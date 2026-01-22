from playwright.sync_api import sync_playwright, expect

def verify_layout():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the local dev server
            page.goto("http://localhost:4321")

            # Wait for content to load
            page.wait_for_selector("body")

            # 1. Verify Skip Link exists
            skip_link = page.locator("a.skip-to-content")
            expect(skip_link).to_have_attribute("href", "#main-content")

            # Check if it's hidden initially
            box = skip_link.bounding_box()
            if box and box['y'] < 0:
                print("SUCCESS: Skip link is initially off-screen")
            else:
                print(f"WARNING: Skip link might be visible? y={box['y'] if box else 'None'}")

            # 2. Verify meta description
            description = page.locator('meta[name="description"]')
            expect(description).to_have_attribute("content", "GoldShore Labs - AI-powered infrastructure for trading, automation, and applied intelligence.")
            print("SUCCESS: Meta description found")

            # 3. Verify favicon
            favicon = page.locator('link[rel="icon"]')
            expect(favicon).to_have_attribute("href", "/favicon.svg")
            print("SUCCESS: Favicon link found")

            # 4. Verify inline styles refactor
            # Use specific locator for the main site header
            header = page.locator("header.gs-header").first
            expect(header).to_be_visible()
            print("SUCCESS: Header has gs-header class")

            # Take screenshot of the top of the page
            page.screenshot(path="verification/layout.png")

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    verify_layout()
