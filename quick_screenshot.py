#!/usr/bin/env python3
"""Quick screenshot test"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
import time
import sys

chrome_options = Options()
chrome_options.add_argument('--headless=new')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')

print("🚀 Starting Chrome...")
driver = webdriver.Chrome(options=chrome_options)
driver.set_page_load_timeout(10)

try:
    print("📡 Loading http://localhost:3001...")
    driver.get("http://localhost:3001")
    print("✅ Page loaded")
    
    time.sleep(3)
    
    # Take screenshot of homepage
    driver.save_screenshot("test_screenshots/homepage.png")
    print("📸 Homepage screenshot saved")
    
    # Click Settings
    print("🖱️  Clicking Settings...")
    settings_btn = driver.find_element(By.XPATH, "//button[.//span[text()='Settings']]")
    settings_btn.click()
    time.sleep(3)
    
    # Take screenshot of Settings page
    driver.save_screenshot("test_screenshots/settings_final.png")
    print("📸 Settings screenshot saved")
    
    # Get page text
    page_text = driver.find_element(By.TAG_NAME, "body").text
    
    # Check for keywords
    print("\n🔍 Checking for security warning keywords:")
    keywords = ["Security Warning", "localStorage", "unencrypted", "public", "shared"]
    for kw in keywords:
        found = kw in page_text
        status = "✅" if found else "❌"
        print(f"  {status} '{kw}': {found}")
    
    # Save page source
    with open("settings_selenium_final.html", "w") as f:
        f.write(driver.page_source)
    print("\n📄 Page source saved to: settings_selenium_final.html")
    
    print("\n✅ Test complete!")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    driver.save_screenshot("test_screenshots/error.png")
    sys.exit(1)
finally:
    driver.quit()

