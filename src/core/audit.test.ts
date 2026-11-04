import { describe, expect, it } from 'vitest';
import { auditProject } from './audit';
import { contrastRatio, ensureContrast } from './color';
import { createSection } from './factory';
import { createDefaultProject, projectFromTemplate, TEMPLATES } from './templates';
import { generatePrompt } from './prompt';
import { renderPageMarkup } from './exporters';
import { assetRef } from './assets';
import type { Project } from './types';

const ids = (p: Project) => auditProject(p).issues.map((i) => i.id);

describe('ensureContrast', () => {
  it('reaches AA on light and dark backgrounds while keeping the hue', () => {
    expect(contrastRatio(ensureContrast('#bbbbbb', '#ffffff'), '#ffffff')).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(ensureContrast('#333344', '#07070c'), '#07070c')).toBeGreaterThanOrEqual(4.5);
    expect(ensureContrast('#000000', '#ffffff')).toBe('#000000');
  });
});

describe('audit', () => {
  it('scores the bundled templates without errors', () => {
    for (const t of TEMPLATES.filter((x) => x.id !== 'blank')) {
      const r = auditProject(projectFromTemplate(t));
      expect(r.counts.error, `${t.id}: ${r.issues.filter((i) => i.severity === 'error').map((i) => i.message).join(' | ')}`).toBe(0);
      expect(r.score).toBeGreaterThan(50);
    }
  });

  it('flags low contrast and fixes it in one click', () => {
    const p = createDefaultProject();
    p.theme.palette.muted = p.theme.palette.background;
    const issue = auditProject(p).issues.find((i) => i.id === 'contrast-muted-background')!;
    expect(issue.severity).toBe('warning');
    const fixed = issue.fix!(p);
    expect(contrastRatio(fixed.theme.palette.muted, fixed.theme.palette.background)).toBeGreaterThanOrEqual(4.5);
    expect(ids(fixed)).not.toContain('contrast-muted-background');
  });

  it('checks SEO fields and fills them', () => {
    const p = createDefaultProject();
    p.pages[0].seoTitle = '';
    p.pages[0].seoDescription = '';
    const r = auditProject(p);
    const title = r.issues.find((i) => i.id.startsWith('seo-title-'))!;
    const desc = r.issues.find((i) => i.id.startsWith('seo-desc-'))!;
    const fixed = desc.fix!(title.fix!(p));
    expect(fixed.pages[0].seoTitle).toContain(p.brief.projectName);
    expect(fixed.pages[0].seoDescription).toBe(p.brief.tagline);
  });

  it('detects duplicate routes, broken internal links and multiple h1', () => {
    const p = projectFromTemplate(TEMPLATES.find((t) => t.id === 'agency')!);
    p.pages[2].slug = '/projetos';
    p.pages[0].sections.splice(2, 0, createSection('hero'));
    const r = auditProject(p);
    expect(r.issues.some((i) => i.id.startsWith('dup-'))).toBe(true);
    expect(r.issues.some((i) => i.message.includes('“/contato”, que não existe'))).toBe(true);
    expect(r.issues.some((i) => i.id.startsWith('h1-many-'))).toBe(true);
    const dup = r.issues.find((i) => i.id.startsWith('dup-'))!;
    expect(new Set(dup.fix!(p).pages.map((x) => x.slug)).size).toBe(3);
  });

  it('requires alt text for uploaded images and flags removed assets', () => {
    const p = createDefaultProject();
    const content = p.pages[0].sections.find((s) => s.type === 'content')!;
    content.props.image = assetRef('img_gone');
    let r = auditProject(p);
    expect(r.issues.some((i) => i.id === `alt-${content.id}`)).toBe(true);
    expect(r.issues.some((i) => i.id.startsWith(`missing-${content.id}`))).toBe(true);
    content.props.imageAlt = 'Equipe reunida';
    p.assets = { img_gone: { id: 'img_gone', name: 'a.webp', type: 'image/webp', width: 1, height: 1, size: 10, createdAt: 0 } };
    r = auditProject(p);
    expect(r.issues.some((i) => i.id === `alt-${content.id}`)).toBe(false);
    expect(r.issues.some((i) => i.id.startsWith(`missing-${content.id}`))).toBe(false);
  });

  it('lists pending errors and warnings in the prompt', () => {
    const p = createDefaultProject();
    p.pages[0].seoTitle = '';
    const prompt = generatePrompt(p);
    expect(prompt).toContain('Pendências conhecidas');
    expect(prompt).toContain('sem título de SEO');
  });
});

describe('link checks', () => {
  it('ignores href fields of buttons that are not rendered', () => {
    const p = createDefaultProject();
    const s = createSection('custom');
    p.pages[0].sections.splice(2, 0, s);
    expect(ids(p)).not.toContain(`links-${s.id}`);
    s.props.primaryLabel = 'Saiba mais';
    s.props.primaryHref = '#';
    expect(auditProject(p).issues.find((i) => i.id === `links-${s.id}`)?.message).toContain('1 link(s)');
  });
});

describe('custom block', () => {
  it('requires a spec and forwards it to the prompt as the objective', () => {
    const p = createDefaultProject();
    const s = createSection('custom', 'cards');
    p.pages[0].sections.splice(3, 0, s);
    expect(ids(p)).toContain(`spec-${s.id}`);
    s.props.spec = 'Calculadora de ROI com slider de funcionários';
    expect(ids(p)).not.toContain(`spec-${s.id}`);
    expect(generatePrompt(p)).toContain('Bloco personalizado — construa exatamente isto: Calculadora de ROI com slider de funcionários');
  });
  it('never exports the editor-only spec note', () => {
    const p = createDefaultProject();
    const s = createSection('custom');
    s.props.spec = 'NOTA_INTERNA';
    p.pages[0].sections.splice(2, 0, s);
    const html = renderPageMarkup(p.pages[0]);
    expect(html).toContain('Um bloco <em>do seu jeito</em>');
    expect(html).not.toContain('NOTA_INTERNA');
    expect(html).not.toContain('fw-spec-note');
  });
});
