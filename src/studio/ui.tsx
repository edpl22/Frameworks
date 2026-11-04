import { useEffect, useState, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { normalizeHex } from '../core/color';
import { ICON_NAMES, SiteIcon } from '../core/icons';

export function Field({ label, hint, children }: { label: ReactNode; hint?: ReactNode; children: ReactNode }) {
  return (
    <div className="field">
      <label>{label}{hint}</label>
      {children}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return <input className={'input' + (mono ? ' mono' : '')} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function TextArea({ value, onChange, placeholder, rows = 3 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea className="textarea" value={value} rows={rows} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}

export function Select<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[] }) {
  return (
    <select className="select" value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function Segmented<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { value: T; label?: string; icon?: ReactNode; title?: string }[] }) {
  return (
    <div className="seg" role="radiogroup">
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} title={o.title ?? o.label} className={value === o.value ? 'on' : ''} onClick={() => onChange(o.value)}>
          {o.icon}{o.label}
        </button>
      ))}
    </div>
  );
}

export function Slider({ value, onChange, min, max, step = 1, format }: { value: number; onChange: (v: number) => void; min: number; max: number; step?: number; format?: (v: number) => string }) {
  return (
    <div className="range">
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <output>{format ? format(value) : value}</output>
    </div>
  );
}

export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: ReactNode }) {
  return (
    <div className="toggle-row">
      <span>{label}</span>
      <button type="button" role="switch" aria-checked={value} className={'toggle' + (value ? ' on' : '')} onClick={() => onChange(!value)} />
    </div>
  );
}

export function ColorInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [text, setText] = useState(value);
  useEffect(() => setText(value), [value]);
  return (
    <div className="color-input">
      <input type="color" value={normalizeHex(value)} onChange={(e) => onChange(e.target.value)} aria-label="Cor" />
      <input
        type="text"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          if (/^#?[0-9a-fA-F]{6}$/.test(e.target.value.trim())) onChange(normalizeHex(e.target.value));
        }}
        onBlur={() => setText(value)}
      />
    </div>
  );
}

export function IconPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className="btn btn-sm icon-btn-preview" onClick={() => setOpen((o) => !o)}>
        <SiteIcon name={value} size={14} /> {value || 'escolher'}
      </button>
      {open && (
        <div className="icon-grid">
          {ICON_NAMES.map((n) => (
            <button key={n} type="button" title={n} className={n === value ? 'on' : ''} onClick={() => { onChange(n); setOpen(false); }}>
              <SiteIcon name={n} size={16} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Modal({ title, subtitle, icon, size, onClose, children, footer }: { title: ReactNode; subtitle?: ReactNode; icon?: ReactNode; size?: 'sm' | 'md'; onClose: () => void; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className={'modal' + (size ? ' ' + size : '')} role="dialog" aria-modal="true">
        <div className="modal-head">
          {icon && <div className="lib-icon">{icon}</div>}
          <div style={{ flex: 1 }}>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Fechar"><X size={16} /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

export const mod = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl';
