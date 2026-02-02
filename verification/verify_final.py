
from playwright.sync_api import sync_playwright
import os

def test_copy_button():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Grant clipboard permissions
        context = browser.new_context()
        context.grant_permissions(["clipboard-read", "clipboard-write"])
        page = context.new_page()

        # We need to test the getting-started page where MDX/Markdown is rendered
        url = "http://localhost:4321/developer/docs/getting-started/"
        print(f"Navigating to {url}")

        try:
            page.goto(url)
            page.wait_for_load_state("networkidle")
        except Exception as e:
            print(f"Failed to navigate: {e}")
            return

        if "404" in page.title():
             url = "http://localhost:4321/developer/docs/getting-started/index.html"
             print(f"Retrying with {url}")
             page.goto(url)

        # The script in DocsLayout adds .code-block-wrapper
        wrapper_count = page.locator(".code-block-wrapper").count()
        print(f"Found {wrapper_count} .code-block-wrapper elements.")

        if wrapper_count > 0:
            wrapper = page.locator(".code-block-wrapper").first
            copy_button = wrapper.locator(".copy-button")

            wrapper.scroll_into_view_if_needed()
            wrapper.hover()
            page.wait_for_timeout(500)

            label_before = copy_button.get_attribute("aria-label")
            print(f"Label before: {label_before}")

            # Click copy
            copy_button.click()
            page.wait_for_timeout(500)

            label_after = copy_button.get_attribute("aria-label")
            print(f"Label after: {label_after}")

            # Verify the label changed to "Copied!"
            if label_after == "Copied!":
                print("SUCCESS: Copy interaction worked and label updated.")
            else:
                print("FAILURE: Label did not update to 'Copied!'.")

            page.screenshot(path="verification/final_check.png")
            page.screenshot(path="verification.png")
        else:
            print("No enhanced code blocks found. Layout script might not be running.")

        browser.close()

if __name__ == "__main__":
    test_copy_button()
