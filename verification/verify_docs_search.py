from playwright.sync_api import sync_playwright, expect

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 1280, "height": 720})
        # Listen for console logs
        context.on("page", lambda page: page.on("console", lambda msg: print(f"CONSOLE: {msg.text}")))
        page = context.new_page()

        try:
            print("Navigating to http://localhost:4321/developer/docs")
            page.goto("http://localhost:4321/developer/docs", timeout=30000)

            print("Waiting for search input...")
            search_input = page.locator("#docs-search-input")
            search_input.wait_for(state="visible", timeout=10000)

            print("Checking for shortcut hint...")
            shortcut_hint = page.locator(".search-shortcut")
            expect(shortcut_hint).to_be_visible()

            print("Testing keyboard interaction...")
            # Focus body first
            # (additional keyboard interaction logic can go here)

            print("Taking screenshot...")
            page.screenshot(path="verification/docs_search_verification.png")

        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")

        finally:
            browser.close()
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

            # Short wait
            page.wait_for_timeout(500)

            page.wait_for_timeout(500)

            # Check focus
            is_focused = search_input.evaluate("el => document.activeElement === el")
            print(f"Is focused (Control+K): {is_focused}")

            if not is_focused:
                 print("Pressing Meta+K...")
                 print("Pressing Meta+K (fallback for Mac logic if simulated)...")
                 page.keyboard.press("Meta+K")
                 page.wait_for_timeout(500)
                 is_focused = search_input.evaluate("el => document.activeElement === el")
                 print(f"Is focused (Meta+K): {is_focused}")

            if is_focused:
                 print("Focus verified!")
            else:
                 print("Focus failed.")

            print("Taking screenshot...")
            # Take screenshot of the whole page to see context
            page.screenshot(path="verification/docs_search_full.png")
            # And component
            page.locator(".search-box").screenshot(path="verification/docs_search.png")

if __name__ == "__main__":
    run()
