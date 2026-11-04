import { useEffect } from 'react';
import { useStore, activePage } from '../core/store';
import { useShallow } from 'zustand/react/shallow';
import { ALL_FONTS } from '../core/theme';
import { ensureFonts, whenIdle } from '../core/fonts';
import { desktop } from '../core/platform';
import { TopBar } from './TopBar';
import { Rail, LeftPanel } from './LeftPanel';
import { Canvas, SiteStyles } from './Canvas';
import { RightPanel } from './Inspector';
import { PromptModal, ExportModal, TemplatesModal, ShortcutsModal, Toasts } from './modals';
import { CommandPalette } from './CommandPalette';
import { CanvasWorkspace } from '../canvas/CanvasWorkspace';
import { collectAssetIds, useAssetUrls } from '../core/assets';
import { FigmaImportModal } from './FigmaImport';
import { openProjectFile, saveProject } from './fileOps';

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      const meta = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();

      // Global shortcuts that work even while typing
      if (meta && key === 'k') { e.preventDefault(); s.set({ palette: !s.palette }); return; }
      if (meta && key === 'enter') { e.preventDefault(); s.set({ modal: 'prompt' }); return; }
      if (meta && key === 's') { e.preventDefault(); saveProject(e.shiftKey); return; }
      if (meta && key === 'o') { e.preventDefault(); openProjectFile(); return; }
      if (meta && key === 'e') { e.preventDefault(); s.set({ modal: 'export' }); return; }
      if (meta && key === 'p') { e.preventDefault(); s.set({ preview: !s.preview, selectedId: null }); return; }
      if (meta && key === '/') { e.preventDefault(); s.set({ modal: 'shortcuts' }); return; }

      if (isTyping(e) || s.modal || s.palette) return;

      if (meta && key === 'z') { e.preventDefault(); e.shiftKey ? s.redo() : s.undo(); return; }
      if (meta && key === 'y') { e.preventDefault(); s.redo(); return; }
      if (meta && (key === '=' || key === '+')) { e.preventDefault(); s.set({ zoom: Math.min(2, s.zoom + 0.1) }); return; }
      if (meta && key === '-') { e.preventDefault(); s.set({ zoom: Math.max(0.25, s.zoom - 0.1) }); return; }
      if (meta && key === '0') { e.preventDefault(); s.set({ zoom: 1 }); return; }
      if (s.mode === 'canvas') return; // the Canvas editor has its own element shortcuts

      const sel = s.selectedId;
      if (sel) {
        if (meta && key === 'd') { e.preventDefault(); s.duplicateSection(sel); return; }
        if (meta && key === 'c') { e.preventDefault(); s.copySection(sel); return; }
        if (key === 'delete' || key === 'backspace') { e.preventDefault(); s.removeSection(sel); return; }
        if (e.altKey && key === 'arrowup') { e.preventDefault(); s.moveSelected(-1); return; }
        if (e.altKey && key === 'arrowdown') { e.preventDefault(); s.moveSelected(1); return; }
      }
      if (meta && key === 'v') { e.preventDefault(); s.pasteSection(); return; }
      if (key === 'escape') { s.set({ selectedId: null, preview: false }); return; }
      if (!meta && (key === 'arrowup' || key === 'arrowdown')) {
        const list = activePage(s).sections;
        if (!list.length) return;
        e.preventDefault();
        const i = list.findIndex((x) => x.id === sel);
        const next = key === 'arrowdown' ? Math.min(list.length - 1, i + 1) : Math.max(0, i < 0 ? 0 : i - 1);
        s.select(list[next].id);
        document.querySelector(`[data-section-id="${list[next].id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
      if (!meta && key === 'g') s.set({ showGrid: !s.showGrid });
      if (!meta && key === '1') s.set({ device: 'desktop' });
      if (!meta && key === '2') s.set({ device: 'tablet' });
      if (!meta && key === '3') s.set({ device: 'mobile' });
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

function useDesktopBridge() {
  const name = useStore((s) => s.project.brief.projectName);
  const dirty = useStore((s) => s.dirty);
  useEffect(() => {
    const d = desktop();
    d?.setTitle(`${dirty ? '● ' : ''}${name} — Frameworks Studio`);
    if (!d) document.title = `${name} — Frameworks Studio`;
  }, [name, dirty]);

  useEffect(() => {
    const d = desktop();
    if (!d) return;
    return d.onMenu((action) => {
      const s = useStore.getState();
      const map: Record<string, () => void> = {
        new: () => s.set({ modal: 'templates' }),
        open: openProjectFile,
        save: () => saveProject(),
        'save-as': () => saveProject(true),
        export: () => s.set({ modal: 'export' }),
        prompt: () => s.set({ modal: 'prompt' }),
        undo: s.undo,
        redo: s.redo,
        palette: () => s.set({ palette: true }),
        preview: () => s.set({ preview: !s.preview }),
        shortcuts: () => s.set({ modal: 'shortcuts' }),
      };
      map[action]?.();
    });
  }, []);
}

function useFonts() {
  const heading = useStore((s) => s.project.theme.fontHeading);
  const body = useStore((s) => s.project.theme.fontBody);
  // The project's fonts load right away (Figma fonts may not be in the built-in list).
  useEffect(() => ensureFonts([heading, body]), [heading, body]);
  // The rest of the catalog (font picker previews) waits until the editor is idle.
  useEffect(() => whenIdle(() => ensureFonts(ALL_FONTS), 4000), []);
}

function useAssetLoader() {
  const assets = useStore((s) => s.project.assets);
  const pages = useStore((s) => s.project.pages);
  useEffect(() => {
    const ids = new Set([...Object.keys(assets ?? {}), ...collectAssetIds(useStore.getState().project)]);
    useAssetUrls.getState().ensure(Array.from(ids));
  }, [assets, pages]);
  // A file dropped outside a drop zone must not make the window navigate to it.
  useEffect(() => {
    const block = (e: DragEvent) => { if (e.dataTransfer?.types.includes('Files')) e.preventDefault(); };
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    return () => { window.removeEventListener('dragover', block); window.removeEventListener('drop', block); };
  }, []);
}

export function Studio() {
  const { modal, palette, preview, mode } = useStore(useShallow((s) => ({ modal: s.modal, palette: s.palette, preview: s.preview, mode: s.mode })));
  useAssetLoader();
  useShortcuts();
  useDesktopBridge();
  useFonts();

  return (
    <div className={'studio' + (preview && mode === 'studio' ? ' is-preview' : '') + (mode === 'canvas' ? ' is-canvas' : '')}>
      <SiteStyles />
      <TopBar />
      {mode === 'canvas' ? (
        <CanvasWorkspace />
      ) : (
        <div className="studio-body">
          <Rail />
          <LeftPanel />
          <Canvas />
          <RightPanel />
        </div>
      )}
      {modal === 'prompt' && <PromptModal />}
      {modal === 'export' && <ExportModal />}
      {modal === 'templates' && <TemplatesModal />}
      {modal === 'shortcuts' && <ShortcutsModal />}
      {modal === 'figma' && <FigmaImportModal />}
      {palette && <CommandPalette />}
      <Toasts />
    </div>
  );
}
