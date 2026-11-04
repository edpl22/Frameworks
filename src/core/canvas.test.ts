import { describe, expect, it } from 'vitest';
import { canvasElements, canvasRows, clampEl, describeCanvas, mobileLayout, newElement, readingOrder, regroup, GRID_COLS, type CanvasEl } from './canvas';
import { cardsComp, ctaComp, SECTION_PRESETS, statsComp } from './canvasKit';
import { THEME_PRESETS } from './theme';
import { createSection } from './factory';
import { createDefaultProject, projectFromTemplate, TEMPLATES } from './templates';
import { exportPageHTML, renderPageMarkup } from './exporters';
import { generatePrompt } from './prompt';
import { auditProject } from './audit';
import type { PropValue } from './types';

const inGrid = (e: CanvasEl) => e.col >= 1 && e.span >= 1 && e.col + e.span - 1 <= GRID_COLS && e.row >= 1 && e.rows >= 1;

describe('free-form elements', () => {
  it('creates elements with sensible defaults and clamps them into the grid', () => {
    const h = newElement('heading');
    expect(h.kind).toBe('heading');
    expect(inGrid(h)).toBe(true);
    expect(clampEl({ ...h, col: 11, span: 6, row: -3, rows: 0 })).toMatchObject({ col: 7, span: 6, row: 1, rows: 1 });
    expect(clampEl({ ...h, span: 40 }).span).toBe(12);
  });

  it('orders elements for phones: rows, columns, tall images by their middle', () => {
    const title = newElement('heading', { id: 't', col: 1, row: 2, rows: 3 });
    const text = newElement('text', { id: 'p', col: 1, row: 5, rows: 2 });
    const img = newElement('image', { id: 'i', col: 7, row: 1, rows: 10 });
    const btn = newElement('button', { id: 'b', col: 1, row: 9, rows: 1 });
    expect(readingOrder([img, btn, text, title]).map((e) => e.id)).toEqual(['t', 'p', 'i', 'b']);
  });

  it('grows the section to fit its lowest element', () => {
    expect(canvasRows({ rows: 4, elements: [newElement('text', { row: 9, rows: 2 })] as unknown as PropValue })).toBe(10);
  });

  it('keeps every preset and themed template inside the 12-column grid', () => {
    for (const p of SECTION_PRESETS) for (const e of p.build().elements) expect(inGrid(e), `${p.id}/${e.kind}`).toBe(true);
    for (const t of TEMPLATES.filter((x) => x.mode === 'canvas')) {
      for (const pg of projectFromTemplate(t).pages) {
        for (const s of pg.sections.filter((x) => x.type === 'canvas')) {
          const els = canvasElements(s.props);
          expect(els.length).toBeGreaterThan(0);
          for (const e of els) expect(inGrid(e), `${t.id}/${s.name}/${e.kind}`).toBe(true);
          expect(new Set(els.map((e) => e.id)).size).toBe(els.length);
        }
      }
    }
  });
});

