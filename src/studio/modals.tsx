import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Sparkles, Copy, Download, Terminal, FileCode2, FileArchive, FileJson, Palette, Wind, Braces, FileText, Upload, CheckCircle2, AlertCircle, Info, Keyboard, LayoutTemplate, Search } from 'lucide-react';
import { useStore, activePage } from '../core/store';
import { generatePrompt, estimateTokens, DEFAULT_PROMPT_OPTIONS, STACKS, type PromptOptions } from '../core/prompt';
import { exportPageHTML, exportZip, portableProjectJSON, designTokens, tailwindConfig, cssVarsFile, pageFileName, renderPageMarkup, dataUrlAssetResolver, relativeAssetResolver } from '../core/exporters';
import { loadProjectBlobs } from '../core/assets';
import { generateSiteCSS } from '../core/siteCss';
import { TEMPLATES, TEMPLATE_CATEGORIES, projectFromTemplate, type TemplateCategory } from '../core/templates';
import { copyText, saveAs } from '../core/platform';
import { Modal, Segmented, Toggle, Field, mod } from './ui';
import { openProjectFile } from './fileOps';
import { FigmaMark } from './FigmaImport';

const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'site';

// ─── Markdown highlighter (React nodes, no innerHTML) ─────────
function inline(text: string): ReactNode[] {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`')) return <span key={i} className="md-code">{part}</span>;
    if (part.startsWith('**') && part.endsWith('**')) return <span key={i} className="md-b">{part}</span>;
    return part;
  });
}
function Highlight({ md }: { md: string }) {
  let fence = false;
  return (
    <pre>
      {md.split('\n').map((line, i) => {
        if (line.startsWith('```')) { fence = !fence; return <div key={i} className="md-fence">{line || ' '}</div>; }
        if (fence) return <div key={i} className="md-fence" style={{ opacity: 0.9 }}>{line || ' '}</div>;
        const h = /^(#{1,4}) /.exec(line);
        if (h) return <div key={i} className={`md-h${h[1].length}`}>{line}</div>;
        if (line.startsWith('>')) return <div key={i} className="md-quote">{line}</div>;
        const li = /^(\s*)(- \[ \]|-|\d+\.)(\s)/.exec(line);
        if (li) return <div key={i}>{li[1]}<span className="md-li">{li[2]}</span>{li[3]}{inline(line.slice(li[0].length))}</div>;
        return <div key={i}>{line ? inline(line) : ' '}</div>;
      })}
    </pre>
  );
}

