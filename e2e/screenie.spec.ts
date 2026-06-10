import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('screenie-local'));
  await page.reload();
});

test('saves a link and finds it locally', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Inbox', exact: true })).toBeVisible();

  await page.getByLabel('Paste link').fill('screenie.app/pricing');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await expect(page.getByText('Link saved.')).toBeVisible();

  await page.getByRole('button', { name: 'Find' }).click();
  await page.getByLabel('Search everything in Screenie').fill('screenie pricing');

  await expect(page.getByRole('heading', { name: 'screenie.app' })).toBeVisible();
  await expect(page.getByText('https://screenie.app/pricing').first()).toBeVisible();
});

test('saves a snippet and keeps it after reload', async ({ page }) => {
  await page.getByLabel('Save snippet').fill('Customer research says pricing needs clearer screenshots.');
  await page.getByRole('button', { name: 'Save text' }).click();
  await expect(page.getByText('Snippet saved.')).toBeVisible();

  await page.reload();
  await page.getByRole('button', { name: 'Find' }).click();
  await page.getByLabel('Search everything in Screenie').fill('customer research');

  await expect(page.getByRole('heading', { name: 'Customer research says pricing needs' })).toBeVisible();
});

test('moves an item to trash and shows it in the trash view', async ({ page }) => {
  await page.getByRole('button', { name: 'Find' }).click();
  await page.getByLabel('Search everything in Screenie').fill('pricing pro plan');
  await expect(page.getByRole('heading', { name: 'Pricing screenshot' })).toBeVisible();

  await page.getByRole('button', { name: 'Move Pricing screenshot to trash' }).click();
  await page.getByRole('button', { name: /Trash/ }).click();

  await expect(page.getByRole('heading', { name: 'Pricing screenshot' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Restore Pricing screenshot' })).toBeVisible();
});
