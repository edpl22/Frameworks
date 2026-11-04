import { useMemo, useState } from 'react';
import { LayoutTemplate, Shapes, Type, Upload, Palette, Image as ImageIcon, Plus, Search } from 'lucide-react';
import { useStore } from '../core/store';
import { TEMPLATES } from '../core/templates';
import { TEXT_PRESETS, SECTION_PRESETS } from '../core/canvasKit';
import { SiteIcon } from '../core/icons';
import { newElement } from '../core/canvas';
import { MediaPanel } from '../studio/MediaPanel';
import { ThemePanel } from '../studio/ThemePanel';
import { templatePreviews } from '../studio/modals';
import { addElement, addSectionPreset } from './ops';
import { BUTTON_PRESETS, DND_ELEMENT, ICON_PICKS, SHAPE_PRESETS, elementFromKey } from './presets';

export type CanvasTab = 'templates' | 'elements' | 'text' | 'uploads' | 'design';

const TABS: { id: CanvasTab; label: string; icon: React.ReactNode }[] = [
  { id: 'templates', label: 'Templates', icon: <LayoutTemplate size={18} /> },
  { id: 'elements', label: 'Elementos', icon: <Shapes size={18} /> },
  { id: 'text', label: 'Texto', icon: <Type size={18} /> },
  { id: 'uploads', label: 'Uploads', icon: <Upload size={18} /> },
  { id: 'design', label: 'Design', icon: <Palette size={18} /> },
];

export function CanvasRail({ tab, setTab }: { tab: CanvasTab; setTab: (t: CanvasTab) => void }) {
  return (
    <nav className="cv-rail" aria-label="Ferramentas do Canvas">
      {TABS.map((t) => (
        <button key={t.id} className={tab === t.id ? 'on' : ''} onClick={() => setTab(t.id)} aria-label={t.label}>
          {t.icon}<span>{t.label}</span>
        </button>
      ))}
    </nav>
  );
}

const drag = (key: string) => ({
  draggable: true,
  onDragStart: (e: React.DragEvent) => { e.dataTransfer.setData(DND_ELEMENT, key); e.dataTransfer.effectAllowed = 'copy'; },
});
const add = (key: string) => () => { const el = elementFromKey(key); if (el) addElement(el); };

export function CanvasPanel({ tab }: { tab: CanvasTab }) {
  return (
    <aside className="cv-panel">
      {tab === 'templates' && <TemplatesPanel />}
      {tab === 'elements' && <ElementsPanel />}
      {tab === 'text' && <TextPanel />}
      {tab === 'uploads' && <MediaPanel />}
      {tab === 'design' && <ThemePanel />}
    </aside>
  );
}

function TemplatesPanel() {
  const newFromTemplate = useStore((s) => s.newFromTemplate);
  const [q, setQ] = useState('');
  const previews = useMemo(templatePreviews, []);
  const term = q.trim().toLowerCase();
  const themed = previews.filter(({ t }) => t.mode === 'canvas');
  const list = (term ? previews : themed).filter(({ t }) => !term || `${t.name} ${t.description} ${t.tags.join(' ')} ${t.category}`.toLowerCase().includes(term));
  return (
    <>
      <div className="panel-head"><div><div className="panel-title">Templates</div><div className="panel-sub">{term ? `${list.length} resultados` : 'Temáticos, prontos para editar no Canvas'}</div></div></div>
      <div className="panel-body">
        <div className="search"><Search size={14} /><input className="input" placeholder={`Buscar entre ${TEMPLATES.length} templates…`} value={q} onChange={(e) => setQ(e.target.value)} /></div>
        <div className="cv-tpl-list">
          {list.map(({ t, html, css, swatches }) => (
            <button key={t.id} className="cv-tpl" onClick={() => newFromTemplate(t.id)} title={t.description}>
              <div className={`cv-tpl-thumb tpl-${t.id}`}>
                <style>{css}</style>
                <div className="cv-tpl-inner" dangerouslySetInnerHTML={{ __html: html }} />
              </div>
              <div className="cv-tpl-info">
                <b>{t.name}</b>
                <span className="tpl-sw">{swatches.map((c, i) => <i key={i} style={{ background: c }} />)}</span>
              </div>
            </button>
          ))}
        </div>
        {!term && <p className="hint" style={{ marginTop: 12 }}>Busque para ver também os {TEMPLATES.length - themed.length} templates do Studio — todos abrem aqui.</p>}
      </div>
    </>
  );
}

function ElementsPanel() {
  return (
    <>
      <div className="panel-head"><div><div className="panel-title">Elementos</div><div className="panel-sub">Clique para adicionar ou arraste até o lugar</div></div></div>
      <div className="panel-body">
        <div className="lib-cat">Seções</div>
        <div className="cv-chip-grid">
          {SECTION_PRESETS.map((p) => <button key={p.id} className="cv-chip" onClick={() => addSectionPreset(p.id)}><Plus size={12} /> {p.label}</button>)}
        </div>
        <div className="lib-cat">Formas</div>
        <div className="cv-shape-grid">
          {SHAPE_PRESETS.map((s) => (
            <button key={s.key} className="cv-shape-tile" title={s.label} onClick={add(`shape:${s.key}`)} {...drag(`shape:${s.key}`)}>
              <i className={`cv-shape-prev ${s.key}`} />
              <span>{s.label}</span>
            </button>
          ))}
        </div>
        <div className="lib-cat">Botões e selos</div>
        <div className="cv-chip-grid">
          {BUTTON_PRESETS.map((b) => <button key={b.key} className={`cv-btn-prev ${b.key}`} onClick={add(`button:${b.key}`)} {...drag(`button:${b.key}`)}>{b.label}</button>)}
          <button className="cv-btn-prev badge" onClick={add('badge')} {...drag('badge')}>Selo</button>
          <button className="cv-btn-prev divider" onClick={add('divider')} {...drag('divider')}>Divisor</button>
        </div>
        <div className="lib-cat">Imagem</div>
        <button className="cv-image-tile" onClick={add('image')} {...drag('image')}><ImageIcon size={18} /> Espaço para imagem</button>
        <div className="lib-cat">Ícones</div>
        <div className="cv-icon-grid">
          {ICON_PICKS.map((n) => <button key={n} title={n} onClick={add(`icon:${n}`)} {...drag(`icon:${n}`)}><SiteIcon name={n} size={18} /></button>)}
        </div>
      </div>
    </>
  );
}

function TextPanel() {
  return (
    <>
      <div className="panel-head"><div><div className="panel-title">Texto</div><div className="panel-sub">Duplo clique no canvas para editar</div></div></div>
      <div className="panel-body">
        <div className="cv-text-list">
          {TEXT_PRESETS.map((t, i) => (
            <button key={t.label} className={`cv-text-tile s-${t.sample}`} onClick={add(`text:${i}`)} {...drag(`text:${i}`)}>{t.label}</button>
          ))}
        </div>
        <div className="lib-cat">Combinações</div>
        <button className="cv-combo" onClick={() => {
          addElement(newElement('text', { span: 4, rows: 1, size: 'xs', upper: true, color: 'primary', text: 'Sobretítulo' }));
          addElement(newElement('heading', { span: 8, rows: 2, size: 'xl', text: 'Título da seção' }));
          addElement(newElement('text', { span: 6, rows: 2, text: 'Um parágrafo curto de apoio ao título.' }));
        }}>
          <small>SOBRETÍTULO</small><b>Título da seção</b><span>Um parágrafo curto de apoio.</span>
        </button>
      </div>
    </>
  );
}
