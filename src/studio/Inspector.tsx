import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus, Trash2, Copy, AlignLeft, AlignCenter, AlignRight, MousePointerClick, ArrowUp, ArrowDown, MessageSquareText } from 'lucide-react';
import { useStore, useSelected, useActivePage } from '../core/store';
import { SECTION_MAP, str, list, bool } from '../core/sections';
import type { Field as FieldDef, Props, PropValue, Section, SectionStyle } from '../core/types';
import { Field, TextInput, TextArea, Select, Segmented, Slider, Toggle, ColorInput, IconPicker, mod } from './ui';
import { ThemePanel } from './ThemePanel';
import { ImageField } from './MediaPanel';
import { BriefPanel } from './BriefPanel';

export function RightPanel() {
  const tab = useStore((s) => s.rightTab);
  const set = useStore((s) => s.set);
  return (
    <aside className="rpanel">
      <div className="panel-tabs" role="tablist">
        <button className={tab === 'inspector' ? 'on' : ''} onClick={() => set({ rightTab: 'inspector' })}>Inspetor</button>
        <button className={tab === 'theme' ? 'on' : ''} onClick={() => set({ rightTab: 'theme' })}>Design</button>
        <button className={tab === 'brief' ? 'on' : ''} onClick={() => set({ rightTab: 'brief' })}>Briefing</button>
      </div>
      {tab === 'inspector' && <Inspector />}
      {tab === 'theme' && <ThemePanel />}
      {tab === 'brief' && <BriefPanel />}
    </aside>
  );
}

function Inspector() {
  const s = useSelected();
  const page = useActivePage();
  if (!s) {
    return (
      <div className="panel-body">
        <div className="empty-insp">
          <div className="orb"><MousePointerClick size={26} /></div>
          <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 6 }}>Nenhuma seção selecionada</div>
          <p className="hint" style={{ margin: '0 0 18px' }}>Clique em uma seção no canvas para editar conteúdo, layout e estilo. Clique em qualquer texto para editá-lo diretamente.</p>
          <div className="stat-row">
            <div className="stat"><b>{page.sections.length}</b><span>seções</span></div>
            <div className="stat"><b>{page.sections.filter((x) => x.hidden).length}</b><span>ocultas</span></div>
          </div>
          <p className="hint" style={{ marginTop: 18 }}>Dica: <span className="kbd">{mod} K</span> abre a paleta de comandos.</p>
        </div>
      </div>
    );
  }
  return <SectionInspector key={s.id} s={s} />;
}

