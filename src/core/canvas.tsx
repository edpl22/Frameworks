import type { CSSProperties, ReactNode } from 'react';
import type { Props, PropValue, Section } from './types';
import { Editable, Media, useRender } from './render/editable';
import { SiteIcon } from './icons';

// ════════════════════════════════════════════════════════════════
//  Free-form section ("Seção livre")
//  Elements are placed on a 12-column CSS grid with fixed-height rows.
//  Desktop/tablet keep the grid; phones stack elements in reading order
//  (row, then column) and can hide decorative pieces. The same component
//  renders the Canvas editor, the Studio canvas, exports and thumbnails.
// ════════════════════════════════════════════════════════════════

export type ElementKind = 'heading' | 'text' | 'button' | 'image' | 'shape' | 'icon' | 'badge' | 'divider';
export type ColorRef = 'text' | 'muted' | 'primary' | 'secondary' | 'accent' | 'bg' | 'surface' | 'border' | 'white' | 'black' | 'none' | 'gradient' | string;
export type TextSize = 'display' | 'xl' | 'lg' | 'md' | 'sm' | 'xs';
export type ShapeKind = 'rect' | 'pill' | 'circle' | 'blob' | 'ring' | 'line' | 'dot';

export interface CanvasEl {
  id: string;
  kind: ElementKind;
  col: number; // 1..12
  span: number; // 1..12
  row: number; // 1..
  rows: number; // ≥1
  z?: number;
  text?: string;
  href?: string;
  src?: string;
  alt?: string;
  icon?: string;
  size?: TextSize;
  bold?: boolean;
  italic?: boolean;
  upper?: boolean;
  align?: 'left' | 'center' | 'right';
  color?: ColorRef;
  fill?: ColorRef;
  variant?: 'primary' | 'secondary' | 'ghost';
  shape?: ShapeKind;
  radius?: number;
  opacity?: number;
  blur?: number;
  glow?: boolean;
  shadow?: boolean;
  font?: 'heading' | 'body' | 'mono';
  /** Heading level: 1 makes it the page's main title (h1). */
  level?: 1 | 2 | 3;
  mobileHidden?: boolean;
}

export const GRID_COLS = 12;
export const DEFAULT_ROW_H = 40;

export const ELEMENT_LABEL: Record<ElementKind, string> = {
  heading: 'Título', text: 'Texto', button: 'Botão', image: 'Imagem', shape: 'Forma', icon: 'Ícone', badge: 'Selo', divider: 'Divisor',
};

const num = (v: PropValue | undefined, d: number) => (typeof v === 'number' && isFinite(v) ? v : d);

export function canvasElements(p: Props): CanvasEl[] {
  return Array.isArray(p.elements) ? (p.elements as unknown as CanvasEl[]) : [];
}

export function rowHeightOf(p: Props) { return Math.max(12, num(p.rowHeight, DEFAULT_ROW_H)); }

/** Total rows: the section's minimum height or whatever its lowest element needs. */
export function canvasRows(p: Props): number {
  const els = canvasElements(p);
  return Math.max(num(p.rows, 8), ...els.map((e) => e.row + e.rows - 1), 1);
}

/**
 * Reading order used on phones (and in the prompt): top-to-bottom, then
 * left-to-right. Tall images count from their vertical middle, so a photo
 * beside a headline lands after the headline instead of before it.
 */
export function readingOrder(els: CanvasEl[]): CanvasEl[] {
  const key = (e: CanvasEl) => (e.kind === 'image' && e.rows > 2 ? e.row + (e.rows - 1) / 2 : e.row);
  return [...els].sort((a, b) => key(a) - key(b) || a.col - b.col || (a.z ?? 0) - (b.z ?? 0));
}

export function colorValue(ref?: ColorRef): string | undefined {
  if (!ref) return undefined;
  const roles: Record<string, string> = {
    text: 'var(--fw-text)', muted: 'var(--fw-muted)', primary: 'var(--fw-primary)', secondary: 'var(--fw-secondary)', accent: 'var(--fw-accent)',
    bg: 'var(--fw-bg)', surface: 'var(--fw-surface)', border: 'var(--fw-border)', white: '#ffffff', black: '#000000', none: 'transparent',
    gradient: 'linear-gradient(135deg, var(--fw-primary), var(--fw-secondary))',
  };
  return roles[ref] ?? ref;
}

/** Clamps an element into the grid. */
export function clampEl(e: CanvasEl): CanvasEl {
  const span = Math.max(1, Math.min(GRID_COLS, Math.round(e.span)));
  const col = Math.max(1, Math.min(GRID_COLS - span + 1, Math.round(e.col)));
  return { ...e, span, col, row: Math.max(1, Math.round(e.row)), rows: Math.max(1, Math.round(e.rows)) };
}

// ─── factory ────────────────────────────────────────────────────
let seq = 0;
export const elId = () => `el_${Date.now().toString(36)}${(seq++).toString(36)}${Math.random().toString(36).slice(2, 5)}`;

