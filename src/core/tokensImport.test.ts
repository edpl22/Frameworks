import { describe, expect, it } from 'vitest';
import { applyMapping, parseColor, parseTokens, suggestMapping, figmaTokensCss } from './tokensImport';
import { DEFAULT_THEME } from './theme';
import { generatePrompt } from './prompt';
import { createDefaultProject } from './templates';

const tokensStudio = JSON.stringify({
  core: {
    color: { violet: { 500: { value: '#7c3aed', type: 'color' } }, gray: { 0: { value: '#ffffff', type: 'color' }, 900: { value: '#111118', type: 'color' }, 950: { value: '#050508', type: 'color' } } },
    font: { display: { value: 'Space Grotesk', type: 'fontFamilies' }, body: { value: 'Inter', type: 'fontFamilies' } },
    radius: { sm: { value: '4', type: 'borderRadius' }, md: { value: '12', type: 'borderRadius' } },
    fontSize: { body: { value: '16', type: 'fontSizes' } },
  },
  light: { brand: { primary: { value: '{color.violet.500}', type: 'color' } }, bg: { default: { value: '{color.gray.0}', type: 'color' } }, text: { default: { value: '{color.gray.900}', type: 'color' } } },
  dark: { brand: { primary: { value: '{color.violet.500}', type: 'color' } }, bg: { default: { value: '{color.gray.950}', type: 'color' } }, text: { default: { value: '{color.gray.0}', type: 'color' } } },
  $metadata: { tokenSetOrder: ['core', 'light', 'dark'] },
});

const dtcg = JSON.stringify({
  color: {
    $type: 'color',
    brand: { $value: '#0ea5e9' },
    background: { $value: '#fafafa' },
    surface: { $value: '#f1f5f9' },
    foreground: { $value: '#0f172a' },
    'foreground-muted': { $value: '#64748b' },
    border: { $value: { colorSpace: 'srgb', components: [0.886, 0.91, 0.941], alpha: 1 } },
    link: { $value: '{color.brand}' },
  },
  radius: { md: { $type: 'dimension', $value: { value: 0.5, unit: 'rem' } } },
  font: { heading: { $type: 'fontFamily', $value: ['Playfair Display', 'serif'] } },
});

const figmaVariables = JSON.stringify({
  status: 200,
  meta: {
    variableCollections: {
      'VC:1': { id: 'VC:1', name: 'Primitives', defaultModeId: '1:0', modes: [{ modeId: '1:0', name: 'Value' }] },
      'VC:2': { id: 'VC:2', name: 'Theme', defaultModeId: '2:0', modes: [{ modeId: '2:0', name: 'Light' }, { modeId: '2:1', name: 'Dark' }] },
    },
    variables: {
      'V:1': { id: 'V:1', name: 'green/500', resolvedType: 'COLOR', variableCollectionId: 'VC:1', valuesByMode: { '1:0': { r: 0.063, g: 0.725, b: 0.506, a: 1 } } },
      'V:2': { id: 'V:2', name: 'white', resolvedType: 'COLOR', variableCollectionId: 'VC:1', valuesByMode: { '1:0': { r: 1, g: 1, b: 1, a: 1 } } },
      'V:3': { id: 'V:3', name: 'black', resolvedType: 'COLOR', variableCollectionId: 'VC:1', valuesByMode: { '1:0': { r: 0.02, g: 0.02, b: 0.03, a: 1 } } },
      'V:4': { id: 'V:4', name: 'color/primary', resolvedType: 'COLOR', variableCollectionId: 'VC:2', valuesByMode: { '2:0': { type: 'VARIABLE_ALIAS', id: 'V:1' }, '2:1': { type: 'VARIABLE_ALIAS', id: 'V:1' } } },
      'V:5': { id: 'V:5', name: 'color/background', resolvedType: 'COLOR', variableCollectionId: 'VC:2', valuesByMode: { '2:0': { type: 'VARIABLE_ALIAS', id: 'V:2' }, '2:1': { type: 'VARIABLE_ALIAS', id: 'V:3' } } },
      'V:6': { id: 'V:6', name: 'color/text', resolvedType: 'COLOR', variableCollectionId: 'VC:2', valuesByMode: { '2:0': { type: 'VARIABLE_ALIAS', id: 'V:3' }, '2:1': { type: 'VARIABLE_ALIAS', id: 'V:2' } } },
      'V:7': { id: 'V:7', name: 'radius/md', resolvedType: 'FLOAT', variableCollectionId: 'VC:1', valuesByMode: { '1:0': 10 } },
      'V:8': { id: 'V:8', name: 'font/family/heading', resolvedType: 'STRING', variableCollectionId: 'VC:1', valuesByMode: { '1:0': 'Sora' } },
      'V:9': { id: 'V:9', name: 'is-rounded', resolvedType: 'BOOLEAN', variableCollectionId: 'VC:1', valuesByMode: { '1:0': true } },
    },
  },
});

const css = `:root {
  --brand-primary: #e11d48;
  --bg: #ffffff;
  --text: #18181b;
  --text-muted: var(--zinc-500);
  --zinc-500: #71717a;
  --radius-md: 0.75rem;
  --font-heading: "Fraunces", serif;
}`;

