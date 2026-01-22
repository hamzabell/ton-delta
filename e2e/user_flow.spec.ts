import { test, expect } from '@playwright/test';

test.describe('Full User Journey', () => {
  test('should allow a user to explore the entire application flow', async ({ page }) => {
    // 1. Dashboard Landing
    await page.goto('/dashboard');
    await expect(page).toHaveTitle(/Pamelo/);
    await expect(page.locator('h1')).toContainText('REFINER');
    
    // 2. Search Functionality
    const searchInput = page.getByPlaceholder('Search assets (e.g. DOGS, NOT)...');
    await expect(searchInput).toBeVisible();
    await searchInput.fill('DOGS');
    // Wait for loading to finish if it appeared, or just wait for list
    await expect(page.getByText('Loading pairs...')).not.toBeVisible({ timeout: 30000 });
    // Ensure "DOGS / TON" is visible and others might be filtered out
    await expect(page.getByText('DOGS / TON').first()).toBeVisible();

    // 3. Navigate to Trade Page via Card Click
    // Wait for the specific card to be available and click the link container
    await page.locator(`a[href="/dashboard/trade/dogs-ton"]`).first().click();
    await expect(page).toHaveURL(/\/dashboard\/trade\/dogs-ton/);
    
    // 4. Verify Trade Page Elements
    // Use a regex/substring check for dynamic price data to avoid flakiness
    await expect(page.locator('h1')).toContainText('DOGS / TON');
    await expect(page.getByText('Estimated Yield')).toBeVisible();
    
    // 5. Navigate to Portfolio (Disconnected State)
    await page.goto('/dashboard/portfolio');
    await expect(page.getByText('Protocol Status')).toBeVisible(); // Disconnected header
    await expect(page.getByText('Pamelo Protocol TVL')).toBeVisible();
    
    // 6. Navigate to Settings Page (formerly Transparency)
    await page.getByText('Settings').click();
    await expect(page.locator('h1')).toContainText('App Settings');
    
    // 7. Verify Settings Elements
    await expect(page.getByText('Wallet Connection')).toBeVisible();
    await expect(page.getByText('Notifications')).toBeVisible();
    await expect(page.getByText('Daily Summary')).toBeVisible();
    
    // Toggle a notification setting (visual check)
    await page.getByText('Daily Summary').click();
  });
});
