import { test, expect } from '@playwright/test';
import JSZip from 'jszip';
import { openStudio, PNG_1PX, stored, waitForSave } from './helpers';

test.describe('landing', () => {
  test('renders the live demo and opens the studio', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Desenhe sites');
    await expect(page.locator('.lp-shot-site .fw-site')).toBeVisible({ timeout: 15_000 });
    await page.getByRole('link', { name: /Abrir Studio/ }).first().click();
    await expect(page.locator('.studio')).toBeVisible();
    expect(new URL(page.url()).hash).toBe('#studio');
    // the legacy route still works
    await page.goto('/#/studio');
    await expect(page.locator('.studio')).toBeVisible();
  });
});

test.describe('studio', () => {
  test('edits text inline and undoes it', async ({ page }) => {
    const errors = await openStudio(page);
    const title = page.locator('.cs h1.fw-h1').first();
    const original = await title.innerText();
    await title.click();
    await page.keyboard.press('ControlOrMeta+a');
    await page.keyboard.type('Título *editado* no canvas');
    await page.keyboard.press('Enter');
    await expect(title.locator('em')).toHaveText('editado');
    await waitForSave(page, (p) => p.pages[0].sections[1].props.title === 'Título *editado* no canvas');
    await page.locator('.canvas-wrap').click({ position: { x: 5, y: 5 } });
    await page.keyboard.press('ControlOrMeta+z');
    await expect(title).toHaveText(original);
    expect(errors).toEqual([]);
  });

  test('adds sections by click and by drag-and-drop', async ({ page }) => {
    await openStudio(page);
    const sections = page.locator('.fw-site > .cs');
    const before = await sections.count();
    await page.locator('.lib-item', { hasText: 'FAQ' }).click();
    await expect(sections).toHaveCount(before + 1);
    // new sections land before the footer
    await expect(sections.last().locator('footer')).toHaveCount(1);
    await page.locator('.lib-item', { hasText: 'Galeria' }).dragTo(sections.nth(2));
    await expect(sections).toHaveCount(before + 2);
    await expect(sections.nth(2).locator('.fw-gallery')).toHaveCount(1);
  });

  test('applies a template from the gallery', async ({ page }) => {
    await openStudio(page);
    await page.getByRole('button', { name: 'Templates' }).click();
    await page.locator('.tpl-cat', { hasText: 'Negócios locais' }).click();
    await expect(page.locator('.tpl')).toHaveCount(3);
    await page.locator('.tpl', { hasText: 'Restaurante' }).click();
    await expect(page.locator('.project-name').first()).toHaveValue('Casa Brasa');
    await page.locator('.rail button[aria-label="Páginas"]').click();
    await expect(page.locator('.page-item')).toHaveCount(2);
  });

  test('switches device preview', async ({ page }) => {
    await openStudio(page);
    await page.locator('.seg button[title^="Mobile"]').click();
    await expect(page.locator('.device.mobile')).toBeVisible();
    await expect(page.locator('.fw-burger').first()).toBeVisible();
    await expect(page.locator('.fw-nav-links').first()).toBeHidden();
  });

  test('full preview shows the page at full width', async ({ page }) => {
    await openStudio(page);
    await page.getByRole('button', { name: 'Preview' }).click();
    await expect(page.locator('.rpanel')).toBeHidden();
    const wrap = (await page.locator('.canvas-wrap').boundingBox())!;
    expect(wrap.width).toBeGreaterThan(800);
    await expect(page.locator('.canvas-stage h1').first()).toBeInViewport();
  });

  test('generates a prompt with the project context', async ({ page }) => {
    await openStudio(page);
    await page.getByRole('button', { name: /Gerar prompt/ }).click();
    const preview = page.locator('.prompt-preview pre');
    await expect(preview).toContainText('# Projeto: Aurora');
    await expect(preview).toContainText('Critérios de aceite');
    await page.getByRole('radio', { name: 'English' }).click();
    await expect(preview).toContainText('Acceptance criteria');
  });

  test('imports Figma tokens from the sample file', async ({ page }) => {
    await openStudio(page);
    await page.locator('.panel-tabs button', { hasText: 'Design' }).click();
    await page.locator('.figma-cta').click();
    await page.getByRole('button', { name: /Usar exemplo/ }).click();
    await expect(page.locator('.fi-head .badge')).toHaveText('Tokens Studio for Figma');
    await page.locator('.fi-head select').selectOption('dark');
    await page.getByRole('button', { name: /Aplicar ao design system/ }).click();
    await expect(page.locator('.figma-cta')).toContainText('Tokens do Figma conectados');
    await waitForSave(page, (p) => p.theme.fontHeading === 'Space Grotesk' && p.theme.mode === 'dark' && !!p.figma);
  });

  test('uploads an image into a section and keeps it after reload', async ({ page }) => {
    await openStudio(page);
    const slot = page.locator('.cs .fw-split .fw-media').first();
    await slot.scrollIntoViewIfNeeded();
    await slot.locator('input[type=file]').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG_1PX });
    await expect(slot.locator('img')).toHaveAttribute('src', /^blob:/);
    await waitForSave(page, (p) => String(p.pages[0].sections.find((s: any) => s.type === 'content').props.image).startsWith('asset:'));
    await page.reload();
    await expect(page.locator('.cs .fw-split .fw-media img').first()).toHaveAttribute('src', /^blob:/);
    await page.locator('.rail button[aria-label="Mídia"]').click();
    await expect(page.locator('.media-item')).toHaveCount(1);
    await expect(page.locator('.media-used')).toHaveCount(1);
  });

  test('exports a ZIP with pages, prompt, tokens and uploaded images', async ({ page }) => {
    await openStudio(page);
    const slot = page.locator('.cs .fw-split .fw-media').first();
    await slot.locator('input[type=file]').setInputFiles({ name: 'foto.png', mimeType: 'image/png', buffer: PNG_1PX });
    await expect(slot.locator('img')).toBeVisible();
    await page.getByRole('button', { name: 'Exportar' }).click();
    const [download] = await Promise.all([page.waitForEvent('download'), page.locator('.export-card.featured').click()]);
    const zip = await JSZip.loadAsync(await (await download.createReadStream()).toArray().then((c) => Buffer.concat(c)));
    const names = Object.keys(zip.files);
    for (const f of ['index.html', 'assets/site.css', 'CLAUDE_PROMPT.md', 'design/tokens.json', 'project.fwstudio']) expect(names).toContain(f);
    expect(names.some((n) => /^assets\/img\/.+\.(webp|png)$/.test(n))).toBe(true);
    const html = await zip.file('index.html')!.async('string');
    expect(html).toContain('./assets/img/');
    expect(html).not.toContain('asset:');
    const project = JSON.parse(await zip.file('project.fwstudio')!.async('string'));
    expect(Object.keys(project.$assetData)).toHaveLength(1);
    const p = await stored(page);
    expect(Object.keys(p.assets)).toHaveLength(1);
  });

  test('command palette runs actions', async ({ page }) => {
    await openStudio(page);
    await page.keyboard.press('ControlOrMeta+k');
    await page.locator('.cmdk-input input').fill('preset neo');
    await expect(page.locator('.cmdk-item.on')).toContainText('Neo-brutal');
    await page.keyboard.press('Enter');
    await waitForSave(page, (p) => p.theme.fontHeading === 'Archivo Black');
  });

  test('quality panel flags issues and fixes them in one click', async ({ page }) => {
    await openStudio(page);
    // break the SEO title of the page through the Pages panel
    await page.locator('.rail button[aria-label="Páginas"]').click();
    await page.locator('.field', { hasText: 'SEO title' }).locator('input').fill('');
    await page.locator('.rail button[aria-label="Qualidade"]').click();
    const issue = page.locator('.audit-item.error', { hasText: 'sem título de SEO' });
    await expect(issue).toBeVisible();
    await expect(page.locator('.rail-badge.err')).toBeVisible();
    await issue.getByRole('button', { name: /Preencher/ }).click();
    await expect(issue).toHaveCount(0);
    await waitForSave(page, (p) => p.pages[0].seoTitle.includes('Aurora'));
  });

  test('custom block takes a free-form spec that reaches the prompt', async ({ page }) => {
    await openStudio(page);
    await page.locator('.lib-item', { hasText: 'Bloco personalizado' }).click();
    const block = page.locator('.cs.sel');
    await expect(block.locator('.fw-spec-note')).toBeVisible();
    await page.locator('.rpanel .field', { hasText: 'O que este bloco deve ser?' }).locator('textarea').fill('Calculadora de economia com slider');
    await expect(block.locator('.fw-spec-note')).toContainText('Calculadora de economia com slider');
    await page.getByRole('button', { name: /Gerar prompt/ }).click();
    await expect(page.locator('.prompt-preview pre')).toContainText('construa exatamente isto: Calculadora de economia com slider');
  });
});

