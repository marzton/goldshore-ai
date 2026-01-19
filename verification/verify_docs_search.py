
from playwright.sync_api import Page, expect, sync_playwright
import time

def verify_docs_search(page: Page):
    # Navigate to docs
    page.goto("http://localhost:4321/developer/docs")

    # Wait for hydration
    page.wait_for_load_state("networkidle")

    # Check for search input
    search_input = page.locator("#docs-search-input")
    expect(search_input).to_be_visible()

    # Focus and type to trigger search (if backend existed, it would show results, here it might just show empty or error)
    search_input.focus()
    search_input.fill("test")

    # Allow UI to react
    time.sleep(1)

    # Take screenshot of the sidebar area where search is
    page.screenshot(path="verification/docs_search.png")

    # Also take full page to see layout
    page.screenshot(path="verification/docs_search_full.png", full_page=True)

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_docs_search(page)
            print("Verification script ran successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/error.png")
        finally:
            browser.close()
