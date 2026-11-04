import type { Palette, Theme } from './types';
import { contrastRatio, hexToHsl, hslToHex, luminance, normalizeHex, rgbToHex } from './color';

// ════════════════════════════════════════════════════════════════
//  Design-token import (Figma → Frameworks Studio)
//  Supported inputs:
//   • Tokens Studio for Figma (single or multi-set, `{alias}` references)
//   • W3C Design Tokens (DTCG: `$value` / `$type`, group-level `$type`)
//   • Figma Variables JSON (REST API `/variables/local` shape: modes + aliases)
//   • Plain CSS custom properties (`--name: value;`)
// ════════════════════════════════════════════════════════════════

export type TokenFormat = 'tokens-studio' | 'dtcg' | 'figma-variables' | 'css';

export const FORMAT_LABEL: Record<TokenFormat, string> = {
  'tokens-studio': 'Tokens Studio for Figma',
  dtcg: 'W3C Design Tokens (DTCG)',
  'figma-variables': 'Figma Variables',
  css: 'CSS variables',
};

export interface NamedValue<T> { name: string; value: T }

export interface ImportedTokens {
  colors: NamedValue<string>[]; // hex
  fonts: NamedValue<string>[]; // family
  radii: NamedValue<number>[]; // px
  sizes: NamedValue<number>[]; // px (font sizes)
}

export interface ParsedTokens {
  format: TokenFormat;
  modes: string[]; // empty when the source has a single mode/set
  resolve: (mode?: string) => ImportedTokens;
}

/** Stored on the project so the prompt can reference the original Figma names. */
export interface FigmaImport {
  source: string;
  format: TokenFormat;
  mode?: string;
  importedAt: number;
  mapping: Partial<Record<keyof Palette, string>> & { fontHeading?: string; fontBody?: string; radius?: string; baseSize?: string };
  tokens: ImportedTokens;
}

