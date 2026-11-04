import { useStore, activePage } from '../core/store';
import { createSection } from '../core/factory';
import { canvasElements, canvasRows, clampEl, elId, nextFreeRow, GRID_COLS, type CanvasEl } from '../core/canvas';
import { SECTION_PRESETS, toProps } from '../core/canvasKit';
import type { PropValue, Section } from '../core/types';

// Element operations for the Canvas editor. Every mutation goes through the
// store's commit() so undo/redo, autosave and the prompt stay in sync.

const st = () => useStore.getState();
const page = () => activePage(st());
export const sectionById = (id: string | null): Section | undefined => (id ? page().sections.find((s) => s.id === id) : undefined);

export function setElements(sectionId: string, fn: (els: CanvasEl[]) => CanvasEl[], key?: string) {
  st().mutateSection(sectionId, (s) => ({ ...s, props: { ...s.props, elements: fn(canvasElements(s.props)).map(clampEl) as unknown as PropValue } }), key);
}

export function patchElements(sectionId: string, ids: string[], patch: Partial<CanvasEl> | ((e: CanvasEl) => Partial<CanvasEl>), key?: string) {
  const set = new Set(ids);
  setElements(sectionId, (els) => els.map((e) => (set.has(e.id) ? { ...e, ...(typeof patch === 'function' ? patch(e) : patch) } : e)), key ?? `el:${ids.join(',')}:${typeof patch === 'function' ? 'fn' : Object.keys(patch).join(',')}`);
}

export function selectEls(sectionId: string | null, ids: string[]) {
  useStore.setState({ elSel: { sectionId, ids }, editingPath: null, selectedId: sectionId });
}

export function clearSelection() {
  useStore.setState({ elSel: { sectionId: null, ids: [] }, editingPath: null, selectedId: null });
}

/** The free-form section new elements should land in (selected → first on page → new one). */
export function targetCanvasSection(): string {
  const { elSel, selectedId } = st();
  const pick = sectionById(elSel.sectionId) ?? sectionById(selectedId);
  if (pick?.type === 'canvas') return pick.id;
  const first = page().sections.find((s) => s.type === 'canvas' && !s.hidden);
  if (first) return first.id;
  return addSectionPreset('blank');
}