function SectionInspector({ s }: { s: Section }) {
  const def = SECTION_MAP[s.type];
  const { updateSection, updateProp, updateStyle, duplicateSection, removeSection, moveSelected } = useStore.getState();
  const Icon = def.icon;
  const st = s.style;
  const setStyle = (patch: Partial<SectionStyle>) => updateStyle(s.id, patch);

  return (
    <>
      <div className="insp-head">
        <div className="lib-icon"><Icon size={16} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <input className="project-name" style={{ width: '100%', padding: '3px 6px', marginLeft: -6 }} value={s.name ?? ''} placeholder={def.label} onChange={(e) => updateSection(s.id, { name: e.target.value })} aria-label="Nome da seção" />
          <div className="panel-sub">{def.description}</div>
        </div>
        <button className="btn btn-ghost btn-icon btn-sm" title="Mover para cima" onClick={() => moveSelected(-1)}><ArrowUp size={14} /></button>
        <button className="btn btn-ghost btn-icon btn-sm" title="Mover para baixo" onClick={() => moveSelected(1)}><ArrowDown size={14} /></button>
        <button className="btn btn-ghost btn-icon btn-sm" title="Duplicar" onClick={() => duplicateSection(s.id)}><Copy size={14} /></button>
        <button className="btn btn-ghost btn-icon btn-sm btn-danger" title="Excluir" disabled={s.locked} onClick={() => removeSection(s.id)}><Trash2 size={14} /></button>
      </div>
      <div className="panel-body">
        {s.type === 'canvas' && (
          <div className="group">
            <div className="canvas-cta">
              <b>Seção livre</b>
              <span>Mova, redimensione e adicione elementos livremente no modo Canvas. Aqui você ajusta altura, fundo e espaçamento.</span>
              <button className="btn btn-primary btn-sm" onClick={() => { useStore.getState().setMode('canvas'); useStore.setState({ elSel: { sectionId: s.id, ids: [] }, selectedId: s.id }); }}>Editar no modo Canvas</button>
            </div>
          </div>
        )}
        {def.variants.length > 1 && (
          <div className="group">
            <div className="group-title">Layout</div>
            <div className="variant-grid">
              {def.variants.map((v) => (
                <button key={v.id} className={'variant' + (s.variant === v.id ? ' on' : '')} onClick={() => updateSection(s.id, { variant: v.id })}>{v.label}</button>
              ))}
            </div>
          </div>
        )}

        <div className="group">
          <div className="group-title">Conteúdo</div>
          {def.fields.map((f) => (
            <FieldEditor key={f.key} field={f} value={s.props[f.key]} onChange={(v) => updateProp(s.id, f.key, v)} />
          ))}
        </div>

        <div className="group">
          <div className="group-title">Estilo</div>
          <Field label="Fundo">
            <Select value={st.background} onChange={(v) => setStyle({ background: v })} options={[
              { value: 'default', label: 'Padrão' }, { value: 'surface', label: 'Superfície' }, { value: 'mesh', label: 'Mesh gradient' },
              { value: 'gradient', label: 'Gradiente da marca' }, { value: 'primary', label: 'Cor primária' }, { value: 'dark', label: 'Escuro' }, { value: 'image', label: 'Imagem' },
            ]} />
          </Field>
          {st.background === 'image' && (
            <>
              <Field label="Imagem de fundo"><ImageField value={st.backgroundImage ?? ''} onChange={(v) => setStyle({ backgroundImage: v })} /></Field>
              <Field label="Overlay"><Slider value={st.overlay ?? 0.5} min={0} max={0.9} step={0.05} onChange={(v) => setStyle({ overlay: v })} format={(v) => `${Math.round(v * 100)}%`} /></Field>
            </>
          )}
          {s.type !== 'navbar' && (
            <>
              <Field label="Espaçamento vertical">
                <Segmented value={st.paddingY} onChange={(v) => setStyle({ paddingY: v })} options={[{ value: 'none', label: '0' }, { value: 'sm', label: 'S' }, { value: 'md', label: 'M' }, { value: 'lg', label: 'L' }, { value: 'xl', label: 'XL' }]} />
              </Field>
              <Field label="Alinhamento">
                <Segmented value={st.align} onChange={(v) => setStyle({ align: v })} options={[{ value: 'left', icon: <AlignLeft size={14} />, title: 'Esquerda' }, { value: 'center', icon: <AlignCenter size={14} />, title: 'Centro' }, { value: 'right', icon: <AlignRight size={14} />, title: 'Direita' }]} />
              </Field>
            </>
          )}
          <Field label="Largura do conteúdo">
            <Segmented value={st.maxWidth} onChange={(v) => setStyle({ maxWidth: v })} options={[{ value: 'narrow', label: 'Estreita' }, { value: 'default', label: 'Padrão' }, { value: 'wide', label: 'Larga' }, { value: 'full', label: 'Total' }]} />
          </Field>
          {s.type !== 'navbar' && s.type !== 'footer' && (
            <Field label="Animação de entrada">
              <Select value={st.animation} onChange={(v) => setStyle({ animation: v })} options={[{ value: 'none', label: 'Nenhuma' }, { value: 'fade', label: 'Fade' }, { value: 'slide-up', label: 'Slide up' }, { value: 'zoom', label: 'Zoom' }, { value: 'blur', label: 'Blur reveal' }]} />
            </Field>
          )}
          <Toggle label="Linha divisória superior" value={st.divider} onChange={(v) => setStyle({ divider: v })} />
          <Toggle label="Bloquear edição" value={!!s.locked} onChange={(v) => updateSection(s.id, { locked: v })} />
        </div>

        <div className="group">
          <div className="group-title"><span style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MessageSquareText size={12} /> Instruções para o Claude</span></div>
          <TextArea value={s.notes ?? ''} rows={3} onChange={(v) => updateSection(s.id, { notes: v })} placeholder="Ex.: contador animado nos números, carrossel automático no mobile, integrar com Stripe…" />
          <p className="hint" style={{ marginTop: 6 }}>Enviado junto com esta seção no prompt gerado.</p>
        </div>
      </div>
    </>
  );
}

