
import { chromium } from 'playwright';

async function verifyDocsSidebar() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  try {
    console.log('Navigating to docs...');
    // The "index" page in content is slug "index"
    // In DocsSidebar, getHref('index') returns '/developer/docs'
    // But verify_sidebar.mjs was visiting /developer/docs and found NO active link.
    // This implies that on /developer/docs, Astro.props.currentSlug was NOT 'index' or something mismatching.

    // Let's debug by checking what the page URL is and what the sidebar thinks.

    // I will try to visit one of the sub-pages that definitely exists: /developer/docs/intro
    // The slug for 'intro.md' is 'intro'.
    // The sidebar link should point to '/developer/docs/intro'.

    await page.goto('http://localhost:4321/developer/docs/intro');

    console.log('Checking active link for /developer/docs/intro...');

    const sidebar = page.locator('.docs-sidebar');
    await sidebar.waitFor();

    // Debug active links
    const links = await sidebar.locator('a').all();
    for (const link of links) {
      const href = await link.getAttribute('href');
      const ariaCurrent = await link.getAttribute('aria-current');
      console.log(`Link: ${href}, aria-current: ${ariaCurrent}`);
    }

    const activeLink = sidebar.locator('a[aria-current="page"]');
    const count = await activeLink.count();

    if (count !== 1) {
      console.error(`FAILED: Expected exactly 1 active link. Found ${count}.`);
    } else {
      console.log('SUCCESS: Found active link with aria-current="page".');

      const color = await activeLink.evaluate((el) => window.getComputedStyle(el).color);
      const borderLeftColor = await activeLink.evaluate((el) => window.getComputedStyle(el).borderLeftColor);
      const fontWeight = await activeLink.evaluate((el) => window.getComputedStyle(el).fontWeight);

      console.log(`Color: ${color}`);
      console.log(`Border Left: ${borderLeftColor}`);
      console.log(`Font Weight: ${fontWeight}`);

      if (color === 'rgb(34, 211, 238)' && borderLeftColor === 'rgb(34, 211, 238)' && fontWeight === '500') {
         console.log('STYLES VERIFIED.');
      } else {
         console.warn('Style verification failed.');
      }
    }

    await page.screenshot({ path: '.Jules/verification/sidebar-active-intro.png' });

  } catch (e) {
    console.error('Error:', e);
  } finally {
    await browser.close();
  }
}

verifyDocsSidebar();
