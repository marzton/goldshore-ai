from playwright.sync_api import sync_playwright, expect

def verify_buttons():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            # Navigate to the local dev server
            page.goto("http://localhost:4321")

            # Wait for content to load
            page.wait_for_selector(".gs-heading")

            # Locate buttons
            learn_more = page.get_by_role("link", name="Learn More")
            get_in_touch = page.get_by_role("link", name="Get in Touch")

            # Verify they are visible
            expect(learn_more).to_be_visible()
            expect(get_in_touch).to_be_visible()

            # Check classes to ensure they are using the new component styles
            # The GSButton adds specific classes
            # Primary should have 'gs-button-primary'
            # Secondary should have 'border-[var(--gs-brand-blue)]'

            # We can inspect the class attribute
            learn_more_class = learn_more.get_attribute("class")
            get_in_touch_class = get_in_touch.get_attribute("class")

            print(f"Learn More classes: {learn_more_class}")
            print(f"Get in Touch classes: {get_in_touch_class}")

            if "gs-button-primary" not in learn_more_class:
                print("WARNING: 'Learn More' button missing gs-button-primary class")

            if "border" not in get_in_touch_class:
                 print("WARNING: 'Get in Touch' button missing border class")

            # Check for focus styles (we added focus-visible)
            # We can't easily test focus-visible state in screenshot without interaction simulation
            # But we can verify the class is present in the DOM
            if "focus-visible:ring-2" in learn_more_class:
                 print("SUCCESS: focus-visible styles present")
            else:
                 print("WARNING: focus-visible styles MISSING")

            # Take screenshot of the buttons area
            # We locate the parent container of buttons
            button_container = page.locator("section").first.locator(".flex.justify-center.gap-4")
            button_container.screenshot(path="verification/buttons.png")

            # Also full page for context
            page.screenshot(path="verification/full_page.png")

        except Exception as e:
            print(f"Error: {e}")
        finally:
            browser.close()

if __name__ == "__main__":
    verify_buttons()
