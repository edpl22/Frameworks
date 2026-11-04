import { useMemo, useState } from 'react';
import { Upload, FileJson, Wand2, Unlink, AlertCircle, Sparkles } from 'lucide-react';
import { useStore } from '../core/store';
import {
  applyMapping, FORMAT_LABEL, parseTokens, ROLES, suggestMapping, tokenCount,
  type ImportedTokens, type ParsedTokens, type Role, type Suggestion,
} from '../core/tokensImport';
import { contrastRatio, wcagLevel } from '../core/color';
import { generateSiteCSS } from '../core/siteCss';
import { renderPageMarkup } from '../core/exporters';
import { createSection } from '../core/factory';
import { googleFontsHref } from '../core/theme';
import { pickTextFile } from '../core/platform';
import { Modal, Field, Toggle } from './ui';

export function FigmaMark({ size = 18 }: { size?: number }) {
  return (
    <svg width={size * 0.67} height={size} viewBox="0 0 38 57" aria-hidden="true">
      <path fill="#1abcfe" d="M19 28.5a9.5 9.5 0 1 1 19 0 9.5 9.5 0 0 1-19 0z" />
      <path fill="#0acf83" d="M0 47.5A9.5 9.5 0 0 1 9.5 38H19v9.5a9.5 9.5 0 1 1-19 0z" />
      <path fill="#ff7262" d="M19 0v19h9.5a9.5 9.5 0 1 0 0-19H19z" />
      <path fill="#f24e1e" d="M0 9.5A9.5 9.5 0 0 0 9.5 19H19V0H9.5A9.5 9.5 0 0 0 0 9.5z" />
      <path fill="#a259ff" d="M0 28.5A9.5 9.5 0 0 0 9.5 38H19V19H9.5A9.5 9.5 0 0 0 0 28.5z" />
    </svg>
  );
}

const ROLE_LABEL: Record<Role, string> = {
  primary: 'Primária', secondary: 'Secundária', accent: 'Destaque', background: 'Fundo', surface: 'Superfície', text: 'Texto', muted: 'Texto suave', border: 'Bordas',
};

/** Small multi-set Tokens Studio file so people can try the flow without Figma. */
const SAMPLE = JSON.stringify({
  core: {
    color: {
      violet: { 500: { value: '#7c3aed', type: 'color' }, 600: { value: '#6d28d9', type: 'color' } },
      cyan: { 400: { value: '#22d3ee', type: 'color' } },
      rose: { 400: { value: '#fb7185', type: 'color' } },
      gray: { 0: { value: '#ffffff', type: 'color' }, 50: { value: '#f7f7fb', type: 'color' }, 200: { value: '#e4e4ee', type: 'color' }, 500: { value: '#6b6b80', type: 'color' }, 800: { value: '#23232f', type: 'color' }, 900: { value: '#12121a', type: 'color' }, 950: { value: '#08080d', type: 'color' } },
    },
    font: { display: { value: 'Space Grotesk', type: 'fontFamilies' }, body: { value: 'Inter', type: 'fontFamilies' } },
    radius: { sm: { value: '6', type: 'borderRadius' }, md: { value: '12', type: 'borderRadius' }, lg: { value: '20', type: 'borderRadius' } },
    fontSize: { body: { value: '16', type: 'fontSizes' }, h1: { value: '64', type: 'fontSizes' } },
  },
  light: {
    brand: { primary: { value: '{color.violet.500}', type: 'color' }, secondary: { value: '{color.cyan.400}', type: 'color' }, accent: { value: '{color.rose.400}', type: 'color' } },
    bg: { default: { value: '{color.gray.0}', type: 'color' }, surface: { value: '{color.gray.50}', type: 'color' } },
    text: { default: { value: '{color.gray.900}', type: 'color' }, muted: { value: '{color.gray.500}', type: 'color' } },
    border: { default: { value: '{color.gray.200}', type: 'color' } },
  },
  dark: {
    brand: { primary: { value: '{color.violet.500}', type: 'color' }, secondary: { value: '{color.cyan.400}', type: 'color' }, accent: { value: '{color.rose.400}', type: 'color' } },
    bg: { default: { value: '{color.gray.950}', type: 'color' }, surface: { value: '{color.gray.900}', type: 'color' } },
    text: { default: { value: '{color.gray.50}', type: 'color' }, muted: { value: '{color.gray.500}', type: 'color' } },
    border: { default: { value: '{color.gray.800}', type: 'color' } },
  },
  $metadata: { tokenSetOrder: ['core', 'light', 'dark'] },
}, null, 2);