// ─── value parsing ──────────────────────────────────────────────
const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function parseColor(v: unknown): string | null {
  if (v == null) return null;
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    // Figma: { r, g, b, a } in 0..1
    if (typeof o.r === 'number' && typeof o.g === 'number' && typeof o.b === 'number') {
      return rgbToHex(clamp01(o.r) * 255, clamp01(o.g) * 255, clamp01(o.b) * 255);
    }
    // DTCG 2025: { colorSpace, components: [r,g,b], alpha, hex }
    if (typeof o.hex === 'string') return parseColor(o.hex);
    if (Array.isArray(o.components) && o.components.length >= 3 && (!o.colorSpace || o.colorSpace === 'srgb')) {
      const [r, g, b] = o.components as number[];
      return rgbToHex(clamp01(r) * 255, clamp01(g) * 255, clamp01(b) * 255);
    }
    return null;
  }
  if (typeof v !== 'string') return null;
  const s = v.trim().toLowerCase();
  let m = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/.exec(s);
  if (m) {
    let h = m[1];
    if (h.length <= 4) h = h.slice(0, 3).split('').map((c) => c + c).join('');
    return normalizeHex('#' + h.slice(0, 6));
  }
  m = /^rgba?\(\s*([\d.]+)%?[\s,]+([\d.]+)%?[\s,]+([\d.]+)%?/.exec(s);
  if (m) return rgbToHex(+m[1], +m[2], +m[3]);
  m = /^hsla?\(\s*([\d.]+)(?:deg)?[\s,]+([\d.]+)%[\s,]+([\d.]+)%/.exec(s);
  if (m) return hslToHex({ h: +m[1], s: +m[2], l: +m[3] });
  const named: Record<string, string> = { white: '#ffffff', black: '#000000' };
  return named[s] ?? null;
}

export function parseDimension(v: unknown): number | null {
  if (typeof v === 'number' && isFinite(v)) return v;
  if (v && typeof v === 'object') {
    const o = v as { value?: unknown; unit?: unknown };
    if (typeof o.value === 'number') return o.unit === 'rem' || o.unit === 'em' ? o.value * 16 : o.value;
    return null;
  }
  if (typeof v !== 'string') return null;
  const m = /^(-?[\d.]+)\s*(px|rem|em)?$/.exec(v.trim());
  if (!m) return null;
  const n = parseFloat(m[1]);
  return m[2] === 'rem' || m[2] === 'em' ? n * 16 : n;
}

export function parseFontFamily(v: unknown): string | null {
  if (Array.isArray(v)) return parseFontFamily(v[0]);
  if (v && typeof v === 'object' && 'fontFamily' in (v as object)) return parseFontFamily((v as { fontFamily: unknown }).fontFamily);
  if (typeof v !== 'string') return null;
  const first = v.split(',')[0].trim().replace(/^['"]|['"]$/g, '');
  if (!first || /^(sans-serif|serif|monospace|system-ui|inherit)$/i.test(first) || first.startsWith('{')) return null;
  return first;
}

// ─── classification ─────────────────────────────────────────────
type Kind = 'color' | 'font' | 'radius' | 'size' | null;

function classify(name: string, type: string | undefined, value: unknown): Kind {
  const t = (type ?? '').toLowerCase();
  const n = name.toLowerCase();
  if (t === 'color') return 'color';
  if (t === 'fontfamilies' || t === 'fontfamily' || t === 'typography') return 'font';
  if (t === 'borderradius') return 'radius';
  if (t === 'fontsizes' || t === 'fontsize') return 'size';
  if (t === 'dimension' || t === 'sizing' || t === 'spacing' || t === 'number' || t === 'float' || !t) {
    if (/radius|rounded|corner/.test(n)) return 'radius';
    if (/font-?size|text-?size|fontsize|type-?scale|^size\/(text|font)/.test(n)) return 'size';
  }
  if (t === 'string' || !t) {
    if (/font-?family|typeface|family|^font\//.test(n) && typeof value === 'string' && !parseColor(value)) return 'font';
  }
  if (!t && parseColor(value)) return 'color';
  return null;
}

function emptyTokens(): ImportedTokens {
  return { colors: [], fonts: [], radii: [], sizes: [] };
}

function addToken(out: ImportedTokens, kind: Kind, name: string, value: unknown) {
  if (kind === 'color') { const c = parseColor(value); if (c) out.colors.push({ name, value: c }); }
  else if (kind === 'font') { const f = parseFontFamily(value); if (f) out.fonts.push({ name, value: f }); }
  else if (kind === 'radius') { const d = parseDimension(value); if (d !== null && d >= 0) out.radii.push({ name, value: d }); }
  else if (kind === 'size') { const d = parseDimension(value); if (d !== null && d > 0) out.sizes.push({ name, value: d }); }
}

// ─── nested JSON (Tokens Studio / DTCG) ─────────────────────────
interface FlatToken { path: string; value: unknown; type?: string }

function flatten(node: unknown, path: string[], inheritedType: string | undefined, out: Map<string, FlatToken>) {
  if (!node || typeof node !== 'object' || Array.isArray(node)) return;
  const o = node as Record<string, unknown>;
  const groupType = (o.$type as string | undefined) ?? inheritedType;
  // DTCG tokens carry `$value`; Tokens Studio tokens carry `value` (+ `type`).
  if ('$value' in o || ('value' in o && ('type' in o || typeof o.value !== 'object' || o.value === null))) {
    const value = '$value' in o ? o.$value : o.value;
    const type = (o.$type as string | undefined) ?? (o.type as string | undefined) ?? groupType;
    out.set(path.join('.'), { path: path.join('.'), value, type });
    return;
  }
  for (const [k, v] of Object.entries(o)) {
    if (k.startsWith('$')) continue;
    flatten(v, [...path, k], groupType, out);
  }
}

const REF = /^\{([^}]+)\}$/;

function resolveRefs(map: Map<string, FlatToken>): Map<string, FlatToken> {
  const resolved = new Map<string, FlatToken>();
  const get = (path: string, depth: number): unknown => {
    const t = map.get(path);
    if (!t) return undefined;
    if (typeof t.value === 'string') {
      const m = REF.exec(t.value.trim());
      if (m && depth < 12) return get(m[1].replace(/\.value$/, ''), depth + 1);
    }
    return t.value;
  };
  for (const [k, t] of map) {
    let type = t.type;
    if (!type && typeof t.value === 'string') {
      const m = REF.exec(t.value.trim());
      if (m) type = map.get(m[1])?.type;
    }
    resolved.set(k, { ...t, type, value: get(k, 0) });
  }
  return resolved;
}

function tokensFromFlat(map: Map<string, FlatToken>): ImportedTokens {
  const out = emptyTokens();
  for (const t of resolveRefs(map).values()) {
    const name = t.path.replace(/\./g, '/');
    addToken(out, classify(name, t.type, t.value), name, t.value);
  }
  return out;
}

function parseNested(data: Record<string, unknown>): ParsedTokens {
  const meta = data.$metadata as { tokenSetOrder?: string[] } | undefined;
  const isTokensStudio = !!meta || '$themes' in data || JSON.stringify(data).includes('"value"');
  const isDtcg = JSON.stringify(data).includes('"$value"');
  const format: TokenFormat = isDtcg && !meta ? 'dtcg' : isTokensStudio ? 'tokens-studio' : 'dtcg';

  // Multi-set Tokens Studio file: top-level keys are token sets.
  const setOrder = meta?.tokenSetOrder?.filter((s) => s in data) ?? [];
  if (setOrder.length > 1) {
    return {
      format: 'tokens-studio',
      modes: setOrder,
      resolve: (mode) => {
        // Every set is available for alias resolution; the chosen set wins.
        const order = mode ? [...setOrder.filter((s) => s !== mode), mode] : setOrder;
        const map = new Map<string, FlatToken>();
        for (const set of order) flatten(data[set], [], undefined, map);
        return tokensFromFlat(map);
      },
    };
  }
  const root = setOrder.length === 1 ? data[setOrder[0]] : data;
  const map = new Map<string, FlatToken>();
  flatten(root, [], undefined, map);
  const tokens = tokensFromFlat(map);
  return { format, modes: [], resolve: () => tokens };
}

// ─── Figma Variables (REST API shape) ───────────────────────────
interface FigmaVariable {
  id: string;
  name: string;
  resolvedType: 'COLOR' | 'FLOAT' | 'STRING' | 'BOOLEAN';
  variableCollectionId: string;
  valuesByMode: Record<string, unknown>;
}
interface FigmaCollection { id: string; name: string; defaultModeId: string; modes: { modeId: string; name: string }[] }

function parseFigmaVariables(data: Record<string, unknown>): ParsedTokens {
  const meta = (data.meta as Record<string, unknown>) ?? data;
  const variables = Object.values((meta.variables as Record<string, FigmaVariable>) ?? {});
  const collections = (meta.variableCollections as Record<string, FigmaCollection>) ?? {};
  const byId = new Map(variables.map((v) => [v.id, v]));
  const modes = Array.from(new Set(Object.values(collections).flatMap((c) => c.modes.map((m) => m.name))));

  const valueFor = (v: FigmaVariable, modeName: string | undefined, depth = 0): unknown => {
    const col = collections[v.variableCollectionId];
    const modeId = (modeName && col?.modes.find((m) => m.name === modeName)?.modeId) || col?.defaultModeId || Object.keys(v.valuesByMode)[0];
    const raw = v.valuesByMode[modeId] ?? Object.values(v.valuesByMode)[0];
    if (raw && typeof raw === 'object' && (raw as { type?: string }).type === 'VARIABLE_ALIAS' && depth < 12) {
      const target = byId.get((raw as { id: string }).id);
      return target ? valueFor(target, modeName, depth + 1) : undefined;
    }
    return raw;
  };

  return {
    format: 'figma-variables',
    modes: modes.length > 1 ? modes : [],
    resolve: (mode) => {
      const out = emptyTokens();
      for (const v of variables) {
        const col = collections[v.variableCollectionId];
        const name = col && Object.keys(collections).length > 1 ? `${col.name}/${v.name}` : v.name;
        const value = valueFor(v, mode);
        const type = v.resolvedType === 'COLOR' ? 'color' : v.resolvedType === 'FLOAT' ? 'number' : v.resolvedType === 'STRING' ? 'string' : 'boolean';
        if (type === 'boolean') continue;
        addToken(out, classify(name, type, value), name, value);
      }
      return out;
    },
  };
}

// ─── CSS custom properties ──────────────────────────────────────
function parseCssVars(text: string): ParsedTokens {
  const out = emptyTokens();
  const re = /--([\w-]+)\s*:\s*([^;}{]+)[;}]?/g;
  let m: RegExpExecArray | null;
  const raw = new Map<string, string>();
  while ((m = re.exec(text))) raw.set(m[1], m[2].trim());
  const deref = (v: string, d = 0): string => {
    const r = /^var\(--([\w-]+)\)$/.exec(v);
    return r && d < 12 && raw.has(r[1]) ? deref(raw.get(r[1])!, d + 1) : v;
  };
  for (const [name, v] of raw) {
    const value = deref(v);
    const n = name.replace(/-/g, '/');
    let kind = classify(name, undefined, value);
    if (!kind && /font|family/.test(name) && !/size|weight|height/.test(name)) kind = 'font';
    addToken(out, kind, n, value);
  }
  return { format: 'css', modes: [], resolve: () => out };
}

// ─── entry point ────────────────────────────────────────────────
export function parseTokens(text: string): ParsedTokens {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Cole ou envie um arquivo de tokens.');
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    if (/--[\w-]+\s*:/.test(trimmed)) return parseCssVars(trimmed);
    throw new Error('Formato não reconhecido. Use JSON (Tokens Studio, DTCG, Figma Variables) ou CSS variables.');
  }
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(trimmed);
  } catch {
    throw new Error('JSON inválido — verifique se o arquivo foi exportado completo.');
  }
  const meta = (data.meta as Record<string, unknown> | undefined) ?? data;
  if (meta && typeof meta === 'object' && 'variables' in meta && 'variableCollections' in meta) return parseFigmaVariables(data);
  return parseNested(data);
}

