import { expect, test, type Page } from '@playwright/test';
import { resetStorage } from './helpers/resetStorage';

async function saveSnippet(page: Page, title: string, text: string) {
  await page.getByRole('button', { name: /Save snippet/i }).click();
  await page.getByLabel('Save snippet').fill(text);
  await page.getByLabel('Title').fill(title);
  await page.getByRole('button', { name: 'Save text' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Snippet saved.' })).toBeVisible();
}

async function searchFor(page: Page, text: string) {
  await page.getByRole('button', { name: 'Find' }).click();
  await page.getByLabel('Search everything in Screenie').fill(text);
}

async function openItemDetail(page: Page, title: string) {
  await page.getByRole('button', { name: `Open ${title}` }).click();
  await expect(page.getByRole('dialog', { name: `${title} details` })).toBeVisible();
}

test.describe('Screenie local beta readiness', () => {
  test('renames and deletes projects without deleting assigned items', async ({ page }) => {
    await resetStorage(page);
    await page.getByRole('button', { name: 'Find' }).click();

    await page.getByLabel('Add project').click();
    await expect(page.getByRole('dialog', { name: 'New project' })).toBeVisible();
    await expect(page.getByLabel('Project name')).toBeFocused();
    await page.getByLabel('Project name').fill('Readiness Project');
    await page.getByRole('button', { name: 'Create project' }).click();

    await page.getByLabel('Add project').click();
    await expect(page.getByRole('dialog', { name: 'New project' })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'New project' })).not.toBeVisible();

    await page.getByLabel('Rename Readiness Project').click();
    await expect(page.getByRole('dialog', { name: 'Rename project' })).toBeVisible();
    await page.getByLabel('Project name').fill('Renamed Readiness');
    await page.getByRole('button', { name: 'Rename project' }).click();
    await expect(page.getByRole('button', { name: 'Renamed Readiness', exact: true })).toBeVisible();

    await page.getByRole('button', { name: 'Inbox' }).click();
    await saveSnippet(page, 'Project survival note', 'This note should survive project deletion.');
    await searchFor(page, 'Project survival note');
    await openItemDetail(page, 'Project survival note');
    await page.getByLabel('Project', { exact: true }).selectOption({ label: 'Renamed Readiness' });
    await page.getByRole('button', { name: 'Save changes' }).click();
    await page.getByRole('button', { name: 'Close item details' }).click();

    await page.getByRole('button', { name: 'Renamed Readiness', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Project survival note' })).toBeVisible();

    await page.getByLabel('Delete Renamed Readiness').click();
    await expect(page.getByRole('dialog', { name: 'Delete project' })).toContainText(
      'Saved items stay in Screenie and move back to Inbox.'
    );
    await page
      .getByRole('dialog', { name: 'Delete project' })
      .getByRole('button', { name: 'Delete project', exact: true })
      .click();

    await expect(page.getByRole('button', { name: 'Renamed Readiness', exact: true })).not.toBeVisible();
    await expect(page.getByRole('heading', { name: 'Project survival note' })).toBeVisible();
  });

  test('edits item details, favorites, trashes, and permanently deletes an item', async ({ page }) => {
    await resetStorage(page);
    await searchFor(page, 'Design inspiration');
    await openItemDetail(page, 'Design inspiration');
    await expect(page.getByRole('button', { name: 'Close item details' })).toBeFocused();

    const detailDialog = page.getByRole('dialog', { name: 'Design inspiration details' });
    await detailDialog.getByRole('textbox', { name: 'Title' }).fill('Design inspiration readiness');
    await detailDialog.getByLabel('Tags (comma separated)').fill('design, readiness');
    await detailDialog.getByRole('button', { name: 'Save changes' }).click();
    await expect(page.getByRole('dialog', { name: 'Design inspiration readiness details' })).toBeVisible();
    await page.getByRole('button', { name: 'Toggle favorite' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: /details/ })).not.toBeVisible();

    await searchFor(page, 'Design inspiration readiness');
    await page.getByRole('button', { name: /Favorites/ }).click();
    await expect(page.getByRole('heading', { name: 'Design inspiration readiness' })).toBeVisible();

    await openItemDetail(page, 'Design inspiration readiness');
    await page.getByRole('button', { name: 'Move to trash' }).click();
    await page.getByRole('button', { name: /Trash/ }).click();
    await openItemDetail(page, 'Design inspiration readiness');
    await page.getByRole('button', { name: 'Delete permanently' }).click();
    await expect(page.getByRole('button', { name: 'Close dialog' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Delete permanently' })).not.toBeVisible();
    await openItemDetail(page, 'Design inspiration readiness');
    await page.getByRole('button', { name: 'Delete permanently' }).click();
    await page.getByRole('dialog', { name: 'Delete permanently' }).getByRole('button', { name: 'Delete permanently' }).click();
    await expect(page.getByRole('heading', { name: 'Design inspiration readiness' })).not.toBeVisible();
  });

  test('handles Settings import errors and supports Escape on data dialogs', async ({ page }) => {
    await resetStorage(page);
    await page.getByLabel('Settings', { exact: true }).click();

    await page.getByRole('button', { name: 'Import archive' }).click();
    await expect(page.getByRole('dialog', { name: 'Import archive' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close data dialog' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Import archive' })).not.toBeVisible();

    await page.getByRole('button', { name: 'Import archive' }).click();
    await page.getByLabel('Choose Screenie archive').setInputFiles({
      name: 'not-a-screenie-export.json',
      mimeType: 'application/json',
      buffer: Buffer.from('not-json')
    });
    await expect(page.getByRole('alert')).toHaveText('Import file must be valid JSON.');
  });

  test('ignores malformed extension drafts and lets users dismiss valid drafts with Escape', async ({ page }) => {
    await resetStorage(page);

    await page.evaluate(() => {
      window.postMessage(
        {
          type: 'screenie.captureDraft.v1',
          draft: { type: 'link', title: 'Incomplete bridge draft' }
        },
        window.location.origin
      );
    });
    await expect(page.getByRole('dialog', { name: 'Review extension capture' })).not.toBeVisible();

    const bridgeMessage = {
      type: 'screenie.captureDraft.v1',
      draft: {
        type: 'snippet',
        title: 'Keyboard dismissible capture',
        text: 'This capture should only save after confirmation.',
        tags: ['bridge']
      }
    };
    await page.evaluate((message) => window.postMessage(message, window.location.origin), bridgeMessage);
    await expect(page.getByRole('dialog', { name: 'Review extension capture' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Close extension capture' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Review extension capture' })).not.toBeVisible();

    await searchFor(page, 'Keyboard dismissible capture');
    await expect(page.getByRole('heading', { name: 'No saved item matched that search.' })).toBeVisible();

    await page.evaluate((message) => window.postMessage(message, window.location.origin), bridgeMessage);
    await page.getByRole('dialog', { name: 'Review extension capture' }).getByRole('button', { name: 'Save capture' }).click();
    await expect(page.getByRole('dialog', { name: 'Keyboard dismissible capture details' })).toBeVisible();
  });

  test('rejects non-image and oversized image uploads without saving them', async ({ page }) => {
    await resetStorage(page);
    await page.getByRole('button', { name: /Drop screenshot/i }).click();

    const fileInput = page.locator('#image-input');
    await fileInput.setInputFiles({
      name: 'notes.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('not an image')
    });
    await expect(page.getByRole('region', { name: 'Capture saved content' }).getByRole('status')).toHaveText(
      'Choose image files under 10 MB.'
    );

    await fileInput.setInputFiles({
      name: 'oversized.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(10 * 1024 * 1024 + 1)
    });
    await expect(page.getByRole('region', { name: 'Capture saved content' }).getByRole('status')).toHaveText(
      'Choose image files under 10 MB.'
    );

    await searchFor(page, 'oversized');
    await expect(page.getByRole('heading', { name: 'No saved item matched that search.' })).toBeVisible();
  });
});
