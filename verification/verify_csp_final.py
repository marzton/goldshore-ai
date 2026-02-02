from playwright.sync_api import Page, expect, sync_playwright

def test_csp_and_highlights(page: Page):
    # 1. Arrange: Go to the homepage.
    page.goto("http://localhost:4321")

    # 2. Debug: Print all meta tags
    metas = page.locator('meta[http-equiv="Content-Security-Policy"]').all()
    print(f"Found {len(metas)} CSP meta tags.")

    valid_found = False
    for i, meta in enumerate(metas):
        content = meta.get_attribute("content")
        print(f"Meta {i}: {content}")

        # Check for required directives
        if "default-src 'self'" in content and "script-src 'self' 'unsafe-inline'" in content:
            valid_found = True

        # Check for forbidden directive
        if "frame-ancestors" in content:
            raise Exception(f"CSP contains forbidden 'frame-ancestors' in meta tag: {content}")

    if not valid_found:
        raise Exception("Valid CSP meta tag not found")

    # 3. Assert: Check for new highlights
    # This proves the build/rendering is working with the highlights fix.
    expect(page.get_by_text("Global Latency")).to_be_visible()
    expect(page.get_by_text("< 30ms")).to_be_visible()

    # 4. Screenshot
    page.screenshot(path="verification/verification_final.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            test_csp_and_highlights(page)
            print("Verification Passed!")
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="verification/error.png")
            raise e
        finally:
            browser.close()
