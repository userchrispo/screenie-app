const isVitest = Boolean(process.env.VITEST);

if (isVitest) {
  const { describe, it } = await import('vitest');

  describe.skip('Screenie foundation e2e', () => {
    it('runs in Playwright, not Vitest', () => undefined);
  });
} else {
  const { expect, test } = await import('@playwright/test');
  const { resetStorage } = await import('./helpers/resetStorage');

  test.describe('Screenie foundation', () => {
    test.beforeEach(async ({ page }) => {
      await resetStorage(page);
    });

    test('loads the app shell without console errors', async ({ page }) => {
      const consoleErrors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') {
          consoleErrors.push(message.text());
        }
      });

      await expect(page.getByRole('main', { name: /screenie app/i })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Inbox', exact: true })).toBeVisible();
      await expect(page.getByRole('heading', { name: /capture anything/i })).toBeVisible();
      expect(consoleErrors).toEqual([]);
    });
  });
}
