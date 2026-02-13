from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a desktop viewport to ensure layout matches desktop expectations
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        try:
            # Navigate to a page that uses DocsLayout
            # e.g., /developer/docs/intro if it exists, or just /about if not.
            # But DocsSearch is likely only in DocsLayout.
            # I'll try /developer/docs/intro based on previous file content.
            # If 404, I'll try to find a valid route.
            url = "http://localhost:4321/developer/docs/intro"
            print(f"Navigating to {url}")
            page.goto(url, timeout=30000)

            # Check if we landed on a valid page (not 404)
            # title might be "404: Not Found" if failed.
            print(f"Page title: {page.title()}")

            print("Waiting for search input...")
            # Use class selector as ID is dynamic
            search_input = page.locator(".docs-search-input").first
            search_input.wait_for(state="visible", timeout=10000)

            print("Checking for shortcut hint...")
            shortcut_hint = page.locator(".search-shortcut").first
            expect(shortcut_hint).to_be_visible()

            print("Testing keyboard interaction...")
            # Focus body first to ensure input is not focused
            page.locator("body").click()

            # Explicitly press Control+K
            print("Pressing Control+K...")
            page.keyboard.press("Control+K")
            page.wait_for_timeout(500)

            # Check focus
            is_focused = search_input.evaluate("el => document.activeElement === el")
            print(f"Is focused (Control+K): {is_focused}")

            if not is_focused:
                 print("Pressing Meta+K (fallback for Mac logic if simulated)...")
                 page.keyboard.press("Meta+K")
                 page.wait_for_timeout(500)
                 is_focused = search_input.evaluate("el => document.activeElement === el")
                 print(f"Is focused (Meta+K): {is_focused}")

            if is_focused:
                 print("Focus verified!")
            else:
                 print("Focus failed.")
                 # If focus failed, maybe try clicking it to verify it works manually
                 print("Attempting click focus...")
                 search_input.click()
                 is_focused = search_input.evaluate("el => document.activeElement === el")
                 print(f"Is focused (Click): {is_focused}")

            print("Taking screenshot...")
            page.screenshot(path="verification/docs_search_verification.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")

        finally:
            browser.close()

if __name__ == "__main__":
    run()