export function PromptModal() {
  const project = useStore((s) => s.project);
  const { set, toast, setBrief } = useStore();
  const [o, setO] = useState<PromptOptions>(DEFAULT_PROMPT_OPTIONS);
  const prompt = useMemo(() => generatePrompt(project, o), [project, o]);
  const tokens = estimateTokens(prompt);
  const sections = project.pages.reduce((n, p) => n + p.sections.filter((s) => !s.hidden).length, 0);
  const up = (patch: Partial<PromptOptions>) => setO((x) => ({ ...x, ...patch }));
  const cli = `claude "$(cat CLAUDE_PROMPT.md)"`;

  return (
    <Modal
      title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Prompt para Claude Code <span className="badge badge-brand">ao vivo</span></span>}
      subtitle="Especificação estruturada gerada a partir do seu design — cole no Claude Code e ele constrói o site."
      icon={<Sparkles size={16} />}
      onClose={() => set({ modal: null })}
      footer={
        <>
          <span className="hint" style={{ flex: 1 }}>Salve como <span className="mono">CLAUDE_PROMPT.md</span> e rode <span className="mono md-code">{cli}</span></span>
          <button className="btn" onClick={async () => { await copyText(cli); toast('Comando copiado'); }}><Terminal size={14} /> Copiar comando</button>
          <button className="btn" onClick={async () => { const r = await saveAs('CLAUDE_PROMPT.md', prompt, 'text/markdown'); if (r) toast('Prompt salvo'); }}><Download size={14} /> Baixar .md</button>
          <button className="btn btn-primary" onClick={async () => { await copyText(prompt); toast('Prompt copiado para a área de transferência'); }}><Copy size={14} /> Copiar prompt</button>
        </>
      }
    >
      <div className="prompt-layout">
        <div className="prompt-opts">
          <div className="stat-row" style={{ marginBottom: 18 }}>
            <div className="stat"><b>{tokens.toLocaleString('pt-BR')}</b><span>tokens</span></div>
            <div className="stat"><b>{sections}</b><span>seções</span></div>
            <div className="stat"><b>{project.pages.length}</b><span>páginas</span></div>
          </div>
          <Field label="Stack de destino">
            <select className="select" value={project.brief.stack} onChange={(e) => setBrief({ stack: e.target.value as never })}>
              {Object.entries(STACKS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </Field>
          <Field label="Nível de detalhe">
            <Segmented value={o.detail} onChange={(v) => up({ detail: v })} options={[{ value: 'concise', label: 'Conciso' }, { value: 'standard', label: 'Padrão' }, { value: 'exhaustive', label: 'Máximo' }]} />
          </Field>
          <Field label="Idioma do prompt">
            <Segmented value={o.promptLanguage} onChange={(v) => up({ promptLanguage: v })} options={[{ value: 'pt-BR', label: 'Português' }, { value: 'en', label: 'English' }]} />
          </Field>
          <div className="group" style={{ paddingTop: 10 }}>
            <div className="group-title">Incluir</div>
            <Toggle label="Textos e conteúdo" value={o.includeContent} onChange={(v) => up({ includeContent: v })} />
            <Toggle label="Design tokens (CSS)" value={o.includeTokens} onChange={(v) => up({ includeTokens: v })} />
            <Toggle label="Plano de execução" value={o.includePlan} onChange={(v) => up({ includePlan: v })} />
            <Toggle label="Critérios de aceite" value={o.includeAcceptance} onChange={(v) => up({ includeAcceptance: v })} />
            <Toggle label="Spec JSON completa" value={o.includeJsonSpec} onChange={(v) => up({ includeJsonSpec: v })} />
          </div>
          <p className="hint">Prompts em inglês costumam ficar ~15% menores. A spec JSON aumenta a fidelidade, mas também o tamanho.</p>
        </div>
        <div className="prompt-preview"><Highlight md={prompt} /></div>
      </div>
    </Modal>
  );
}

export function ExportModal() {
  const st = useStore();
  const { project, toast, set } = st;
  const page = activePage(st);
  const base = slug(project.brief.projectName);

  const run = async (fn: () => Promise<string | null>, msg: string) => {
    try { const r = await fn(); if (r) toast(msg); } catch (e) { toast((e as Error).message, 'error'); }
  };

  const items: { icon: ReactNode; title: string; desc: string; ext: string; action: () => void; featured?: boolean }[] = [
    { featured: true, icon: <FileArchive size={22} />, title: 'Pacote completo (.zip)', desc: 'Todas as páginas em HTML estático, CSS, design tokens, tema Tailwind, prompt do Claude Code e o arquivo do projeto — pronto para publicar ou evoluir.', ext: '.zip',
      action: () => run(async () => saveAs(`${base}.zip`, await exportZip(project, undefined, await loadProjectBlobs(project)), 'application/zip'), 'Pacote exportado') },
    { icon: <FileCode2 size={18} />, title: 'Página atual em HTML', desc: `“${page.name}” como arquivo único, com CSS e imagens embutidos.`, ext: '.html',
      action: () => run(async () => saveAs(pageFileName(page), exportPageHTML(project, page, { inlineCss: true, resolveAsset: await dataUrlAssetResolver(await loadProjectBlobs(project)) }), 'text/html'), 'HTML exportado') },
    { icon: <Sparkles size={18} />, title: 'Prompt Claude Code', desc: 'Especificação Markdown estruturada para gerar o projeto.', ext: '.md',
      action: () => run(() => saveAs('CLAUDE_PROMPT.md', generatePrompt(project), 'text/markdown'), 'Prompt exportado') },
    { icon: <FileJson size={18} />, title: 'Projeto', desc: 'Arquivo editável para reabrir no Frameworks Studio.', ext: '.fwstudio',
      action: () => run(async () => saveAs(`${base}.fwstudio`, await portableProjectJSON(project, await loadProjectBlobs(project)), 'application/json'), 'Projeto exportado') },
    { icon: <Braces size={18} />, title: 'Design tokens', desc: 'Formato W3C DTCG — compatível com Style Dictionary, Figma Tokens.', ext: '.json',
      action: () => run(() => saveAs(`${base}-tokens.json`, JSON.stringify(designTokens(project), null, 2), 'application/json'), 'Tokens exportados') },
    { icon: <Wind size={18} />, title: 'Tema Tailwind', desc: 'Bloco @theme (v4) + tailwind.config (v3).', ext: '.css',
      action: () => run(() => saveAs('tailwind-theme.css', tailwindConfig(project), 'text/css'), 'Tema exportado') },
    { icon: <Palette size={18} />, title: 'CSS variables', desc: 'Custom properties prontas para qualquer stack.', ext: '.css',
      action: () => run(() => saveAs('tokens.css', cssVarsFile(project), 'text/css'), 'CSS exportado') },
    { icon: <FileText size={18} />, title: 'Copiar HTML', desc: 'Markup da página atual para a área de transferência.', ext: 'clip',
      action: async () => { await copyText(renderPageMarkup(page, relativeAssetResolver(project))); toast('HTML copiado'); } },
    { icon: <FigmaMark size={18} />, title: 'Importar tokens do Figma', desc: 'Variables, Tokens Studio, DTCG ou CSS → design system.', ext: 'figma',
      action: () => set({ modal: 'figma' }) },
    { icon: <Upload size={18} />, title: 'Importar projeto', desc: 'Abra um arquivo .fwstudio ou .json.', ext: 'open',
      action: () => { set({ modal: null }); openProjectFile(); } },
  ];

  return (
    <Modal title="Exportar" subtitle="Leve seu design para qualquer lugar — código, tokens ou prompt." icon={<Download size={16} />} size="md" onClose={() => set({ modal: null })}>
      <div className="export-grid">
        {items.map((it) => (
          <button key={it.title} className={'export-card' + (it.featured ? ' featured' : '')} onClick={it.action}>
            <div className="ic">{it.icon}</div>
            <div>
              <h3>{it.title}</h3>
              <p>{it.desc}</p>
            </div>
            <span className="ext">{it.ext}</span>
          </button>
        ))}
      </div>
    </Modal>
  );
}

// Template thumbnails are expensive to render, so they are cached for the session.
let previewCache: { t: (typeof TEMPLATES)[number]; html: string; css: string; swatches: string[]; font: string; pages: number; sections: number }[] | null = null;
export function templatePreviews() {
  if (!previewCache) {
    previewCache = TEMPLATES.map((t) => {
      const p = projectFromTemplate(t);
      const pg = p.pages[0];
      const pal = p.theme.palette;
      return {
        t,
        html: renderPageMarkup({ ...pg, sections: pg.sections.slice(0, 7) }),
        css: generateSiteCSS(p.theme, `.tpl-${t.id} .fw-site`),
        swatches: [pal.background, pal.primary, pal.secondary, pal.accent, pal.text],
        font: `${p.theme.fontHeading} / ${p.theme.fontBody}`,
        pages: p.pages.length,
        sections: p.pages.reduce((n, x) => n + x.sections.length, 0),
      };
    });
  }
  return previewCache;
}

export function TemplatesModal() {
  const { set, newFromTemplate } = useStore();
  const previews = useMemo(templatePreviews, []);
  const [cat, setCat] = useState<TemplateCategory | 'Todos'>('Todos');
  const [tag, setTag] = useState<string | null>(null);
  const [q, setQ] = useState('');
  // Thumbnails render a 1400px-wide page; scale it to the real card width.
  const gridRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const grid = gridRef.current;
    if (!grid) return;
    const ro = new ResizeObserver(() => {
      const thumb = grid.querySelector<HTMLElement>('.tpl-thumb');
      if (thumb) grid.style.setProperty('--tpl-scale', String(thumb.clientWidth / 1400));
    });
    ro.observe(grid);
    return () => ro.disconnect();
  }, []);
  const allTags = useMemo(() => Array.from(new Set(TEMPLATES.flatMap((t) => t.tags))).sort(), []);
  const term = q.trim().toLowerCase();
  const list = previews.filter(({ t }) =>
    (cat === 'Todos' || t.category === cat) &&
    (!tag || t.tags.includes(tag)) &&
    (!term || `${t.name} ${t.description} ${t.category} ${t.tags.join(' ')} ${t.brief.industry ?? ''}`.toLowerCase().includes(term)));

  return (
    <Modal
      title={<span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>Templates <span className="badge badge-brand">{TEMPLATES.length}</span></span>}
      subtitle="Layouts originais inspirados nos estilos mais usados em kits de design. Tudo continua 100% editável — e dá para desfazer com Ctrl+Z."
      icon={<LayoutTemplate size={16} />}
      onClose={() => set({ modal: null })}
    >
      <div className="tpl-layout">
        <aside className="tpl-side">
          {(['Todos', ...TEMPLATE_CATEGORIES] as const).map((c) => {
            const n = c === 'Todos' ? TEMPLATES.length : TEMPLATES.filter((t) => t.category === c).length;
            return (
              <button key={c} className={'tpl-cat' + (cat === c ? ' on' : '')} onClick={() => setCat(c)}>
                <span>{c}</span><span className="n">{n}</span>
              </button>
            );
          })}
        </aside>
        <div className="tpl-main">
          <div className="tpl-toolbar">
            <div className="search" style={{ margin: 0, flex: 1, maxWidth: 320 }}>
              <Search size={14} />
              <input className="input" placeholder="Buscar por nicho, estilo…" value={q} onChange={(e) => setQ(e.target.value)} autoFocus />
            </div>
            <div className="chips">
              {allTags.map((x) => (
                <button key={x} className={'chip' + (tag === x ? ' on' : '')} onClick={() => setTag(tag === x ? null : x)}>{x}</button>
              ))}
            </div>
          </div>
          <div className="tpl-grid" ref={gridRef}>
            {list.map(({ t, html, css, swatches, font, pages, sections }) => (
              <button key={t.id} className="tpl" onClick={() => newFromTemplate(t.id)}>
                <div className={`tpl-thumb tpl-${t.id}`}>
                  <style>{css}</style>
                  <div className="tpl-thumb-inner" dangerouslySetInnerHTML={{ __html: html }} />
                  <span className="tpl-use">Usar template</span>
                </div>
                <div className="tpl-info">
                  <div className="tpl-row">
                    <h3>{t.name}</h3>
                    <span className="tpl-sw">{swatches.map((c, i) => <i key={i} style={{ background: c }} />)}</span>
                  </div>
                  <p>{t.description}</p>
                  <div className="tpl-meta">
                    <span>{pages} {pages > 1 ? 'páginas' : 'página'} · {sections} seções</span>
                    <span className="mono">{font}</span>
                  </div>
                  <div className="tpl-tags">{t.tags.map((x) => <span key={x}>{x}</span>)}</div>
                </div>
              </button>
            ))}
            {!list.length && <p className="hint" style={{ gridColumn: '1/-1', textAlign: 'center', padding: 40 }}>Nenhum template encontrado.</p>}
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function ShortcutsModal() {
  const set = useStore((s) => s.set);
  const rows: [string, string[]][] = [
    ['Paleta de comandos', [mod, 'K']], ['Gerar prompt', [mod, 'Enter']], ['Exportar', [mod, 'E']], ['Salvar projeto', [mod, 'S']],
    ['Abrir projeto', [mod, 'O']], ['Desfazer', [mod, 'Z']], ['Refazer', [mod, 'Shift', 'Z']], ['Duplicar seção', [mod, 'D']],
    ['Copiar seção', [mod, 'C']], ['Colar seção', [mod, 'V']], ['Excluir seção', ['Del']], ['Mover seção', ['Alt', '↑/↓']],
    ['Selecionar anterior/próxima', ['↑/↓']], ['Desmarcar', ['Esc']], ['Preview', [mod, 'P']], ['Grade', ['G']],
    ['Desktop / Tablet / Mobile', ['1', '2', '3']], ['Zoom', [mod, '+/−']],
  ];
  return (
    <Modal title="Atalhos de teclado" icon={<Keyboard size={16} />} size="md" onClose={() => set({ modal: null })}>
      <div className="shortcut-list">
        {rows.map(([l, k]) => (
          <div className="shortcut-row" key={l}><span>{l}</span><span>{k.map((x) => <span key={x} className="kbd">{x}</span>)}</span></div>
        ))}
      </div>
    </Modal>
  );
}

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  return (
    <div className="toasts" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={'toast ' + t.tone}>
          {t.tone === 'ok' ? <CheckCircle2 size={15} /> : t.tone === 'error' ? <AlertCircle size={15} /> : <Info size={15} />}
          {t.text}
        </div>
      ))}
    </div>
  );
}
