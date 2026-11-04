import { useState, type ReactNode } from 'react';
import {
  Bold, Italic, CaseUpper, AlignLeft, AlignCenter, AlignRight, Copy, Trash2, BringToFront, SendToBack,
  ChevronUp, ChevronDown, Smartphone, Link2, ImagePlus, MousePointerClick, Heading1, Sparkles,
  AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, Blend,
} from 'lucide-react';
import { useStore } from '../core/store';
import { canvasElements, ELEMENT_LABEL, type CanvasEl, type ColorRef, type TextSize } from '../core/canvas';
import { SECTION_MAP } from '../core/sections';
import { IconPicker } from '../studio/ui';
import { uploadImages } from '../studio/assetOps';
import { alignInGrid, duplicateSelected, patchElements, removeSelected, sectionById, zOrder } from './ops';
import { SHAPE_KINDS } from './presets';

const ROLE_SWATCHES: { ref: ColorRef; label: string; css: string }[] = [
  { ref: 'text', label: 'Texto', css: 'var(--fw-text)' },
  { ref: 'muted', label: 'Texto suave', css: 'var(--fw-muted)' },
  { ref: 'primary', label: 'Primária', css: 'var(--fw-primary)' },
  { ref: 'secondary', label: 'Secundária', css: 'var(--fw-secondary)' },
  { ref: 'accent', label: 'Destaque', css: 'var(--fw-accent)' },
  { ref: 'surface', label: 'Superfície', css: 'var(--fw-surface)' },
  { ref: 'bg', label: 'Fundo', css: 'var(--fw-bg)' },
  { ref: 'white', label: 'Branco', css: '#ffffff' },
  { ref: 'black', label: 'Preto', css: '#000000' },
];

