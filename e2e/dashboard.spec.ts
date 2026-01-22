import { test, expect } from '@playwright/test';

test.describe('Dashboard & Trading Flow', () => {
  
  test('should load opportunities page with real data', async ({ page }) => {
    // 1. Visit Dashboard
    await page.goto('/dashboard', { timeout: 60000 });
    
    // 2. Check for Static Header to ensure page loaded
    await expect(page.locator('text=REFINER')).toBeVisible({ timeout: 10000 });

    // 3. Wait for API data (dynamic)
    // Use getByText with exact:false to be more forgiving
    await expect(page.getByText('DOGS / TON', { exact: false })).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('242.3%', { exact: false })).toBeVisible();
  });

  test('should filter pairs using search', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 60000 });
    
    // Wait for data
    await expect(page.locator('text=DOGS / TON')).toBeVisible({ timeout: 10000 });

    // Search for "NOT"
    await page.fill('input[placeholder*="Search"]', 'NOT');
    
    // NOT should be visible, DOGS should be hidden (assuming filtered)
    await expect(page.locator('text=NOT / TON')).toBeVisible();
    await expect(page.locator('text=DOGS / TON')).toBeHidden(); 
  });

  test('should navigate to trade page and show market data', async ({ page }) => {
    await page.goto('/dashboard', { timeout: 60000 });
    
    // Wait for list and Click 'DOGS / TON' explicitly
    const card = page.locator('a[href*="/dashboard/trade/dogs-ton"]');
    await expect(card).toBeVisible({ timeout: 10000 });
    await card.click();
    
    // Verify navigation
    await expect(page).toHaveURL(/\/dashboard\/trade\/dogs-ton/);
    
    // Check for Trade Page Header
    await expect(page.locator('h1')).toContainText('DOGS / TON');
    
    // Check for Yield (Dynamic)
    await expect(page.getByText('242.3%', { exact: false })).toBeVisible();
  });

});
