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
  { id: 'geist', label: 'Geist', heading: 'Geist', body: 'Geist', vibe: 'Minimal suíço, produto' },
  { id: 'intertight', label: 'Inter Tight / Inter', heading: 'Inter Tight', body: 'Inter', vibe: 'Portfólio, grotesk' },
  { id: 'unbounded', label: 'Unbounded / Inter', heading: 'Unbounded', body: 'Inter', vibe: 'Web3, gamer' },
  { id: 'brutal', label: 'Archivo Black / Archivo', heading: 'Archivo Black', body: 'Archivo', vibe: 'Neo-brutalismo' },
  { id: 'bebas', label: 'Bebas Neue / Inter', heading: 'Bebas Neue', body: 'Inter', vibe: 'Eventos, esporte' },
  { id: 'lora', label: 'Lora / Nunito Sans', heading: 'Lora', body: 'Nunito Sans', vibe: 'Saúde, causa social' },
  { id: 'youngserif', label: 'Young Serif / Instrument Sans', heading: 'Young Serif', body: 'Instrument Sans', vibe: 'Gastronomia, artesanal' },
  { id: 'gloock', label: 'Gloock / Inter', heading: 'Gloock', body: 'Inter', vibe: 'Imobiliário, alto padrão' },
  { id: 'orbitron', label: 'Orbitron / Rajdhani', heading: 'Orbitron', body: 'Rajdhani', vibe: 'Cyberpunk, futurista' },
  { id: 'exo', label: 'Exo 2 / Inter', heading: 'Exo 2', body: 'Inter', vibe: 'Sci-fi, espacial' },
  { id: 'cinzel', label: 'Cinzel / EB Garamond', heading: 'Cinzel', body: 'EB Garamond', vibe: 'Fantasia, épico' },
  { id: 'techmono', label: 'Share Tech Mono / Inter', heading: 'Share Tech Mono', body: 'Inter', vibe: 'Computação, terminal' },
  { id: 'fredoka', label: 'Fredoka / Nunito', heading: 'Fredoka', body: 'Nunito', vibe: 'Educação, infantil' },
  { id: 'pixel', label: 'Press Start 2P / Inter', heading: 'Press Start 2P', body: 'Inter', vibe: 'Games retrô, 8-bit' },
  { id: 'righteous', label: 'Righteous / Inter', heading: 'Righteous', body: 'Inter', vibe: 'Música, festival' },
];

export const ALL_FONTS = Array.from(new Set(FONT_PAIRS.flatMap((p) => [p.heading, p.body]))).sort();

// Families that ship a single weight. Requesting a weight axis for them makes
// Google Fonts reject the whole stylesheet, so they are requested bare.
const SINGLE_WEIGHT = new Set(['Archivo Black', 'Bebas Neue', 'Gloock', 'Young Serif', 'Press Start 2P', 'Share Tech Mono', 'Righteous']);
const ITALIC_ONLY = new Set(['Instrument Serif', 'DM Serif Display']);

export function googleFontFamily(f: string): string {
  const name = f.replace(/ /g, '+');
  if (SINGLE_WEIGHT.has(f)) return `family=${name}`;
  if (ITALIC_ONLY.has(f)) return `family=${name}:ital@0;1`;
  return `family=${name}:wght@400;500;600;700;800`;
}