function Swatches({ value, onChange, gradient }: { value?: ColorRef; onChange: (v: ColorRef) => void; gradient?: boolean }) {
  const [open, setOpen] = useState(false);
  const current = ROLE_SWATCHES.find((r) => r.ref === value);
  const css = value === 'gradient' ? 'linear-gradient(135deg,var(--fw-primary),var(--fw-secondary))' : current?.css ?? value ?? 'transparent';
  return (
    <div className="cv-swatch-wrap">
      <button className="cv-swatch-btn" title="Cor" onClick={() => setOpen((o) => !o)}><i style={{ background: css }} /></button>
      {open && (
        <div className="cv-swatch-pop" onMouseLeave={() => setOpen(false)}>
          {ROLE_SWATCHES.map((r) => (
            <button key={r.ref} title={r.label} className={value === r.ref ? 'on' : ''} onClick={() => { onChange(r.ref); setOpen(false); }}><i style={{ background: r.css }} /></button>
          ))}
          {gradient && <button title="Gradiente da marca" className={value === 'gradient' ? 'on' : ''} onClick={() => { onChange('gradient'); setOpen(false); }}><i style={{ background: 'linear-gradient(135deg,var(--fw-primary),var(--fw-secondary))' }} /></button>}
          <label title="Cor personalizada" className="cv-swatch-custom">
            <input type="color" value={/^#/.test(value ?? '') ? value : '#8b5cf6'} onChange={(e) => onChange(e.target.value)} />
            <span>+</span>
          </label>
        </div>
      )}
    </div>
  );
}

const Btn = ({ on, title, onClick, children }: { on?: boolean; title: string; onClick: () => void; children: ReactNode }) => (
  <button className={'cv-tb-btn' + (on ? ' on' : '')} title={title} aria-label={title} onClick={onClick}>{children}</button>
);
const Sep = () => <span className="cv-tb-sep" />;

/** Contextual toolbar (Canva-style) for the current selection. */
export function Toolbar() {
  const elSel = useStore((s) => s.elSel);
  const selectedId = useStore((s) => s.selectedId);
  const section = useStore((s) => sectionById(s.elSel.sectionId ?? s.selectedId));
  const { updateStyle, setMode } = useStore.getState();

  if (section && section.type === 'canvas' && elSel.ids.length) {
    const els = canvasElements(section.props).filter((e) => elSel.ids.includes(e.id));
    if (!els.length) return <Idle />;
    return <ElementTools sectionId={section.id} els={els} />;
  }
  if (section && selectedId === section.id) {
    const isCanvas = section.type === 'canvas';
    return (
      <div className="cv-toolbar">
        <span className="cv-tb-label">{section.name || SECTION_MAP[section.type]?.label}</span>
        <Sep />
        <label className="cv-tb-field">Fundo
          <select className="select" value={section.style.background} onChange={(e) => updateStyle(section.id, { background: e.target.value as never })}>
            <option value="default">Padrão</option><option value="surface">Superfície</option><option value="mesh">Mesh</option>
            <option value="gradient">Gradiente</option><option value="primary">Primária</option><option value="dark">Escura</option>
          </select>
        </label>
        <label className="cv-tb-field">Espaço
          <select className="select" value={section.style.paddingY} onChange={(e) => updateStyle(section.id, { paddingY: e.target.value as never })}>
            <option value="none">0</option><option value="sm">S</option><option value="md">M</option><option value="lg">L</option><option value="xl">XL</option>
          </select>
        </label>
        {isCanvas ? (
          <span className="cv-tb-hint"><MousePointerClick size={13} /> Clique num elemento para editar · arraste da barra lateral para adicionar</span>
        ) : (
          <>
            <span className="cv-tb-hint">Clique nos textos para editar.</span>
            <button className="btn btn-sm" onClick={() => setMode('studio')}>Mais opções no Studio</button>
          </>
        )}
      </div>
    );
  }
  return <Idle />;
}

function Idle() {
  return (
    <div className="cv-toolbar idle">
      <Sparkles size={14} />
      <span>Clique em qualquer elemento para editar. Duplo clique edita o texto. Arraste para mover, puxe as bordas para redimensionar.</span>
    </div>
  );
}

function ElementTools({ sectionId, els }: { sectionId: string; els: CanvasEl[] }) {
  const ids = els.map((e) => e.id);
  const one = els.length === 1 ? els[0] : null;
  const patch = (p: Partial<CanvasEl>) => patchElements(sectionId, ids, p);
  const kinds = new Set(els.map((e) => e.kind));
  const allText = [...kinds].every((k) => k === 'heading' || k === 'text');
  const first = els[0];

  return (
    <div className="cv-toolbar">
      <span className="cv-tb-label">{one ? ELEMENT_LABEL[one.kind] : `${els.length} elementos`}</span>
      <Sep />

      {allText && (
        <>
          <select className="select cv-tb-select" title="Tamanho" value={first.size ?? (first.kind === 'heading' ? 'xl' : 'md')} onChange={(e) => patch({ size: e.target.value as TextSize })}>
            <option value="display">Display</option><option value="xl">Muito grande</option><option value="lg">Grande</option>
            <option value="md">Médio</option><option value="sm">Pequeno</option><option value="xs">Legenda</option>
          </select>
          <select className="select cv-tb-select" title="Fonte" value={first.font ?? (first.kind === 'heading' ? 'heading' : 'body')} onChange={(e) => patch({ font: e.target.value as CanvasEl['font'] })}>
            <option value="heading">Fonte dos títulos</option><option value="body">Fonte do corpo</option><option value="mono">Monoespaçada</option>
          </select>
          <Swatches value={first.color ?? (first.kind === 'heading' ? 'text' : 'muted')} onChange={(v) => patch({ color: v })} />
          <Btn title="Negrito" on={!!first.bold} onClick={() => patch({ bold: !first.bold })}><Bold size={14} /></Btn>
          <Btn title="Itálico" on={!!first.italic} onClick={() => patch({ italic: !first.italic })}><Italic size={14} /></Btn>
          <Btn title="Caixa alta" on={!!first.upper} onClick={() => patch({ upper: !first.upper })}><CaseUpper size={14} /></Btn>
          <Btn title="Alinhar texto à esquerda" on={(first.align ?? 'left') === 'left'} onClick={() => patch({ align: 'left' })}><AlignLeft size={14} /></Btn>
          <Btn title="Centralizar texto" on={first.align === 'center'} onClick={() => patch({ align: 'center' })}><AlignCenter size={14} /></Btn>
          <Btn title="Alinhar texto à direita" on={first.align === 'right'} onClick={() => patch({ align: 'right' })}><AlignRight size={14} /></Btn>
          {one?.kind === 'heading' && <Btn title="Título principal da página (h1)" on={one.level === 1} onClick={() => patch({ level: one.level === 1 ? 2 : 1 })}><Heading1 size={14} /></Btn>}
          <Sep />
        </>
      )}

      {one?.kind === 'button' && (
        <>
          <select className="select cv-tb-select" value={one.variant ?? 'primary'} onChange={(e) => patch({ variant: e.target.value as CanvasEl['variant'] })}>
            <option value="primary">Principal</option><option value="secondary">Secundário</option><option value="ghost">Discreto</option>
          </select>
          <label className="cv-tb-link"><Link2 size={13} /><input className="input" placeholder="https://… ou /pagina" value={one.href ?? ''} onChange={(e) => patch({ href: e.target.value })} /></label>
          <Sep />
        </>
      )}

      {one?.kind === 'badge' && (
        <>
          <span className="cv-tb-mini">Fundo</span><Swatches value={one.fill ?? 'primary'} onChange={(v) => patch({ fill: v })} gradient />
          <span className="cv-tb-mini">Texto</span><Swatches value={one.color ?? 'white'} onChange={(v) => patch({ color: v })} />
          <Sep />
        </>
      )}

      {kinds.size === 1 && kinds.has('shape') && (
        <>
          <select className="select cv-tb-select" value={first.shape ?? 'rect'} onChange={(e) => patch({ shape: e.target.value as CanvasEl['shape'] })}>
            {SHAPE_KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
          </select>
          <Swatches value={first.fill ?? 'primary'} onChange={(v) => patch({ fill: v })} gradient />
          {(first.shape ?? 'rect') === 'rect' && <label className="cv-tb-range" title="Cantos">Cantos<input type="range" min={0} max={48} value={first.radius ?? 0} onChange={(e) => patch({ radius: Number(e.target.value) })} /></label>}
          <label className="cv-tb-range" title="Desfoque">Desfoque<input type="range" min={0} max={120} step={4} value={first.blur ?? 0} onChange={(e) => patch({ blur: Number(e.target.value) || undefined })} /></label>
          <Btn title="Brilho (glow)" on={!!first.glow} onClick={() => patch({ glow: !first.glow })}><Sparkles size={14} /></Btn>
          <Sep />
        </>
      )}

      {one?.kind === 'icon' && (
        <>
          <IconPicker value={one.icon ?? 'sparkles'} onChange={(v) => patch({ icon: v })} />
          <Swatches value={one.color ?? 'primary'} onChange={(v) => patch({ color: v })} />
          <Sep />
        </>
      )}

      {one?.kind === 'image' && (
        <>
          <label className="btn btn-sm" title="Trocar imagem">
            <ImagePlus size={13} /> Trocar
            <input type="file" accept="image/*" hidden onChange={async (e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) { const [r] = await uploadImages([f]); if (r) patch({ src: r }); } }} />
          </label>
          <input className="input cv-tb-alt" placeholder="Texto alternativo" value={one.alt ?? ''} onChange={(e) => patch({ alt: e.target.value })} />
          <label className="cv-tb-range" title="Cantos">Cantos<input type="range" min={0} max={48} value={one.radius ?? 16} onChange={(e) => patch({ radius: Number(e.target.value) })} /></label>
          <Sep />
        </>
      )}

      {one?.kind === 'divider' && (<><Swatches value={one.color ?? 'border'} onChange={(v) => patch({ color: v })} /><Sep /></>)}

      <label className="cv-tb-range" title="Opacidade"><Blend size={14} /><input type="range" min={0.1} max={1} step={0.05} value={first.opacity ?? 1} onChange={(e) => patch({ opacity: Number(e.target.value) })} aria-label="Opacidade" /></label>
      <Sep />
      <Btn title="Encostar à esquerda da grade" onClick={() => alignInGrid('left')}><AlignHorizontalJustifyStart size={14} /></Btn>
      <Btn title="Centralizar na grade" onClick={() => alignInGrid('center')}><AlignHorizontalJustifyCenter size={14} /></Btn>
      <Btn title="Encostar à direita da grade" onClick={() => alignInGrid('right')}><AlignHorizontalJustifyEnd size={14} /></Btn>
      <Sep />
      <Btn title="Trazer para a frente" onClick={() => zOrder('front')}><BringToFront size={14} /></Btn>
      <Btn title="Avançar uma camada" onClick={() => zOrder('forward')}><ChevronUp size={14} /></Btn>
      <Btn title="Recuar uma camada" onClick={() => zOrder('backward')}><ChevronDown size={14} /></Btn>
      <Btn title="Enviar para trás" onClick={() => zOrder('back')}><SendToBack size={14} /></Btn>
      <Btn title="Ocultar no celular (decorativo)" on={!!first.mobileHidden} onClick={() => patch({ mobileHidden: !first.mobileHidden })}><Smartphone size={14} /></Btn>
      <Sep />
      <Btn title="Duplicar (Ctrl+D)" onClick={duplicateSelected}><Copy size={14} /></Btn>
      <Btn title="Excluir (Delete)" onClick={removeSelected}><Trash2 size={14} /></Btn>
    </div>
  );
}
