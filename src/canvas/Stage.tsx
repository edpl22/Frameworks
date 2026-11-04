import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowUp, ArrowDown, Copy, Trash2, Plus, Frame } from 'lucide-react';
import { useStore, useActivePage } from '../core/store';
import { RenderContext, DND_ASSET_TYPE } from '../core/render/editable';
import { SiteSection } from '../core/render/SiteSection';
import { SECTION_MAP } from '../core/sections';
import { canvasElements, newElement, type CanvasEl } from '../core/canvas';
import { SECTION_PRESETS } from '../core/canvasKit';
import type { Section } from '../core/types';
import { uploadImage } from '../studio/assetOps';
import { DEVICE_WIDTH } from '../studio/Canvas';
import { addElement, addSectionPreset, cellAt, clearSelection, gridMetrics, moveSection, sectionById, selectEls, setElements } from './ops';
import { DND_ELEMENT, elementFromKey } from './presets';

interface DragState {
  sectionId: string;
  ids: string[];
  handle: string | null;
  x0: number;
  y0: number;
  orig: Map<string, CanvasEl>;
  colW: number;
  rowH: number;
  last: string;
  captured?: boolean;
}

function applyDrag(o: CanvasEl, handle: string | null, dc: number, dr: number): Partial<CanvasEl> {
  if (!handle) return { col: o.col + dc, row: Math.max(1, o.row + dr) };
  const p: Partial<CanvasEl> = {};
  if (handle.includes('e')) p.span = Math.max(1, o.span + dc);
  if (handle.includes('w')) {
    const d = Math.min(dc, o.span - 1);
    const col = Math.max(1, o.col + d);
    p.col = col;
    p.span = o.span - (col - o.col);
  }
  if (handle.includes('s')) p.rows = Math.max(1, o.rows + dr);
  if (handle.includes('n')) {
    const d = Math.min(dr, o.rows - 1);
    const row = Math.max(1, o.row + d);
    p.row = row;
    p.rows = o.rows - (row - o.row);
  }
  return p;
}