export function googleFontsHref(fonts: string[]): string {
  const uniq = Array.from(new Set(fonts.filter(Boolean)));
  return `https://fonts.googleapis.com/css2?${uniq.map(googleFontFamily).join('&')}&display=swap`;
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
  {
    id: 'glass',
    label: 'Aurora Glass',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Geist', fontBody: 'Geist', radius: 18, shadow: 'dramatic', buttonStyle: 'glass',
      palette: { primary: '#6366f1', secondary: '#ec4899', accent: '#22d3ee', background: '#05060f', surface: '#0d0f1f', text: '#eef0ff', muted: '#9599b8', border: '#1d2040' },
    },
  },
  {
    id: 'brutal',
    label: 'Neo-brutal',
    theme: {
      ...base, mode: 'light', fontHeading: 'Archivo Black', fontBody: 'Archivo', radius: 8, shadow: 'hard', buttonStyle: 'solid', scale: 1.2,
      palette: { primary: '#ffd23f', secondary: '#3a86ff', accent: '#ff5c8a', background: '#fff8e7', surface: '#ffffff', text: '#111111', muted: '#3d3d3d', border: '#111111' },
    },
  },
  {
    id: 'swiss',
    label: 'Swiss Minimal',
    theme: {
      ...base, mode: 'light', fontHeading: 'Inter Tight', fontBody: 'Inter', radius: 0, shadow: 'none', buttonStyle: 'solid', density: 'spacious', scale: 1.333,
      palette: { primary: '#e63312', secondary: '#0a0a0a', accent: '#e63312', background: '#f4f3ef', surface: '#ebe9e3', text: '#0a0a0a', muted: '#5f5d58', border: '#d9d6cf' },
    },
  },
  {
    id: 'pastel',
    label: 'Pastel App',
    theme: {
      ...base, mode: 'light', fontHeading: 'Plus Jakarta Sans', fontBody: 'Plus Jakarta Sans', radius: 24, shadow: 'soft', buttonStyle: 'pill',
      palette: { primary: '#7c5cff', secondary: '#ff8fab', accent: '#4cc9a6', background: '#fbf9ff', surface: '#f1ecff', text: '#1b1530', muted: '#6a6386', border: '#e7e1f7' },
    },
  },
  {
    id: 'emerald',
    label: 'Emerald Finance',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Manrope', fontBody: 'Manrope', radius: 16, shadow: 'medium', buttonStyle: 'pill',
      palette: { primary: '#10b981', secondary: '#a3e635', accent: '#facc15', background: '#04120d', surface: '#0a1f17', text: '#ecfdf5', muted: '#8fb3a4', border: '#173328' },
    },
  },
  {
    id: 'cyber',
    label: 'Cyber Web3',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Unbounded', fontBody: 'Inter', radius: 14, shadow: 'dramatic', buttonStyle: 'glass', scale: 1.2,
      palette: { primary: '#a855f7', secondary: '#06b6d4', accent: '#f0abfc', background: '#06020f', surface: '#110a22', text: '#f5f0ff', muted: '#a397c2', border: '#251a40' },
    },
  },
  {
    id: 'bistro',
    label: 'Bistrô',
    theme: {
      ...base, mode: 'light', fontHeading: 'Young Serif', fontBody: 'Instrument Sans', radius: 14, shadow: 'soft', buttonStyle: 'pill', density: 'spacious',
      palette: { primary: '#8c1c13', secondary: '#bf9b30', accent: '#d9480f', background: '#fbf6ee', surface: '#f3eadb', text: '#2a1a14', muted: '#7a6457', border: '#e8dccb' },
    },
  },
  {
    id: 'estate',
    label: 'Estate',
    theme: {
      ...base, mode: 'light', fontHeading: 'Gloock', fontBody: 'Inter', radius: 4, shadow: 'soft', buttonStyle: 'solid', density: 'spacious',
      palette: { primary: '#1f3a5f', secondary: '#b08d57', accent: '#b08d57', background: '#fafaf7', surface: '#f0eee7', text: '#141a22', muted: '#5e6672', border: '#e2dfd6' },
    },
  },
  {
    id: 'clinic',
    label: 'Clinic',
    theme: {
      ...base, mode: 'light', fontHeading: 'Lora', fontBody: 'Nunito Sans', radius: 20, shadow: 'soft', buttonStyle: 'pill',
      palette: { primary: '#0f766e', secondary: '#38bdf8', accent: '#f59e0b', background: '#f8fcfb', surface: '#e9f6f3', text: '#0d2622', muted: '#55716b', border: '#d6ebe6' },
    },
  },
  {
    id: 'festival',
    label: 'Festival',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Bebas Neue', fontBody: 'Inter', radius: 6, shadow: 'medium', buttonStyle: 'solid', scale: 1.333,
      palette: { primary: '#ff3d71', secondary: '#ffb800', accent: '#00e0ff', background: '#0b0710', surface: '#17101f', text: '#fff7fb', muted: '#b3a2b8', border: '#2a1d33' },
    },
  },
  {
    id: 'academy',
    label: 'Academy',
    theme: {
      ...base, mode: 'light', fontHeading: 'Outfit', fontBody: 'Outfit', radius: 16, shadow: 'medium', buttonStyle: 'pill',
      palette: { primary: '#4f46e5', secondary: '#f59e0b', accent: '#ec4899', background: '#ffffff', surface: '#f5f5ff', text: '#13123a', muted: '#5d5c80', border: '#e4e4f5' },
    },
  },
  {
    id: 'cyberpunk',
    label: 'Cyberpunk',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Orbitron', fontBody: 'Rajdhani', radius: 4, shadow: 'dramatic', buttonStyle: 'solid', baseSize: 18,
      palette: { primary: '#ff2a6d', secondary: '#05d9e8', accent: '#f9f871', background: '#07010f', surface: '#120822', text: '#f6f1ff', muted: '#a99cc4', border: '#2a1745' },
    },
  },
  {
    id: 'scifi',
    label: 'Sci-fi',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Exo 2', fontBody: 'Inter', radius: 14, shadow: 'dramatic', buttonStyle: 'glass',
      palette: { primary: '#38bdf8', secondary: '#a78bfa', accent: '#f472b6', background: '#030712', surface: '#0b1324', text: '#eaf2ff', muted: '#8ea3c4', border: '#1b2a44' },
    },
  },
  {
    id: 'fantasy',
    label: 'Fantasia',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Cinzel', fontBody: 'EB Garamond', radius: 6, shadow: 'medium', buttonStyle: 'solid', baseSize: 19, density: 'spacious',
      palette: { primary: '#d4a24c', secondary: '#8b1e3f', accent: '#6fa38b', background: '#120d08', surface: '#1d1610', text: '#f3e7cf', muted: '#bfa982', border: '#3a2c1c' },
    },
  },
  {
    id: 'terminal',
    label: 'Terminal',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Share Tech Mono', fontBody: 'Inter', radius: 6, shadow: 'none', buttonStyle: 'solid',
      palette: { primary: '#22c55e', secondary: '#38bdf8', accent: '#eab308', background: '#050806', surface: '#0c130f', text: '#d9fbe5', muted: '#7fa58c', border: '#18261d' },
    },
  },
  {
    id: 'school',
    label: 'Escola',
    theme: {
      ...base, mode: 'light', fontHeading: 'Fredoka', fontBody: 'Nunito', radius: 22, shadow: 'soft', buttonStyle: 'pill', baseSize: 18,
      palette: { primary: '#2563eb', secondary: '#f59e0b', accent: '#ef4444', background: '#fffdf7', surface: '#fff3d6', text: '#1e1b4b', muted: '#57537a', border: '#f1e4c4' },
    },
  },
  {
    id: 'retro',
    label: 'Retrô 8-bit',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Press Start 2P', fontBody: 'Inter', radius: 0, shadow: 'medium', buttonStyle: 'solid', scale: 1.2,
      palette: { primary: '#ff00a0', secondary: '#00e5ff', accent: '#ffe600', background: '#12002b', surface: '#1f0a45', text: '#fff7ff', muted: '#b8a6d9', border: '#34176b' },
    },
  },
  {
    id: 'music',
    label: 'Música',
    theme: {
      ...base, mode: 'dark', fontHeading: 'Righteous', fontBody: 'Inter', radius: 16, shadow: 'dramatic', buttonStyle: 'pill',
      palette: { primary: '#ff5f1f', secondary: '#8b5cf6', accent: '#22d3ee', background: '#0b0a10', surface: '#16141f', text: '#f5f3ff', muted: '#a3a0b8', border: '#262337' },
    },
  },
  {
    id: 'nature',
    label: 'Natureza',
    theme: {
      ...base, mode: 'light', fontHeading: 'Fraunces', fontBody: 'Nunito', radius: 24, shadow: 'soft', buttonStyle: 'pill', density: 'spacious',
      palette: { primary: '#2f6d3a', secondary: '#a3b18a', accent: '#e9a23b', background: '#f6f7f0', surface: '#e9edd9', text: '#1d2a1b', muted: '#5b6b55', border: '#d9dfc6' },
    },
  },
];

export const DEFAULT_THEME: Theme = THEME_PRESETS[0].theme;