// ─── role suggestion ────────────────────────────────────────────
export type Role = keyof Palette;
export const ROLES: Role[] = ['primary', 'secondary', 'accent', 'background', 'surface', 'text', 'muted', 'border'];

const STATE = /(hover|pressed|active|focus|disabled|selected|visited)/;
const RULES: Record<Role, { include: RegExp[]; exclude?: RegExp }> = {
  primary: {
    include: [/(^|\/)(primary|brand)(\/(default|base|main))?$/, /(^|\/)(primary|brand)\/(500|600)$/, /(^|\/)(primary|brand|action|interactive)/],
    exclude: /(on[-_/]?primary|text|foreground|fg|bg|background|surface|border|stroke|subtle|muted|light|(^|\/)(50|100|200|300)$)/,
  },
  secondary: { include: [/(^|\/)secondary(\/(default|base|main|500|600))?$/, /(^|\/)secondary/], exclude: /(text|foreground|fg|bg|background|surface|border|on[-_/])/ },
  accent: { include: [/(^|\/)(accent|highlight|tertiary)(\/(default|base|main|500))?$/, /(accent|highlight|tertiary|info)/], exclude: /(text|foreground|fg|bg|background|surface|border|on[-_/])/ },
  background: {
    include: [/(^|\/)(background|bg|canvas|page)(\/(default|base|primary|main))?$/, /(^|\/)(background|bg)[-_/]?(default|base|primary|page)/, /(background|canvas|(^|\/)bg)/],
    exclude: /(secondary|tertiary|surface|card|elevated|subtle|muted|inverse|button|input|overlay|brand|accent|hover)/,
  },
  surface: {
    include: [/(^|\/)(surface|card|panel)(\/(default|base|primary))?$/, /(surface|card|panel|elevated|(bg|background)[-_/]?(secondary|subtle|muted))/],
    exclude: /(text|foreground|border|inverse|hover|brand|accent)/,
  },
  text: {
    include: [/(^|\/)(text|foreground|fg|content)(\/(default|base|primary|main|body))?$/, /(^|\/)(text|foreground|fg)[-_/]?(default|primary|body|base)/, /(^|\/)(text|foreground|fg|content)/],
    exclude: /(muted|secondary|subtle|tertiary|disabled|inverse|placeholder|on[-_/]|link|brand|accent|success|error|warning|danger)/,
  },
  muted: {
    include: [/(^|\/)(text|foreground|fg|content)[-_/]?(muted|secondary|subtle|tertiary)$/, /(muted|subtle|secondary)[-_/]?(text|foreground|fg)/, /(text|foreground|fg).*(muted|secondary|subtle)/],
    exclude: /(bg|background|surface|border|disabled)/,
  },
  border: { include: [/(^|\/)(border|stroke|outline|divider)(\/(default|base|primary))?$/, /(border|stroke|outline|divider|separator|line)/], exclude: /(focus|brand|accent|error|success|warning)/ },
};

