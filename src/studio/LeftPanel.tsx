import { useMemo, useState } from 'react';
import { Image as ImageIcon } from 'lucide-react';
import { MediaPanel } from './MediaPanel';
import { AuditPanel, useAudit } from './AuditPanel';
import { ShieldCheck } from 'lucide-react';
import { Search, GripVertical, Eye, EyeOff, Lock, Unlock, Copy, Trash2, Plus, FileText, Files, Layers3, Blocks, Palette, ClipboardList, Keyboard } from 'lucide-react';
import { useStore, useActivePage, type LeftTab, type RightTab } from '../core/store';
import { useShallow } from 'zustand/react/shallow';
import { CATEGORIES, SECTIONS, SECTION_MAP } from '../core/sections';
import type { SectionType } from '../core/types';
import { Field, TextArea, TextInput } from './ui';

export const DND_NEW = 'application/x-fw-new';
export const DND_MOVE = 'application/x-fw-move';

export function Rail() {
  const { leftTab, rightTab, set } = useStore(useShallow((s) => ({ leftTab: s.leftTab, rightTab: s.rightTab, set: s.set })));
  const audit = useAudit();
  const alerts = audit.counts.error + audit.counts.warning;
  const left: { id: LeftTab; icon: JSX; tip: string }[] = [
    { id: 'library', icon: <Blocks size={18} />, tip: 'Biblioteca de seções' },
    { id: 'layers', icon: <Layers3 size={18} />, tip: 'Camadas' },
    { id: 'pages', icon: <Files size={18} />, tip: 'Páginas' },
    { id: 'media', icon: <ImageIcon size={18} />, tip: 'Mídia' },
    { id: 'audit', icon: <ShieldCheck size={18} />, tip: 'Qualidade' },
  ];
  const right: { id: RightTab; icon: JSX; tip: string }[] = [
    { id: 'theme', icon: <Palette size={18} />, tip: 'Design system' },
    { id: 'brief', icon: <ClipboardList size={18} />, tip: 'Briefing do projeto' },
  ];
  return (
    <nav className="rail" aria-label="Ferramentas">
      {left.map((t) => (
        <button key={t.id} className={'tip' + (leftTab === t.id ? ' on' : '')} data-tip={t.tip} aria-label={t.tip} onClick={() => set({ leftTab: t.id })}>
          {t.icon}
          {t.id === 'audit' && alerts > 0 && <span className={'rail-badge' + (audit.counts.error ? ' err' : '')}>{alerts > 9 ? '9+' : alerts}</span>}
        </button>
      ))}
      <div style={{ width: 24, height: 1, background: 'var(--line-2)', margin: '6px 0' }} />
      {right.map((t) => (
        <button key={t.id} className={'tip' + (rightTab === t.id ? ' on' : '')} data-tip={t.tip} aria-label={t.tip} onClick={() => set({ rightTab: t.id, selectedId: null })}>{t.icon}</button>
      ))}
      <div className="grow" />
      <button className="tip" data-tip="Atalhos de teclado" aria-label="Atalhos" onClick={() => set({ modal: 'shortcuts' })}><Keyboard size={18} /></button>
    </nav>
  );
}
type JSX = React.ReactNode;

export function LeftPanel() {
  const tab = useStore((s) => s.leftTab);
  return (
    <aside className="lpanel">
      {tab === 'library' && <Library />}
      {tab === 'layers' && <LayersPanel />}
      {tab === 'pages' && <PagesPanel />}
      {tab === 'media' && <MediaPanel />}
      {tab === 'audit' && <AuditPanel />}
    </aside>
  );
}

