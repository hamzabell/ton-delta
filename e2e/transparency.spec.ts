import { test, expect } from '@playwright/test';

test.describe('Transparency Page', () => {
  test('should load transparency page and display audit scope', async ({ page }) => {
    // Navigate to Transparency Page
    await page.goto('/dashboard/transparency');

    // Check Header
    await expect(page.locator('h1')).toContainText('Trust Architecture');

    // Check Default Audit Scope (should default to first pair, e.g. DOGS/TON or DOGS/TON)
    // The text might be dynamic, so we check existence of the button trigger
    const scopeTrigger = page.locator('button', { hasText: 'Active Audit Scope' });
    await expect(scopeTrigger).toBeVisible();

    // Open Dropdown
    await scopeTrigger.click();

    // Check if sheet opens and search input is visible
    await expect(page.getByPlaceholder('SEARCH TON PAIRS...')).toBeVisible();
    
    // Check if at least one pair is listed (e.g. DOGS/TON)
    // This verifies usePairs hook is returning data
    await expect(page.locator('button').filter({ hasText: 'Yield' }).first()).toBeVisible();
  });
});