function chroma(hex: string) {
  const { s, l } = hexToHsl(hex);
  return s * (1 - Math.abs(l - 50) / 50);
}

export interface Suggestion {
  palette: Partial<Record<Role, string>>; // token names
  fontHeading?: string;
  fontBody?: string;
  radius?: string;
  baseSize?: string;
}

export function suggestMapping(t: ImportedTokens): Suggestion {
  const used = new Set<string>();
  const palette: Partial<Record<Role, string>> = {};
  const byName = new Map(t.colors.map((c) => [c.name, c.value]));

  for (const role of ROLES) {
    const rule = RULES[role];
    let best: { name: string; score: number } | null = null;
    for (const c of t.colors) {
      const n = c.name.toLowerCase();
      if (used.has(c.name) && ['primary', 'secondary', 'accent'].includes(role)) continue;
      if (rule.exclude?.test(n) || STATE.test(n)) continue;
      const idx = rule.include.findIndex((r) => r.test(n));
      if (idx < 0) continue;
      const score = 100 - idx * 30 - n.split('/').length;
      if (!best || score > best.score) best = { name: c.name, score };
    }
    if (best) { palette[role] = best.name; used.add(best.name); }
  }

  // Fallbacks for raw scales (e.g. only blue/500, gray/900…)
  const colors = t.colors;
  if (colors.length) {
    if (!palette.primary) {
      const pick = [...colors].filter((c) => !used.has(c.name)).sort((a, b) => chroma(b.value) - chroma(a.value))[0];
      if (pick) { palette.primary = pick.name; used.add(pick.name); }
    }
    if (!palette.background) {
      const pick = [...colors].sort((a, b) => luminance(b.value) - luminance(a.value))[0];
      palette.background = pick.name;
    }
    const bg = byName.get(palette.background!)!;
    if (!palette.text) {
      const pick = [...colors].sort((a, b) => contrastRatio(b.value, bg) - contrastRatio(a.value, bg))[0];
      palette.text = pick.name;
    }
    if (!palette.border) {
      const pick = colors.filter((c) => c.name !== palette.background && chroma(c.value) < 15).sort((a, b) => contrastRatio(a.value, bg) - contrastRatio(b.value, bg))[0];
      if (pick) palette.border = pick.name;
    }
    if (!palette.surface) {
      const pick = colors.filter((c) => c.name !== palette.background && chroma(c.value) < 15 && contrastRatio(c.value, bg) < 1.25).sort((a, b) => contrastRatio(a.value, bg) - contrastRatio(b.value, bg))[0];
      if (pick) palette.surface = pick.name;
    }
    if (!palette.muted) {
      const pick = colors.filter((c) => chroma(c.value) < 20).map((c) => ({ c, r: contrastRatio(c.value, bg) })).filter((x) => x.r >= 3.5 && x.r <= 9).sort((a, b) => Math.abs(a.r - 5.5) - Math.abs(b.r - 5.5))[0];
      if (pick) palette.muted = pick.c.name;
    }
    for (const role of ['secondary', 'accent'] as Role[]) {
      if (palette[role]) continue;
      const pick = colors.filter((c) => !used.has(c.name) && chroma(c.value) > 25).sort((a, b) => chroma(b.value) - chroma(a.value))[0];
      if (pick) { palette[role] = pick.name; used.add(pick.name); }
    }
  }

  const findName = <T,>(list: NamedValue<T>[], re: RegExp) => list.find((x) => re.test(x.name.toLowerCase()))?.name;
  const fontHeading = findName(t.fonts, /(heading|display|title|headline|h1)/) ?? t.fonts[0]?.name;
  const fontBody = findName(t.fonts, /(body|text|paragraph|base|sans|copy)/) ?? t.fonts.find((f) => f.name !== fontHeading)?.name ?? fontHeading;

  const radii = t.radii.filter((r) => r.value > 0 && r.value < 200);
  let radius = findName(radii, /(^|\/|-)(md|default|base|medium|m|card)$/);
  if (!radius && radii.length) radius = [...radii].sort((a, b) => a.value - b.value)[Math.floor(radii.length / 2)].name;

  let baseSize = findName(t.sizes, /(^|\/|-)(base|body|md|medium|default|p|m)$/) ?? findName(t.sizes, /(body|base|paragraph)/);
  if (!baseSize && t.sizes.length) baseSize = [...t.sizes].sort((a, b) => Math.abs(a.value - 16) - Math.abs(b.value - 16))[0].name;

  return { palette, fontHeading, fontBody, radius, baseSize };
}