function Library() {
  const [q, setQ] = useState('');
  const addSection = useStore((s) => s.addSection);
  const filtered = useMemo(() => {
    const t = q.trim().toLowerCase();
    return t ? SECTIONS.filter((d) => (d.label + d.description + d.category + d.type).toLowerCase().includes(t)) : SECTIONS;
  }, [q]);

  return (
    <>
      <div className="panel-head">
        <div>
          <div className="panel-title">Biblioteca</div>
          <div className="panel-sub">Clique ou arraste para o canvas</div>
        </div>
      </div>
      <div className="panel-body">
        <div className="search">
          <Search size={14} />
          <input className="input" placeholder="Buscar seções…" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
        {CATEGORIES.map((cat) => {
          const items = filtered.filter((d) => d.category === cat);
          if (!items.length) return null;
          return (
            <div key={cat}>
              <div className="lib-cat">{cat}</div>
              {items.map((d) => {
                const Icon = d.icon;
                return (
                  <div
                    key={d.type}
                    className="lib-item"
                    draggable
                    onDragStart={(e) => { e.dataTransfer.setData(DND_NEW, d.type); e.dataTransfer.effectAllowed = 'copy'; }}
                    onClick={() => addSection(d.type)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === 'Enter') addSection(d.type); }}
                  >
                    <div className="lib-icon"><Icon size={16} /></div>
                    <div style={{ minWidth: 0 }}>
                      <div className="lib-name">{d.label}</div>
                      <div className="lib-desc">{d.description}</div>
                      {d.variants.length > 1 && (
                        <div className="lib-variants">
                          {d.variants.map((v) => (
                            <span key={v.id} title={`Adicionar: ${v.label}`} onClick={(e) => { e.stopPropagation(); addSection(d.type, v.id); }}>{v.label}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </>
  );
}

function LayersPanel() {
  const page = useActivePage();
  const selectedId = useStore((s) => s.selectedId);
  const { select, moveSection, updateSection, duplicateSection, removeSection, set } = useStore.getState();
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<{ i: number; after: boolean } | null>(null);

  return (
    <>
      <div className="panel-head">
        <div>
          <div className="panel-title">Camadas</div>
          <div className="panel-sub">{page.name} · {page.sections.length} seções</div>
        </div>
        <button className="btn btn-sm" onClick={() => set({ leftTab: 'library' })}><Plus size={13} /> Seção</button>
      </div>
      <div className="panel-body">
        {page.sections.map((s, i) => {
          const def = SECTION_MAP[s.type];
          const Icon = def.icon;
          const cls = ['layer', selectedId === s.id ? 'on' : '', s.hidden ? 'dim' : '', over?.i === i ? (over.after ? 'drop-after' : 'drop-before') : ''].join(' ');
          return (
            <div
              key={s.id}
              className={cls}
              draggable
              onDragStart={(e) => { setDrag(i); e.dataTransfer.setData(DND_MOVE, String(i)); e.dataTransfer.effectAllowed = 'move'; }}
              onDragOver={(e) => {
                e.preventDefault();
                const r = e.currentTarget.getBoundingClientRect();
                setOver({ i, after: e.clientY > r.top + r.height / 2 });
              }}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => {
                e.preventDefault();
                const newType = e.dataTransfer.getData(DND_NEW) as SectionType;
                const target = over ? over.i + (over.after ? 1 : 0) : i;
                if (newType) useStore.getState().addSection(newType, undefined, target);
                else if (drag !== null) moveSection(drag, target > drag ? target - 1 : target);
                setDrag(null);
                setOver(null);
              }}
              onDragEnd={() => { setDrag(null); setOver(null); }}
              onClick={() => {
                select(s.id);
                document.querySelector(`[data-section-id="${s.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              <span className="grip"><GripVertical size={14} /></span>
              <Icon size={14} style={{ flex: 'none', color: 'var(--text-3)' }} />
              <span className="name">{s.name || def.label}</span>
              <span className="acts" onClick={(e) => e.stopPropagation()}>
                <button title={s.hidden ? 'Mostrar' : 'Ocultar'} onClick={() => updateSection(s.id, { hidden: !s.hidden })}>{s.hidden ? <EyeOff size={13} /> : <Eye size={13} />}</button>
                <button title={s.locked ? 'Desbloquear' : 'Bloquear'} onClick={() => updateSection(s.id, { locked: !s.locked })}>{s.locked ? <Lock size={13} /> : <Unlock size={13} />}</button>
                <button title="Duplicar" onClick={() => duplicateSection(s.id)}><Copy size={13} /></button>
                <button title="Excluir" disabled={s.locked} onClick={() => removeSection(s.id)}><Trash2 size={13} /></button>
              </span>
            </div>
          );
        })}
        {!page.sections.length && <p className="hint" style={{ textAlign: 'center', padding: 30 }}>Nenhuma seção nesta página.</p>}
      </div>
    </>
  );
}

function PagesPanel() {
  const { project, activePageId } = useStore(useShallow((s) => ({ project: s.project, activePageId: s.activePageId })));
  const { set, addPage, removePage, updatePage, duplicatePage } = useStore.getState();
  const page = project.pages.find((p) => p.id === activePageId) ?? project.pages[0];
  return (
    <>
      <div className="panel-head">
        <div>
          <div className="panel-title">Páginas</div>
          <div className="panel-sub">{project.pages.length} página(s) no projeto</div>
        </div>
        <button className="btn btn-sm" onClick={() => addPage()}><Plus size={13} /> Página</button>
      </div>
      <div className="panel-body">
        {project.pages.map((p) => (
          <div key={p.id} className={'page-item' + (p.id === activePageId ? ' on' : '')} onClick={() => set({ activePageId: p.id, selectedId: null })}>
            <FileText size={15} style={{ color: 'var(--text-3)' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.name}</div>
              <div className="slug">{p.slug}</div>
            </div>
            <button className="btn btn-ghost btn-icon btn-sm" title="Duplicar" onClick={(e) => { e.stopPropagation(); duplicatePage(p.id); }}><Copy size={13} /></button>
            <button className="btn btn-ghost btn-icon btn-sm btn-danger" title="Excluir" onClick={(e) => { e.stopPropagation(); removePage(p.id); }}><Trash2 size={13} /></button>
          </div>
        ))}

        <div className="group" style={{ marginTop: 14 }}>
          <div className="group-title">Configurações da página</div>
          <Field label="Nome"><TextInput value={page.name} onChange={(v) => updatePage(page.id, { name: v })} /></Field>
          <Field label="Slug / rota"><TextInput mono value={page.slug} onChange={(v) => updatePage(page.id, { slug: v.startsWith('/') ? v : '/' + v })} /></Field>
          <Field label="SEO title" hint={<span className={'badge ' + (page.seoTitle.length > 60 ? 'badge-warn' : 'badge-ok')}>{page.seoTitle.length}/60</span>}>
            <TextInput value={page.seoTitle} onChange={(v) => updatePage(page.id, { seoTitle: v })} />
          </Field>
          <Field label="Meta description" hint={<span className={'badge ' + (page.seoDescription.length > 160 ? 'badge-warn' : 'badge-ok')}>{page.seoDescription.length}/160</span>}>
            <TextArea value={page.seoDescription} onChange={(v) => updatePage(page.id, { seoDescription: v })} />
          </Field>
        </div>
      </div>
    </>
  );
}
