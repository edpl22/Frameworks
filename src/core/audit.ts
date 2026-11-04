import type { Page, Project, Section } from './types';
import { SECTION_MAP, list, str, bool } from './sections';
import { contrastRatio, ensureContrast, readableOn } from './color';
import { assetIdOf, isAssetRef } from './assets';

// ════════════════════════════════════════════════════════════════
//  Project quality audit: accessibility, SEO, content, links, media.
//  Pure function of the project, so it runs live in the studio, in tests
//  and in the prompt generator ("Pendências conhecidas").
// ════════════════════════════════════════════════════════════════

export type Severity = 'error' | 'warning' | 'info';
export type AuditCategory = 'Acessibilidade' | 'SEO' | 'Conteúdo' | 'Links' | 'Mídia' | 'Briefing';

export interface Issue {
  id: string;
  severity: Severity;
  category: AuditCategory;
  message: string;
  hint?: string;
  pageId?: string;
  sectionId?: string;
  /** Present when the studio can fix the issue in one click. */
  fix?: (p: Project) => Project;
  fixLabel?: string;
}

export interface AuditResult {
  issues: Issue[];
  score: number;
  counts: Record<Severity, number>;
}

const WEIGHT: Record<Severity, number> = { error: 12, warning: 4, info: 1 };
const TITLE_REQUIRED = new Set(['hero', 'features', 'pricing', 'team', 'faq', 'cta', 'contact', 'newsletter']);

const sectionName = (s: Section) => s.name || SECTION_MAP[s.type]?.label || s.type;
const updatePage = (p: Project, pageId: string, fn: (pg: Page) => Page): Project => ({ ...p, pages: p.pages.map((pg) => (pg.id === pageId ? fn(pg) : pg)) });

function auditTheme(p: Project, out: Issue[]) {
  const pal = p.theme.palette;
  const pairs: { key: 'text' | 'muted'; label: string; severity: Severity }[] = [
    { key: 'text', label: 'Texto principal', severity: 'error' },
    { key: 'muted', label: 'Texto suave', severity: 'warning' },
  ];
  for (const { key, label, severity } of pairs) {
    for (const [bgKey, bgLabel] of [['background', 'fundo'], ['surface', 'superfície']] as const) {
      const r = contrastRatio(pal[key], pal[bgKey]);
      if (r < 4.5) {
        out.push({
          id: `contrast-${key}-${bgKey}`, severity, category: 'Acessibilidade',
          message: `${label} tem contraste ${r.toFixed(2)}:1 sobre a cor de ${bgLabel} (mínimo AA: 4.5:1)`,
          hint: 'Texto com pouco contraste fica ilegível para muitas pessoas, principalmente no celular e sob sol.',
          fixLabel: 'Ajustar cor',
          fix: (pr) => {
            const target = ensureContrast(pr.theme.palette[key], pr.theme.palette[bgKey]);
            const both = ensureContrast(target, bgKey === 'background' ? pr.theme.palette.surface : pr.theme.palette.background);
            return { ...pr, theme: { ...pr.theme, palette: { ...pr.theme.palette, [key]: both } } };
          },
        });
      }
    }
  }
  const btn = contrastRatio(readableOn(pal.primary), pal.primary);
  if (btn < 4.5) {
    out.push({
      id: 'contrast-button', severity: 'warning', category: 'Acessibilidade',
      message: `O texto dos botões principais tem contraste ${btn.toFixed(2)}:1 sobre a cor primária`,
      hint: 'Escureça ou clareie a cor primária para o texto do botão ficar legível.',
    });
  }
}

