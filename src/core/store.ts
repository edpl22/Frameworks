import { create } from 'zustand';
import type { Brief, Device, Page, Palette, Project, Section, SectionStyle, SectionType, Theme } from './types';
import { cloneSection, createPage, createSection, setPath, uid } from './factory';
import { createDefaultProject, projectFromTemplate, TEMPLATES } from './templates';
import { THEME_PRESETS } from './theme';

const STORAGE_KEY = 'fw.project.v1';
const HISTORY_LIMIT = 150;
const COALESCE_MS = 700;

export type LeftTab = 'library' | 'layers' | 'pages' | 'media' | 'audit';
export type RightTab = 'inspector' | 'theme' | 'brief';
export type Modal = null | 'prompt' | 'export' | 'templates' | 'shortcuts' | 'figma';

interface Toast { id: string; text: string; tone: 'ok' | 'info' | 'error' }

interface State {
  project: Project;
  activePageId: string;
  selectedId: string | null;
  hoverId: string | null;
  device: Device;
  zoom: number;
  fitScale: number; // effective canvas scale (auto-fit × zoom), UI only
  leftTab: LeftTab;
  rightTab: RightTab;
  modal: Modal;
  palette: boolean; // command palette open
  preview: boolean;
  showGrid: boolean;
  past: Project[];
  future: Project[];
  lastCommitKey: string | null;
  lastCommitAt: number;
  clipboard: Section | null;
  toasts: Toast[];
  filePath: string | null; // desktop: current file on disk
  dirty: boolean;
  /** Editor flavour: the full Studio or the Canva-style Canvas. */
  mode: 'studio' | 'canvas';
  /** Canvas mode: selected elements (all inside one free-form section). */
  elSel: { sectionId: string | null; ids: string[] };
  /** Canvas mode: text being edited in place (prop path), if any. */
  editingPath: string | null;
}

interface Actions {
  commit: (fn: (p: Project) => Project, key?: string) => void;
  undo: () => void;
  redo: () => void;
  // ui
  set: (patch: Partial<State>) => void;
  select: (id: string | null) => void;
  toast: (text: string, tone?: Toast['tone']) => void;
  // sections
  addSection: (type: SectionType, variant?: string, index?: number) => void;
  moveSection: (from: number, to: number) => void;
  moveSelected: (dir: -1 | 1) => void;
  duplicateSection: (id: string) => void;
  removeSection: (id: string) => void;
  updateSection: (id: string, patch: Partial<Section>, key?: string) => void;
  updateProp: (id: string, path: string, value: unknown) => void;
  updateStyle: (id: string, patch: Partial<SectionStyle>) => void;
  /** Generic section mutation on the active page (one undo step per `key` burst). */
  mutateSection: (id: string, fn: (s: Section) => Section, key?: string) => void;
  setMode: (mode: 'studio' | 'canvas') => void;
  copySection: (id: string) => void;
  pasteSection: () => void;
  // pages
  addPage: (name?: string) => void;
  removePage: (id: string) => void;
  updatePage: (id: string, patch: Partial<Page>) => void;
  duplicatePage: (id: string) => void;
  // theme / brief
  setTheme: (patch: Partial<Theme>, key?: string) => void;
  setPalette: (patch: Partial<Palette>) => void;
  applyPreset: (id: string) => void;
  setBrief: (patch: Partial<Brief>) => void;
  // project
  loadProject: (p: Project, filePath?: string | null) => void;
  newFromTemplate: (id: string) => void;
  markSaved: (filePath?: string | null) => void;
}

function loadMode(): 'studio' | 'canvas' {
  try { return localStorage.getItem('fw.mode') === 'canvas' ? 'canvas' : 'studio'; } catch { return 'studio'; }
}

function loadInitial(): Project {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw) as Project;
      if (p && Array.isArray(p.pages) && p.pages.length) return p;
    }
  } catch { /* ignore corrupted storage */ }
  return createDefaultProject();
}

const initial = loadInitial();