export function Stage() {
  const page = useActivePage();
  const device = useStore((s) => s.device);
  const zoom = useStore((s) => s.zoom);
  const wrapRef = useRef<HTMLDivElement>(null);
  const drag = useRef<DragState | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [fit, setFit] = useState(1);
  const width = DEVICE_WIDTH[device];

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setFit(Math.min(1, (el.clientWidth - 80) / width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [width]);
  const scale = fit * zoom;
  useEffect(() => { useStore.setState({ fitScale: scale }); }, [scale]);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const t = e.target as HTMLElement;
    if (t.closest('.cv-sec-tools, .cv-add, .cv-pop')) return;
    if (t.isContentEditable || t.closest('[contenteditable="true"]')) return;
    const secNode = t.closest<HTMLElement>('[data-section-id]');
    if (!secNode) { clearSelection(); return; }
    const sectionId = secNode.dataset.sectionId!;
    const elNode = t.closest<HTMLElement>('[data-el-id]');
    const canvasNode = t.closest<HTMLElement>('[data-canvas-id]');
    if (!elNode || !canvasNode) {
      const s = sectionById(sectionId);
      useStore.setState({ elSel: { sectionId: s?.type === 'canvas' ? sectionId : null, ids: [] }, selectedId: sectionId, editingPath: null });
      return;
    }
    const sid = canvasNode.dataset.canvasId!;
    const id = elNode.dataset.elId!;
    const cur = useStore.getState().elSel;
    let ids: string[];
    if (e.shiftKey) ids = cur.sectionId === sid ? (cur.ids.includes(id) ? cur.ids.filter((x) => x !== id) : [...cur.ids, id]) : [id];
    else ids = cur.sectionId === sid && cur.ids.includes(id) ? cur.ids : [id];
    selectEls(sid, ids);
    if (t.closest('label, input, textarea, select, button')) return; // image upload etc.
    const s = sectionById(sid);
    const m = gridMetrics(sid);
    if (!s || !m || !ids.length) return;
    const handle = t.closest<HTMLElement>('[data-handle]')?.dataset.handle ?? null;
    const set = new Set(handle ? [id] : ids);
    drag.current = {
      sectionId: sid, ids: [...set], handle, x0: e.clientX, y0: e.clientY,
      orig: new Map(canvasElements(s.props).filter((x) => set.has(x.id)).map((x) => [x.id, x])),
      colW: m.colW, rowH: m.rowH, last: '0,0',
    };
    // Pointer capture starts only once the pointer actually moves (see onPointerMove),
    // so clicks and double-clicks still reach the element underneath.
    e.preventDefault();
  };

  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (!d.captured) {
      if (Math.abs(e.clientX - d.x0) < 3 && Math.abs(e.clientY - d.y0) < 3) return;
      d.captured = true;
      try { wrapRef.current?.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    }
    const dc = Math.round((e.clientX - d.x0) / d.colW);
    const dr = Math.round((e.clientY - d.y0) / d.rowH);
    const key = `${dc},${dr}`;
    if (key === d.last) return;
    d.last = key;
    if (!dragging) setDragging(true);
    setElements(d.sectionId, (els) => els.map((x) => {
      const o = d.orig.get(x.id);
      return o ? { ...x, ...applyDrag(o, d.handle, dc, dr) } : x;
    }), `drag:${d.ids.join(',')}:${d.handle ?? 'move'}`);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!drag.current) return;
    drag.current = null;
    setDragging(false);
    try { wrapRef.current?.releasePointerCapture(e.pointerId); } catch { /* ignore */ }
  };

  // Drops from the side panels (elements, text presets, media library).
  const canvasUnder = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>('[data-canvas-id]')?.dataset.canvasId ?? null;
  const onDragOver = (e: React.DragEvent) => {
    const types = e.dataTransfer.types;
    if (!types.includes(DND_ELEMENT) && !types.includes(DND_ASSET_TYPE)) return;
    const sid = canvasUnder(e.clientX, e.clientY);
    setDropTarget(sid);
    if (sid) { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }
  };
  const onDrop = (e: React.DragEvent) => {
    const sid = canvasUnder(e.clientX, e.clientY);
    setDropTarget(null);
    if (!sid) return;
    const asset = e.dataTransfer.getData(DND_ASSET_TYPE);
    const key = e.dataTransfer.getData(DND_ELEMENT);
    const el = asset ? newElement('image', { src: asset, span: 4, rows: 5 }) : key ? elementFromKey(key) : null;
    if (!el) return;
    e.preventDefault();
    const cell = cellAt(sid, e.clientX, e.clientY, el.span);
    addElement(el, { sectionId: sid, ...cell });
  };

  return (
    <div
      className={'cv-stage-wrap' + (dragging ? ' is-dragging' : '')}
      ref={wrapRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onDragOver={onDragOver}
      onDragLeave={(e) => { if (!wrapRef.current?.contains(e.relatedTarget as Node)) setDropTarget(null); }}
      onDrop={onDrop}
      onClickCapture={(e) => { if ((e.target as HTMLElement).closest('a')) e.preventDefault(); }}
      onDoubleClick={(e) => {
        // Double-click anywhere on a text element edits its text.
        const t = e.target as HTMLElement;
        if (t.isContentEditable) return;
        const elNode = t.closest<HTMLElement>('[data-el-id]');
        const sid = t.closest<HTMLElement>('[data-canvas-id]')?.dataset.canvasId;
        const s = sectionById(sid ?? null);
        if (!elNode || !s) return;
        const els = canvasElements(s.props);
        const i = els.findIndex((x) => x.id === elNode.dataset.elId);
        const kind = els[i]?.kind;
        if (i >= 0 && (kind === 'heading' || kind === 'text' || kind === 'button' || kind === 'badge')) useStore.setState({ editingPath: `elements.${i}.text` });
      }}
    >
      <div className="cv-stage">
        <div className={`device ${device}`} style={{ width, zoom: scale } as React.CSSProperties}>
          <div className="device-frame">
            <div className="fw-site cv-site">
              {page.sections.map((s, i) => (
                <CvSection key={s.id} s={s} index={i} count={page.sections.length} dropTarget={dropTarget === s.id} />
              ))}
              {!page.sections.length && <EmptyPage />}
              <AddSection index={page.sections.length} last />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyPage() {
  return (
    <div className="cv-empty">
      <Frame size={28} />
      <b>Página em branco</b>
      <span>Escolha um template na barra lateral ou adicione uma seção livre.</span>
      <button className="btn btn-primary btn-sm" onClick={() => addSectionPreset('hero')}><Plus size={13} /> Adicionar abertura</button>
    </div>
  );
}

function CvSection({ s, index, count, dropTarget }: { s: Section; index: number; count: number; dropTarget: boolean }) {
  const selected = useStore((st) => st.selectedId === s.id);
  const elIds = useStore((st) => (st.elSel.sectionId === s.id ? st.elSel.ids : EMPTY));
  const editingPath = useStore((st) => st.editingPath);
  const { updateProp, duplicateSection, removeSection } = useStore.getState();
  const isCanvas = s.type === 'canvas';
  const ctx = useMemo(() => ({
    editable: !s.locked,
    onEdit: (path: string, v: string) => updateProp(s.id, path, v),
    uploadImage,
    ...(isCanvas ? { canvasEditing: { selected: elIds, editingPath, startEdit: (p: string | null) => useStore.setState({ editingPath: p }) } } : {}),
  }), [s.id, s.locked, isCanvas, elIds, editingPath, updateProp]);
  if (s.hidden) return null;
  const label = s.name || SECTION_MAP[s.type]?.label;
  return (
    <>
      <div className={'cv-sec' + (selected ? ' sel' : '') + (isCanvas ? ' is-canvas' : '') + (dropTarget ? ' drop' : '')} data-section-id={s.id}>
        <div className="cv-sec-tag">{label}{!isCanvas && <span> · seção do Studio</span>}</div>
        <div className="cv-sec-tools">
          <button title="Mover para cima" disabled={index === 0} onClick={() => moveSection(s.id, -1)}><ArrowUp size={13} /></button>
          <button title="Mover para baixo" disabled={index === count - 1} onClick={() => moveSection(s.id, 1)}><ArrowDown size={13} /></button>
          <button title="Duplicar seção" onClick={() => duplicateSection(s.id)}><Copy size={13} /></button>
          <button title="Excluir seção" className="danger" onClick={() => { removeSection(s.id); clearSelection(); }}><Trash2 size={13} /></button>
        </div>
        <RenderContext.Provider value={ctx}>
          <SiteSection s={s} />
        </RenderContext.Provider>
      </div>
      {index < count - 1 && <AddSection index={index + 1} />}
    </>
  );
}
const EMPTY: string[] = [];

function AddSection({ index, last }: { index: number; last?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={'cv-add' + (last ? ' last' : '')}>
      <button className="cv-add-btn" onClick={() => setOpen((o) => !o)} title="Adicionar seção aqui"><Plus size={14} />{last && <span>Adicionar seção</span>}</button>
      {open && (
        <div className="cv-pop" onMouseLeave={() => setOpen(false)}>
          {SECTION_PRESETS.map((p) => (
            <button key={p.id} onClick={() => { addSectionPreset(p.id, index); setOpen(false); }}>{p.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}
