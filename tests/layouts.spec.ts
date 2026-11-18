import { test, expect, type Page } from '@playwright/test';

const flash = { schemaVersion: 1, id: 'qa-flash', variant: 'flash-sale', title: 'QA 限時商品', image: { src: '/qa-flash.svg', alt: 'QA 商品圖片' }, price: 149, originalPrice: 300, stock: 188, badges: [] };

test.beforeEach(async ({ page }) => {
  await page.route('**/*.svg', (route) => route.fulfill({ status: 200, contentType: 'image/svg+xml', body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120"><rect width="120" height="120" fill="#ddd"/></svg>' }));
  await page.goto('/');
  await page.waitForFunction(() => !!customElements.get('momo-card'));
});

async function mountFlash(page: Page, data: object) {
  await page.evaluate(async (card) => {
    const entry = '/src/index.ts';
    const api = await import(/* @vite-ignore */ entry);
    const box = document.createElement('section'); box.id = 'qa-flash-box'; document.body.append(box);
    api.mount(box, { data: card });
  }, data);
  return page.locator('#qa-flash-box momo-card');
}

test('showroom displays five flash cards and three ranking cards with a separate preview', async ({ page }) => {
  await expect(page.getByRole('heading', { name: '限時搶購', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: '今日暢銷榜', exact: true })).toBeVisible();
  await expect(page.locator('#flash-grid momo-card')).toHaveCount(5);
  await expect(page.locator('#ranking-grid momo-card')).toHaveCount(3);
  await expect(page.locator('momo-card#preview')).toContainText('BOSE');
});

test('flash card shows price, original price and stock, and purchase emits only once', async ({ page }) => {
  const mounted = await mountFlash(page, flash);
  await expect(mounted).toContainText('149');
  await expect(mounted).toContainText('300');
  await expect(mounted).toContainText('188');
  expect(await mounted.evaluate((host) => Array.from(host.shadowRoot!.querySelectorAll('*')).some((el) => el.textContent?.includes('300') && getComputedStyle(el).textDecorationLine.includes('line-through')))).toBe(true);
  await page.evaluate(() => {
    const state = window as unknown as { qaPurchases: unknown[] }; state.qaPurchases = [];
    document.addEventListener('momo-card-action', (event) => { const detail = (event as CustomEvent).detail; if (detail.action === 'purchase') state.qaPurchases.push(detail); });
  });
  await mounted.getByRole('button', { name: /搶|購買/ }).click();
  expect(await page.evaluate(() => (window as unknown as { qaPurchases: unknown[] }).qaPurchases)).toEqual([{ id: flash.id, action: 'purchase' }]);
  await expect(page.getByRole('status')).toContainText(/示範|demo/i);
  await expect(page).toHaveURL(/\/$/);
});

test('zero stock disables purchase, absent stock hides the inventory label', async ({ page }) => {
  const mounted = await mountFlash(page, { ...flash, stock: 0 });
  await expect(mounted).toContainText('售完');
  await expect(mounted.getByRole('button', { name: /售完|搶|購買/ })).toBeDisabled();
  const { stock: _stock, ...withoutStock } = flash;
  await mounted.evaluate((el, data) => { (el as HTMLElement & { data: unknown }).data = data; }, withoutStock);
  await expect(mounted).not.toContainText(/最後|剩餘|售完/);
  await expect(mounted.getByRole('button', { name: /搶|購買/ })).toBeEnabled();
});

test('absent video URL has no playback action and equal original price remains struck through', async ({ page }) => {
  const mounted = await mountFlash(page, { ...flash, originalPrice: 149 });
  await expect(mounted.getByRole('button', { name: /播放|play/i })).toHaveCount(0);
  expect(await mounted.evaluate((host) => Array.from(host.shadowRoot!.querySelectorAll('*')).some((el) => el.textContent?.includes('149') && getComputedStyle(el).textDecorationLine.includes('line-through')))).toBe(true);
});
