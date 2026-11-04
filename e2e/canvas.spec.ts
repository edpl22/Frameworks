import { test, expect, type Page } from '@playwright/test';
import { stored, waitForSave } from './helpers';

async function openCanvas(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  await page.goto('/#studio');
  await page.getByRole('tab', { name: /Canvas/ }).click();
  await expect(page.locator('.cv-stage-wrap')).toBeVisible();
  return errors;
}

const tpl = (page: Page, name: string) => page.locator('.cv-tpl').filter({ has: page.locator('.cv-tpl-info b', { hasText: new RegExp(`^${name.replace(/[/]/g, '\\/')}$`) }) });
const canvasSections = (p: any) => p.pages[0].sections.filter((s: any) => s.type === 'canvas');
const findEl = (p: any, kind: string) => canvasSections(p).flatMap((s: any) => s.props.elements).find((e: any) => e.kind === kind);

test.describe('canvas mode', () => {
  test('applies a themed template from the side panel', async ({ page }) => {
    const errors = await openCanvas(page);
    await page.locator('.cv-rail button[aria-label="Templates"]').click();
    await tpl(page, 'Cyberpunk').click();
    await expect(page.locator('.project-name').first()).toHaveValue('NEON//DISTRICT');
    await expect(page.locator('.cv-sec.is-canvas').first().locator('h1')).toContainText('O futuro é');
    await waitForSave(page, (p) => p.theme.fontHeading === 'Orbitron' && canvasSections(p).length >= 3);
    expect(errors).toEqual([]);
  });

  test('moves, resizes, edits, nudges and deletes elements with undo', async ({ page }) => {
    await openCanvas(page);
    await page.locator('.cv-rail button[aria-label="Elementos"]').click();
    await page.locator('.cv-chip', { hasText: 'Abertura' }).first().click();
    const sec = page.locator('.cv-sec.sel');
    const heading = sec.locator('.fw-el.fw-el-heading').first();
    await heading.scrollIntoViewIfNeeded();
    await waitForSave(page, (p) => !!findEl(p, 'heading'));
    const before = findEl(await stored(page), 'heading');

    // drag
    const box = (await heading.boundingBox())!;
    await page.mouse.move(box.x + 20, box.y + 20);
    await page.mouse.down();
    await page.mouse.move(box.x + 140, box.y + 90, { steps: 8 });
    await page.mouse.up();
    await waitForSave(page, (p) => { const h = findEl(p, 'heading'); return h.col > before.col && h.row > before.row; });

    // resize from the east handle
    const handle = sec.locator('.fw-handle-e');
    const hb = (await handle.boundingBox())!;
    await page.mouse.move(hb.x + 3, hb.y + 5);
    await page.mouse.down();
    await page.mouse.move(hb.x - 150, hb.y + 5, { steps: 6 });
    await page.mouse.up();
    await waitForSave(page, (p) => findEl(p, 'heading').span < before.span);

    // double-click to edit text
    await sec.locator('h1').dblclick();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('Editado no Canvas');
    await page.keyboard.press('Enter');
    await waitForSave(page, (p) => findEl(p, 'heading').text === 'Editado no Canvas');

    // keyboard nudge
    await sec.locator('h1').click();
    const colBefore = findEl(await stored(page), 'heading').col;
    await page.keyboard.press('ArrowRight');
    await waitForSave(page, (p) => findEl(p, 'heading').col === colBefore + 1);

    // delete + undo
    await page.keyboard.press('Delete');
    await waitForSave(page, (p) => !findEl(p, 'heading'));
    await page.keyboard.press('ControlOrMeta+z');
    await waitForSave(page, (p) => !!findEl(p, 'heading'));
  });

  test('adds elements by click and by dragging from the panel', async ({ page }) => {
    await openCanvas(page);
    await page.locator('.cv-rail button[aria-label="Elementos"]').click();
    await page.locator('.cv-chip', { hasText: 'Em branco' }).click();
    const sec = page.locator('.cv-sec.sel');
    await expect(sec.locator('.fw-el')).toHaveCount(0);
    await page.locator('.cv-shape-tile', { hasText: 'Círculo' }).click();
    await expect(sec.locator('.fw-el-shape')).toHaveCount(1);
    await page.locator('.cv-icon-grid button[title="rocket"]').dragTo(sec.locator('.fw-canvas'), { targetPosition: { x: 40, y: 40 } });
    await expect(sec.locator('.fw-el-icon')).toHaveCount(1);
    await page.locator('.cv-rail button[aria-label="Texto"]').click();
    await page.locator('.cv-text-tile').filter({ hasText: /^Adicionar título$/ }).click();
    await expect(sec.locator('.fw-el-heading')).toHaveCount(1);
  });

  test('styles the selection from the contextual toolbar', async ({ page }) => {
    await openCanvas(page);
    await page.locator('.cv-rail button[aria-label="Elementos"]').click();
    await page.locator('.cv-chip', { hasText: 'Em branco' }).click();
    await page.locator('.cv-rail button[aria-label="Texto"]').click();
    await page.locator('.cv-text-tile').filter({ hasText: /^Adicionar título$/ }).click();
    await expect(page.locator('.cv-tb-label')).toHaveText('Título');
    await page.locator('.cv-swatch-btn').first().click();
    await page.locator('.cv-swatch-pop button[title="Destaque"]').click();
    await page.getByRole('button', { name: 'Caixa alta' }).click();
    await page.getByRole('button', { name: 'Título principal da página (h1)' }).click();
    await waitForSave(page, (p) => { const h = findEl(p, 'heading'); return h.color === 'accent' && h.upper === true && h.level === 1; });
  });

  test('switching back to the Studio keeps the free-form sections', async ({ page }) => {
    await openCanvas(page);
    await page.locator('.cv-rail button[aria-label="Templates"]').click();
    await tpl(page, 'Natureza / Eco').click();
    await page.getByRole('tab', { name: /Studio/ }).click();
    await expect(page.locator('.studio-body')).toBeVisible();
    await expect(page.locator('.fw-canvas').first()).toBeVisible();
    await page.getByRole('button', { name: /Gerar prompt/ }).click();
    await expect(page.locator('.prompt-preview pre')).toContainText('Composição (grade livre)');
  });

  test('applies the game-inspired templates', async ({ page }) => {
    const errors = await openCanvas(page);
    await page.locator('.cv-rail button[aria-label="Templates"]').click();
    for (const [name, project, font] of [['Neon Mercenário', 'CROMO//CLÍNICA', 'Chakra Petch'], ['Expedição Carmesim', 'LINHA 12', 'Oswald'], ['Biblioteca dos Dez Andares', 'Biblioteca dos Dez Andares', 'Marcellus']]) {
      await tpl(page, name).click();
      await expect(page.locator('.project-name').first()).toHaveValue(project);
      await waitForSave(page, (p) => p.theme.fontHeading === font && canvasSections(p).length >= 4);
    }
    expect(errors).toEqual([]);
  });
});