function auditPage(p: Project, pg: Page, out: Issue[]) {
  const visible = pg.sections.filter((s) => !s.hidden);
  const at = { pageId: pg.id };

  if (!visible.length) out.push({ id: `empty-${pg.id}`, severity: 'error', category: 'Conteúdo', message: `A página “${pg.name}” não tem seções visíveis`, ...at });

  // SEO
  const fallbackTitle = pg.slug === '/' ? `${p.brief.projectName} — ${p.brief.tagline}` : `${pg.name} — ${p.brief.projectName}`;
  if (!pg.seoTitle.trim()) {
    out.push({ id: `seo-title-${pg.id}`, severity: 'error', category: 'SEO', message: `“${pg.name}” está sem título de SEO`, ...at, fixLabel: 'Preencher', fix: (pr) => updatePage(pr, pg.id, (x) => ({ ...x, seoTitle: fallbackTitle })) });
  } else if (pg.seoTitle.length > 60) {
    out.push({ id: `seo-title-long-${pg.id}`, severity: 'warning', category: 'SEO', message: `O título de SEO de “${pg.name}” tem ${pg.seoTitle.length} caracteres (o Google corta perto de 60)`, ...at });
  }
  if (!pg.seoDescription.trim()) {
    const fill = p.brief.tagline || p.brief.goal;
    out.push({ id: `seo-desc-${pg.id}`, severity: 'warning', category: 'SEO', message: `“${pg.name}” está sem meta description`, ...at, ...(fill ? { fixLabel: 'Usar tagline', fix: (pr: Project) => updatePage(pr, pg.id, (x) => ({ ...x, seoDescription: fill.slice(0, 160) })) } : {}) });
  } else if (pg.seoDescription.length > 160) {
    out.push({ id: `seo-desc-long-${pg.id}`, severity: 'warning', category: 'SEO', message: `A meta description de “${pg.name}” passa de 160 caracteres`, ...at });
  }

  // Heading structure: the hero renders the page's only <h1>.
  const heroes = visible.filter((s) => s.type === 'hero');
  if (!heroes.length && visible.length) out.push({ id: `h1-none-${pg.id}`, severity: 'warning', category: 'Acessibilidade', message: `“${pg.name}” não tem um título principal (h1)`, hint: 'Adicione uma seção Hero: ela define o h1 da página.', ...at });
  if (heroes.length > 1) out.push({ id: `h1-many-${pg.id}`, severity: 'warning', category: 'Acessibilidade', message: `“${pg.name}” tem ${heroes.length} seções Hero, ou seja, ${heroes.length} títulos h1`, hint: 'Use um único Hero por página; para os demais blocos, prefira “Chamada final” ou “Texto + mídia”.', pageId: pg.id, sectionId: heroes[1].id });

  if (visible.length && !visible.some((s) => s.type === 'navbar')) out.push({ id: `nav-${pg.id}`, severity: 'info', category: 'Conteúdo', message: `“${pg.name}” não tem barra de navegação`, ...at });
  if (visible.length && !visible.some((s) => s.type === 'footer')) out.push({ id: `footer-${pg.id}`, severity: 'info', category: 'Conteúdo', message: `“${pg.name}” não tem rodapé`, ...at });

  const slugs = new Set(p.pages.map((x) => x.slug));
  for (const s of visible) auditSection(p, pg, s, slugs, out);

  const hidden = pg.sections.length - visible.length;
  if (hidden) out.push({ id: `hidden-${pg.id}`, severity: 'info', category: 'Conteúdo', message: `${hidden} seção(ões) oculta(s) em “${pg.name}” não vão para o prompt nem para o export`, ...at });
}

function auditSection(p: Project, pg: Page, s: Section, slugs: Set<string>, out: Issue[]) {
  const at = { pageId: pg.id, sectionId: s.id };
  const name = sectionName(s);
  const pr = s.props;

  const needsTitle = s.type === 'custom' || TITLE_REQUIRED.has(s.type);
  if (needsTitle && 'title' in pr && !str(pr.title).trim()) {
    out.push({ id: `title-${s.id}`, severity: 'warning', category: 'Conteúdo', message: `“${name}” está sem título`, ...at });
  }
  if (s.type === 'custom' && !str(pr.spec).trim()) {
    out.push({ id: `spec-${s.id}`, severity: 'error', category: 'Conteúdo', message: `“${name}” precisa de uma descrição do que o bloco deve fazer`, hint: 'É essa descrição que o Claude Code usa para construir o bloco.', ...at });
  }

  // Links: placeholders and internal links to pages that don't exist.
  // Only links that are actually rendered count: a `fooHref` needs its `fooLabel`
  // (or, for list items, a `label`/`icon`) to be non-empty.
  const hrefs: string[] = [];
  const collect = (v: unknown) => {
    if (Array.isArray(v)) return v.forEach(collect);
    if (!v || typeof v !== 'object') return;
    const o = v as Record<string, unknown>;
    for (const [k, x] of Object.entries(o)) {
      if (/href$/i.test(k)) {
        const labelKey = k === 'href' ? 'label' : k.replace(/Href$/, 'Label');
        const shown = str(o[labelKey] as never).trim() || (k === 'href' && str(o.icon as never).trim());
        if (shown) hrefs.push(str(x as never));
      } else collect(x);
    }
  };
  collect(pr);
  const pending = hrefs.filter((h) => !h.trim() || h.trim() === '#').length;
  if (pending) out.push({ id: `links-${s.id}`, severity: 'info', category: 'Links', message: `“${name}” tem ${pending} link(s) sem destino definido (#)`, hint: 'O Claude Code vai precisar saber para onde cada botão leva.', ...at });
  for (const h of hrefs) {
    if (h.startsWith('/') && !slugs.has(h)) out.push({ id: `broken-${s.id}-${h}`, severity: 'error', category: 'Links', message: `“${name}” aponta para “${h}”, que não existe no projeto`, ...at });
  }

  // Media
  const images: { src: string; alt: string; label: string }[] = [];
  if (s.type === 'hero' || s.type === 'content') {
    if (str(pr.image)) images.push({ src: str(pr.image), alt: str(pr.imageAlt), label: 'imagem principal' });
    else if (s.type === 'content' && !bool(pr.showMockup)) images.push({ src: '', alt: '', label: 'imagem principal' });
  }
  if (s.type === 'gallery') list(pr.images).forEach((im, i) => images.push({ src: str(im.src), alt: str(im.caption), label: `imagem ${i + 1}` }));
  if (s.type === 'team') list(pr.members).forEach((m) => images.push({ src: str(m.photo), alt: str(m.name), label: `foto de ${str(m.name) || 'membro'}` }));
  if (s.style.background === 'image') images.push({ src: s.style.backgroundImage ?? '', alt: 'decorativa', label: 'imagem de fundo' });

  const placeholders = images.filter((im) => !im.src).length;
  if (placeholders) out.push({ id: `placeholder-${s.id}`, severity: 'info', category: 'Mídia', message: `“${name}” usa ${placeholders} imagem(ns) de placeholder`, hint: 'Envie imagens reais pela aba Mídia ou deixe que o Claude Code sugira fotos.', ...at });
  const noAlt = images.filter((im) => im.src && !im.alt.trim());
  if (noAlt.length) out.push({ id: `alt-${s.id}`, severity: 'warning', category: 'Acessibilidade', message: `“${name}”: ${noAlt.map((x) => x.label).join(', ')} sem texto alternativo`, hint: 'Leitores de tela leem o texto alternativo; ele também ajuda o SEO de imagens.', ...at });
  for (const im of images) {
    if (im.src.startsWith('http://')) out.push({ id: `http-${s.id}-${im.label}`, severity: 'warning', category: 'Mídia', message: `“${name}”: ${im.label} usa http:// (será bloqueada em sites https)`, ...at });
    if (isAssetRef(im.src)) {
      const meta = p.assets?.[assetIdOf(im.src)];
      if (!meta) out.push({ id: `missing-${s.id}-${im.label}`, severity: 'error', category: 'Mídia', message: `“${name}”: ${im.label} foi removida da biblioteca`, ...at });
      else if (meta.size > 1.5 * 1024 * 1024) out.push({ id: `heavy-${s.id}-${meta.id}`, severity: 'warning', category: 'Mídia', message: `“${name}”: ${meta.name} tem ${(meta.size / 1024 / 1024).toFixed(1)} MB`, hint: 'Imagens pesadas atrasam o carregamento (LCP).', ...at });
    }
  }
}

