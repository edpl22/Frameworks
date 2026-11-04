import { expect, type Page } from '@playwright/test';

/** 1×1 PNG, enough to exercise the upload pipeline. */
export const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

export async function openStudio(page: Page) {
  // Fail on any uncaught error or console error during the test.
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/fonts\.(googleapis|gstatic)/.test(m.text())) errors.push(m.text()); });
  await page.goto('/#/studio');
  await expect(page.locator('.studio')).toBeVisible();
  await expect(page.locator('.fw-site > .cs').first()).toBeVisible();
  return errors;
}

export const stored = (page: Page) => page.evaluate(() => JSON.parse(localStorage.getItem('fw.project.v1') ?? 'null'));

/** Autosave is debounced; wait until the stored project matches. */
export async function waitForSave(page: Page, check: (p: any) => boolean) {
  await expect.poll(async () => {
    const p = await stored(page);
    try { return !!p && check(p); } catch { return false; }
  }, { timeout: 5000 }).toBe(true);
}