function Swatch({ c }: { c?: string }) {
  return <i className="fi-swatch" style={{ background: c ?? 'transparent' }} />;
}

export function FigmaImportModal() {
  const project = useStore((s) => s.project);
  const { set, commit, toast } = useStore();
  const [text, setText] = useState('');
  const [sourceName, setSourceName] = useState('Arquivo do Figma');
  const [mode, setMode] = useState<string | undefined>();
  const [map, setMap] = useState<Suggestion | null>(null);
  const [keepNames, setKeepNames] = useState(true);
  const [dragging, setDragging] = useState(false);

  // Parse → tokens for the selected mode → suggested mapping (recomputed when input/mode changes).
  const parsed = useMemo<{ p?: ParsedTokens; error?: string }>(() => {
    if (!text.trim()) return {};
    try { return { p: parseTokens(text) }; } catch (e) { return { error: (e as Error).message }; }
  }, [text]);
  const activeMode = parsed.p?.modes.length ? (mode && parsed.p.modes.includes(mode) ? mode : pickDefaultMode(parsed.p.modes, project.theme.mode)) : undefined;
  const tokens = useMemo<ImportedTokens | null>(() => (parsed.p ? parsed.p.resolve(activeMode) : null), [parsed.p, activeMode]);
  const suggestion = useMemo(() => (tokens ? suggestMapping(tokens) : null), [tokens]);
  const mapping = map ?? suggestion;
  const theme = useMemo(() => (tokens && mapping ? applyMapping(project.theme, tokens, mapping) : null), [tokens, mapping, project.theme]);

  const load = (content: string, name: string) => { setText(content); setSourceName(name); setMode(undefined); setMap(null); };
  const setRole = (patch: Partial<Suggestion>) => mapping && setMap({ ...mapping, ...patch, palette: { ...mapping.palette, ...(patch.palette ?? {}) } });

  const apply = () => {
    if (!theme || !tokens || !mapping || !parsed.p) return;
    commit((p) => ({
      ...p,
      theme,
      figma: keepNames ? {
        source: sourceName, format: parsed.p!.format, mode: activeMode, importedAt: Date.now(), tokens,
        mapping: { ...mapping.palette, fontHeading: mapping.fontHeading, fontBody: mapping.fontBody, radius: mapping.radius, baseSize: mapping.baseSize },
      } : undefined,
    }));
    set({ modal: null, rightTab: 'theme' });
    toast(`Design system atualizado com ${tokenCount(tokens)} tokens do Figma`);
  };

  const preview = useMemo(() => {
    if (!theme) return null;
    const hero = createSection('hero', 'split');
    hero.props = { ...hero.props, title: `${project.brief.projectName} com o *seu* design system`, subtitle: 'Cores, tipografia e raios vindos direto dos tokens do Figma.', badge: 'Pré-visualização', proof: '' };
    hero.style = { ...hero.style, paddingY: 'md', background: 'default', align: 'left' };
    const feat = createSection('features');
    feat.props = { ...feat.props, eyebrow: '', subtitle: '', title: '', items: (feat.props.items as never[]).slice(0, 3) };
    feat.style = { ...feat.style, paddingY: 'sm', background: 'surface' };
    return {
      css: generateSiteCSS(theme, '.fi-preview .fw-site'),
      html: renderPageMarkup({ id: 'p', name: 'p', slug: '/', seoTitle: '', seoDescription: '', sections: [hero, feat] }),
      fonts: [theme.fontHeading, theme.fontBody],
    };
  }, [theme, project.brief.projectName]);

  const colorOf = (n?: string) => tokens?.colors.find((c) => c.name === n)?.value;
  const bg = colorOf(mapping?.palette.background) ?? project.theme.palette.background;

  return (
    <Modal
      title="Importar tokens do Figma"
      subtitle="Traga as cores, fontes e raios do seu arquivo do Figma para o design system — e mantenha os nomes originais no prompt."
      icon={<FigmaMark size={16} />}
      onClose={() => set({ modal: null })}
      footer={
        <>
          {project.figma && (
            <button className="btn btn-ghost" onClick={() => { commit((p) => ({ ...p, figma: undefined })); toast('Vínculo com o Figma removido', 'info'); }}>
              <Unlink size={14} /> Remover vínculo atual
            </button>
          )}
          <span style={{ flex: 1 }} />
          {tokens && <span className="hint">{tokenCount(tokens)} tokens · {tokens.colors.length} cores · {tokens.fonts.length} fontes · {tokens.radii.length} raios</span>}
          <button className="btn btn-primary" disabled={!theme} onClick={apply}><Wand2 size={14} /> Aplicar ao design system</button>
        </>
      }
    >
      <div className="fi-layout">
        <div className="fi-input">
          <div
            className={'fi-drop' + (dragging ? ' on' : '')}
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={async (e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files[0];
              if (f) load(await f.text(), f.name);
            }}
          >
            <FileJson size={26} />
            <b>Arraste o arquivo de tokens aqui</b>
            <span>.json ou .css</span>
            <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
              <button className="btn btn-sm" onClick={async () => { const f = await pickTextFile('.json,.css,.tokens,.txt'); if (f) load(f.content, f.name.split(/[\\/]/).pop() ?? f.name); }}><Upload size={13} /> Escolher arquivo</button>
              <button className="btn btn-sm btn-ghost" onClick={() => load(SAMPLE, 'Exemplo (Tokens Studio)')}><Sparkles size={13} /> Usar exemplo</button>
            </div>
          </div>
          <Field label="…ou cole o conteúdo">
            <textarea className="textarea mono" style={{ minHeight: 150, fontSize: 11.5 }} value={text} onChange={(e) => { setText(e.target.value); setSourceName('Tokens colados'); setMap(null); }} placeholder={'{\n  "color": { "primary": { "$value": "#7c3aed", "$type": "color" } }\n}'} />
          </Field>
          {parsed.error && <div className="fi-error"><AlertCircle size={14} /> {parsed.error}</div>}
          <div className="fi-help">
            <b>Como exportar do Figma</b>
            <ul>
              <li><b>Tokens Studio</b> — Export → JSON (single file com todos os sets).</li>
              <li><b>Figma Variables</b> — JSON no formato da REST API (<span className="mono">/v1/files/:key/variables/local</span>) ou de um plugin de export de variáveis; modos (ex.: Light/Dark) e aliases são resolvidos.</li>
              <li><b>W3C DTCG</b> — arquivos com <span className="mono">$value</span>/<span className="mono">$type</span>.</li>
              <li><b>CSS</b> — cole um bloco com <span className="mono">--variaveis: valor;</span></li>
            </ul>
          </div>
        </div>

        <div className="fi-map">
          {!tokens ? (
            <div className="empty-insp" style={{ paddingTop: 80 }}>
              <div className="orb"><FigmaMark size={26} /></div>
              <div style={{ color: 'var(--text)', fontWeight: 600, marginBottom: 6 }}>Nenhum token carregado</div>
              <p className="hint" style={{ margin: 0 }}>Envie um arquivo ou use o exemplo para ver o mapeamento automático.</p>
            </div>
          ) : (
            <>
              <div className="fi-head">
                <span className="badge badge-brand">{FORMAT_LABEL[parsed.p!.format]}</span>
                <span className="hint">{sourceName}</span>
                <span style={{ flex: 1 }} />
                {parsed.p!.modes.length > 0 && (
                  <label className="hint" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    Modo / set
                    <select className="select" style={{ width: 150 }} value={activeMode} onChange={(e) => { setMode(e.target.value); setMap(null); }}>
                      {parsed.p!.modes.map((m) => <option key={m} value={m}>{m}</option>)}
                    </select>
                  </label>
                )}
              </div>
              {!tokens.colors.length && <div className="fi-error"><AlertCircle size={14} /> Nenhuma cor encontrada neste arquivo/modo.</div>}

              <div className="fi-grid">
                <div>
                  <div className="group-title" style={{ marginTop: 4 }}>Cores → papéis</div>
                  {ROLES.map((role) => {
                    const name = mapping?.palette[role];
                    const c = colorOf(name);
                    const showContrast = role === 'text' || role === 'muted' || role === 'primary';
                    return (
                      <div className="fi-row" key={role}>
                        <span className="fi-role">{ROLE_LABEL[role]}</span>
                        <Swatch c={c ?? project.theme.palette[role]} />
                        <select className="select" value={name ?? ''} onChange={(e) => setRole({ palette: { [role]: e.target.value || undefined } })}>
                          <option value="">— manter atual —</option>
                          {tokens.colors.map((t) => <option key={t.name} value={t.name}>{t.name} · {t.value}</option>)}
                        </select>
                        {showContrast && c ? <ContrastBadge fg={c} bg={bg} /> : <span style={{ width: 48 }} />}
                      </div>
                    );
                  })}

                  <div className="group-title" style={{ marginTop: 18 }}>Tipografia & forma</div>
                  <TokenSelect label="Fonte dos títulos" value={mapping?.fontHeading} options={tokens.fonts.map((f) => ({ v: f.name, l: `${f.name} · ${f.value}` }))} onChange={(v) => setRole({ fontHeading: v })} />
                  <TokenSelect label="Fonte do corpo" value={mapping?.fontBody} options={tokens.fonts.map((f) => ({ v: f.name, l: `${f.name} · ${f.value}` }))} onChange={(v) => setRole({ fontBody: v })} />
                  <TokenSelect label="Raio base" value={mapping?.radius} options={tokens.radii.map((f) => ({ v: f.name, l: `${f.name} · ${f.value}px` }))} onChange={(v) => setRole({ radius: v })} />
                  <TokenSelect label="Tamanho do texto" value={mapping?.baseSize} options={tokens.sizes.map((f) => ({ v: f.name, l: `${f.name} · ${f.value}px` }))} onChange={(v) => setRole({ baseSize: v })} />
                  <div style={{ marginTop: 10 }}>
                    <Toggle label="Manter nomes originais no prompt e no export" value={keepNames} onChange={setKeepNames} />
                  </div>
                  {map && <button className="btn btn-sm btn-ghost" onClick={() => setMap(null)}>Restaurar sugestão automática</button>}
                </div>

                <div>
                  <div className="group-title" style={{ marginTop: 4 }}>Pré-visualização {theme && <span style={{ textTransform: 'none', letterSpacing: 0 }}>{theme.mode === 'dark' ? 'modo escuro' : 'modo claro'}</span>}</div>
                  {preview && (
                    <div className="fi-preview">
                      {preview.fonts.map((f) => <link key={f} rel="stylesheet" href={googleFontsHref([f])} />)}
                      <style>{preview.css}</style>
                      <div className="fi-preview-inner" dangerouslySetInnerHTML={{ __html: preview.html }} />
                    </div>
                  )}
                  <div className="fi-chips">
                    {tokens.colors.slice(0, 40).map((c) => <i key={c.name} title={`${c.name} · ${c.value}`} style={{ background: c.value }} />)}
                    {tokens.colors.length > 40 && <span className="hint">+{tokens.colors.length - 40}</span>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </Modal>
  );
}

function pickDefaultMode(modes: string[], current: 'light' | 'dark'): string {
  return modes.find((m) => m.toLowerCase().includes(current)) ?? modes.find((m) => /light|claro|default/i.test(m)) ?? modes[modes.length - 1];
}

function ContrastBadge({ fg, bg }: { fg: string; bg: string }) {
  const r = contrastRatio(fg, bg);
  const lvl = wcagLevel(r);
  const cls = lvl === 'Fail' ? 'badge-err' : lvl === 'AA Large' ? 'badge-warn' : 'badge-ok';
  return <span className={'badge ' + cls} style={{ width: 48, justifyContent: 'center' }} title={`Contraste com o fundo: ${r.toFixed(2)}:1`}>{r.toFixed(1)}</span>;
}

function TokenSelect({ label, value, options, onChange }: { label: string; value?: string; options: { v: string; l: string }[]; onChange: (v?: string) => void }) {
  return (
    <div className="fi-row">
      <span className="fi-role" style={{ width: 120 }}>{label}</span>
      <select className="select" value={value ?? ''} onChange={(e) => onChange(e.target.value || undefined)} disabled={!options.length}>
        <option value="">{options.length ? '— manter atual —' : 'nenhum token encontrado'}</option>
        {options.map((o) => <option key={o.v} value={o.v}>{o.l}</option>)}
      </select>
    </div>
  );
}