function auditProjectLevel(p: Project, out: Issue[]) {
  const seen = new Map<string, Page>();
  for (const pg of p.pages) {
    if (!pg.slug.startsWith('/')) out.push({ id: `slug-${pg.id}`, severity: 'error', category: 'Links', message: `A rota de “${pg.name}” precisa começar com “/”`, pageId: pg.id, fixLabel: 'Corrigir', fix: (pr) => updatePage(pr, pg.id, (x) => ({ ...x, slug: '/' + x.slug.replace(/^\/*/, '') })) });
    const dup = seen.get(pg.slug);
    if (dup) {
      out.push({
        id: `dup-${pg.id}`, severity: 'error', category: 'Links', message: `“${pg.name}” e “${dup.name}” usam a mesma rota ${pg.slug}`, pageId: pg.id,
        fixLabel: 'Renomear rota',
        fix: (pr) => {
          const taken = new Set(pr.pages.map((x) => x.slug));
          let n = 2;
          const base = pg.slug === '/' ? '/pagina' : pg.slug;
          while (taken.has(`${base}-${n}`)) n++;
          return updatePage(pr, pg.id, (x) => ({ ...x, slug: `${base}-${n}` }));
        },
      });
    }
    seen.set(pg.slug, pg);
  }
  const b = p.brief;
  const missing = [!b.goal.trim() && 'objetivo', !b.audience.trim() && 'público-alvo', !b.tone.length && 'tom de voz'].filter(Boolean);
  if (missing.length) out.push({ id: 'brief', severity: 'info', category: 'Briefing', message: `Briefing sem ${missing.join(', ')}`, hint: 'Quanto mais contexto de negócio, melhor o resultado do Claude Code.' });
}

export function auditProject(p: Project): AuditResult {
  const issues: Issue[] = [];
  auditTheme(p, issues);
  auditProjectLevel(p, issues);
  for (const pg of p.pages) auditPage(p, pg, issues);
  const order: Record<Severity, number> = { error: 0, warning: 1, info: 2 };
  issues.sort((a, b) => order[a.severity] - order[b.severity]);
  const counts = { error: 0, warning: 0, info: 0 } as Record<Severity, number>;
  for (const i of issues) counts[i.severity]++;
  const score = Math.max(0, Math.min(100, 100 - issues.reduce((n, i) => n + WEIGHT[i.severity], 0)));
  return { issues, score, counts };
}
