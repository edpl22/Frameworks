import { createContext, useContext, useEffect, useRef, type ElementType, type ReactNode } from 'react';

/**
 * Rendering context shared by every site component.
 * - `editable: true`  → live canvas: text is contentEditable and commits on blur.
 * - `editable: false` → static export (renderToStaticMarkup) or preview mode.
 */
export interface RenderCtx {
  editable: boolean;
  onEdit?: (path: string, value: string) => void;
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

export function Media({ src, alt, className, caption, children }: { src?: string; alt?: string; className?: string; caption?: ReactNode; children?: ReactNode }) {
  return (
    <div className={'fw-media' + (className ? ' ' + className : '')}>
      {src ? <img src={src} alt={alt ?? ''} loading="lazy" /> : <div className="fw-media-grid" />}
      {children}
      {caption ? <span className="fw-caption">{caption}</span> : null}
    </div>
  );
}