/** Builds the new theme from the chosen mapping, keeping current values for anything unmapped. */
export function applyMapping(current: Theme, t: ImportedTokens, s: Suggestion): Theme {
  const color = (n?: string) => (n ? t.colors.find((c) => c.name === n)?.value : undefined);
  const palette = { ...current.palette };
  for (const role of ROLES) {
    const v = color(s.palette[role]);
    if (v) palette[role] = v;
  }
  const font = (n?: string) => (n ? t.fonts.find((f) => f.name === n)?.value : undefined);
  const r = s.radius ? t.radii.find((x) => x.name === s.radius)?.value : undefined;
  const b = s.baseSize ? t.sizes.find((x) => x.name === s.baseSize)?.value : undefined;
  return {
    ...current,
    palette,
    mode: luminance(palette.background) < 0.4 ? 'dark' : 'light',
    fontHeading: font(s.fontHeading) ?? current.fontHeading,
    fontBody: font(s.fontBody) ?? current.fontBody,
    radius: r !== undefined ? Math.round(Math.min(32, Math.max(0, r))) : current.radius,
    baseSize: b !== undefined ? Math.round(Math.min(20, Math.max(14, b))) : current.baseSize,
  };
}

/** CSS custom properties using the original Figma token names (for prompts/exports). */
export function figmaTokensCss(f: FigmaImport, limit = Infinity): string {
  const slug = (n: string) => n.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const lines = [
    ...f.tokens.colors.slice(0, limit).map((c) => `  --${slug(c.name)}: ${c.value};`),
    ...f.tokens.fonts.slice(0, limit).map((c) => `  --${slug(c.name)}: "${c.value}";`),
    ...f.tokens.radii.slice(0, limit).map((c) => `  --${slug(c.name)}: ${c.value}px;`),
    ...f.tokens.sizes.slice(0, limit).map((c) => `  --${slug(c.name)}: ${c.value}px;`),
  ];
  return `:root {\n${lines.join('\n')}\n}\n`;
}

export const tokenCount = (t: ImportedTokens) => t.colors.length + t.fonts.length + t.radii.length + t.sizes.length;
