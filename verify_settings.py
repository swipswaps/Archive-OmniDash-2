#!/usr/bin/env python3
"""Quick verification of Settings page content"""

import time
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options

chrome_options = Options()
chrome_options.add_argument('--headless')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--window-size=1920,1080')

driver = webdriver.Chrome(options=chrome_options)

try:
    driver.get("http://localhost:3001")
    time.sleep(2)
    
    # Click Settings
    settings_btn = WebDriverWait(driver, 5).until(
        EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Settings') or contains(text(), 'Configuration')]"))
    )
    settings_btn.click()
    time.sleep(2)
    
    # Get all text content
    body_text = driver.find_element(By.TAG_NAME, "body").text
    
    print("=" * 60)
    print("SETTINGS PAGE CONTENT")
    print("=" * 60)
    print(body_text)
    print("\n" + "=" * 60)
    
    # Check for specific keywords
    keywords = ["Security Warning", "localStorage", "unencrypted", "public", "shared", "API Credentials"]
    print("\nKEYWORD SEARCH:")
    print("-" * 60)
    for keyword in keywords:
        found = keyword in body_text
        status = "✅" if found else "❌"
        print(f"{status} '{keyword}': {found}")
    
    # Save page source
    with open("/home/owner/Documents/Archive-Omnidash-2/settings_page_source.html", "w") as f:
        f.write(driver.page_source)
    print("\n📄 Page source saved to: settings_page_source.html")
    
finally:
    driver.quit()