export const useStore = create<State & Actions>((set, get) => {
  const mapPage = (fn: (pg: Page) => Page) => (p: Project): Project => ({
    ...p,
    pages: p.pages.map((pg) => (pg.id === get().activePageId ? fn(pg) : pg)),
  });
  const mapSection = (id: string, fn: (s: Section) => Section) =>
    mapPage((pg) => ({ ...pg, sections: pg.sections.map((s) => (s.id === id ? fn(s) : s)) }));

  return {
    project: initial,
    activePageId: initial.pages[0].id,
    selectedId: null,
    hoverId: null,
    device: 'desktop',
    zoom: 1,
    fitScale: 1,
    leftTab: 'library',
    rightTab: 'inspector',
    modal: null,
    palette: false,
    preview: false,
    showGrid: false,
    past: [],
    future: [],
    lastCommitKey: null,
    lastCommitAt: 0,
    clipboard: null,
    toasts: [],
    filePath: null,
    dirty: false,
    mode: loadMode(),
    elSel: { sectionId: null, ids: [] },
    editingPath: null,

    commit: (fn, key) => {
      const { project, past, lastCommitKey, lastCommitAt } = get();
      const next = { ...fn(project), updatedAt: Date.now() };
      const now = Date.now();
      const coalesce = key && key === lastCommitKey && now - lastCommitAt < COALESCE_MS;
      set({
        project: next,
        past: coalesce ? past : [...past, project].slice(-HISTORY_LIMIT),
        future: [],
        lastCommitKey: key ?? null,
        lastCommitAt: now,
        dirty: true,
      });
    },
    undo: () => {
      const { past, future, project } = get();
      if (!past.length) return;
      const prev = past[past.length - 1];
      set({ project: prev, past: past.slice(0, -1), future: [project, ...future], lastCommitKey: null, dirty: true });
      ensureValidSelection();
    },
    redo: () => {
      const { past, future, project } = get();
      if (!future.length) return;
      const [next, ...rest] = future;
      set({ project: next, past: [...past, project], future: rest, lastCommitKey: null, dirty: true });
      ensureValidSelection();
    },

    set: (patch) => set(patch),
    select: (id) => set({ selectedId: id, ...(id ? { rightTab: 'inspector' as RightTab } : {}) }),
    toast: (text, tone = 'ok') => {
      const t = { id: uid('t'), text, tone };
      set({ toasts: [...get().toasts, t] });
      setTimeout(() => set({ toasts: get().toasts.filter((x) => x.id !== t.id) }), 2600);
    },

    addSection: (type, variant, index) => {
      const s = createSection(type, variant);
      const brand = get().project.brief.projectName;
      if ((type === 'navbar' || type === 'footer') && brand) s.props.brand = brand;
      get().commit(mapPage((pg) => {
        const list = [...pg.sections];
        let at = index ?? list.length;
        if (index === undefined) {
          // Keep footer last and navbar first by default.
          const footerIdx = list.findIndex((x) => x.type === 'footer');
          if (type === 'navbar') at = 0;
          else if (type !== 'footer' && footerIdx >= 0) at = footerIdx;
        }
        list.splice(at, 0, s);
        return { ...pg, sections: list };
      }));
      set({ selectedId: s.id, rightTab: 'inspector' });
      requestAnimationFrame(() => document.querySelector(`[data-section-id="${s.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    },
    moveSection: (from, to) => {
      if (from === to) return;
      get().commit(mapPage((pg) => {
        const list = [...pg.sections];
        const [m] = list.splice(from, 1);
        list.splice(Math.max(0, Math.min(list.length, to)), 0, m);
        return { ...pg, sections: list };
      }));
    },
    moveSelected: (dir) => {
      const { selectedId } = get();
      const pg = activePage(get());
      const i = pg.sections.findIndex((s) => s.id === selectedId);
      if (i < 0) return;
      const j = i + dir;
      if (j < 0 || j >= pg.sections.length) return;
      get().moveSection(i, j);
    },
    duplicateSection: (id) => {
      let newId = '';
      get().commit(mapPage((pg) => {
        const i = pg.sections.findIndex((s) => s.id === id);
        if (i < 0) return pg;
        const c = cloneSection(pg.sections[i]);
        newId = c.id;
        const list = [...pg.sections];
        list.splice(i + 1, 0, c);
        return { ...pg, sections: list };
      }));
      if (newId) set({ selectedId: newId });
    },
    removeSection: (id) => {
      const sec = activePage(get()).sections.find((s) => s.id === id);
      if (!sec || sec.locked) return;
      get().commit(mapPage((pg) => ({ ...pg, sections: pg.sections.filter((s) => s.id !== id) })));
      if (get().selectedId === id) set({ selectedId: null });
    },
    updateSection: (id, patch, key) => get().commit(mapSection(id, (s) => ({ ...s, ...patch })), key ?? `sec:${id}:${Object.keys(patch).join(',')}`),
    updateProp: (id, path, value) => get().commit(mapSection(id, (s) => ({ ...s, props: setPath(s.props, path, value) })), `prop:${id}:${path}`),
    mutateSection: (id, fn, key) => get().commit(mapSection(id, fn), key),
    setMode: (mode) => {
      try { localStorage.setItem('fw.mode', mode); } catch { /* ignore */ }
      set({ mode, elSel: { sectionId: null, ids: [] }, editingPath: null, selectedId: null, preview: false });
    },
    updateStyle: (id, patch) => get().commit(mapSection(id, (s) => ({ ...s, style: { ...s.style, ...patch } })), `style:${id}:${Object.keys(patch).join(',')}`),
    copySection: (id) => {
      const s = activePage(get()).sections.find((x) => x.id === id);
      if (s) { set({ clipboard: structuredClone(s) }); get().toast('Seção copiada'); }
    },
    pasteSection: () => {
      const { clipboard, selectedId } = get();
      if (!clipboard) return;
      const c = cloneSection(clipboard);
      get().commit(mapPage((pg) => {
        const i = pg.sections.findIndex((s) => s.id === selectedId);
        const list = [...pg.sections];
        list.splice(i >= 0 ? i + 1 : list.length, 0, c);
        return { ...pg, sections: list };
      }));
      set({ selectedId: c.id });
    },

    addPage: (name) => {
      const n = get().project.pages.length + 1;
      const title = name ?? `Página ${n}`;
      const slug = '/' + title.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const pg = createPage(title, slug, ['navbar', 'hero', 'footer']);
      const brand = get().project.brief.projectName;
      pg.sections.forEach((s) => { if (s.type === 'navbar' || s.type === 'footer') s.props.brand = brand; });
      get().commit((p) => ({ ...p, pages: [...p.pages, pg] }));
      set({ activePageId: pg.id, selectedId: null });
    },
    removePage: (id) => {
      const { project, activePageId } = get();
      if (project.pages.length <= 1) return get().toast('O projeto precisa de ao menos uma página', 'error');
      get().commit((p) => ({ ...p, pages: p.pages.filter((pg) => pg.id !== id) }));
      if (activePageId === id) set({ activePageId: get().project.pages[0].id, selectedId: null });
    },
    updatePage: (id, patch) => get().commit((p) => ({ ...p, pages: p.pages.map((pg) => (pg.id === id ? { ...pg, ...patch } : pg)) }), `page:${id}:${Object.keys(patch).join(',')}`),
    duplicatePage: (id) => {
      const src = get().project.pages.find((p) => p.id === id);
      if (!src) return;
      const copy: Page = { ...structuredClone(src), id: uid('page'), name: src.name + ' (cópia)', slug: src.slug === '/' ? '/copia' : src.slug + '-copia', sections: src.sections.map(cloneSection) };
      get().commit((p) => ({ ...p, pages: [...p.pages, copy] }));
      set({ activePageId: copy.id });
    },

    setTheme: (patch, key) => get().commit((p) => ({ ...p, theme: { ...p.theme, ...patch } }), key ?? `theme:${Object.keys(patch).join(',')}`),
    setPalette: (patch) => get().commit((p) => ({ ...p, theme: { ...p.theme, palette: { ...p.theme.palette, ...patch } } }), `palette:${Object.keys(patch).join(',')}`),
    applyPreset: (id) => {
      const preset = THEME_PRESETS.find((t) => t.id === id);
      if (preset) get().commit((p) => ({ ...p, theme: structuredClone(preset.theme) }));
    },
    setBrief: (patch) => get().commit((p) => ({ ...p, brief: { ...p.brief, ...patch }, name: patch.projectName ?? p.name }), `brief:${Object.keys(patch).join(',')}`),

    loadProject: (p, filePath = null) => {
      set({ project: p, activePageId: p.pages[0].id, selectedId: null, past: [], future: [], filePath, dirty: false });
    },
    newFromTemplate: (id) => {
      const tpl = TEMPLATES.find((t) => t.id === id) ?? TEMPLATES[0];
      const p = projectFromTemplate(tpl);
      const prev = get().project;
      set({ project: p, activePageId: p.pages[0].id, selectedId: null, elSel: { sectionId: null, ids: [] }, editingPath: null, past: [...get().past, prev].slice(-HISTORY_LIMIT), future: [], modal: null, filePath: null, dirty: true });
      get().toast(`Template “${tpl.name}” aplicado`);
    },
    markSaved: (filePath) => set({ dirty: false, ...(filePath !== undefined ? { filePath } : {}) }),
  };
});

export function activePage(s: Pick<State, 'project' | 'activePageId'>): Page {
  return s.project.pages.find((p) => p.id === s.activePageId) ?? s.project.pages[0];
}

export const useActivePage = () => useStore((s) => activePage(s));
export const useSelected = () => useStore((s) => activePage(s).sections.find((x) => x.id === s.selectedId) ?? null);

function ensureValidSelection() {
  const s = useStore.getState();
  if (!s.project.pages.some((p) => p.id === s.activePageId)) useStore.setState({ activePageId: s.project.pages[0].id });
  const pg = activePage(useStore.getState());
  if (s.selectedId && !pg.sections.some((x) => x.id === s.selectedId)) useStore.setState({ selectedId: null });
}

// ─── Autosave (debounced) ───────────────────────────────────────
let saveTimer: ReturnType<typeof setTimeout> | undefined;
useStore.subscribe((s, prev) => {
  if (s.project === prev.project) return;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(s.project)); } catch { /* quota */ }
  }, 400);
});
