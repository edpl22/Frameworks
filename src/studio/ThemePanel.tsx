import { useMemo, useState } from 'react';
import { Shuffle, Wand2, Sun, Moon, Upload } from 'lucide-react';
import { FigmaMark } from './FigmaImport';
import { useStore } from '../core/store';
import { FONT_PAIRS, ALL_FONTS, THEME_PRESETS } from '../core/theme';
import { contrastRatio, harmonyPalette, randomSeed, wcagLevel, type Harmony } from '../core/color';
import type { Palette, Theme } from '../core/types';
import { Field, Select, Segmented, Slider, ColorInput } from './ui';

const PALETTE_LABELS: Record<keyof Palette, string> = {
  primary: 'Primária', secondary: 'Secundária', accent: 'Destaque', background: 'Fundo', surface: 'Superfície', text: 'Texto', muted: 'Texto suave', border: 'Bordas',
};

function ContrastBadge({ fg, bg }: { fg: string; bg: string }) {
  const r = contrastRatio(fg, bg);
  const lvl = wcagLevel(r);
  const cls = lvl === 'Fail' ? 'badge-err' : lvl === 'AA Large' ? 'badge-warn' : 'badge-ok';
  return <span className={'badge ' + cls} title={`Contraste ${r.toFixed(2)}:1`}>{lvl === 'AA Large' ? 'AA-L' : lvl} {r.toFixed(1)}</span>;
}

