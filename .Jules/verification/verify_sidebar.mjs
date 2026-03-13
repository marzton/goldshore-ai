
import { chromium } from 'playwright';

async function verifyDocsSidebar() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  // Assuming dev server runs on port 4321, start it in background if not running
  // But for this script, I assume the server is running.
  // Since I can't guarantee the server is running, I'll start it in the bash session first.

  try {
    console.log('Navigating to docs...');
    // We need a real page. apps/web/src/pages/developer/docs/index.astro -> /developer/docs
    await page.goto('http://localhost:4321/developer/docs');

    console.log('Checking active link...');
    // The active link should be "Overview" (based on index.astro title)
    // DocsSidebar renders links. The one matching current slug should have aria-current="page".
    // On /developer/docs, slug is "index".

    // Wait for sidebar
    const sidebar = page.locator('.docs-sidebar');
    await sidebar.waitFor();

    // Check for aria-current="page"
    const activeLink = sidebar.locator('a[aria-current="page"]');
    const count = await activeLink.count();
    console.log(`Found ${count} active links.`);

    if (count !== 1) {
      console.error('FAILED: Expected exactly 1 active link.');
      // Dump html for debugging
      console.log(await sidebar.innerHTML());
    } else {
      console.log('SUCCESS: Found active link with aria-current="page".');

      // Check styles (computed)
      const color = await activeLink.evaluate((el) => window.getComputedStyle(el).color);
      const borderLeftColor = await activeLink.evaluate((el) => window.getComputedStyle(el).borderLeftColor);
      const fontWeight = await activeLink.evaluate((el) => window.getComputedStyle(el).fontWeight);

      console.log(`Color: ${color}`); // Should be rgb(34, 211, 238) -> #22d3ee
      console.log(`Border Left: ${borderLeftColor}`);
      console.log(`Font Weight: ${fontWeight}`); // Should be 500

      if (color === 'rgb(34, 211, 238)' && borderLeftColor === 'rgb(34, 211, 238)' && fontWeight === '500') {
         console.log('STYLES VERIFIED.');
      } else {
         console.warn('Style verification failed (or computed styles differ). Check screenshot.');
      }
    }

    await page.screenshot({ path: '.Jules/verification/sidebar-active.png' });
    console.log('Screenshot saved.');

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

verifyDocsSidebar();
