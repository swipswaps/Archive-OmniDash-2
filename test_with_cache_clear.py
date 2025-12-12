#!/usr/bin/env python3
"""
Test Settings page with aggressive cache clearing
"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
import time

# Setup Chrome with cache disabled
chrome_options = Options()
chrome_options.add_argument('--headless=new')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--disable-cache')
chrome_options.add_argument('--disable-application-cache')
chrome_options.add_argument('--disable-offline-load-stale-cache')
chrome_options.add_argument('--disk-cache-size=0')
chrome_options.add_argument('--disable-gpu-shader-disk-cache')
chrome_options.add_experimental_option('prefs', {
    'profile.default_content_setting_values.automatic_downloads': 1,
    'disk-cache-size': 0
})

driver = webdriver.Chrome(options=chrome_options)

try:
    print("🧪 Testing Settings page with cache disabled...")
    print("=" * 60)
    
    # Navigate to app
    driver.get("http://localhost:3001")
    time.sleep(2)
    
    # Click Settings button
    settings_buttons = driver.find_elements(By.XPATH, "//button[.//span[text()='Settings']]")
    if settings_buttons:
        settings_buttons[0].click()
        print("✅ Clicked Settings button")
        time.sleep(2)
    
    # Get page source
    page_source = driver.page_source
    
    # Check for security warning
    keywords = {
        "Security Warning": "Security Warning" in page_source,
        "localStorage": "localStorage" in page_source,
        "unencrypted": "unencrypted" in page_source,
        "public or shared": "public" in page_source and "shared" in page_source,
        "AlertTriangle": "AlertTriangle" in page_source or "alert-triangle" in page_source,
    }
    
    print("\n🔍 KEYWORD SEARCH RESULTS:")
    print("-" * 60)
    for keyword, found in keywords.items():
        status = "✅" if found else "❌"
        print(f"{status} '{keyword}': {found}")
    
    # Save screenshot
    driver.save_screenshot("test_screenshots/settings_cache_cleared.png")
    print(f"\n📸 Screenshot saved: test_screenshots/settings_cache_cleared.png")
    
    # Save page source
    with open("settings_page_fresh.html", "w") as f:
        f.write(page_source)
    print(f"📄 Page source saved: settings_page_fresh.html")
    
    # Check if warning div exists
    try:
        warning_div = driver.find_element(By.XPATH, "//*[contains(text(), 'Security Warning')]")
        print(f"\n✅ SUCCESS: Security warning element found!")
        print(f"   Text: {warning_div.text[:100]}...")
    except:
        print(f"\n❌ FAIL: Security warning element NOT found in DOM")
        
        # Debug: Print what's actually in the API Credentials section
        try:
            api_section = driver.find_element(By.XPATH, "//*[contains(text(), 'API Credentials')]")
            parent = api_section.find_element(By.XPATH, "..")
            print(f"\n🔍 API Credentials section HTML:")
            print(parent.get_attribute('outerHTML')[:500])
        except Exception as e:
            print(f"   Could not find API Credentials section: {e}")
    
    print("\n" + "=" * 60)
    
finally:
    driver.quit()

