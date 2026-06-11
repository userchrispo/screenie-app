const isVitest = Boolean(process.env.VITEST);

if (isVitest) {
  const { describe, it } = await import('vitest');

  describe.skip('Screenie MVP flows e2e', () => {
    it('runs in Playwright, not Vitest', () => undefined);
  });
} else {
  const { expect, test } = await import('@playwright/test');
  const { resetStorage } = await import('./helpers/resetStorage');

  test.describe('Screenie MVP flows - quality gaps', () => {
    test.beforeEach(async ({ page }) => {
      await resetStorage(page);
    });

    test('finds seeded pricing results with result count and supports sorting', async ({ page }) => {
      await page.getByRole('button', { name: 'Find' }).click();
      await page.getByLabel('Search everything in Screenie').fill('pricing pro plan');
      await expect(page.getByText(/\d+ results found/)).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Pricing screenshot' })).toBeVisible();
      await page.getByLabel('Sort by').selectOption('newest');
      await expect(page.getByRole('heading', { name: 'Pricing screenshot' })).toBeVisible();
    });

    test('navigates to Favorites and Trash from the sidebar', async ({ page }) => {
      await page.getByRole('button', { name: /Favorites/ }).click();
      await expect(page.getByRole('heading', { name: 'Favorites', exact: true })).toBeVisible();
      await page.getByRole('button', { name: /Trash/ }).click();
      await expect(page.getByRole('heading', { name: 'Trash', exact: true })).toBeVisible();
    });

    test('routes top-bar search focus to the Find view', async ({ page }) => {
      await page.getByPlaceholder('Search saved items...').click();
      await expect(page.getByLabel('Search everything in Screenie')).toBeFocused();
      await expect(page.getByRole('heading', { name: 'Find', exact: true })).toBeVisible();
    });
  });
}
