
import { test } from '@playwright/test';
import { expect } from '@playwright/test';

test('AgroE2E_2025-11-17', async ({ page, context }) => {
  
    // Navigate to URL
    await page.goto('http://localhost:5175/', { waitUntil: 'domcontentloaded' });

    // Take screenshot
    await page.screenshot({ path: 'home.png', { fullPage: true } });

    // Take screenshot
    await page.screenshot({ path: 'farmer-dashboard.png', { fullPage: true } });

    // Take screenshot
    await page.screenshot({ path: 'farm-listings.png', { fullPage: true } });
});