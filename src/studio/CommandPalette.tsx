import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Search, Sparkles, Download, Undo2, Redo2, Eye, Monitor, Tablet, Smartphone, LayoutTemplate, Palette, FileText, Save, FolderOpen, Grid3x3, Keyboard, Plus, MousePointer2, Sun, Moon } from 'lucide-react';
import { useStore, activePage } from '../core/store';
import { SECTIONS, SECTION_MAP } from '../core/sections';
import { THEME_PRESETS } from '../core/theme';
import { TEMPLATES } from '../core/templates';
import { mod } from './ui';
import { openProjectFile, saveProject } from './fileOps';

interface Cmd { id: string; group: string; label: string; icon: ReactNode; shortcut?: string; keywords?: string; run: () => void }

const fold = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

export function score(query: string, text: string): number {
  const q = fold(query.trim());
  if (!q) return 1;
  const t = fold(text);
  if (t.includes(q)) return 4 + (t.startsWith(q) ? 1 : 0);
  // every word present, in any order ("preset neo" → "Aplicar preset: Neo-brutal")
  const words = q.split(/\s+/);
  if (words.every((w) => t.includes(w))) {
    // whole-word hits rank above prefix hits ("neo" → Neo-brutal before Neon)
    const tokens = new Set(t.split(/[^a-z0-9]+/));
    return 3 + words.filter((w) => tokens.has(w)).length / 10;
  }
  // subsequence fuzzy match ("gprm" → "Gerar prompt")
  let i = 0;
  for (const c of t) if (c === q[i]) i++;
  return i === q.length ? 1 : 0;
}

