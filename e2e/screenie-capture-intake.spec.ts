import { expect, test, type Page } from '@playwright/test';
import { resetStorage } from './helpers/resetStorage';

const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test.describe('Screenie capture intake', () => {
  test('stages a pasted image for review before saving and finding it', async ({ page }) => {
    const consoleIssues = collectConsoleIssues(page);
    await resetStorage(page);

    await dispatchImagePaste(page, 'paste-screen.png');

    await expect(page.getByLabel('Images ready to save')).toContainText('paste-screen.png');
    await expect(page.getByRole('region', { name: 'Capture saved content' }).getByRole('status')).toHaveText(
      '1 image ready to review.'
    );

    await page.getByRole('button', { name: 'Save image' }).click();
    await expect(page.getByText('1 image saved. OCR queued.')).toBeVisible();

    await searchFor(page, 'paste-screen');
    await expect(page.getByRole('heading', { name: 'paste-screen' })).toBeVisible();
    expect(consoleIssues).toEqual([]);
  });

  test('stages a broad capture-area drop before saving and finding it', async ({ page }) => {
    const consoleIssues = collectConsoleIssues(page);
    await resetStorage(page);

    await dispatchImageDrop(page, 'drop-screen.png');

    await expect(page.getByLabel('Images ready to save')).toContainText('drop-screen.png');
    await expect(page.getByRole('region', { name: 'Capture saved content' }).getByRole('status')).toHaveText(
      '1 image ready to review.'
    );

    await page.getByRole('button', { name: 'Save image' }).click();
    await expect(page.getByText('1 image saved. OCR queued.')).toBeVisible();

    await searchFor(page, 'drop-screen');
    await expect(page.getByRole('heading', { name: 'drop-screen' })).toBeVisible();
    expect(consoleIssues).toEqual([]);
  });

  test('keeps file picker upload working with staged review', async ({ page }) => {
    const consoleIssues = collectConsoleIssues(page);
    await resetStorage(page);

    await page.getByRole('button', { name: /Drop screenshot/i }).click();
    await page.locator('#image-input').setInputFiles({
      name: 'picker-screen.png',
      mimeType: 'image/png',
      buffer: Buffer.from(PNG_BASE64, 'base64')
    });

    await expect(page.getByLabel('Images ready to save')).toContainText('picker-screen.png');
    await page.getByRole('button', { name: 'Save image' }).click();

    await searchFor(page, 'picker-screen');
    await expect(page.getByRole('heading', { name: 'picker-screen' })).toBeVisible();
    expect(consoleIssues).toEqual([]);
  });

  test('routes pasted URL and plain text to the matching review forms', async ({ page }) => {
    const consoleIssues = collectConsoleIssues(page);
    await resetStorage(page);

    await dispatchTextPaste(page, 'https://screenie.app/paste-target');
    await expect(page.getByLabel('Paste link')).toHaveValue('https://screenie.app/paste-target');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByText('Link saved.')).toBeVisible();

    await page.keyboard.press('Escape');
    await dispatchTextPaste(page, 'Plain pasted note should become a snippet.');
    await expect(page.getByLabel('Save snippet')).toHaveValue('Plain pasted note should become a snippet.');
    await page.getByRole('button', { name: 'Save text' }).click();
    await expect(page.getByText('Snippet saved.')).toBeVisible();

    await searchFor(page, 'paste-target');
    await expect(page.getByRole('heading', { name: 'screenie.app' })).toBeVisible();
    await searchFor(page, 'Plain pasted note');
    await expect(page.getByRole('heading', { name: 'Plain pasted note should become' })).toBeVisible();
    expect(consoleIssues).toEqual([]);
  });
});

function collectConsoleIssues(page: Page): string[] {
  const issues: string[] = [];
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      issues.push(`${message.type()}: ${message.text()}`);
    }
  });
  page.on('pageerror', (error) => issues.push(`pageerror: ${error.message}`));
  return issues;
}

async function searchFor(page: Page, query: string): Promise<void> {
  await page.getByRole('button', { name: 'Find' }).click();
  await page.getByLabel('Search everything in Screenie').fill(query);
}

async function dispatchImagePaste(page: Page, name: string): Promise<void> {
  await page.evaluate(
    ({ base64, fileName }) => {
      const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
      const file = new File([bytes], fileName, { type: 'image/png' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      document.dispatchEvent(
        new ClipboardEvent('paste', {
          bubbles: true,
          cancelable: true,
          clipboardData: dataTransfer
        })
      );
    },
    { base64: PNG_BASE64, fileName: name }
  );
}

async function dispatchImageDrop(page: Page, name: string): Promise<void> {
  await page.evaluate(
    ({ base64, fileName }) => {
      const bytes = Uint8Array.from(atob(base64), (character) => character.charCodeAt(0));
      const file = new File([bytes], fileName, { type: 'image/png' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      const target = document.querySelector('[aria-label="Capture saved content"]');
      target?.dispatchEvent(new DragEvent('dragover', { bubbles: true, cancelable: true, dataTransfer }));
      target?.dispatchEvent(new DragEvent('drop', { bubbles: true, cancelable: true, dataTransfer }));
    },
    { base64: PNG_BASE64, fileName: name }
  );
}

async function dispatchTextPaste(page: Page, text: string): Promise<void> {
  await page.evaluate((value) => {
    const dataTransfer = new DataTransfer();
    dataTransfer.setData('text/plain', value);
    document.dispatchEvent(
      new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dataTransfer
      })
    );
  }, text);
}
