import { expect, test, type Page } from '@playwright/test';
import { resetStorage } from './helpers/resetStorage';

function collectConsoleIssues(page: Page) {
  const issues: string[] = [];

  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      issues.push(`${message.type()}: ${message.text()}`);
    }
  });

  page.on('pageerror', (error) => {
    issues.push(`pageerror: ${error.message}`);
  });

  return issues;
}

test.describe('Screenie Product Beta regressions', () => {
  test('exports imports and resets workspace through Settings', async ({ page }) => {
    await resetStorage(page);

    await page.getByRole('button', { name: /Paste link/i }).click();
    await page.getByLabel('Paste link').fill('https://screenie.app/beta-export');
    await page.getByLabel('Title').fill('Export Round Trip Link');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Link saved.' })).toBeVisible();

    await page.getByLabel('Settings', { exact: true }).click();
    await page.getByRole('button', { name: 'Export archive' }).click();

    const downloadPromise = page.waitForEvent('download');
    await page
      .getByRole('dialog', { name: 'Export archive' })
      .getByRole('button', { name: 'Export archive' })
      .click();
    const download = await downloadPromise;
    const exportPath = await download.path();
    expect(exportPath).toBeTruthy();

    await page.getByRole('button', { name: 'Clear all data' }).click();
    await page
      .getByRole('dialog', { name: 'Clear all data' })
      .getByRole('button', { name: 'Clear all data' })
      .click();
    await expect(page.getByRole('status').filter({ hasText: 'Local workspace cleared.' })).toBeVisible();

    await page.getByRole('button', { name: 'Import archive' }).click();
    await page.getByLabel('Choose Screenie archive').setInputFiles(exportPath!);
    await expect(page.getByRole('dialog', { name: 'Import archive' })).toContainText('Ready to import');
    await page
      .getByRole('dialog', { name: 'Import archive' })
      .getByRole('button', { name: 'Import archive' })
      .click();
    await expect(page.getByRole('status').filter({ hasText: /Imported \d+ items/ })).toBeVisible();

    await page.getByRole('button', { name: 'Find' }).click();
    await page.getByLabel('Search everything in Screenie').fill('Export Round Trip Link');
    await expect(page.getByRole('heading', { name: 'Export Round Trip Link' })).toBeVisible();

    await page.getByLabel('Settings', { exact: true }).click();
    await page.getByRole('button', { name: 'Reset workspace' }).click();
    await page
      .getByRole('dialog', { name: 'Reset workspace' })
      .getByRole('button', { name: 'Reset workspace' })
      .click();
    await expect(page.getByRole('status').filter({ hasText: 'Starter workspace restored.' })).toBeVisible();

    await page.getByRole('button', { name: 'Find' }).click();
    await page.getByLabel('Search everything in Screenie').fill('pricing');
    await expect(page.getByRole('heading', { name: 'Our Pricing Plans - Screenie' })).toBeVisible();
  });

  test('reviews extension bridge drafts and only saves after confirmation', async ({ page }) => {
    await resetStorage(page);

    const bridgeMessage = {
      type: 'screenie.captureDraft.v1',
      draft: {
        type: 'link',
        title: 'Zeta Omega Capture',
        url: 'https://screenie.app/zeta-omega',
        tags: ['bridge', 'zeta']
      }
    };

    await page.evaluate((message) => {
      window.postMessage(message, window.location.origin);
    }, bridgeMessage);

    await expect(page.getByRole('dialog', { name: 'Review extension capture' })).toBeVisible();
    await expect(page.getByText('Zeta Omega Capture')).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    await page.getByRole('button', { name: 'Find' }).click();
    await page.getByLabel('Search everything in Screenie').fill('Zeta Omega Capture');
    await expect(page.getByRole('heading', { name: 'No saved item matched that search.' })).toBeVisible();

    await page.evaluate((message) => {
      window.postMessage(message, window.location.origin);
    }, bridgeMessage);

    const reviewDialog = page.getByRole('dialog', { name: 'Review extension capture' });
    await reviewDialog.getByRole('button', { name: 'Save capture' }).click();
    await expect(reviewDialog).not.toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Zeta Omega Capture details' })).toBeVisible();
    await page.getByRole('button', { name: 'Close item details' }).click();

    await page.getByRole('button', { name: 'Find' }).click();
    await page.getByLabel('Search everything in Screenie').fill('Zeta Omega Capture');
    await expect(page.getByRole('heading', { name: 'Zeta Omega Capture' })).toBeVisible();
  });

  test('creates a project from the Find sidebar and persists it locally', async ({ page }) => {
    await resetStorage(page);
    await page.getByRole('button', { name: 'Find' }).click();

    await page.getByLabel('Add project').click();
    await expect(page.getByRole('dialog', { name: 'New project' })).toBeVisible();
    await page.getByLabel('Project name').fill('Beta QA Project');
    await page.getByRole('button', { name: 'Create project' }).click();

    await expect(page.getByRole('button', { name: 'Beta QA Project', exact: true })).toBeVisible();

    await page.reload();
    await page.getByRole('button', { name: 'Find' }).click();

    await expect(page.getByRole('button', { name: 'Beta QA Project', exact: true })).toBeVisible();
  });

  for (const viewport of [
    { label: 'mobile', width: 320, height: 900 },
    { label: 'narrow mobile', width: 390, height: 900 },
    { label: 'tablet', width: 768, height: 900 },
    { label: 'desktop', width: 1024, height: 900 },
    { label: 'wide desktop', width: 1440, height: 1000 }
  ]) {
    test(`keeps core views responsive and console-clean at ${viewport.label}`, async ({ page }) => {
      const consoleIssues = collectConsoleIssues(page);

      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await resetStorage(page);

      await expect(page.getByRole('heading', { name: 'Inbox', exact: true })).toBeVisible();
      await expect(page.getByRole('region', { name: /capture workspace/i })).toBeVisible();

      await page.getByRole('button', { name: 'Find' }).click();
      await page.getByLabel('Search everything in Screenie').fill('pricing pro');
      await expect(page.getByRole('heading', { name: /Pricing screenshot/i })).toBeVisible();

      await page
        .getByRole('navigation', { name: 'Workspace' })
        .getByRole('button', { name: 'Settings' })
        .click();
      await expect(page.getByRole('heading', { name: 'Settings', level: 1 })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Clear all data' })).toBeVisible();

      for (const name of ['Inbox', 'Find', 'Library', 'Favorites', 'Tags', 'Trash']) {
        const box = await page.getByRole('button', { name: new RegExp(name) }).first().boundingBox();
        expect(box, `${name} should be visible`).not.toBeNull();
        expect(box!.x, `${name} should not clip left at ${viewport.width}px`).toBeGreaterThanOrEqual(0);
        expect(
          box!.x + box!.width,
          `${name} should not clip right at ${viewport.width}px`
        ).toBeLessThanOrEqual(viewport.width);
      }

      const horizontalOverflow = await page.evaluate(() =>
        Math.max(
          document.documentElement.scrollWidth - document.documentElement.clientWidth,
          document.body.scrollWidth - document.body.clientWidth
        )
      );

      expect(horizontalOverflow, `page should not horizontally overflow at ${viewport.width}px`).toBeLessThanOrEqual(1);
      expect(consoleIssues).toEqual([]);
    });
  }
});