export function CommandPalette() {
  const st = useStore();
  const [q, setQ] = useState('');
  const [idx, setIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const close = () => st.set({ palette: false });

  const cmds = useMemo<Cmd[]>(() => {
    const s = useStore.getState();
    const page = activePage(s);
    return [
      { id: 'prompt', group: 'Ações', label: 'Gerar prompt para Claude Code', icon: <Sparkles size={14} />, shortcut: `${mod} ↵`, run: () => s.set({ modal: 'prompt' }) },
      { id: 'export', group: 'Ações', label: 'Exportar…', icon: <Download size={14} />, shortcut: `${mod} E`, run: () => s.set({ modal: 'export' }) },
      { id: 'mode-canvas', group: 'Ações', label: 'Abrir modo Canvas (arrastar e soltar)', icon: <MousePointer2 size={14} />, keywords: 'canva livre grade arrastar', run: () => s.setMode('canvas') },
      { id: 'mode-studio', group: 'Ações', label: 'Abrir modo Studio', icon: <LayoutTemplate size={14} />, keywords: 'studio secoes', run: () => s.setMode('studio') },
      { id: 'figma', group: 'Ações', label: 'Importar tokens do Figma', icon: <Palette size={14} />, keywords: 'figma variables tokens studio dtcg design tokens importar', run: () => s.set({ modal: 'figma' }) },
      { id: 'templates', group: 'Ações', label: 'Abrir templates', icon: <LayoutTemplate size={14} />, run: () => s.set({ modal: 'templates' }) },
      { id: 'save', group: 'Ações', label: 'Salvar projeto', icon: <Save size={14} />, shortcut: `${mod} S`, run: () => saveProject() },
      { id: 'open', group: 'Ações', label: 'Abrir projeto', icon: <FolderOpen size={14} />, shortcut: `${mod} O`, run: openProjectFile },
      { id: 'undo', group: 'Ações', label: 'Desfazer', icon: <Undo2 size={14} />, shortcut: `${mod} Z`, run: s.undo },
      { id: 'redo', group: 'Ações', label: 'Refazer', icon: <Redo2 size={14} />, shortcut: `${mod} ⇧ Z`, run: s.redo },
      { id: 'page-add', group: 'Ações', label: 'Nova página', icon: <FileText size={14} />, run: () => s.addPage() },
      { id: 'shortcuts', group: 'Ações', label: 'Atalhos de teclado', icon: <Keyboard size={14} />, run: () => s.set({ modal: 'shortcuts' }) },
      { id: 'preview', group: 'Visualização', label: 'Alternar preview', icon: <Eye size={14} />, shortcut: `${mod} P`, run: () => s.set({ preview: !s.preview, selectedId: null }) },
      { id: 'grid', group: 'Visualização', label: 'Alternar grade de colunas', icon: <Grid3x3 size={14} />, shortcut: 'G', run: () => s.set({ showGrid: !s.showGrid }) },
      { id: 'd', group: 'Visualização', label: 'Desktop', icon: <Monitor size={14} />, shortcut: '1', run: () => s.set({ device: 'desktop' }) },
      { id: 't', group: 'Visualização', label: 'Tablet', icon: <Tablet size={14} />, shortcut: '2', run: () => s.set({ device: 'tablet' }) },
      { id: 'm', group: 'Visualização', label: 'Mobile', icon: <Smartphone size={14} />, shortcut: '3', run: () => s.set({ device: 'mobile' }) },
      { id: 'light', group: 'Design', label: 'Tema: modo claro', icon: <Sun size={14} />, run: () => s.applyPreset('saas') },
      { id: 'dark', group: 'Design', label: 'Tema: modo escuro', icon: <Moon size={14} />, run: () => s.applyPreset('midnight') },
      ...TEMPLATES.map((t) => ({ id: 'tpl-' + t.id, group: 'Templates', label: `Template: ${t.name}`, icon: <LayoutTemplate size={14} />, keywords: `template ${t.category} ${t.tags.join(' ')} ${t.description}`, run: () => s.newFromTemplate(t.id) })),
      ...THEME_PRESETS.map((p) => ({ id: 'preset-' + p.id, group: 'Design', label: `Aplicar preset: ${p.label}`, icon: <Palette size={14} />, keywords: 'tema theme preset', run: () => s.applyPreset(p.id) })),
      ...SECTIONS.flatMap((d) => d.variants.map((v) => ({
        id: `add-${d.type}-${v.id}`, group: 'Adicionar seção', label: `${d.label}${d.variants.length > 1 ? ` — ${v.label}` : ''}`,
        icon: <Plus size={14} />, keywords: 'adicionar inserir add ' + d.description, run: () => s.addSection(d.type, v.id),
      }))),
      ...page.sections.map((sec) => ({ id: 'sel-' + sec.id, group: 'Ir para seção', label: sec.name || SECTION_MAP[sec.type].label, icon: <MousePointer2 size={14} />, keywords: 'selecionar ir', run: () => { s.select(sec.id); document.querySelector(`[data-section-id="${sec.id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' }); } })),
      ...s.project.pages.map((p) => ({ id: 'page-' + p.id, group: 'Páginas', label: `Abrir página: ${p.name}`, icon: <FileText size={14} />, run: () => s.set({ activePageId: p.id, selectedId: null }) })),
    ];
  }, [st.project, st.activePageId]);

  const results = useMemo(() => {
    const term = q.trim();
    return cmds
      .map((c) => ({ c, sc: score(term, `${c.label} ${c.group} ${c.keywords ?? ''}`) }))
      .filter((r) => r.sc > 0)
      .sort((a, b) => b.sc - a.sc)
      .slice(0, term ? 40 : 60)
      .map((r) => r.c);
  }, [cmds, q]);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => setIdx(0), [q]);
  useEffect(() => { document.querySelector('.cmdk-item.on')?.scrollIntoView({ block: 'nearest' }); }, [idx]);

  const exec = (c?: Cmd) => { if (!c) return; close(); setTimeout(c.run, 0); };

  let lastGroup = '';
  return (
    <div className="cmdk-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="cmdk" role="dialog" aria-label="Paleta de comandos">
        <div className="cmdk-input">
          <Search size={16} style={{ color: 'var(--text-3)' }} />
          <input
            ref={inputRef}
            placeholder="Digite um comando, seção ou preset…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') { e.preventDefault(); setIdx((i) => Math.min(results.length - 1, i + 1)); }
              else if (e.key === 'ArrowUp') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
              else if (e.key === 'Enter') { e.preventDefault(); exec(results[idx]); }
              else if (e.key === 'Escape') close();
              e.stopPropagation();
            }}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="cmdk-list">
          {results.map((c, i) => {
            const header = c.group !== lastGroup ? <div className="cmdk-group">{c.group}</div> : null;
            lastGroup = c.group;
            return (
              <div key={c.id}>
                {header}
                <div className={'cmdk-item' + (i === idx ? ' on' : '')} onMouseEnter={() => setIdx(i)} onClick={() => exec(c)}>
                  <span className="ic">{c.icon}</span>{c.label}{c.shortcut && <span className="kbd sc">{c.shortcut}</span>}
                </div>
              </div>
            );
          })}
          {!results.length && <div className="hint" style={{ padding: 24, textAlign: 'center' }}>Nenhum resultado para “{q}”.</div>}
        </div>
        <div className="cmdk-foot"><span><span className="kbd">↑↓</span> navegar</span><span><span className="kbd">↵</span> executar</span><span><span className="kbd">esc</span> fechar</span></div>
      </div>
    </div>
  );
}