function FieldEditor({ field, value, onChange }: { field: FieldDef; value: PropValue | undefined; onChange: (v: PropValue) => void }) {
  switch (field.kind) {
    case 'image':
      return <Field label={field.label}><ImageField value={str(value)} onChange={onChange} /></Field>;
    case 'text':
    case 'url':
      return <Field label={field.label}><TextInput value={str(value)} onChange={onChange} placeholder={'placeholder' in field ? field.placeholder : undefined} /></Field>;
    case 'textarea':
      return <Field label={field.label}><TextArea value={str(value)} onChange={onChange} placeholder={field.placeholder} /></Field>;
    case 'color':
      return <Field label={field.label}><ColorInput value={str(value) || '#000000'} onChange={onChange} /></Field>;
    case 'icon':
      return <Field label={field.label}><IconPicker value={str(value)} onChange={onChange} /></Field>;
    case 'number':
      return <Field label={field.label}><Slider value={Number(value ?? 0)} min={field.min ?? 0} max={field.max ?? 100} step={field.step} onChange={onChange} /></Field>;
    case 'toggle':
      return <Toggle label={field.label} value={bool(value)} onChange={onChange} />;
    case 'select':
      return <Field label={field.label}><Select value={str(value)} onChange={onChange} options={field.options} /></Field>;
    case 'list':
      return <ListEditor field={field} items={list(value)} onChange={onChange} />;
  }
}

function ListEditor({ field, items, onChange }: { field: Extract<FieldDef, { kind: 'list' }>; items: Props[]; onChange: (v: PropValue) => void }) {
  const [open, setOpen] = useState<number | null>(null);
  const update = (i: number, key: string, v: PropValue) => onChange(items.map((it, j) => (j === i ? { ...it, [key]: v } : it)));
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
    setOpen(j);
  };
  const titleOf = (it: Props) => str(it[field.fields[0]?.key]) || str(it[field.fields[1]?.key]) || field.itemLabel;

  return (
    <div className="field">
      <label>{field.label} <span className="badge badge-brand">{items.length}</span></label>
      {items.map((it, i) => (
        <div className="list-item" key={i}>
          <div className="list-item-head" onClick={() => setOpen(open === i ? null : i)}>
            {open === i ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            <span className="t">{titleOf(it)}</span>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); move(i, -1); }} title="Subir"><ArrowUp size={12} /></button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); move(i, 1); }} title="Descer"><ArrowDown size={12} /></button>
            <button className="btn btn-ghost btn-icon btn-sm" onClick={(e) => { e.stopPropagation(); onChange([...items.slice(0, i + 1), structuredClone(it), ...items.slice(i + 1)]); }} title="Duplicar"><Copy size={12} /></button>
            <button className="btn btn-ghost btn-icon btn-sm btn-danger" onClick={(e) => { e.stopPropagation(); onChange(items.filter((_, j) => j !== i)); }} title="Remover"><Trash2 size={12} /></button>
          </div>
          {open === i && (
            <div className="list-item-body">
              {field.fields.map((f) => (
                <FieldEditor key={f.key} field={f} value={it[f.key]} onChange={(v) => update(i, f.key, v)} />
              ))}
            </div>
          )}
        </div>
      ))}
      <button className="btn btn-sm" style={{ width: '100%', borderStyle: 'dashed' }} onClick={() => { onChange([...items, field.newItem()]); setOpen(items.length); }}>
        <Plus size={13} /> Adicionar {field.itemLabel.toLowerCase()}
      </button>
    </div>
  );
}
