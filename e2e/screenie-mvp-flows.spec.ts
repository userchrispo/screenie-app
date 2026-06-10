const isVitest = Boolean(process.env.VITEST);

if (isVitest) {
  const { describe, it } = await import('vitest');

  describe.skip('Screenie MVP flows e2e', () => {
    it('runs in Playwright after the MVP UI lands', () => undefined);
  });
} else {
  const { expect, test } = await import('@playwright/test');

  test.describe.skip('Screenie MVP flows - blocked on UI implementation', () => {
    test('saves a link from the Inbox capture action and persists after reload', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /paste link/i }).click();
      await page.getByLabel(/url/i).fill('https://screenie.app/pricing');
      await page.getByRole('button', { name: /^save$/i }).click();
      await expect(page.getByText(/our pricing plans/i)).toBeVisible();
      await page.reload();
      await expect(page.getByText(/our pricing plans/i)).toBeVisible();
    });

    test('saves a snippet from the Inbox capture action and makes it searchable', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('button', { name: /save snippet/i }).click();
      await page.getByLabel(/snippet/i).fill('Pro plan includes advanced analytics and priority support.');
      await page.getByRole('button', { name: /^save$/i }).click();
      await page.getByRole('searchbox', { name: /search saved items/i }).fill('advanced analytics');
      await expect(page.getByText(/pro plan includes advanced analytics/i)).toBeVisible();
    });

    test('finds seeded pricing results and supports sorting', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('searchbox', { name: /search saved items/i }).fill('that pricing screenshot from last week');
      await expect(page.getByText(/3 results found/i)).toBeVisible();
      await expect(page.getByText(/pricing screenshot/i)).toBeVisible();
      await page.getByLabel(/sort by/i).selectOption('newest');
      await expect(page.getByText(/pricing screenshot/i)).toBeVisible();
    });

    test('filters saved items from sidebar navigation', async ({ page }) => {
      await page.goto('/');
      await page.getByRole('link', { name: /favorites/i }).click();
      await expect(page.getByRole('heading', { name: /favorites/i })).toBeVisible();
      await page.getByRole('link', { name: /trash/i }).click();
      await expect(page.getByRole('heading', { name: /trash/i })).toBeVisible();
    });
  });
}
