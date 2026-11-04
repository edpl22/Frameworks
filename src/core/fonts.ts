import { googleFontsHref } from './theme';

/** Adds one Google Fonts stylesheet per family, once. Safe to call on every render. */
export function ensureFonts(fonts: (string | undefined)[]): void {
  if (typeof document === 'undefined') return;
  for (const f of fonts) {
    if (!f) continue;
    const id = 'fw-font-' + f.replace(/\W+/g, '-');
    if (document.getElementById(id)) continue;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = googleFontsHref([f]);
    document.head.appendChild(link);
  }
}

/** Runs `fn` when the browser is idle (falls back to a timeout). */
export function whenIdle(fn: () => void, timeout = 2500): () => void {
  const w = globalThis as typeof globalThis & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (h: number) => void };
  if (w.requestIdleCallback) {
    const h = w.requestIdleCallback(fn, { timeout });
    return () => w.cancelIdleCallback?.(h);
  }
  const t = setTimeout(fn, 300);
  return () => clearTimeout(t);
}
