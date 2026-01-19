from playwright.sync_api import Page, expect, sync_playwright

def verify_search_clean(page: Page):
    print("Navigating to docs page...")
    page.goto("http://localhost:4321/developer/docs")

    # Wait for page load
    page.wait_for_load_state("networkidle")

    print("Finding search input...")
    search_input = page.get_by_role("searchbox", name="Search documentation")
    expect(search_input).to_be_visible()

    # Focus and type
    search_input.focus()
    print("Typing query...")
    search_input.type("api")

    # Wait for loading state or results
    print("Waiting for results...")
    # Because my implementation is mocked to call /api/docs-search, and the dev server might return 404 or empty,
    # I expect the error message OR results.
    # The list is #results (ul)
    results_list = page.locator("#results")

    # Wait for the list to be visible (it becomes block on non-empty)
    # or check if it contains text.
    # If the API fails (likely 404), it will show "Search failed" or "No results".
    # I'll wait a bit.
    page.wait_for_timeout(1000)

    print("Taking screenshot...")
    page.screenshot(path="verification/clean_search.png")

    # Verify accessibility attributes
    expect(search_input).to_have_attribute("aria-controls", "results")
    expect(results_list).to_have_attribute("aria-label", "Search results")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_search_clean(page)
            print("Verification script completed successfully.")
        except Exception as e:
            print(f"Verification failed: {e}")
            page.screenshot(path="verification/clean_error.png")
        finally:
            browser.close()
