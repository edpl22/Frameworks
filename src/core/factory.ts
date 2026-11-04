import type { Brief, Page, Project, Section, SectionStyle, SectionType, Theme } from './types';
import { SECTION_MAP } from './sections';
import { DEFAULT_THEME, THEME_PRESETS } from './theme';

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

export interface Template {
  id: string;
  name: string;
  description: string;
  preset: string;
  brief: Partial<Brief>;
  pages: { name: string; slug: string; sections: (SectionType | [SectionType, string, Partial<SectionStyle>?])[] }[];
}

export const TEMPLATES: Template[] = [
  {
    id: 'saas',
    name: 'SaaS Premium',
    description: 'Landing de produto com mockup, bento, preços e FAQ',
    preset: 'midnight',
    brief: { industry: 'SaaS / Tecnologia' },
    pages: [{ name: 'Início', slug: '/', sections: ['navbar', 'hero', 'logos', ['features', 'bento'], 'stats', 'content', 'testimonials', 'pricing', 'faq', 'cta', 'footer'] }],
  },
  {
    id: 'agency',
    name: 'Agência Criativa',
    description: 'Portfólio ousado com galeria masonry e equipe',
    preset: 'mono',
    brief: { projectName: 'Studio Norte', industry: 'Agência / Design', tone: ['Ousado', 'Criativo', 'Minimalista'] },
    pages: [{ name: 'Início', slug: '/', sections: ['navbar', ['hero', 'minimal', { background: 'default' }], ['gallery', 'masonry'], ['features', 'list'], 'team', ['testimonials', 'highlight'], 'contact', ['footer', 'simple']] }],
  },
  {
    id: 'startup',
    name: 'Startup Tech',
    description: 'Hero dividido, recursos em grid e newsletter',
    preset: 'neon',
    brief: { industry: 'Tecnologia / IA', tone: ['Inovador', 'Técnico', 'Direto'] },
    pages: [{ name: 'Início', slug: '/', sections: ['navbar', ['hero', 'split'], 'logos', 'features', ['stats', 'bar'], 'content', 'pricing', 'newsletter', 'footer'] }],
  },
  {
    id: 'brand',
    name: 'Marca de Luxo',
    description: 'Editorial elegante, serifado e espaçoso',
    preset: 'editorial',
    brief: { projectName: 'Maison Lumière', industry: 'Moda / Luxo', tone: ['Elegante', 'Sofisticado', 'Atemporal'] },
    pages: [{ name: 'Início', slug: '/', sections: ['navbar', ['hero', 'split', { background: 'surface' }], ['content', 'image-left'], 'gallery', ['testimonials', 'highlight', { background: 'default' }], 'newsletter', 'footer'] }],
  },
  {
    id: 'blank',
    name: 'Em branco',
    description: 'Comece do zero com navbar e rodapé',
    preset: 'saas',
    brief: {},
    pages: [{ name: 'Início', slug: '/', sections: ['navbar', 'footer'] }],
  },
];

export function projectFromTemplate(tpl: Template): Project {
  const preset = THEME_PRESETS.find((p) => p.id === tpl.preset)?.theme ?? DEFAULT_THEME;
  const brief: Brief = { ...DEFAULT_BRIEF, ...tpl.brief };
  const pages: Page[] = tpl.pages.map((pg) => {
    const page = createPage(pg.name, pg.slug);
    page.sections = pg.sections.map((entry) => {
      const [type, variant, style] = Array.isArray(entry) ? entry : [entry, undefined, undefined];
      const s = createSection(type, variant);
      if (style) s.style = { ...s.style, ...style };
      if ((type === 'navbar' || type === 'footer') && brief.projectName) {
        s.props.brand = brief.projectName;
        if (type === 'footer') s.props.copyright = `© ${new Date().getFullYear()} ${brief.projectName}. Todos os direitos reservados.`;
      }
      return s;
    });
    page.seoTitle = `${brief.projectName} — ${brief.tagline}`;
    page.seoDescription = brief.tagline;
    return page;
  });
  const now = Date.now();
  return { id: uid('proj'), version: 1, name: brief.projectName, createdAt: now, updatedAt: now, brief, theme: structuredClone(preset) as Theme, pages };
}

export function createDefaultProject(): Project {
  return projectFromTemplate(TEMPLATES[0]);
}

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
