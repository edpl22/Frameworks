// ─── Document model ─────────────────────────────────────────────
// Project → Pages → Sections. Everything is plain JSON so it can be
// persisted, diffed for undo/redo, exported and fed to the prompt builder.

export type SectionType =
  | 'navbar'
  | 'hero'
  | 'logos'
  | 'features'
  | 'stats'
  | 'content'
  | 'gallery'
  | 'testimonials'
  | 'pricing'
  | 'team'
  | 'faq'
  | 'cta'
  | 'contact'
  | 'newsletter'
  | 'footer';

export type Align = 'left' | 'center' | 'right';
export type Animation = 'none' | 'fade' | 'slide-up' | 'zoom' | 'blur';
export type BgKind = 'default' | 'surface' | 'primary' | 'gradient' | 'dark' | 'image' | 'mesh';
export type Spacing = 'none' | 'sm' | 'md' | 'lg' | 'xl';

export interface SectionStyle {
  background: BgKind;
  backgroundImage?: string;
  overlay?: number; // 0..1 darkening for image backgrounds
  paddingY: Spacing;
  align: Align;
  maxWidth: 'narrow' | 'default' | 'wide' | 'full';
  animation: Animation;
  divider: boolean;
  customClass?: string;
}

export type PropValue = string | number | boolean | PropValue[] | { [k: string]: PropValue };
export type Props = Record<string, PropValue>;

export interface Section {
  id: string;
  type: SectionType;
  variant: string;
  name?: string;
  hidden?: boolean;
  locked?: boolean;
  notes?: string; // free-form instructions forwarded to Claude Code
  props: Props;
  style: SectionStyle;
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  seoTitle: string;
  seoDescription: string;
  sections: Section[];
}

export interface Palette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  palette: Palette;
  fontHeading: string;
  fontBody: string;
  baseSize: number; // px
  scale: number; // modular type scale ratio
  radius: number; // px
  shadow: 'none' | 'soft' | 'medium' | 'dramatic';
  buttonStyle: 'solid' | 'pill' | 'outline' | 'glass';
  density: 'compact' | 'comfortable' | 'spacious';
}

export type TargetStack = 'next-tailwind' | 'react-vite' | 'astro' | 'nuxt' | 'sveltekit' | 'html';

export interface Brief {
  projectName: string;
  tagline: string;
  goal: string;
  audience: string;
  tone: string[];
  industry: string;
  stack: TargetStack;
  features: string[]; // integrations / functional requirements
  references: string; // URLs or inspiration notes
  extraInstructions: string;
  language: string;
}

export interface Project {
  id: string;
  version: number;
  name: string;
  createdAt: number;
  updatedAt: number;
  brief: Brief;
  theme: Theme;
  pages: Page[];
}

// ─── Schema used to auto-generate the inspector ────────────────
export type Field =
  | { key: string; label: string; kind: 'text' | 'textarea' | 'url' | 'image' | 'icon' | 'color'; placeholder?: string }
  | { key: string; label: string; kind: 'number'; min?: number; max?: number; step?: number }
  | { key: string; label: string; kind: 'toggle' }
  | { key: string; label: string; kind: 'select'; options: { value: string; label: string }[] }
  | { key: string; label: string; kind: 'list'; itemLabel: string; fields: Field[]; newItem: () => Props };

export type Device = 'desktop' | 'tablet' | 'mobile';
