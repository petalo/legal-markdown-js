import { test, expect } from '@playwright/test';

test.describe('Playground', () => {
  let consoleErrors: string[] = [];
  let failedRequests: string[] = [];

  test.beforeEach(async ({ page }) => {
    consoleErrors = [];
    failedRequests = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    page.on('requestfailed', req => {
      failedRequests.push(req.url());
    });
  });

  test.afterEach(async () => {
    // favicon 404 is a known harmless dev-server artifact
    const realErrors = consoleErrors.filter(e => !e.includes('favicon'));
    const realFails = failedRequests.filter(u => !u.includes('favicon'));
    expect(realErrors, 'No console errors expected').toEqual([]);
    expect(realFails, 'No failed network requests expected').toEqual([]);
  });

  test('FTUX: empty state shows prompt and Process button; clicking it renders output', async ({
    page,
  }) => {
    await page.goto('/');

    // Empty state elements are visible before any processing
    const tabpanel = page.getByRole('tabpanel', { name: 'Rendered' });
    await expect(tabpanel.getByText('Process a document to see the rendered output')).toBeVisible();

    const ftuxProcess = tabpanel.getByRole('button', { name: 'Process document' });
    await expect(ftuxProcess).toBeVisible();

    // Clicking the FTUX button triggers processing
    await ftuxProcess.click();

    // iframe appears once processing completes
    await expect(page.frameLocator('iframe').locator('body')).not.toBeEmpty({ timeout: 10_000 });
  });

  test('processing the default example shows output in statusbar and iframe', async ({ page }) => {
    await page.goto('/');

    // Click the main Process button in the output header
    await page.getByRole('button', { name: 'Process', exact: true }).click();

    const statusBar = page.getByRole('contentinfo');

    // Status bar updates to Ready
    await expect(statusBar).toContainText('Ready', { timeout: 10_000 });

    // Word count is non-zero - match a number starting with 1-9 (e.g. "860 words")
    await expect(statusBar).toContainText(/[1-9]\d* words/, { timeout: 5_000 });

    // iframe has rendered content with at least one heading
    const iframe = page.frameLocator('iframe');
    await expect(iframe.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10_000 });
  });

  test('badge indicator: appears when any option differs from default, disappears on reset', async ({
    page,
  }) => {
    await page.goto('/');

    // Gear button has no badge initially (all options at defaults) - span is absent from DOM
    await expect(page.getByTestId('options-badge')).not.toBeAttached();

    // Open Options, toggle No headers ON, close popover
    await page.getByRole('button', { name: 'Processing options' }).click();
    await page.getByRole('switch', { name: 'No headers' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('switch', { name: 'No headers' })).not.toBeVisible();

    // Badge is now visible because No headers differs from its default (OFF)
    await expect(page.getByTestId('options-badge')).toBeVisible();

    // Open Options, toggle No headers OFF, close popover
    await page.getByRole('button', { name: 'Processing options' }).click();
    await page.getByRole('switch', { name: 'No headers' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('switch', { name: 'No headers' })).not.toBeVisible();

    // Badge is gone - span removed from DOM, all options back to defaults
    await expect(page.getByTestId('options-badge')).not.toBeAttached();
  });

  test('Copy button: clipboard content matches active tab (Markdown / HTML / HTML Document)', async ({
    page,
    context,
  }) => {
    await page.goto('/');

    // Grant clipboard permissions before any copy action
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    // Process the default example and wait for Ready
    await page.getByRole('button', { name: 'Process', exact: true }).click();
    await expect(page.getByRole('contentinfo')).toContainText('Ready', { timeout: 10_000 });

    // Helper: click the Copy button by its visible text label (not the icon-only "Copy HTML" in the
    // PreviewPanel header which has the same accessible name via aria-label).
    const clickCopyByText = (label: string): Promise<void> =>
      page.getByRole('button').filter({ hasText: label }).click();

    // --- Markdown tab ---
    await page.getByRole('tab', { name: 'Markdown' }).click();
    await clickCopyByText('Copy Markdown');
    const markdownClipboard = await page.evaluate(() => navigator.clipboard.readText());
    // Pipeline strips YAML frontmatter; output starts with a markdown heading (#).
    // Must not look like HTML - that would indicate the wrong tab's content was copied.
    expect(markdownClipboard).toMatch(/^#/);
    expect(markdownClipboard).not.toMatch(/^<!DOCTYPE/i);

    // --- HTML tab ---
    await page.getByRole('tab', { name: 'HTML', exact: true }).click();
    await clickCopyByText('Copy HTML');
    const htmlClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(htmlClipboard).toMatch(/^</);
    expect(htmlClipboard).not.toMatch(/^<!DOCTYPE/i);

    // --- HTML Document tab ---
    await page.getByRole('tab', { name: 'HTML Document', exact: true }).click();
    await clickCopyByText('Copy HTML Document');
    const htmlDocClipboard = await page.evaluate(() => navigator.clipboard.readText());
    expect(htmlDocClipboard).toMatch(/^<!DOCTYPE html>/i);
  });

  test('No headers toggle: disables l./ll. numbering in pipeline output', async ({ page }) => {
    await page.goto('/');

    // Master Services Agreement is the default example (has l./ll. markers) - no need to switch
    // Process with default options (headers enabled)
    await page.getByRole('button', { name: 'Process', exact: true }).click();
    await expect(page.getByRole('contentinfo')).toContainText('Ready', { timeout: 10_000 });

    // Switch to Markdown tab and verify numbered headings exist
    await page.getByRole('tab', { name: 'Markdown' }).click();
    const markdownPre = page.getByRole('tabpanel', { name: 'Markdown' }).locator('pre');
    await expect(markdownPre).toContainText('# Article 1. DEFINITIONS');

    // Enable No headers
    await page.getByRole('button', { name: 'Processing options' }).click();
    await page.getByRole('switch', { name: 'No headers' }).click();
    await page.keyboard.press('Escape');
    // Confirm popover closed before proceeding
    await expect(page.getByRole('switch', { name: 'No headers' })).not.toBeVisible();

    // Reprocess; content assertions below are the true gate on the result
    await page.getByRole('button', { name: 'Process', exact: true }).click();
    await expect(page.getByRole('contentinfo')).toContainText('Ready', { timeout: 10_000 });

    // Numbered headings are gone; raw l. marker appears instead
    await expect(markdownPre).not.toContainText('# Article 1.');
    await expect(markdownPre).toContainText('l. DEFINITIONS');
  });

  test('golden snapshot: Features Demo HTML Document output matches stored snapshot', async ({
    page,
  }) => {
    // Freeze browser Date so @today tokens are deterministic across runs.
    // Keep this date explicit to avoid snapshot drift tied to the execution day.
    await page.addInitScript(({ nowIso }) => {
      const fixedTime = new Date(nowIso).getTime();
      const OriginalDate = Date;

      class MockDate extends OriginalDate {
        constructor(...args: unknown[]) {
          if (args.length === 0) {
            super(fixedTime);
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any -- browser-side date shim
            super(...(args as any[]));
          }
        }

        static now() {
          return fixedTime;
        }
      }

      MockDate.parse = OriginalDate.parse;
      MockDate.UTC = OriginalDate.UTC;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- browser-side global assignment
      (window as any).Date = MockDate;
    }, { nowIso: '2026-03-04T12:00:00.000Z' });

    await page.goto('/');

    // Features Demo is the default example - no need to switch
    // Process and wait for Ready
    await page.getByRole('button', { name: 'Process', exact: true }).click();
    await expect(page.getByRole('contentinfo')).toContainText('Ready', { timeout: 10_000 });

    // Switch to HTML Document tab
    await page.getByRole('tab', { name: 'HTML Document', exact: true }).click();

    // Wait for the pre to be visible, then read its rendered text content.
    // innerText() always returns string (unlike textContent() which can return null).
    // If content intentionally changes, refresh with:
    // npm run test:playground:ui -- --update-snapshots
    const htmlDocPre = page.getByRole('tabpanel', { name: 'HTML Document' }).locator('pre');
    await expect(htmlDocPre).toBeVisible({ timeout: 10_000 });
    const output = await htmlDocPre.innerText();

    expect(output).toMatchSnapshot('features-demo.html');
  });
});
