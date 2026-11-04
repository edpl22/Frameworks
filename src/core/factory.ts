import type { Brief, Page, Section, SectionStyle, SectionType } from './types';
import { SECTION_MAP } from './sections';

export const uid = (prefix = 'id') => `${prefix}_${Math.random().toString(36).slice(2, 9)}${Date.now().toString(36).slice(-3)}`;

export const BASE_STYLE: SectionStyle = {
  background: 'default',
  paddingY: 'lg',
  align: 'left',
  maxWidth: 'default',
  animation: 'fade',
  divider: false,
  overlay: 0.5,
};

export function createSection(type: SectionType, variant?: string): Section {
  const def = SECTION_MAP[type];
  return {
    id: uid('sec'),
    type,
    variant: variant ?? def.variants[0].id,
    props: def.defaults(),
    style: { ...BASE_STYLE, ...def.defaultStyle },
  };
}

export function cloneSection(s: Section): Section {
  return { ...structuredClone(s), id: uid('sec') };
}

export function createPage(name = 'Início', slug = '/', types: SectionType[] = []): Page {
  return {
    id: uid('page'),
    name,
    slug,
    seoTitle: name,
    seoDescription: '',
    sections: types.map((t) => createSection(t)),
  };
}

export const DEFAULT_BRIEF: Brief = {
  projectName: 'Aurora',
  tagline: 'A plataforma que transforma ambição em resultados',
  goal: 'Gerar leads qualificados e converter visitantes em clientes pagantes.',
  audience: 'Founders, heads de produto e times de marketing de empresas B2B em crescimento.',
  tone: ['Premium', 'Confiante', 'Moderno'],
  industry: 'SaaS / Tecnologia',
  stack: 'next-tailwind',
  features: ['Formulário de contato funcional', 'SEO técnico completo', 'Animações on-scroll', 'Modo escuro'],
  references: '',
  extraInstructions: '',
  language: 'pt-BR',
};

/** Immutable set by dotted path, e.g. setPath(obj, 'items.2.title', 'x'). */
export function setPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split('.');
  const root: any = Array.isArray(obj) ? [...(obj as any)] : { ...(obj as any) };
  let cur = root;
  for (let i = 0; i < keys.length - 1; i++) {
    const k = keys[i];
    const next = cur[k];
    cur[k] = Array.isArray(next) ? [...next] : { ...next };
    cur = cur[k];
  }
  cur[keys[keys.length - 1]] = value;
  return root;
}