describe('parseColor', () => {
  it('handles hex, rgb, hsl, figma and dtcg objects', () => {
    expect(parseColor('#ABC')).toBe('#aabbcc');
    expect(parseColor('#11223380')).toBe('#112233');
    expect(parseColor('rgb(255, 0, 0)')).toBe('#ff0000');
    expect(parseColor('hsl(0, 100%, 50%)')).toBe('#ff0000');
    expect(parseColor({ r: 0, g: 0, b: 1, a: 1 })).toBe('#0000ff');
    expect(parseColor({ colorSpace: 'srgb', components: [1, 1, 1] })).toBe('#ffffff');
    expect(parseColor('{color.x}')).toBeNull();
  });
});

describe('Tokens Studio', () => {
  const p = parseTokens(tokensStudio);
  it('detects sets as modes and resolves aliases across sets', () => {
    expect(p.format).toBe('tokens-studio');
    expect(p.modes).toEqual(['core', 'light', 'dark']);
    const dark = p.resolve('dark');
    expect(dark.colors.find((c) => c.name === 'bg/default')?.value).toBe('#050508');
    expect(dark.colors.find((c) => c.name === 'brand/primary')?.value).toBe('#7c3aed');
  });
  it('suggests semantic roles, fonts, radius and size', () => {
    const t = p.resolve('light');
    const s = suggestMapping(t);
    expect(s.palette.primary).toBe('brand/primary');
    expect(s.palette.background).toBe('bg/default');
    expect(s.palette.text).toBe('text/default');
    expect(t.fonts.find((f) => f.name === s.fontHeading)?.value).toBe('Space Grotesk');
    expect(t.fonts.find((f) => f.name === s.fontBody)?.value).toBe('Inter');
    expect(s.radius).toBe('radius/md');
    const theme = applyMapping(DEFAULT_THEME, t, s);
    expect(theme.mode).toBe('light');
    expect(theme.radius).toBe(12);
    expect(theme.baseSize).toBe(16);
    expect(theme.palette.primary).toBe('#7c3aed');
  });
  it('switches to dark mode from the dark set', () => {
    const t = p.resolve('dark');
    expect(applyMapping(DEFAULT_THEME, t, suggestMapping(t)).mode).toBe('dark');
  });
});

describe('DTCG', () => {
  const p = parseTokens(dtcg);
  const t = p.resolve();
  it('inherits group $type, resolves refs and parses dimension/color objects', () => {
    expect(p.format).toBe('dtcg');
    expect(t.colors.find((c) => c.name === 'color/link')?.value).toBe('#0ea5e9');
    expect(t.colors.find((c) => c.name === 'color/border')?.value).toBe('#e2e8f0');
    expect(t.radii[0].value).toBe(8);
    expect(t.fonts[0].value).toBe('Playfair Display');
  });
  it('maps foreground / foreground-muted / surface', () => {
    const s = suggestMapping(t);
    expect(s.palette.primary).toBe('color/brand');
    expect(s.palette.text).toBe('color/foreground');
    expect(s.palette.muted).toBe('color/foreground-muted');
    expect(s.palette.surface).toBe('color/surface');
    expect(s.palette.border).toBe('color/border');
  });
});

describe('Figma Variables', () => {
  const p = parseTokens(figmaVariables);
  it('lists modes and resolves aliases per mode', () => {
    expect(p.format).toBe('figma-variables');
    expect(p.modes).toEqual(['Value', 'Light', 'Dark']);
    const light = p.resolve('Light');
    const dark = p.resolve('Dark');
    expect(light.colors.find((c) => c.name.endsWith('color/background'))?.value).toBe('#ffffff');
    expect(dark.colors.find((c) => c.name.endsWith('color/background'))?.value).not.toBe('#ffffff');
    expect(light.radii[0].value).toBe(10);
    expect(light.fonts[0].value).toBe('Sora');
  });
  it('maps semantic variables', () => {
    const t = p.resolve('Dark');
    const s = suggestMapping(t);
    expect(s.palette.primary).toMatch(/color\/primary$/);
    expect(applyMapping(DEFAULT_THEME, t, s).mode).toBe('dark');
  });
});

describe('CSS variables', () => {
  it('parses colors, var() refs, rem radius and font families', () => {
    const p = parseTokens(css);
    const t = p.resolve();
    expect(p.format).toBe('css');
    expect(t.colors.find((c) => c.name === 'text/muted')?.value).toBe('#71717a');
    expect(t.radii[0].value).toBe(12);
    expect(t.fonts[0].value).toBe('Fraunces');
    const s = suggestMapping(t);
    expect(s.palette.primary).toBe('brand/primary');
    expect(s.palette.background).toBe('bg');
  });
});

describe('errors & prompt integration', () => {
  it('rejects garbage', () => {
    expect(() => parseTokens('')).toThrow();
    expect(() => parseTokens('hello')).toThrow();
    expect(() => parseTokens('{bad json')).toThrow();
  });
  it('forwards original Figma names to the prompt', () => {
    const t = parseTokens(tokensStudio).resolve('light');
    const s = suggestMapping(t);
    const project = createDefaultProject();
    project.theme = applyMapping(project.theme, t, s);
    project.figma = { source: 'Design System.json', format: 'tokens-studio', mode: 'light', importedAt: 0, tokens: t, mapping: { ...s.palette } };
    const prompt = generatePrompt(project);
    expect(prompt).toContain('Tokens originais do Figma');
    expect(prompt).toContain('`brand/primary`');
    expect(prompt).toContain('--brand-primary: #7c3aed;');
    expect(figmaTokensCss(project.figma)).toContain('--font-display: "Space Grotesk";');
  });
});
