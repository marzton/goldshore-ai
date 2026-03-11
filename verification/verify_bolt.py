from playwright.sync_api import sync_playwright, expect

def verify_bolt_optimizations(page):
    print("Navigating to home page...")
    page.goto("http://localhost:4321/")

    # 1. Check Favicon
    print("Checking favicon...")
    favicon = page.locator("link[rel='icon']")
    expect(favicon).to_have_attribute("href", "/logo/gs-penrose.svg")
    print("✅ Favicon present")

    # 2. Check LCP Logo Optimization
    # The logo is in the header.
    print("Checking logo...")
    logo = page.locator("header.gs-header a.gs-logo img")
    expect(logo).to_be_visible()
    expect(logo).to_have_attribute("fetchpriority", "high")
    print("✅ Logo has fetchpriority='high'")

    # 3. Screenshot
    print("Taking screenshot...")
    page.screenshot(path="verification.png")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_bolt_optimizations(page)
        except Exception as e:
            print(f"Error: {e}")
            page.screenshot(path="error.png")
            raise
        finally:
            browser.close()