export function ThemePanel() {
  const theme = useStore((s) => s.project.theme);
  const figma = useStore((s) => s.project.figma);
  const openFigma = () => useStore.getState().set({ modal: 'figma' });
  const { setTheme, setPalette, applyPreset, commit } = useStore();
  const [seed, setSeed] = useState(theme.palette.primary);
  const [harmony, setHarmony] = useState<Harmony>('analogous');
  const preview = useMemo(() => harmonyPalette(seed, harmony, theme.mode), [seed, harmony, theme.mode]);
  const pal = theme.palette;
  const pairId = FONT_PAIRS.find((p) => p.heading === theme.fontHeading && p.body === theme.fontBody)?.id ?? 'custom';

  const fontOptions = Array.from(new Set([...ALL_FONTS, theme.fontHeading, theme.fontBody, ...(figma?.tokens.fonts.map((f) => f.value) ?? [])])).sort().map((f) => ({ value: f, label: f }));
  const applyGenerated = (p: Palette) => commit((pr) => ({ ...pr, theme: { ...pr.theme, palette: p } }));

  return (
    <div className="panel-body" style={{ paddingTop: 14 }}>
      <button className="figma-cta" onClick={openFigma}>
        <FigmaMark />
        <span style={{ flex: 1, textAlign: 'left' }}>
          <b>{figma ? 'Tokens do Figma conectados' : 'Importar tokens do Figma'}</b>
          <small>{figma ? `${figma.source}${figma.mode ? ' · ' + figma.mode : ''}` : 'Variables, Tokens Studio, DTCG ou CSS'}</small>
        </span>
        <Upload size={14} />
      </button>
      <div className="group">
        <div className="group-title">Presets</div>
        <div className="preset-grid">
          {THEME_PRESETS.map((p) => {
            const on = p.theme.palette.primary === pal.primary && p.theme.palette.background === pal.background && p.theme.fontHeading === theme.fontHeading;
            const c = p.theme.palette;
            return (
              <button key={p.id} className={'preset' + (on ? ' on' : '')} onClick={() => applyPreset(p.id)}>
                <div className="sw"><i style={{ background: c.background }} /><i style={{ background: c.primary }} /><i style={{ background: c.secondary }} /><i style={{ background: c.accent }} /><i style={{ background: c.text }} /></div>
                <div className="nm">{p.label}</div>
                <div className="ft" style={{ fontFamily: `'${p.theme.fontHeading}'` }}>{p.theme.fontHeading}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="group">
        <div className="group-title">Modo</div>
        <Segmented
          value={theme.mode}
          onChange={(mode) => commit((pr) => ({ ...pr, theme: { ...pr.theme, mode, palette: { ...harmonyPalette(pr.theme.palette.primary, harmony, mode), primary: pr.theme.palette.primary, secondary: pr.theme.palette.secondary, accent: pr.theme.palette.accent } } }))}
          options={[{ value: 'light', label: 'Claro', icon: <Sun size={13} /> }, { value: 'dark', label: 'Escuro', icon: <Moon size={13} /> }]}
        />
      </div>

      <div className="group">
        <div className="group-title">Gerador de paleta</div>
        <div className="grid-2" style={{ marginBottom: 8 }}>
          <ColorInput value={seed} onChange={setSeed} />
          <Select value={harmony} onChange={setHarmony} options={[
            { value: 'analogous', label: 'Análoga' }, { value: 'complementary', label: 'Complementar' }, { value: 'triadic', label: 'Triádica' }, { value: 'split', label: 'Split' }, { value: 'monochrome', label: 'Monocromática' },
          ]} />
        </div>
        <div className="harmony-swatches">{Object.values(preview).map((c, i) => <i key={i} style={{ background: c }} title={c} />)}</div>
        <div className="grid-2" style={{ marginTop: 10 }}>
          <button className="btn btn-sm" onClick={() => { const s = randomSeed(); setSeed(s); applyGenerated(harmonyPalette(s, harmony, theme.mode)); }}><Shuffle size={13} /> Aleatória</button>
          <button className="btn btn-sm btn-primary" onClick={() => applyGenerated(preview)}><Wand2 size={13} /> Aplicar</button>
        </div>
      </div>

      <div className="group">
        <div className="group-title">Cores <span style={{ textTransform: 'none', letterSpacing: 0 }}>WCAG</span></div>
        {(Object.keys(PALETTE_LABELS) as (keyof Palette)[]).map((k) => (
          <div className="palette-row" key={k}>
            <span>{PALETTE_LABELS[k]}</span>
            <ColorInput value={pal[k]} onChange={(v) => setPalette({ [k]: v })} />
            {k === 'text' || k === 'muted' ? <ContrastBadge fg={pal[k]} bg={pal.background} /> : k === 'primary' ? <ContrastBadge fg={pal.primary} bg={pal.background} /> : <span style={{ width: 52 }} />}
          </div>
        ))}
      </div>

      <div className="group">
        <div className="group-title">Tipografia</div>
        <div className="font-preview" style={{ background: pal.background, color: pal.text, borderColor: pal.border }}>
          <div className="h" style={{ fontFamily: `'${theme.fontHeading}'` }}>Design que <em style={{ color: pal.primary }}>converte</em></div>
          <div className="b" style={{ fontFamily: `'${theme.fontBody}'`, color: pal.muted }}>O rápido gato marrom salta sobre o cão preguiçoso. 0123456789</div>
        </div>
        <Field label="Combinação">
          <Select value={pairId} onChange={(id) => { const p = FONT_PAIRS.find((x) => x.id === id); if (p) setTheme({ fontHeading: p.heading, fontBody: p.body }); }}
            options={[...FONT_PAIRS.map((p) => ({ value: p.id, label: `${p.label} — ${p.vibe}` })), ...(pairId === 'custom' ? [{ value: 'custom', label: 'Personalizada' }] : [])]} />
        </Field>
        <div className="grid-2">
          <Field label="Títulos"><Select value={theme.fontHeading} onChange={(v) => setTheme({ fontHeading: v })} options={fontOptions} /></Field>
          <Field label="Corpo"><Select value={theme.fontBody} onChange={(v) => setTheme({ fontBody: v })} options={fontOptions} /></Field>
        </div>
        <Field label="Tamanho base"><Slider value={theme.baseSize} min={14} max={20} onChange={(v) => setTheme({ baseSize: v })} format={(v) => `${v}px`} /></Field>
        <Field label="Escala tipográfica">
          <Select value={String(theme.scale)} onChange={(v) => setTheme({ scale: Number(v) })} options={[
            { value: '1.125', label: '1.125 — Major Second' }, { value: '1.2', label: '1.2 — Minor Third' }, { value: '1.25', label: '1.25 — Major Third' },
            { value: '1.333', label: '1.333 — Perfect Fourth' }, { value: '1.414', label: '1.414 — Augmented Fourth' },
          ]} />
        </Field>
      </div>

      <div className="group">
        <div className="group-title">Forma & profundidade</div>
        <Field label="Arredondamento"><Slider value={theme.radius} min={0} max={32} onChange={(v) => setTheme({ radius: v })} format={(v) => `${v}px`} /></Field>
        <Field label="Sombras">
          <Segmented<Theme['shadow']> value={theme.shadow} onChange={(v) => setTheme({ shadow: v })} options={[{ value: 'none', label: 'Sem' }, { value: 'soft', label: 'Suave' }, { value: 'medium', label: 'Média' }, { value: 'dramatic', label: 'Forte' }, { value: 'hard', label: 'Brutal' }]} />
        </Field>
        <Field label="Botões">
          <Segmented<Theme['buttonStyle']> value={theme.buttonStyle} onChange={(v) => setTheme({ buttonStyle: v })} options={[{ value: 'solid', label: 'Sólido' }, { value: 'pill', label: 'Pílula' }, { value: 'outline', label: 'Contorno' }, { value: 'glass', label: 'Glass' }]} />
        </Field>
        <Field label="Densidade">
          <Segmented<Theme['density']> value={theme.density} onChange={(v) => setTheme({ density: v })} options={[{ value: 'compact', label: 'Compacta' }, { value: 'comfortable', label: 'Confortável' }, { value: 'spacious', label: 'Espaçosa' }]} />
        </Field>
      </div>
    </div>
  );
}
