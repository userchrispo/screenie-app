import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('screenie-local'));
  await page.reload();
});

test('toggles favorite from a saved card', async ({ page }) => {
  await page.getByRole('button', { name: 'Find' }).click();
  await page.getByLabel('Search everything in Screenie').fill('Our Pricing Plans');
  await expect(page.getByRole('heading', { name: 'Our Pricing Plans - Screenie' })).toBeVisible();

  await page.getByRole('button', { name: 'Favorite Our Pricing Plans - Screenie', exact: true }).click();
  await page.getByRole('button', { name: /Favorites/ }).click();
  await expect(page.getByRole('heading', { name: 'Our Pricing Plans - Screenie' })).toBeVisible();
});

test('opens settings as a routed page from the top bar', async ({ page }) => {
  await page.getByLabel('Settings', { exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
  await expect(page.getByText('Keyboard shortcuts')).toBeVisible();
  await expect(page.getByRole('dialog', { name: 'Settings' })).not.toBeVisible();
});

test('navigates to integrations and templates workspace pages', async ({ page }) => {
  await page.getByRole('button', { name: 'Integrations' }).click();
  await expect(page.getByRole('heading', { name: 'Integrations', level: 1 })).toBeVisible();
  await expect(page.getByText('Local storage')).toBeVisible();

  await page.getByRole('button', { name: 'Templates' }).click();
  await expect(page.getByRole('heading', { name: 'Templates', level: 1 })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Use template' }).first()).toBeVisible();
});

test('focuses find search with control+k', async ({ page }) => {
  const shortcut = process.platform === 'darwin' ? 'Meta+K' : 'Control+K';
  await page.getByRole('main', { name: /screenie app/i }).click();
  await page.keyboard.press(shortcut);
  const findSearch = page.getByLabel('Search everything in Screenie');
  await expect(findSearch).toBeVisible();
  await expect(findSearch).toBeFocused();
});

test('filters tags from the tags view', async ({ page }) => {
  await page.getByRole('button', { name: /Tags/ }).click();
  await page.locator('.tag-browser button').filter({ hasText: 'pricing' }).first().click();
  await expect(page.locator('.saved-view__meta')).toContainText('tagged pricing');
});

test('deletes an item permanently from trash', async ({ page }) => {
  await page.getByRole('button', { name: 'Find' }).click();
  await page.getByLabel('Search everything in Screenie').fill('onboarding');
  await page.getByRole('button', { name: 'Move User onboarding flow to trash', exact: true }).click();

  await page.getByRole('button', { name: /Trash/ }).click();
  await page.getByRole('button', { name: /Delete User onboarding flow permanently/i }).click();
  await page
    .getByRole('dialog', { name: 'Delete permanently' })
    .getByRole('button', { name: 'Delete permanently' })
    .click();

  await expect(page.getByRole('heading', { name: 'User onboarding flow' })).not.toBeVisible();
});

test('uploads an image and finds it in search', async ({ page }) => {
  await page.getByRole('button', { name: /Drop screenshot/i }).click();

  const fileInput = page.locator('#image-input');
  await fileInput.setInputFiles({
    name: 'pricing-screen.png',
    mimeType: 'image/png',
    buffer: Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      'base64'
    )
  });

  await expect(page.getByLabel('Images ready to save')).toContainText('pricing-screen.png');
  await expect(page.getByRole('region', { name: 'Capture saved content' }).getByRole('status')).toHaveText(
    '1 image ready to review.'
  );
  await page.getByRole('button', { name: 'Save image' }).click();
  await expect(page.getByText('1 image saved. OCR queued.')).toBeVisible();

  await page.getByRole('button', { name: 'Find' }).click();
  await page.getByLabel('Search everything in Screenie').fill('pricing-screen');
  await expect(page.getByRole('heading', { name: 'pricing-screen' })).toBeVisible();
});

test('clear all data keeps the workspace empty after reload', async ({ page }) => {
  await page.getByLabel('Settings', { exact: true }).click();
  await page.getByRole('button', { name: 'Clear all data' }).click();
  await expect(page.getByRole('dialog', { name: 'Clear all data' })).toBeVisible();
  await page
    .getByRole('dialog', { name: 'Clear all data' })
    .getByRole('button', { name: 'Clear all data' })
    .click();
  await expect(page.getByRole('status')).toHaveText('Local workspace cleared.');

  await page.reload();

  await expect(page.getByRole('heading', { name: 'Inbox', level: 1 })).toBeVisible();
  await expect(page.getByText('Save your first link, screenshot, or snippet above.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'User onboarding flow' })).not.toBeVisible();
});

test('malformed link capture shows validation without console errors', async ({ page }) => {
  const errors: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error') {
      errors.push(message.text());
    }
  });

  await page.getByRole('button', { name: /Paste link/i }).click();
  await page.getByLabel('Paste link').fill('not a real url');
  await page.getByRole('button', { name: 'Save', exact: true }).click();

  await expect(page.getByRole('region', { name: 'Capture saved content' }).getByRole('status')).toHaveText(
    'Enter a valid URL.'
  );
  expect(errors).toEqual([]);
});

for (const width of [320, 390]) {
  test(`mobile navigation keeps items within viewport at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.reload();

    for (const name of ['Inbox', 'Find', 'Library', 'Favorites', 'Tags', 'Trash', 'Integrations', 'Templates', 'Settings']) {
      const box = await page.getByRole('button', { name: new RegExp(name) }).boundingBox();
      expect(box, `${name} should be visible`).not.toBeNull();
      expect(box!.x, `${name} should not clip left`).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, `${name} should not clip right`).toBeLessThanOrEqual(width);
    }
  });
}