describe('free-form rendering, prompt and audit', () => {
  const project = () => {
    const p = createDefaultProject();
    const s = createSection('canvas');
    s.props.elements = [
      newElement('heading', { id: 'h', text: 'Olá *mundo*', col: 2, span: 6, row: 1, rows: 2, level: 1 }),
      newElement('shape', { id: 's', shape: 'blob', col: 9, span: 4, row: 1, rows: 4, mobileHidden: true }),
      newElement('image', { id: 'img', src: 'https://example.com/a.jpg', alt: '', col: 8, span: 5, row: 2, rows: 4 }),
      newElement('button', { id: 'b', text: 'Comprar', href: '#', col: 2, span: 3, row: 4 }),
    ] as unknown as PropValue;
    p.pages[0].sections.splice(2, 0, s);
    return { p, s };
  };

  it('renders a CSS grid with placements, an h1 and no editor affordances', () => {
    const { p } = project();
    const html = renderPageMarkup(p.pages[0]);
    expect(html).toContain('class="fw-canvas"');
    expect(html).toContain('grid-column:2 / span 6');
    expect(html).toContain('<h1 class="fw-el-h');
    expect(html).toContain('fw-el-mhide');
    expect(html).not.toContain('fw-handle');
    expect(html).not.toContain('fw-canvas-guides');
    expect(exportPageHTML(p, p.pages[0])).toContain('@container site (max-width: 768px)');
  });

  it('describes the composition for Claude Code in reading order', () => {
    const { p, s } = project();
    const d = describeCanvas(s.props);
    expect(d).toContain('Grade de 12 colunas');
    expect(d.indexOf('Título')).toBeLessThan(d.indexOf('Botão'));
    expect(d).toContain('título principal da página (h1)');
    expect(d).toContain('decorativo: ocultar no celular');
    expect(generatePrompt(p)).toContain('Composição (grade livre)');
  });

  it('audits free-form content: h1, alt text and button destinations', () => {
    const { p, s } = project();
    const r = auditProject(p);
    expect(r.issues.some((i) => i.id.startsWith('h1-many-'))).toBe(true); // hero + free-form h1
    expect(r.issues.some((i) => i.id === `alt-${s.id}`)).toBe(true);
    expect(r.issues.some((i) => i.id === `links-${s.id}`)).toBe(true);
  });

  it('themed templates open with exactly one h1 per page', () => {
    for (const t of TEMPLATES.filter((x) => x.mode === 'canvas')) {
      const issues = auditProject(projectFromTemplate(t)).issues.map((i) => i.id);
      expect(issues.some((id) => id.startsWith('h1-')), t.id).toBe(false);
    }
  });

  it('keeps cards, stats and panels together when stacking on phones', () => {
    const cards = cardsComp({ title: 'T', items: [{ icon: 'zap', title: 'A', text: 'a' }, { icon: 'zap', title: 'B', text: 'b' }] }).elements;
    const m = mobileLayout(cards);
    const rowOf = (pred: (e: CanvasEl) => boolean) => cards.filter(pred).map((e) => m.get(e.id)!.row);
    // Card A's icon, title and text come before anything from card B.
    const a = rowOf((e) => e.group === 'card-0' && e.kind !== 'shape');
    const b = rowOf((e) => e.group === 'card-1' && e.kind !== 'shape');
    expect(Math.max(...a)).toBeLessThan(Math.min(...b));
    // The card background spans exactly its own content rows.
    const bg = m.get(cards.find((e) => e.group === 'card-0' && e.kind === 'shape')!.id)!;
    expect(bg.backdrop).toBe(true);
    expect([bg.row, bg.row + bg.rows - 1]).toEqual([Math.min(...a), Math.max(...a)]);

    const stats = statsComp([{ value: '1', label: 'um' }, { value: '2', label: 'dois' }]).elements;
    const sm = mobileLayout(stats);
    expect(stats.map((e) => e.text).sort((x, y) => sm.get(stats.find((e) => e.text === x)!.id)!.row - sm.get(stats.find((e) => e.text === y)!.id)!.row)).toEqual(['1', 'um', '2', 'dois']);

    // Panels without explicit groups are detected by containment.
    const cta = ctaComp({ title: 'X', text: 'y', button: 'Ir' }).elements;
    const cm = mobileLayout(cta);
    const panel = cm.get(cta.find((e) => e.kind === 'shape')!.id)!;
    expect(panel).toMatchObject({ backdrop: true, row: 1, rows: 3 });
  });

  it('gives duplicated groups fresh names', () => {
    const els = cardsComp({ title: 'T', items: [{ icon: 'zap', title: 'A', text: 'a' }] }).elements.filter((e) => e.group);
    const copies = regroup(els);
    expect(new Set(copies.map((e) => e.group)).size).toBe(1);
    expect(copies[0].group).not.toBe('card-0');
  });

  it('ships the game-inspired templates with their own themes', () => {
    for (const [id, preset] of [['neon-merc', 'neon-merc'], ['crimson-line', 'crimson'], ['ten-floors-library', 'library']]) {
      const t = TEMPLATES.find((x) => x.id === id)!;
      expect(t.preset).toBe(preset);
      expect(THEME_PRESETS.some((p) => p.id === preset)).toBe(true);
      const proj = projectFromTemplate(t);
      const html = exportPageHTML(proj, proj.pages[0]);
      expect(html).toContain('fw-canvas');
    }
  });
});
