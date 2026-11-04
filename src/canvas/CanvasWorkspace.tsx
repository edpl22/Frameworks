import { useEffect, useMemo, useState } from 'react';
import { useStore } from '../core/store';
import { cssVariables } from '../core/siteCss';
import { Stage } from './Stage';
import { Toolbar } from './Toolbar';
import { CanvasPanel, CanvasRail, type CanvasTab } from './Panels';
import { clearSelection, copySelected, duplicateSelected, nudge, pasteClipboard, removeSelected, sectionById, selectAllInSection, zOrder } from './ops';
import '../styles/canvas.css';

function isTyping(e: KeyboardEvent) {
  const t = e.target as HTMLElement | null;
  return !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
}

/** Canvas-mode keyboard shortcuts (the Studio's section shortcuts are off in this mode). */
function useCanvasKeys() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStore.getState();
      if (s.mode !== 'canvas' || s.modal || s.palette || isTyping(e)) return;
      const meta = e.metaKey || e.ctrlKey;
      const k = e.key.toLowerCase();
      const has = s.elSel.ids.length > 0;
      if (k === 'escape') { clearSelection(); return; }
      if (meta && k === 'a') { e.preventDefault(); selectAllInSection(); return; }
      if (meta && k === 'v') { if (pasteClipboard()) e.preventDefault(); return; }
      if (!has) return;
      if (k === 'delete' || k === 'backspace') { e.preventDefault(); removeSelected(); return; }
      if (meta && k === 'd') { e.preventDefault(); duplicateSelected(); return; }
      if (meta && k === 'c') { if (copySelected()) { e.preventDefault(); s.toast('Elementos copiados'); } return; }
      if (meta && k === 'x') { if (copySelected()) { e.preventDefault(); removeSelected(); } return; }
      if (k === ']') { zOrder(meta ? 'front' : 'forward'); return; }
      if (k === '[') { zOrder(meta ? 'back' : 'backward'); return; }
      const step = e.shiftKey ? 2 : 1;
      if (k === 'arrowleft') { e.preventDefault(); nudge(-step, 0); return; }
      if (k === 'arrowright') { e.preventDefault(); nudge(step, 0); return; }
      if (k === 'arrowup') { e.preventDefault(); nudge(0, -step); return; }
      if (k === 'arrowdown') { e.preventDefault(); nudge(0, step); return; }
      if (k === 'enter' && s.elSel.ids.length === 1) {
        // Enter starts editing the selected text element.
        const sec = sectionById(s.elSel.sectionId);
        const els = (sec?.props.elements ?? []) as unknown as { id: string; kind: string }[];
        const i = els.findIndex((x) => x.id === s.elSel.ids[0]);
        if (i >= 0 && ['heading', 'text', 'button', 'badge'].includes(els[i].kind)) { e.preventDefault(); useStore.setState({ editingPath: `elements.${i}.text` }); }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function CanvasWorkspace() {
  const [tab, setTab] = useState<CanvasTab>(() => {
    const p = useStore.getState().project;
    return p.pages.some((pg) => pg.sections.some((s) => s.type === 'canvas')) ? 'elements' : 'templates';
  });
  const theme = useStore((s) => s.project.theme);
  // Theme variables for editor chrome that previews site colors (swatches, tiles).
  const vars = useMemo(() => Object.entries(cssVariables(theme)).map(([k, v]) => `${k}:${v}`).join(';'), [theme]);
  useCanvasKeys();
  return (
    <div className="cv-body cv-vars">
      <style>{`.cv-vars{${vars}}`}</style>
      <CanvasRail tab={tab} setTab={setTab} />
      <CanvasPanel tab={tab} />
      <div className="cv-main">
        <Toolbar />
        <Stage />
      </div>
    </div>
  );
}
