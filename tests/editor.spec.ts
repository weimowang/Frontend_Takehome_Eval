import { test, expect } from '@playwright/test';
const key = 'merchant-card-showroom:v1';
test.beforeEach(async ({ page }) => {
  await page.route('**/*.svg', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"/>' }));
  await page.goto('/');
});

test('valid editor input updates and survives a reload; invalid input cannot overwrite it', async ({ page }) => {
  await page.locator('#field-title').fill('QA persisted title');
  await page.locator('#field-price').fill('149');
  await expect.poll(() => page.evaluate((k) => JSON.parse(localStorage.getItem(k)!).cards.some((c: { title: string; price: number }) => c.title === 'QA persisted title' && c.price === 149), key)).toBe(true);
  const saved = await page.evaluate((k) => localStorage.getItem(k), key);
  await page.locator('#field-price').fill('-1');
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe(saved);
  await page.reload();
  await expect(page.locator('#field-title')).toHaveValue('QA persisted title');
  await expect(page.locator('#field-price')).toHaveValue('149');
});

test('same-origin second page receives accepted edits without reload', async ({ page, context }) => {
  const second = await context.newPage(); await second.goto('/');
  await page.locator('#field-title').fill('QA cross-tab title');
  await expect(second.locator('#field-title')).toHaveValue('QA cross-tab title');
  await second.close();
});

test('reset restores defaults and preserves unrelated storage', async ({ page }) => {
  const original = await page.locator('#field-title').inputValue();
  await page.evaluate(() => localStorage.setItem('other-project', 'keep'));
  await page.locator('#field-title').fill('Before reset');
  page.on('dialog', (dialog) => dialog.accept());
  await page.locator('#reset').click();
  await expect(page.locator('#field-title')).toHaveValue(original);
  expect(await page.evaluate(() => localStorage.getItem('other-project'))).toBe('keep');
});

test('corrupted storage degrades to editable defaults and warns rather than overwriting', async ({ page }) => {
  await page.evaluate((k) => localStorage.setItem(k, '{broken'), key); await page.reload();
  await expect(page.locator('#field-title')).not.toHaveValue('');
  expect(await page.evaluate((k) => localStorage.getItem(k), key)).toBe('{broken');
  await expect(page.locator('body')).toContainText(/損壞|無效|讀取失敗|無法讀取|錯誤/);
});

test('clearing optional original price removes it rather than saving zero', async ({ page }) => {
  const id = await page.locator('#product').inputValue();
  await page.locator('#field-originalPrice').fill('');
  await expect.poll(() => page.evaluate(({ k, id }) => {
    const card = JSON.parse(localStorage.getItem(k)!).cards.find((c: { id: string }) => c.id === id);
    return Object.hasOwn(card, 'originalPrice');
  }, { k: key, id })).toBe(false);
  await page.reload();
  await expect(page.locator('#field-originalPrice')).toHaveValue('');
});

test('changing variant moves the selected card between lists and persists it', async ({ page }) => {
  const id = await page.locator('#product').inputValue();
  const beforeFlash = await page.locator('#flash-grid momo-card').count();
  const beforeRanking = await page.locator('#ranking-grid momo-card').count();
  await page.locator('#field-variant').selectOption('flash-sale');
  await expect(page.locator('#flash-grid momo-card')).toHaveCount(beforeFlash + 1);
  await expect(page.locator('#ranking-grid momo-card')).toHaveCount(beforeRanking - 1);
  await expect.poll(() => page.evaluate(({ k, id }) => JSON.parse(localStorage.getItem(k)!).cards.find((c: { id: string }) => c.id === id).variant, { k: key, id })).toBe('flash-sale');
  await page.reload();
  await expect(page.locator('#field-variant')).toHaveValue('flash-sale');
  await expect(page.locator('#flash-grid momo-card')).toHaveCount(beforeFlash + 1);
});

test('switching with an invalid draft requires cancel or explicit discard', async ({ page }) => {
  const originalId = await page.locator('#product').inputValue();
  const alternativeId = await page.locator('#product option').evaluateAll((options, current) => (options as HTMLOptionElement[]).find((option) => option.value !== current)!.value, originalId);
  await page.locator('#field-price').fill('-1');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.locator('#product').selectOption(alternativeId);
  await expect(page.locator('#product')).toHaveValue(originalId);
  await expect(page.locator('#field-price')).toHaveValue('-1');
  page.once('dialog', (dialog) => dialog.accept());
  await page.locator('#product').selectOption(alternativeId);
  await expect(page.locator('#product')).toHaveValue(alternativeId);
  await expect(page.locator('#field-price')).not.toHaveValue('-1');
  await page.locator('#product').selectOption(originalId);
  await expect(page.locator('#field-price')).not.toHaveValue('-1');
});
