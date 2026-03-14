import { test, expect } from '@playwright/test';

test.describe('GS-Web Canonical Restoration Verification', () => {
  test('Capture Desktop Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('http://localhost:4321');

    // Wait for the hero to be visible
    await expect(page.locator('h1')).toContainText('Shaping Waves');

    // 1. Hero Desktop
    await page.screenshot({ path: 'verification/desktop_hero.png' });

    // 2. Below the fold - Performance metrics
    const metrics = page.locator('section:has-text("Performance at a glance")');
    await metrics.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'verification/desktop_metrics.png' });

    // 3. Below the fold - Feature cards
    const features = page.locator('section:has-text("Deployment Intelligence")');
    await features.scrollIntoViewIfNeeded();
    await page.screenshot({ path: 'verification/desktop_features.png' });
  });

  test('Capture Mobile Screenshots', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 }); // iPhone X
    await page.goto('http://localhost:4321');

    // Wait for the hero
    await expect(page.locator('h1')).toContainText('Shaping Waves');

    // 1. Hero Mobile
    await page.screenshot({ path: 'verification/mobile_hero.png' });

    // 2. Mobile Nav check
    const navToggle = page.locator('button[data-gs-nav-toggle]');
    await navToggle.click();
    await page.waitForTimeout(500); // Wait for animation
    await page.screenshot({ path: 'verification/mobile_nav.png' });
  });
});