export function addElement(el: CanvasEl, at?: { sectionId: string; col: number; row: number }) {
  const sectionId = at?.sectionId ?? targetCanvasSection();
  const s = sectionById(sectionId);
  if (!s) return;
  const els = canvasElements(s.props);
  const placed = clampEl({
    ...el,
    id: elId(),
    col: at ? at.col : Math.floor((GRID_COLS - el.span) / 2) + 1,
    row: at ? at.row : nextFreeRow(els),
    z: Math.max(1, ...els.map((x) => x.z ?? 1)) + (el.kind === 'shape' && el.mobileHidden ? -1 : 1),
  });
  setElements(sectionId, (list) => [...list, placed]);
  selectEls(sectionId, [placed.id]);
  requestAnimationFrame(() => document.querySelector(`[data-el-id="${placed.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }));
}

/** Inserts a free-form section built from a preset; returns its id. */
export function addSectionPreset(presetId: string, index?: number): string {
  const preset = SECTION_PRESETS.find((p) => p.id === presetId) ?? SECTION_PRESETS[0];
  const comp = preset.build();
  const s = createSection('canvas');
  s.props = toProps(comp);
  s.props.elements = (canvasElements(s.props)).map((e) => ({ ...e, id: elId() })) as unknown as PropValue;
  if (comp.style) s.style = { ...s.style, ...comp.style };
  s.name = preset.id === 'blank' ? 'Seção livre' : preset.label;
  st().commit((p) => ({
    ...p,
    pages: p.pages.map((pg) => {
      if (pg.id !== st().activePageId) return pg;
      const list = [...pg.sections];
      const footer = list.findIndex((x) => x.type === 'footer');
      const at = index ?? (footer >= 0 ? footer : list.length);
      list.splice(at, 0, s);
      return { ...pg, sections: list };
    }),
  }));
  useStore.setState({ elSel: { sectionId: s.id, ids: [] }, selectedId: s.id, editingPath: null });
  requestAnimationFrame(() => document.querySelector(`[data-section-id="${s.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  return s.id;
}

export function removeSelected() {
  const { elSel } = st();
  if (!elSel.sectionId || !elSel.ids.length) return;
  const set = new Set(elSel.ids);
  setElements(elSel.sectionId, (els) => els.filter((e) => !set.has(e.id)));
  selectEls(elSel.sectionId, []);
}

export function duplicateSelected() {
  const { elSel } = st();
  const s = sectionById(elSel.sectionId);
  if (!s || !elSel.ids.length) return;
  const set = new Set(elSel.ids);
  const copies = canvasElements(s.props).filter((e) => set.has(e.id)).map((e) => ({ ...e, id: elId(), row: e.row + 1, col: Math.min(e.col + 1, GRID_COLS - e.span + 1), z: (e.z ?? 1) + 1 }));
  setElements(s.id, (els) => [...els, ...copies]);
  selectEls(s.id, copies.map((c) => c.id));
}

let clipboard: CanvasEl[] = [];
export function copySelected() {
  const { elSel } = st();
  const s = sectionById(elSel.sectionId);
  if (!s) return false;
  const set = new Set(elSel.ids);
  clipboard = canvasElements(s.props).filter((e) => set.has(e.id)).map((e) => ({ ...e }));
  return clipboard.length > 0;
}
export function pasteClipboard() {
  if (!clipboard.length) return false;
  const sectionId = targetCanvasSection();
  const s = sectionById(sectionId);
  if (!s) return false;
  const top = Math.min(...clipboard.map((e) => e.row));
  const base = nextFreeRow(canvasElements(s.props));
  const copies = clipboard.map((e) => ({ ...e, id: elId(), row: base + (e.row - top) }));
  setElements(sectionId, (els) => [...els, ...copies]);
  selectEls(sectionId, copies.map((c) => c.id));
  return true;
}

export function nudge(dc: number, dr: number) {
  const { elSel } = st();
  if (!elSel.sectionId || !elSel.ids.length) return;
  patchElements(elSel.sectionId, elSel.ids, (e) => ({ col: e.col + dc, row: Math.max(1, e.row + dr) }), `nudge:${elSel.ids.join(',')}`);
}

export function zOrder(dir: 'front' | 'back' | 'forward' | 'backward') {
  const { elSel } = st();
  const s = sectionById(elSel.sectionId);
  if (!s || !elSel.ids.length) return;
  const zs = canvasElements(s.props).map((e) => e.z ?? 1);
  const max = Math.max(...zs);
  const min = Math.min(...zs);
  patchElements(s.id, elSel.ids, (e) => ({
    z: dir === 'front' ? max + 1 : dir === 'back' ? min - 1 : (e.z ?? 1) + (dir === 'forward' ? 1 : -1),
  }), `z:${elSel.ids.join(',')}`);
}

export function alignInGrid(where: 'left' | 'center' | 'right') {
  const { elSel } = st();
  if (!elSel.sectionId || !elSel.ids.length) return;
  patchElements(elSel.sectionId, elSel.ids, (e) => ({ col: where === 'left' ? 1 : where === 'right' ? GRID_COLS - e.span + 1 : Math.floor((GRID_COLS - e.span) / 2) + 1 }), `align:${elSel.ids.join(',')}`);
}

export function selectAllInSection() {
  const { elSel, selectedId } = st();
  const s = sectionById(elSel.sectionId) ?? sectionById(selectedId);
  if (s?.type === 'canvas') selectEls(s.id, canvasElements(s.props).map((e) => e.id));
}

export function moveSection(sectionId: string, dir: -1 | 1) {
  const list = page().sections;
  const i = list.findIndex((s) => s.id === sectionId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= list.length) return;
  st().moveSection(i, j);
}

/** Grid metrics of a rendered free-form section in screen pixels (zoom-aware). */
export function gridMetrics(sectionId: string) {
  const node = document.querySelector<HTMLElement>(`[data-canvas-id="${sectionId}"]`);
  const s = sectionById(sectionId);
  if (!node || !s) return null;
  const rect = node.getBoundingClientRect();
  const rows = canvasRows(s.props);
  return { rect, colW: rect.width / GRID_COLS, rowH: rect.height / rows };
}

export function cellAt(sectionId: string, clientX: number, clientY: number, span = 1) {
  const m = gridMetrics(sectionId);
  if (!m) return { col: 1, row: 1 };
  const col = Math.floor((clientX - m.rect.left) / m.colW) + 1;
  const row = Math.floor((clientY - m.rect.top) / m.rowH) + 1;
  return { col: Math.max(1, Math.min(GRID_COLS - span + 1, col)), row: Math.max(1, row) };
}
