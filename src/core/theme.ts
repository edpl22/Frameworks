import type { Theme } from './types';

export interface FontPair {
  id: string;
  label: string;
  heading: string;
  body: string;
  vibe: string;
}

export const FONT_PAIRS: FontPair[] = [
  { id: 'inter', label: 'Inter / Inter', heading: 'Inter', body: 'Inter', vibe: 'Neutro, SaaS, produto' },
  { id: 'instrument', label: 'Instrument Serif / Inter', heading: 'Instrument Serif', body: 'Inter', vibe: 'Editorial premium' },
  { id: 'playfair', label: 'Playfair Display / Inter', heading: 'Playfair Display', body: 'Inter', vibe: 'Luxo, elegante' },
  { id: 'grotesk', label: 'Space Grotesk / Inter', heading: 'Space Grotesk', body: 'Inter', vibe: 'Tech, startup' },
  { id: 'jakarta', label: 'Plus Jakarta Sans', heading: 'Plus Jakarta Sans', body: 'Plus Jakarta Sans', vibe: 'Moderno, amigável' },
  { id: 'sora', label: 'Sora / Inter', heading: 'Sora', body: 'Inter', vibe: 'Futurista, Web3' },
  { id: 'dmserif', label: 'DM Serif Display / DM Sans', heading: 'DM Serif Display', body: 'DM Sans', vibe: 'Sofisticado, marca' },
  { id: 'fraunces', label: 'Fraunces / Work Sans', heading: 'Fraunces', body: 'Work Sans', vibe: 'Orgânico, artesanal' },
  { id: 'syne', label: 'Syne / Inter', heading: 'Syne', body: 'Inter', vibe: 'Agência criativa' },
  { id: 'bricolage', label: 'Bricolage Grotesque / Inter', heading: 'Bricolage Grotesque', body: 'Inter', vibe: 'Expressivo, ousado' },
  { id: 'manrope', label: 'Manrope', heading: 'Manrope', body: 'Manrope', vibe: 'Fintech, limpo' },
  { id: 'cormorant', label: 'Cormorant / Montserrat', heading: 'Cormorant Garamond', body: 'Montserrat', vibe: 'Moda, hotelaria' },
  { id: 'outfit', label: 'Outfit', heading: 'Outfit', body: 'Outfit', vibe: 'Geométrico, app' },
  { id: 'plex', label: 'IBM Plex Sans / Mono', heading: 'IBM Plex Sans', body: 'IBM Plex Sans', vibe: 'Dev tools, enterprise' },
];

export const ALL_FONTS = Array.from(new Set(FONT_PAIRS.flatMap((p) => [p.heading, p.body]))).sort();

export function googleFontsHref(fonts: string[]): string {
  const uniq = Array.from(new Set(fonts.filter(Boolean)));
  const families = uniq
    .map((f) => {
      const name = f.replace(/ /g, '+');
      // Display serifs typically ship a single weight + italic.
      if (/Instrument Serif|DM Serif Display/.test(f)) return `family=${name}:ital@0;1`;
      return `family=${name}:wght@400;500;600;700;800`;
    })
    .join('&');
  return `https://fonts.googleapis.com/css2?${families}&display=swap`;
}

export interface ThemePreset {
  id: string;
  label: string;
  theme: Theme;
}

const base: Omit<Theme, 'palette' | 'mode' | 'fontHeading' | 'fontBody'> = {
  baseSize: 17,
  scale: 1.25,
  radius: 14,
  shadow: 'soft',
  buttonStyle: 'solid',
  density: 'comfortable',
};

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'midnight',
    label: 'Midnight Luxe',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Instrument Serif', fontBody: 'Inter', radius: 16, shadow: 'dramatic', buttonStyle: 'pill',
      palette: { primary: '#8b5cf6', secondary: '#22d3ee', accent: '#f472b6', background: '#07070c', surface: '#11111a', text: '#f5f5fa', muted: '#9a9ab0', border: '#23232f' },
    },
  },
  {
    id: 'saas',
    label: 'Clean SaaS',
    theme: {
      ...base, mode: 'light', fontHeading: 'Inter', fontBody: 'Inter', radius: 12,
      palette: { primary: '#2563eb', secondary: '#0ea5e9', accent: '#f59e0b', background: '#ffffff', surface: '#f6f8fc', text: '#0b1220', muted: '#5b6477', border: '#e5e9f2' },
    },
  },
  {
    id: 'editorial',
    label: 'Editorial',
    theme: {
      ...base, mode: 'light', fontHeading: 'Playfair Display', fontBody: 'Inter', radius: 2, shadow: 'none', buttonStyle: 'outline', density: 'spacious',
      palette: { primary: '#111111', secondary: '#7c5c3b', accent: '#c2410c', background: '#faf7f2', surface: '#f2ede4', text: '#151311', muted: '#6b645b', border: '#e2dbcf' },
    },
  },
  {
    id: 'neon',
    label: 'Neon Tech',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Space Grotesk', fontBody: 'Inter', radius: 10, shadow: 'medium', buttonStyle: 'glass',
      palette: { primary: '#22c55e', secondary: '#06b6d4', accent: '#eab308', background: '#050807', surface: '#0c1311', text: '#ecfdf5', muted: '#8aa59a', border: '#1a2622' },
    },
  },
  {
    id: 'organic',
    label: 'Organic',
    theme: {
      ...base, mode: 'light', fontHeading: 'Fraunces', fontBody: 'Work Sans', radius: 22, shadow: 'soft', buttonStyle: 'pill',
      palette: { primary: '#3f6212', secondary: '#a16207', accent: '#ea580c', background: '#fbfaf5', surface: '#f1efe4', text: '#1c1f14', muted: '#64685a', border: '#e3e0d2' },
    },
  },
  {
    id: 'mono',
    label: 'Monochrome',
    theme: {
      ...base, mode: 'light', fontHeading: 'Syne', fontBody: 'Inter', radius: 0, shadow: 'none', buttonStyle: 'solid',
      palette: { primary: '#0a0a0a', secondary: '#404040', accent: '#ff3d00', background: '#ffffff', surface: '#f4f4f4', text: '#0a0a0a', muted: '#666666', border: '#e4e4e4' },
    },
  },
  {
    id: 'sunset',
    label: 'Sunset',
    theme: {
      ...base, mode: 'light', fontHeading: 'Bricolage Grotesque', fontBody: 'Inter', radius: 18, shadow: 'medium', buttonStyle: 'pill',
      palette: { primary: '#e11d48', secondary: '#f97316', accent: '#7c3aed', background: '#fffaf7', surface: '#fff1ea', text: '#1f0a0f', muted: '#7a5f63', border: '#f6e1d9' },
    },
  },
  {
    id: 'navy',
    label: 'Corporate Navy',
    theme: {
      ...base, mode: 'light', fontHeading: 'Manrope', fontBody: 'Manrope', radius: 8, shadow: 'soft', buttonStyle: 'solid',
      palette: { primary: '#1e3a8a', secondary: '#0f766e', accent: '#d97706', background: '#ffffff', surface: '#f3f6fb', text: '#0f172a', muted: '#526079', border: '#e2e8f0' },
    },
  },
];

export const DEFAULT_THEME: Theme = THEME_PRESETS[0].theme;
