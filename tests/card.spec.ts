import { test, expect } from '@playwright/test';

const card = { schemaVersion: 1, id: 'qa-ranking', variant: 'ranking', title: 'QA 耳機', image: { src: '/missing-qa.svg', alt: 'QA 耳機圖片' }, price: 9500, originalPrice: 9500, badges: [] };

test.beforeEach(async ({ page }) => {
  // Stable successful image fixture: product artwork is supplied separately.
  // Missing-image behavior must use an explicit failing route in its own test.
  await page.route('**/*.svg', (route) => route.fulfill({
    status: 200,
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" fill="#ddd"/></svg>',
  }));
  await page.goto('/');
  await page.waitForFunction(() => !!customElements.get('momo-card'));
});

test('ranking preview preserves equal original price as a struck-through amount', async ({ page }) => {
  const preview = page.locator('momo-card#preview');
  await expect(preview).toContainText('BOSE');
  await expect(preview).toContainText('9,500');
  const struck = await preview.evaluate((host) => Array.from(host.shadowRoot!.querySelectorAll('*')).some((el) => el.textContent?.includes('9,500') && getComputedStyle(el).textDecorationLine.includes('line-through')));
  expect(struck).toBe(true);
});

test('data is copied, updates render, and clearing data restores catalog selection', async ({ page }) => {
  await page.evaluate(async (data) => {
    const entry = '/src/index.ts';
    const api = await import(/* @vite-ignore */ entry);
    api.configureCatalog([{ ...data, id: 'catalog-qa', title: 'Catalog selection' }]);
    const el = document.querySelector('#preview') as HTMLElement & { data: unknown };
    el.setAttribute('product-id', 'catalog-qa');
    el.data = data;
    data.title = 'Mutation should not leak';
  }, structuredClone(card));
  await expect(page.locator('#preview')).toContainText('QA 耳機');
  await expect(page.locator('#preview')).not.toContainText('Mutation should not leak');
  await page.evaluate(() => { (document.querySelector('#preview') as HTMLElement & { data: unknown }).data = null; });
  await expect(page.locator('#preview')).toContainText('Catalog selection');
  await page.locator('#preview').evaluate((el) => el.setAttribute('product-id', 'missing-catalog-id'));
  await expect(page.locator('#preview')).not.toContainText('Catalog selection');
  await expect(page.locator('#preview')).not.toHaveText('');
});

test('attribute variant override uses the registry and removal restores data variant', async ({ page }) => {
  await page.evaluate(async (data) => {
    const entry = '/src/index.ts';
    const api = await import(/* @vite-ignore */ entry);
    api.registerVariant({ id: 'qa-test', label: 'QA', render: () => { const node = document.createElement('p'); node.textContent = 'QA plugin renderer'; return node; } });
    const el = document.querySelector('#preview') as HTMLElement & { data: unknown };
    el.data = data;
    el.setAttribute('variant', 'qa-test');
  }, card);
  await expect(page.locator('#preview')).toContainText('QA plugin renderer');
  await page.locator('#preview').evaluate((el) => el.removeAttribute('variant'));
  await expect(page.locator('#preview')).toContainText('QA 耳機');
});

test('untrusted title renders as text, never executable markup', async ({ page }) => {
  const title = '<img src=x onerror="window.__qaXss=1">';
  await page.evaluate((data) => { (document.querySelector('#preview') as HTMLElement & { data: unknown }).data = data; }, { ...card, title });
  await expect(page.locator('#preview')).toContainText(title);
  expect(await page.evaluate(() => (window as unknown as { __qaXss?: number }).__qaXss)).toBeUndefined();
});

test('host selectors do not alter internal rendering or leak card styles outside', async ({ page }) => {
  await page.evaluate(() => { const p = document.createElement('p'); p.id = 'outside-probe'; p.textContent = 'Host text'; document.body.append(p); });
  const before = await page.locator('#preview').evaluate((el) => { const img = el.shadowRoot!.querySelector('img')!; return { width: getComputedStyle(img).width, display: getComputedStyle(img).display }; });
  await page.addStyleTag({ content: 'p { color: rgb(1, 2, 3) !important; } img { width: 1px !important; display: none !important; } button { font-size: 99px !important; }' });
  const after = await page.locator('#preview').evaluate((el) => { const img = el.shadowRoot!.querySelector('img')!; return { width: getComputedStyle(img).width, display: getComputedStyle(img).display }; });
  expect(after).toEqual(before);
  await expect(page.locator('#outside-probe')).toHaveCSS('color', 'rgb(1, 2, 3)');
});

test('mount updates its own card, reconnect emits once, destroy preserves siblings', async ({ page }) => {
  await page.evaluate(async (data) => {
    const entry = '/src/index.ts';
    const api = await import(/* @vite-ignore */ entry);
    const box = document.createElement('section'); box.id = 'mount-box';
    const sibling = document.createElement('p'); sibling.textContent = 'Keep sibling'; box.append(sibling); document.body.append(box);
    const handle = api.mount(box, { data });
    const state = window as unknown as { qaHandle: typeof handle; qaEvents: unknown[] };
    state.qaHandle = handle; state.qaEvents = [];
    box.addEventListener('momo-card-action', (event) => state.qaEvents.push((event as CustomEvent).detail));
    for (let n = 0; n < 3; n++) { handle.element.remove(); box.append(handle.element); }
    handle.update({ ...data, title: 'Updated mount card' });
  }, card);
  const mounted = page.locator('#mount-box momo-card');
  await expect(mounted).toContainText('Updated mount card');
  await mounted.getByRole('button').first().click();
  const events = await page.evaluate(() => (window as unknown as { qaEvents: unknown[] }).qaEvents);
  expect(events).toEqual([{ id: card.id, action: 'select' }]);
  const result = await page.evaluate((data) => {
    const handle = (window as unknown as { qaHandle: { destroy(): void; update(data: unknown): void } }).qaHandle;
    handle.destroy(); handle.destroy();
    try { handle.update(data); return false; } catch { return true; }
  }, card);
  expect(result).toBe(true);
  await expect(page.locator('#mount-box momo-card')).toHaveCount(0);
  await expect(page.locator('#mount-box')).toContainText('Keep sibling');
});

test('keyboard can activate the card without a product URL', async ({ page }) => {
  await page.evaluate((data) => { (document.querySelector('#preview') as HTMLElement & { data: unknown }).data = data; }, card);
  const action = page.locator('#preview').getByRole('button').first();
  await expect(action).toHaveAccessibleName(/.+/);
  await action.focus();
  await expect(action).toBeFocused();
  await action.press('Enter');
});
