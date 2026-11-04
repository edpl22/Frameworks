import { create } from 'zustand';
import type { Project } from './types';

// ════════════════════════════════════════════════════════════════
//  Local media library
//  • Binary data lives in IndexedDB (works on web and in Electron).
//  • The project only stores lightweight metadata + `asset:<id>` refs,
//    so autosave/undo stay fast and localStorage stays small.
//  • Exports resolve refs to files (ZIP), data URLs (single HTML) or
//    descriptive paths (prompt).
// ════════════════════════════════════════════════════════════════

export interface AssetMeta {
  id: string;
  name: string; // original file name
  type: string; // mime type after processing
  width: number;
  height: number;
  size: number; // bytes
  createdAt: number;
}

export const ASSET_PREFIX = 'asset:';
export const isAssetRef = (src: unknown): src is string => typeof src === 'string' && src.startsWith(ASSET_PREFIX);
export const assetIdOf = (src: string) => src.slice(ASSET_PREFIX.length);
export const assetRef = (id: string) => ASSET_PREFIX + id;

export function extFor(type: string): string {
  const map: Record<string, string> = { 'image/webp': 'webp', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/gif': 'gif', 'image/svg+xml': 'svg', 'image/avif': 'avif' };
  return map[type] ?? 'bin';
}

export const assetPath = (m: Pick<AssetMeta, 'id' | 'type'>) => `assets/img/${m.id}.${extFor(m.type)}`;

/** Every asset id referenced anywhere in the project (props, styles, nested lists). */
export function collectAssetIds(project: Project): string[] {
  const ids = new Set<string>();
  const walk = (v: unknown) => {
    if (isAssetRef(v)) ids.add(assetIdOf(v));
    else if (Array.isArray(v)) v.forEach(walk);
    else if (v && typeof v === 'object') Object.values(v).forEach(walk);
  };
  walk(project.pages);
  return Array.from(ids);
}

export function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`;
  return `${(n / 1024 / 1024).toFixed(1)} MB`;
}

// ─── IndexedDB ──────────────────────────────────────────────────
const DB_NAME = 'fw-assets';
const STORE = 'blobs';
let dbPromise: Promise<IDBDatabase> | null = null;

function db(): Promise<IDBDatabase> {
  if (typeof indexedDB === 'undefined') return Promise.reject(new Error('IndexedDB indisponível'));
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx<T>(mode: IDBTransactionMode, fn: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  return db().then((d) => new Promise<T>((resolve, reject) => {
    const req = fn(d.transaction(STORE, mode).objectStore(STORE));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  }));
}

export const putBlob = (id: string, blob: Blob) => tx('readwrite', (s) => s.put(blob, id));
export const getBlob = (id: string) => tx<Blob | undefined>('readonly', (s) => s.get(id));
export const deleteBlob = (id: string) => tx('readwrite', (s) => s.delete(id));

// ─── Image processing ───────────────────────────────────────────
const MAX_DIM = 2400;
export const MAX_UPLOAD = 25 * 1024 * 1024;

function loadImage(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Imagem inválida ou corrompida')); };
    img.src = url;
  });
}

/**
 * Downscales large raster images to ≤2400px and re-encodes them as WebP
 * (keeps the original if WebP isn't smaller). SVG and GIF pass through so
 * vectors stay sharp and animations keep playing.
 */
export async function processImage(file: File): Promise<{ blob: Blob; type: string; width: number; height: number }> {
  if (!file.type.startsWith('image/')) throw new Error(`“${file.name}” não é uma imagem`);
  if (file.size > MAX_UPLOAD) throw new Error(`“${file.name}” passa de ${formatBytes(MAX_UPLOAD)}`);
  const img = await loadImage(file);
  const width = img.naturalWidth || 800;
  const height = img.naturalHeight || 600;
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return { blob: file, type: file.type, width, height };

  const scale = Math.min(1, MAX_DIM / Math.max(width, height));
  const w = Math.round(width * scale);
  const h = Math.round(height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { blob: file, type: file.type, width, height };
  ctx.drawImage(img, 0, 0, w, h);
  const webp = await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/webp', 0.86));
  if (webp && webp.type === 'image/webp' && (webp.size < file.size || scale < 1)) return { blob: webp, type: 'image/webp', width: w, height: h };
  return { blob: file, type: file.type, width, height };
}

// ─── Object URL registry (reactive) ─────────────────────────────
interface UrlState {
  urls: Record<string, string>;
  register: (id: string, blob: Blob) => string;
  ensure: (ids: string[]) => Promise<void>;
  forget: (id: string) => void;
}

export const useAssetUrls = create<UrlState>((set, get) => ({
  urls: {},
  register: (id, blob) => {
    const prev = get().urls[id];
    if (prev) URL.revokeObjectURL(prev);
    const url = URL.createObjectURL(blob);
    set({ urls: { ...get().urls, [id]: url } });
    return url;
  },
  ensure: async (ids) => {
    const missing = ids.filter((id) => !get().urls[id]);
    for (const id of missing) {
      try {
        const blob = await getBlob(id);
        if (blob) get().register(id, blob);
      } catch { /* storage unavailable: placeholder stays */ }
    }
  },
  forget: (id) => {
    const url = get().urls[id];
    if (url) URL.revokeObjectURL(url);
    const { [id]: _drop, ...rest } = get().urls;
    set({ urls: rest });
  },
}));

/** Resolves `asset:` refs to live object URLs; other srcs pass through. */
export function useResolvedSrc(src: string | undefined): string | undefined {
  const url = useAssetUrls((s) => (src && isAssetRef(src) ? s.urls[assetIdOf(src)] : undefined));
  if (!src) return undefined;
  return isAssetRef(src) ? url : src;
}

// ─── Portable project files ─────────────────────────────────────
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const [head, b64] = dataUrl.split(',');
  const type = /data:([^;]+)/.exec(head)?.[1] ?? 'application/octet-stream';
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
}

/** Loads the blobs of every asset used by the project (missing ones are skipped). */
export async function loadProjectBlobs(project: Project): Promise<Map<string, Blob>> {
  const out = new Map<string, Blob>();
  for (const id of collectAssetIds(project)) {
    try {
      const b = await getBlob(id);
      if (b) out.set(id, b);
    } catch { /* ignore */ }
  }
  return out;
}
