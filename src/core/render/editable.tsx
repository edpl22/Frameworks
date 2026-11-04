import { createContext, useContext, useEffect, useRef, useState, type ElementType, type ReactNode } from 'react';
import { isAssetRef, useResolvedSrc } from '../assets';

/**
 * Rendering context shared by every site component.
 * - `editable: true`  → live canvas: text is contentEditable and commits on blur.
 * - `editable: false` → static export (renderToStaticMarkup) or preview mode.
 */
export interface RenderCtx {
  editable: boolean;
  onEdit?: (path: string, value: string) => void;
  /** Canvas only: stores an uploaded image and returns its `asset:` ref. */
  uploadImage?: (file: File) => Promise<string | null>;
  /** Exports only: maps `asset:` refs to file paths or data URLs. */
  resolveAsset?: (src: string) => string | undefined;
}

export const RenderContext = createContext<RenderCtx>({ editable: false });
export const useRender = () => useContext(RenderContext);

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/** Lightweight inline markup: *text* → <em>, **text** → <strong>, line breaks kept. */
export function formatInline(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br/>');
}

interface EditableProps {
  path: string;
  value: string;
  as?: ElementType;
  className?: string;
  multiline?: boolean;
  placeholder?: string;
}

export function Editable({ path, value, as: Tag = 'span', className, multiline, placeholder }: EditableProps) {
  const { editable, onEdit } = useRender();
  const ref = useRef<HTMLElement>(null);
  const focused = useRef(false);

  useEffect(() => {
    if (ref.current && !focused.current) ref.current.innerHTML = formatInline(value || '');
  }, [value, editable]);

  if (!editable) {
    return <Tag className={className} dangerouslySetInnerHTML={{ __html: formatInline(value || '') }} />;
  }

  return (
    <Tag
      ref={ref}
      className={(className ? className + ' ' : '') + 'fw-editable'}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder ?? 'Digite…'}
      onFocus={(e: React.FocusEvent<HTMLElement>) => {
        focused.current = true;
        e.currentTarget.innerText = value || '';
      }}
      onBlur={(e: React.FocusEvent<HTMLElement>) => {
        focused.current = false;
        const next = e.currentTarget.innerText.replace(/ /g, ' ').replace(/\n+$/, '');
        if (next !== value) onEdit?.(path, next);
        e.currentTarget.innerHTML = formatInline(next);
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLElement>) => {
        // Enter commits; Shift+Enter inserts a line break where multiline is allowed.
        if (e.key === 'Enter' && (!e.shiftKey || !multiline)) {
          e.preventDefault();
          (e.currentTarget as HTMLElement).blur();
        }
        if (e.key === 'Escape') (e.currentTarget as HTMLElement).blur();
        e.stopPropagation();
      }}
      onClick={(e: React.MouseEvent) => {
        // Links inside the canvas should never navigate while editing.
        e.preventDefault();
      }}
    />
  );
}

/** dataTransfer type used when dragging an image out of the media library. */
export const DND_ASSET_TYPE = 'application/x-fw-asset';

/** Resolves an image src for the current render target (canvas, export, thumbnail). */
export function useImageSrc(src?: string): string | undefined {
  const { resolveAsset } = useRender();
  const live = useResolvedSrc(src);
  if (!src) return undefined;
  if (resolveAsset && isAssetRef(src)) return resolveAsset(src);
  return live;
}

export function Img({ src, alt = '', className, style }: { src?: string; alt?: string; className?: string; style?: React.CSSProperties }) {
  const url = useImageSrc(src);
  return url ? <img src={url} alt={alt} className={className} style={style} loading="lazy" /> : null;
}

/**
 * Image slot. In the canvas (`path` given) it accepts a click or a dropped
 * file to upload a new image straight into that prop.
 */
export function Media({ src, alt, className, caption, children, path }: { src?: string; alt?: string; className?: string; caption?: ReactNode; children?: ReactNode; path?: string }) {
  const { editable, onEdit, uploadImage } = useRender();
  const url = useImageSrc(src);
  const [over, setOver] = useState(false);
  const canUpload = editable && !!path && !!uploadImage && !!onEdit;
  const take = async (file?: File | null) => {
    if (!file || !uploadImage || !onEdit || !path) return;
    const ref = await uploadImage(file);
    if (ref) onEdit(path, ref);
  };
  return (
    <div
      className={'fw-media' + (className ? ' ' + className : '') + (over ? ' fw-media-over' : '')}
      onDragOver={canUpload ? (e) => { if (e.dataTransfer.types.includes('Files') || e.dataTransfer.types.includes(DND_ASSET_TYPE)) { e.preventDefault(); e.stopPropagation(); setOver(true); } } : undefined}
      onDragLeave={canUpload ? () => setOver(false) : undefined}
      onDrop={canUpload ? (e) => {
        const ref = e.dataTransfer.getData(DND_ASSET_TYPE);
        if (!ref && !e.dataTransfer.files.length) return;
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        if (ref) onEdit!(path!, ref);
        else take(e.dataTransfer.files[0]);
      } : undefined}
    >
      {url ? <img src={url} alt={alt ?? ''} loading="lazy" /> : <div className="fw-media-grid" />}
      {children}
      {caption ? <span className="fw-caption">{caption}</span> : null}
      {canUpload && (
        <label className="fw-media-upload" onClick={(e) => e.stopPropagation()}>
          <input type="file" accept="image/*" hidden onChange={(e) => { take(e.target.files?.[0]); e.target.value = ''; }} />
          {url ? 'Trocar imagem' : 'Enviar imagem'}
        </label>
      )}
    </div>
  );
}
