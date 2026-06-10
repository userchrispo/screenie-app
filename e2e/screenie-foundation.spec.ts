const isVitest = Boolean(process.env.VITEST);

if (isVitest) {
  const { describe, it } = await import('vitest');

  describe.skip('Screenie foundation e2e', () => {
    it('runs in Playwright, not Vitest', () => undefined);
  });
} else {
  const { expect, test } = await import('@playwright/test');

  test.describe('Screenie foundation', () => {
    test('loads the app shell without console errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });

      await page.goto('/');

      await expect(page.getByRole('main', { name: /screenie app/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: /your saved content/i })).toBeVisible();
      await expect(page.getByText(/local-first app foundation is ready/i)).toBeVisible();
      expect(consoleErrors).toEqual([]);
    });
  });
}