export function newElement(kind: ElementKind, o: Partial<CanvasEl> = {}): CanvasEl {
  const base: Record<ElementKind, Partial<CanvasEl>> = {
    heading: { span: 8, rows: 3, text: 'Seu título aqui', size: 'xl', color: 'text', font: 'heading' },
    text: { span: 6, rows: 2, text: 'Escreva um texto curto e direto sobre o que importa.', size: 'md', color: 'muted', font: 'body' },
    button: { span: 3, rows: 1, text: 'Saiba mais', href: '#', variant: 'primary' },
    image: { span: 5, rows: 6, src: '', alt: '', radius: 16 },
    shape: { span: 3, rows: 3, shape: 'rect', fill: 'primary', radius: 16 },
    icon: { span: 1, rows: 1, icon: 'sparkles', color: 'primary' },
    badge: { span: 3, rows: 1, text: 'Novidade', fill: 'primary', color: 'white' },
    divider: { span: 12, rows: 1, color: 'border' },
  };
  return clampEl({ id: elId(), kind, col: 1, row: 1, rows: 1, span: 1, ...base[kind], ...o } as CanvasEl);
}

/** First free row below all elements — where new elements land by default. */
export function nextFreeRow(els: CanvasEl[]): number {
  return els.length ? Math.max(...els.map((e) => e.row + e.rows)) : 1;
}

// ─── rendering ──────────────────────────────────────────────────
const SIZE_CLASS: Record<TextSize, string> = { display: 'fw-t-display', xl: 'fw-t-xl', lg: 'fw-t-lg', md: 'fw-t-md', sm: 'fw-t-sm', xs: 'fw-t-xs' };
const SHAPE_RADIUS: Record<ShapeKind, string | undefined> = {
  rect: undefined, pill: '999px', circle: '50%', blob: '42% 58% 70% 30% / 45% 45% 55% 55%', ring: '50%', line: '999px', dot: '50%',
};

function ElementBody({ e, i }: { e: CanvasEl; i: number }) {
  const path = (k: string) => `elements.${i}.${k}`;
  switch (e.kind) {
    case 'heading':
      return <Editable as={e.level === 1 ? 'h1' : e.level === 3 ? 'h3' : 'h2'} className={`fw-el-h ${SIZE_CLASS[e.size ?? 'xl']}`} path={path('text')} value={e.text ?? ''} multiline />;
    case 'text':
      return <Editable as="p" className={`fw-el-p ${SIZE_CLASS[e.size ?? 'md']}`} path={path('text')} value={e.text ?? ''} multiline />;
    case 'badge':
      return <Editable className="fw-el-badge-text" path={path('text')} value={e.text ?? ''} />;
    case 'button':
      return (
        <a className={`fw-btn ${e.variant === 'secondary' ? 'fw-btn-secondary' : e.variant === 'ghost' ? 'fw-btn-ghost' : 'fw-btn-primary'}`} href={e.href || '#'} style={e.color ? { color: colorValue(e.color) } : undefined}>
          <Editable path={path('text')} value={e.text ?? ''} />
        </a>
      );
    case 'image':
      return <Media src={e.src} alt={e.alt} path={path('src')} />;
    case 'icon':
      return <span className="fw-el-icon-glyph" style={{ color: colorValue(e.color) }}><SiteIcon name={e.icon ?? 'sparkles'} /></span>;
    case 'shape':
    case 'divider':
      return null;
  }
}

function elementStyle(e: CanvasEl, order: number): CSSProperties {
  const s: CSSProperties & Record<string, string | number | undefined> = {
    gridColumn: `${e.col} / span ${e.span}`,
    gridRow: `${e.row} / span ${e.rows}`,
    zIndex: e.z ?? 1,
    '--fw-mo': order,
    '--fw-rs': e.rows,
    opacity: e.opacity ?? undefined,
  };
  const txt = e.kind === 'heading' || e.kind === 'text';
  if (txt) {
    Object.assign(s, {
      color: colorValue(e.color), textAlign: e.align, fontWeight: e.bold ? 700 : undefined, fontStyle: e.italic ? 'italic' : undefined,
      textTransform: e.upper ? 'uppercase' : undefined, letterSpacing: e.upper ? '0.14em' : undefined,
      fontFamily: e.font === 'mono' ? 'var(--fw-font-mono)' : e.font === 'heading' ? 'var(--fw-font-heading)' : e.font === 'body' ? 'var(--fw-font-body)' : undefined,
    });
  }
  if (e.kind === 'button') s.justifySelf = e.align === 'center' ? 'center' : e.align === 'right' ? 'end' : 'start';
  if (e.kind === 'badge') {
    s.background = colorValue(e.fill ?? 'primary');
    s.color = colorValue(e.color ?? 'white');
    s.justifySelf = e.align === 'center' ? 'center' : e.align === 'right' ? 'end' : 'start';
  }
  if (e.kind === 'shape') {
    const shape = e.shape ?? 'rect';
    const fill = colorValue(e.fill ?? 'primary');
    if (shape === 'ring') { s.border = `${Math.max(2, e.radius ?? 2)}px solid ${fill}`; s.background = 'transparent'; }
    else s.background = fill;
    s.borderRadius = SHAPE_RADIUS[shape] ?? `${e.radius ?? 0}px`;
    if (shape === 'line') { s.height = 2; s.alignSelf = 'center'; }
    if (e.blur) s.filter = `blur(${e.blur}px)`;
    if (e.glow) s.boxShadow = `0 0 40px ${fill}, 0 0 90px ${fill}`;
  }
  if (e.kind === 'image') {
    s['--fw-el-radius'] = `${e.radius ?? 16}px`;
    if (e.glow) s.filter = 'drop-shadow(0 0 30px var(--fw-primary))';
  }
  if (e.kind === 'divider') s.background = colorValue(e.color ?? 'border');
  if (e.shadow) s.boxShadow = 'var(--fw-shadow-lg)';
  return s;
}

