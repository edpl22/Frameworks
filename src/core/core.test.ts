import { describe, expect, it, beforeEach } from 'vitest';
import { contrastRatio, hexToHsl, hslToHex, harmonyPalette, normalizeHex, wcagLevel } from './color';
import { createSection, setPath } from './factory';
import { createDefaultProject, TEMPLATES, projectFromTemplate } from './templates';
import { THEME_PRESETS } from './theme';
import { generateSiteCSS } from './siteCss';
import { generatePrompt, DEFAULT_PROMPT_OPTIONS, STACKS } from './prompt';
import { exportPageHTML, designTokens, parseProject, projectJSON, renderPageMarkup, exportZip } from './exporters';
import { SECTIONS } from './sections';
import { useStore, activePage } from './store';
import JSZip from 'jszip';

describe('color', () => {
  it('normalizes and round-trips hex ↔ hsl', () => {
    expect(normalizeHex('#ABC')).toBe('#aabbcc');
    for (const c of ['#8b5cf6', '#22d3ee', '#000000', '#ffffff', '#e11d48']) {
      expect(hslToHex(hexToHsl(c))).toBe(c);
    }
  });
  it('computes WCAG contrast', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(wcagLevel(4.6)).toBe('AA');
    expect(wcagLevel(2)).toBe('Fail');
  });
  it('generates readable palettes in both modes', () => {
    for (const mode of ['light', 'dark'] as const) {
      const p = harmonyPalette('#8b5cf6', 'triadic', mode);
      expect(contrastRatio(p.text, p.background)).toBeGreaterThan(7);
    }
  });
});

describe('factory', () => {
  it('creates every section type with defaults', () => {
    for (const d of SECTIONS) {
      const s = createSection(d.type);
      expect(s.variant).toBe(d.variants[0].id);
      expect(Object.keys(s.props).length).toBeGreaterThan(0);
    }
  });
  it('setPath is immutable and supports nested arrays', () => {
    const o = { items: [{ title: 'a' }, { title: 'b' }] };
    const n = setPath(o, 'items.1.title', 'x');
    expect(n.items[1].title).toBe('x');
    expect(o.items[1].title).toBe('b');
    expect(n.items[0]).toBe(o.items[0]);
  });
  it('builds every template with valid preset, unique id and renderable pages', () => {
    const ids = new Set<string>();
    for (const t of TEMPLATES) {
      expect(ids.has(t.id), t.id).toBe(false);
      ids.add(t.id);
      expect(THEME_PRESETS.some((p) => p.id === t.preset), `${t.id} preset`).toBe(true);
      const p = projectFromTemplate(t);
      for (const pg of p.pages) {
        expect(pg.sections.length).toBeGreaterThan(0);
        expect(renderPageMarkup(pg)).toContain('fw-site');
      }
      // template copy must reach the generated prompt
      if (t.brief.projectName) expect(generatePrompt(p)).toContain(t.brief.projectName);
    }
  });
  it('rewrites internal page links in multi-page exports', () => {
    const p = projectFromTemplate(TEMPLATES.find((t) => t.id === 'agency')!);
    expect(p.pages.length).toBe(3);
    const html = exportPageHTML(p, p.pages[0]);
    expect(html).toContain('href="./projetos.html"');
    expect(html).toContain('href="./contato.html"');
  });
  it('does not leak generic demo copy into templates that rewrite a section', () => {
    for (const t of TEMPLATES) {
      const p = projectFromTemplate(t);
      for (const pg of p.pages) for (const s of pg.sections) {
        if (t.id === 'saas' || t.id === 'startup' || t.id === 'brand' || t.id === 'blank') continue;
        expect(String(s.props.subtitle ?? ''), `${t.id}/${s.type}`).not.toContain('Ferramentas poderosas desenhadas');
      }
    }
  });
  it('generates CSS for every preset, fully scoped', () => {
    for (const p of THEME_PRESETS) {
      const css = generateSiteCSS(p.theme, '.scope-x .fw-site');
      expect(css).toContain('--fw-primary');
      // every non-keyframe rule must be scoped
      const rules = css.replace(/@keyframes[^{]+\{(?:[^{}]*\{[^}]*\})*[^}]*\}/g, '').match(/[^{}@]+\{[^{}]*\}/g) ?? [];
      for (const r of rules) {
        const sel = r.slice(0, r.indexOf('{')).trim();
        if (/^(from|to|\d+%)$/.test(sel)) continue;
        for (const part of sel.split(/,(?![^(]*\))/)) expect(part, sel).toContain('.scope-x .fw-site');
      }
    }
  });
});

