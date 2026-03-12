from playwright.sync_api import Page, expect, sync_playwright

def verify_apps(page: Page):
    # Verify Web App
    print("Navigating to Web App...")
    page.goto("http://localhost:3000")
    expect(page).to_have_title("GoldShore | Steer Capital with Intelligence")
    expect(page.get_by_role("heading", name="Steer Capital with AI Intelligence.")).to_be_visible()

    # Take screenshot of Web App
    page.screenshot(path="verification/web_app.png", full_page=True)
    print("Web App screenshot taken.")

    # Verify Admin App
    print("Navigating to Admin App...")
    page.goto("http://localhost:3001/admin/overview")
    expect(page).to_have_title("Admin | Operational Overview")
    expect(page.get_by_role("heading", name="Operational Overview")).to_be_visible()
    expect(page.get_by_text("gs-api Status")).to_be_visible()

    # Take screenshot of Admin App
    page.screenshot(path="verification/admin_app.png", full_page=True)
    print("Admin App screenshot taken.")

if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            verify_apps(page)
        finally:
            browser.close()
