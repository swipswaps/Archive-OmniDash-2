#!/usr/bin/env python3
"""Test the production build on port 3002"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time

chrome_options = Options()
chrome_options.add_argument('--headless=new')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=chrome_options)
driver.set_page_load_timeout(15)

try:
    print("=" * 70)
    print("🧪 TESTING PRODUCTION BUILD (http://localhost:3002)")
    print("=" * 70)
    
    driver.get("http://localhost:3002")
    print("✅ Page loaded")
    time.sleep(2)
    
    # Click Settings
    settings_btn = driver.find_element(By.XPATH, "//button[.//span[text()='Settings']]")
    settings_btn.click()
    print("✅ Clicked Settings")
    time.sleep(2)
    
    # Take screenshot
    driver.save_screenshot("test_screenshots/prod_settings.png")
    print("📸 Screenshot saved: test_screenshots/prod_settings.png")
    
    # Get page text
    page_text = driver.find_element(By.TAG_NAME, "body").text
    
    # Check for security warning
    print("\n" + "=" * 70)
    print("🔍 SECURITY WARNING CHECK")
    print("=" * 70)
    
    keywords = {
        "Security Warning": "Security Warning" in page_text,
        "localStorage": "localStorage" in page_text,
        "unencrypted": "unencrypted" in page_text,
        "public or shared computers": ("public" in page_text and "shared" in page_text and "computers" in page_text),
        "AlertTriangle icon": "⚠️" in page_text,
    }
    
    for keyword, found in keywords.items():
        status = "✅ FOUND" if found else "❌ NOT FOUND"
        print(f"{status}: '{keyword}'")
    
    # Try to find the warning element
    print("\n" + "=" * 70)
    print("🔍 DOM ELEMENT CHECK")
    print("=" * 70)
    
    try:
        warning_elem = driver.find_element(By.XPATH, "//*[contains(text(), 'Security Warning')]")
        print("✅ Security Warning element FOUND in DOM")
        print(f"   Element tag: {warning_elem.tag_name}")
        print(f"   Element text: {warning_elem.text[:100]}")
    except:
        print("❌ Security Warning element NOT FOUND in DOM")
    
    # Save page source
    with open("prod_settings_source.html", "w") as f:
        f.write(driver.page_source)
    print("\n📄 Page source saved: prod_settings_source.html")
    
    # Final verdict
    print("\n" + "=" * 70)
    if all(keywords.values()):
        print("✅ ✅ ✅ PHASE 1 SECURITY WARNING: PASS ✅ ✅ ✅")
    else:
        print("❌ ❌ ❌ PHASE 1 SECURITY WARNING: FAIL ❌ ❌ ❌")
    print("=" * 70)
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    driver.save_screenshot("test_screenshots/prod_error.png")
finally:
    driver.quit()