describe('prompt', () => {
  const p = createDefaultProject();
  it('includes brief, stack, tokens and every visible section', () => {
    const out = generatePrompt(p);
    expect(out).toContain(p.brief.projectName);
    expect(out).toContain(STACKS[p.brief.stack].label);
    expect(out).toContain('--color-primary:');
    for (const s of p.pages[0].sections) expect(out).toContain(`#${s.type === 'navbar' || s.type === 'footer' ? s.type : s.type + '-'}`);
    expect(out).toContain('Critérios de aceite');
  });
  it('respects options and language', () => {
    const en = generatePrompt(p, { ...DEFAULT_PROMPT_OPTIONS, promptLanguage: 'en', includeAcceptance: false, includeJsonSpec: true });
    expect(en).not.toContain('Acceptance criteria');
    expect(en).toContain('Product context');
    expect(en).toContain('```json');
  });
  it('omits hidden sections and forwards section notes', () => {
    const q = structuredClone(p);
    q.pages[0].sections[1].hidden = true;
    q.pages[0].sections[2].notes = 'CARROSSEL_AUTOMATICO';
    const out = generatePrompt(q);
    expect(out).toContain('CARROSSEL_AUTOMATICO');
    expect(out).not.toContain(`#${q.pages[0].sections[1].type}-${q.pages[0].sections[1].id.slice(-4)}`);
  });
});

describe('exporters', () => {
  const p = createDefaultProject();
  it('renders static markup without editing artifacts', () => {
    const html = renderPageMarkup(p.pages[0]);
    expect(html).toContain('fw-site');
    expect(html).not.toContain('contenteditable');
    expect(html).toContain('<em>');
  });
  it('produces a complete HTML document', () => {
    const doc = exportPageHTML(p, p.pages[0]);
    expect(doc.startsWith('<!doctype html>')).toBe(true);
    expect(doc).toContain('<style>');
    expect(doc).toContain('fonts.googleapis.com');
  });
  it('round-trips project JSON', () => {
    const back = parseProject(projectJSON(p));
    expect(back.pages[0].sections.length).toBe(p.pages[0].sections.length);
    expect(() => parseProject('{"foo":1}')).toThrow();
  });
  it('emits W3C tokens', () => {
    const t = designTokens(p);
    expect((t.color as unknown as Record<string, { $type: string }>).primary.$type).toBe('color');
  });
  it('builds a zip with all artifacts', async () => {
    const blob = await exportZip(p);
    const zip = await JSZip.loadAsync(await blob.arrayBuffer());
    for (const f of ['index.html', 'assets/site.css', 'CLAUDE_PROMPT.md', 'design/tokens.json', 'project.fwstudio', 'README.md']) {
      expect(zip.file(f), f).not.toBeNull();
    }
  });
});

describe('store', () => {
  beforeEach(() => useStore.getState().loadProject(createDefaultProject()));
  it('adds, moves, duplicates, removes with undo/redo', () => {
    const s = () => useStore.getState();
    const n0 = activePage(s()).sections.length;
    s().addSection('faq');
    expect(activePage(s()).sections.length).toBe(n0 + 1);
    // inserted before the footer
    const list = activePage(s()).sections;
    expect(list[list.length - 1].type).toBe('footer');
    s().undo();
    expect(activePage(s()).sections.length).toBe(n0);
    s().redo();
    expect(activePage(s()).sections.length).toBe(n0 + 1);
    const id = activePage(s()).sections[1].id;
    s().duplicateSection(id);
    expect(activePage(s()).sections[2].type).toBe(activePage(s()).sections[1].type);
    s().removeSection(id);
    expect(activePage(s()).sections.find((x) => x.id === id)).toBeUndefined();
  });
  it('coalesces rapid edits to the same prop into one history step', () => {
    const s = () => useStore.getState();
    const id = activePage(s()).sections[1].id;
    const before = s().past.length;
    s().updateProp(id, 'title', 'a');
    s().updateProp(id, 'title', 'ab');
    s().updateProp(id, 'title', 'abc');
    expect(s().past.length).toBe(before + 1);
    expect(activePage(s()).sections[1].props.title).toBe('abc');
  });
  it('protects locked sections', () => {
    const s = () => useStore.getState();
    const id = activePage(s()).sections[1].id;
    s().updateSection(id, { locked: true });
    s().removeSection(id);
    expect(activePage(s()).sections.some((x) => x.id === id)).toBe(true);
  });
});
