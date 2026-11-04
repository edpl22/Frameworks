import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, Copy, Trash2, EyeOff, Eye, Plus, GripVertical, Sparkles, Lock } from 'lucide-react';
import { useStore, useActivePage } from '../core/store';
import { RenderContext } from '../core/render/editable';
import { SiteSection } from '../core/render/SiteSection';
import { generateSiteCSS } from '../core/siteCss';
import { SECTIONS, SECTION_MAP } from '../core/sections';
import type { Device, Section, SectionType } from '../core/types';
import { DND_MOVE, DND_NEW } from './LeftPanel';
import { uploadImage } from './assetOps';

export const DEVICE_WIDTH: Record<Device, number> = { desktop: 1440, tablet: 820, mobile: 390 };

/** Injects the generated site stylesheet for the current theme. */
export function SiteStyles() {
  const theme = useStore((s) => s.project.theme);
  const css = useMemo(() => generateSiteCSS(theme), [theme]);
  return <style data-fw-site>{css}</style>;
}

export function Canvas() {
  const page = useActivePage();
  const { device, zoom, preview, showGrid, select, moveSection, addSection, set } = useStore();
  const wrapRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const [fit, setFit] = useState(1);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [insertAt, setInsertAt] = useState<number | null>(null);

  const width = DEVICE_WIDTH[device];
  const fullBleed = preview && device === 'desktop';

  // Auto-fit the device into the available canvas width.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const avail = el.clientWidth - (preview ? 0 : 96);
      setFit(Math.min(1, avail / width));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [width, preview]);

  const scale = fullBleed ? 1 : fit * zoom;
  useEffect(() => { set({ fitScale: scale }); }, [scale, set]);

  const computeIndex = (clientY: number) => {
    const kids = Array.from(listRef.current?.querySelectorAll<HTMLElement>(':scope > .cs') ?? []);
    for (let i = 0; i < kids.length; i++) {
      const r = kids[i].getBoundingClientRect();
      if (clientY < r.top + r.height / 2) return i;
    }
    return kids.length;
  };

  const onDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (!types.includes(DND_NEW) && !types.includes(DND_MOVE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = types.includes(DND_NEW) ? 'copy' : 'move';
    setDropIndex(computeIndex(e.clientY));
  };
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const idx = dropIndex ?? computeIndex(e.clientY);
    const t = e.dataTransfer.getData(DND_NEW) as SectionType;
    const from = e.dataTransfer.getData(DND_MOVE);
    if (t) addSection(t, undefined, idx);
    else if (from !== '') {
      const f = Number(from);
      moveSection(f, idx > f ? idx - 1 : idx);
    }
    setDropIndex(null);
    setDragFrom(null);
  };

  return (
    <div
      className="canvas-wrap"
      ref={wrapRef}
      onClick={() => select(null)}
      onDragOver={onDragOver}
      onDrop={onDrop}
      onDragLeave={(e) => { if (!wrapRef.current?.contains(e.relatedTarget as Node)) setDropIndex(null); }}
    >
      <div className={'canvas-stage' + (preview ? ' preview' : '')}>
        <div className={`device ${device}`} style={{ width: fullBleed ? '100%' : width, zoom: scale } as React.CSSProperties}>
          {!preview && (
            <div className="device-label"><span>{page.name} · {page.slug}</span><span>{width}px · {Math.round(scale * 100)}%</span></div>
          )}
          <div className="device-frame">
            <div
              className="fw-site"
              ref={listRef}
              style={{ minHeight: device === 'mobile' ? 780 : 600, position: 'relative' }}
              onClickCapture={(e) => { if ((e.target as HTMLElement).closest('a')) e.preventDefault(); }}
            >
              {showGrid && !preview && <div className="canvas-grid-overlay" />}
              {page.sections.map((s, i) => (
                <FragmentWithDrop key={s.id} show={dropIndex === i} label={dragFrom !== null ? 'Mover para cá' : 'Soltar seção aqui'}>
                  <CanvasSection
                    s={s}
                    index={i}
                    count={page.sections.length}
                    preview={preview}
                    dragging={dragFrom === i}
                    onDragStart={() => setDragFrom(i)}
                    onDragEnd={() => { setDragFrom(null); setDropIndex(null); }}
                    onInsert={() => setInsertAt(i + 1)}
                  />
                </FragmentWithDrop>
              ))}
              {dropIndex === page.sections.length && <div className="drop-line"><span>Soltar seção aqui</span></div>}
              {!page.sections.length && (
                <div className="canvas-empty">
                  <Sparkles size={32} style={{ color: '#8b5cf6' }} />
                  <h3 style={{ margin: '14px 0 6px', fontSize: 20, color: '#222' }}>Comece a criar</h3>
                  <p style={{ margin: 0 }}>Arraste seções da biblioteca ou <button className="btn btn-primary btn-sm" onClick={(e) => { e.stopPropagation(); set({ modal: 'templates' }); }}>escolha um template</button></p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {insertAt !== null && <InsertMenu onPick={(t) => { addSection(t, undefined, insertAt); setInsertAt(null); }} onClose={() => setInsertAt(null)} />}
    </div>
  );
}

function FragmentWithDrop({ show, label, children }: { show: boolean; label: string; children: React.ReactNode }) {
  return (
    <>
      {show && <div className="drop-line"><span>{label}</span></div>}
      {children}
    </>
  );
}

interface CSProps {
  s: Section;
  index: number;
  count: number;
  preview: boolean;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onInsert: () => void;
}

function CanvasSection({ s, index, count, preview, dragging, onDragStart, onDragEnd, onInsert }: CSProps) {
  const selected = useStore((st) => st.selectedId === s.id);
  const hovered = useStore((st) => st.hoverId === s.id);
  const { select, set, updateProp, moveSection, duplicateSection, removeSection, updateSection } = useStore.getState();
  const def = SECTION_MAP[s.type];
  const ctx = useMemo(() => ({ editable: !preview && !s.locked, onEdit: (path: string, v: string) => updateProp(s.id, path, v), uploadImage }), [preview, s.locked, s.id, updateProp]);

  if (preview) {
    if (s.hidden) return null;
    return <div className="cs"><SiteSection s={s} /></div>;
  }

  const cls = ['cs', selected ? 'sel' : '', hovered && !selected ? 'hover' : '', s.hidden ? 'is-hidden' : '', dragging ? 'dragging' : ''].join(' ');
  const stop = (fn: () => void) => (e: React.MouseEvent) => { e.stopPropagation(); fn(); };

  return (
    <div
      className={cls}
      data-section-id={s.id}
      onMouseEnter={() => set({ hoverId: s.id })}
      onMouseLeave={() => set({ hoverId: null })}
      onClick={(e) => { e.stopPropagation(); select(s.id); }}
      style={s.type === 'navbar' ? { position: 'sticky', top: 0, zIndex: 20 } : undefined}
    >
      {(selected || hovered) && (
        <div className="cs-tag">{s.locked && <Lock size={11} />}{s.name || def.label}</div>
      )}
      {selected && (
        <div className="cs-tools" onClick={(e) => e.stopPropagation()}>
          <button
            draggable
            title="Arrastar para reordenar"
            style={{ cursor: 'grab' }}
            onDragStart={(e) => { e.dataTransfer.setData(DND_MOVE, String(index)); e.dataTransfer.effectAllowed = 'move'; onDragStart(); }}
            onDragEnd={onDragEnd}
          ><GripVertical size={14} /></button>
          <button title="Mover para cima (Alt+↑)" disabled={index === 0} onClick={stop(() => moveSection(index, index - 1))}><ArrowUp size={14} /></button>
          <button title="Mover para baixo (Alt+↓)" disabled={index === count - 1} onClick={stop(() => moveSection(index, index + 1))}><ArrowDown size={14} /></button>
          <span className="sep" />
          <button title="Duplicar (Ctrl+D)" onClick={stop(() => duplicateSection(s.id))}><Copy size={14} /></button>
          <button title={s.hidden ? 'Mostrar' : 'Ocultar'} onClick={stop(() => updateSection(s.id, { hidden: !s.hidden }))}>{s.hidden ? <Eye size={14} /> : <EyeOff size={14} />}</button>
          <button className="danger" title="Excluir (Del)" disabled={s.locked} onClick={stop(() => removeSection(s.id))}><Trash2 size={14} /></button>
        </div>
      )}
      <RenderContext.Provider value={ctx}>
        <SiteSection s={s} />
      </RenderContext.Provider>
      <button className="add-between" title="Inserir seção abaixo" onClick={stop(onInsert)}><Plus size={15} /></button>
    </div>
  );
}

function InsertMenu({ onPick, onClose }: { onPick: (t: SectionType) => void; onClose: () => void }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  return (
    <div className="cmdk-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="cmdk" style={{ padding: 14 }}>
        <div className="cmdk-group" style={{ paddingTop: 2 }}>Inserir seção</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {SECTIONS.map((d) => {
            const I = d.icon;
            return (
              <button key={d.type} className="lib-item" style={{ margin: 0, cursor: 'pointer' }} onClick={() => onPick(d.type)}>
                <div className="lib-icon"><I size={15} /></div>
                <div className="lib-name">{d.label}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
