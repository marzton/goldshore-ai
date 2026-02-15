import { expect, test } from '@playwright/test';

test('docs search renders results correctly', async ({ page }) => {
  // Mock the search API
  await page.route('**/api/docs-search?q=test', async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([
        { title: 'Test Result 1', url: '/developer/docs/test-1' },
        { title: 'Test Result 2', url: '/developer/docs/test-2' },
      ]),
    });
  });

  await page.goto('/developer/docs', { waitUntil: 'networkidle' });

  // Locate the search input using the specific test ID
  const searchInput = page.getByTestId('docs-search-input').first();
  await expect(searchInput).toBeVisible();

  // Type into the search input
  await searchInput.fill('test');

  // Wait for debounce (300ms) + network delay
  await page.waitForTimeout(500);

  // Verify results appear
  const resultsList = page.locator('.docs-search-results').filter({ hasText: 'Test Result 1' }).first();

  // Wait for results to be visible
  await expect(resultsList).toBeVisible();

  const items = resultsList.locator('li a');
  await expect(items).toHaveCount(2);
  await expect(items.first()).toHaveText('Test Result 1');
  await expect(items.nth(1)).toHaveText('Test Result 2');
});
