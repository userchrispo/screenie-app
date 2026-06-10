import type { Page } from '@playwright/test';

export async function resetStorage(page: Page): Promise<void> {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('screenie-local'));
  await page.reload();
}
