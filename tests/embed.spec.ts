import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.route('**/*.svg', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"/>' }));
});

test('declarative sample loads the built library independently', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  const library = page.waitForResponse((response) => response.url().endsWith('/dist/momo-cards.es.js') && response.ok());
  await page.goto('/sample.html'); await library;
  await expect(page.locator('momo-card').first()).not.toHaveText('');
  expect(errors).toEqual([]);
});

test('imperative sample supports update and destroy', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message));
  const library = page.waitForResponse((response) => response.url().endsWith('/dist/momo-cards.es.js') && response.ok());
  await page.goto('/sample-mount.html'); await library;
  await expect(page.locator('momo-card')).toContainText('示範耳機');
  await page.locator('#sample-update').click();
  await expect(page.locator('momo-card')).toContainText('更新後的示範耳機');
  await page.locator('#sample-destroy').click();
  await expect(page.locator('momo-card')).toHaveCount(0);
  expect(errors).toEqual([]);
});