export interface CanvasEditing {
  selected: string[];
}

/** Renders a free-form section's grid. Editor-only affordances come from the render context. */
export function CanvasGrid({ s, p }: { s: Section; p: Props }) {
  const { canvasEditing } = useRender();
  const els = canvasElements(p);
  const rows = canvasRows(p);
  const rh = rowHeightOf(p);
  const order = new Map(readingOrder(els).map((e, i) => [e.id, i]));
  const sorted = [...els].map((e, i) => ({ e, i })).sort((a, b) => (a.e.z ?? 1) - (b.e.z ?? 1));
  const selected = new Set(canvasEditing?.selected ?? []);
  const single = canvasEditing && canvasEditing.selected.length === 1 ? canvasEditing.selected[0] : null;
  return (
    <div className="fw-canvas" data-canvas-id={s.id} style={{ gridTemplateRows: `repeat(${rows}, minmax(${rh}px, auto))`, '--fw-rh': `${rh}px` } as CSSProperties}>
      {canvasEditing && <div className="fw-canvas-guides" aria-hidden="true">{Array.from({ length: GRID_COLS }, (_, k) => <i key={k} />)}</div>}
      {sorted.map(({ e, i }) => (
        <div
          key={e.id}
          data-el-id={e.id}
          className={[
            'fw-el', `fw-el-${e.kind}`, e.kind === 'shape' ? `fw-shape-${e.shape ?? 'rect'}` : '', e.mobileHidden ? 'fw-el-mhide' : '',
            selected.has(e.id) ? 'is-selected' : '',
          ].filter(Boolean).join(' ')}
          style={elementStyle(e, order.get(e.id) ?? 0)}
        >
          <ElementBody e={e} i={i} />
          {single === e.id && <Handles />}
        </div>
      ))}
    </div>
  );
}

function Handles(): ReactNode {
  return (
    <>
      {(['n', 's', 'e', 'w', 'ne', 'nw', 'se', 'sw'] as const).map((h) => <span key={h} className={`fw-handle fw-handle-${h}`} data-handle={h} />)}
    </>
  );
}

// ─── prompt description ─────────────────────────────────────────
const colorWord = (c?: ColorRef) => (!c ? '' : /^#/.test(c) ? c : c);

export function describeElement(e: CanvasEl): string {
  const where = `colunas ${e.col}–${e.col + e.span - 1}, linhas ${e.row}–${e.row + e.rows - 1}`;
  const bits: string[] = [];
  if (e.size) bits.push(`tamanho ${e.size}`);
  if (e.color) bits.push(`cor ${colorWord(e.color)}`);
  if (e.fill) bits.push(`preenchimento ${colorWord(e.fill)}`);
  if (e.bold) bits.push('negrito');
  if (e.upper) bits.push('caixa alta');
  if (e.align) bits.push(`alinhado à ${e.align === 'left' ? 'esquerda' : e.align === 'right' ? 'direita' : 'centro'}`);
  if (e.variant) bits.push(`variante ${e.variant}`);
  if (e.shape) bits.push(`forma ${e.shape}`);
  if (e.blur) bits.push(`desfoque ${e.blur}px`);
  if (e.glow) bits.push('brilho (glow)');
  if (e.opacity !== undefined && e.opacity < 1) bits.push(`opacidade ${Math.round(e.opacity * 100)}%`);
  if (e.mobileHidden) bits.push('decorativo: ocultar no celular');
  if (e.kind === 'heading' && e.level === 1) bits.push('título principal da página (h1)');
  const content = e.kind === 'image' ? (e.src ? `imagem ${e.src}${e.alt ? ` (alt: “${e.alt}”)` : ''}` : 'imagem (placeholder)')
    : e.kind === 'icon' ? `ícone “${e.icon}”`
      : e.text ? `“${e.text.replace(/\n/g, ' ')}”${e.href ? ` → ${e.href}` : ''}` : '';
  return `${ELEMENT_LABEL[e.kind]} — ${where}${bits.length ? ` · ${bits.join(', ')}` : ''}${content ? `: ${content}` : ''}`;
}

export function describeCanvas(p: Props): string {
  const els = readingOrder(canvasElements(p));
  return [
    `Grade de 12 colunas, ${canvasRows(p)} linhas de ${rowHeightOf(p)}px. Elementos em ordem de leitura (é também a ordem de empilhamento no celular):`,
    ...els.map((e, i) => `  ${i + 1}. ${describeElement(e)}`),
  ].join('\n');
}
