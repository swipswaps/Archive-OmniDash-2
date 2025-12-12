#!/usr/bin/env python3
"""
Test backend integration and capture screenshots for documentation
"""
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time
import subprocess
import os

# Create screenshots directory
os.makedirs("docs/screenshots", exist_ok=True)

chrome_options = Options()
chrome_options.add_argument('--headless=new')
chrome_options.add_argument('--no-sandbox')
chrome_options.add_argument('--disable-dev-shm-usage')
chrome_options.add_argument('--window-size=1920,1080')

driver = webdriver.Chrome(options=chrome_options)
wait = WebDriverWait(driver, 10)

try:
    print("🧪 Testing Backend Integration...")
    print("=" * 60)
    
    # Navigate to app
    driver.get("http://localhost:3001")
    time.sleep(3)
    
    # Click Settings
    print("\n1️⃣  Navigating to Settings...")
    settings_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Settings']]")))
    settings_btn.click()
    time.sleep(2)
    
    # Scroll to API Credentials section
    print("2️⃣  Scrolling to API Credentials section...")
    api_section = driver.find_element(By.XPATH, "//*[contains(text(), 'API Credentials')]")
    driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", api_section)
    time.sleep(1)
    
    # Capture full settings page
    driver.save_screenshot("docs/screenshots/after_backend_settings_full.png")
    print("✅ Saved: docs/screenshots/after_backend_settings_full.png")
    
    # Find and capture the security status box
    print("\n3️⃣  Analyzing security status...")
    status_boxes = driver.find_elements(By.XPATH, "//div[contains(@class, 'bg-green') or contains(@class, 'bg-red')]")
    
    for i, box in enumerate(status_boxes):
        text = box.text
        if "Backend" in text or "Secure" in text or "Credentials" in text:
            box.screenshot(f"docs/screenshots/after_security_status_{i}.png")
            print(f"✅ Saved: docs/screenshots/after_security_status_{i}.png")
            
            # OCR the status
            print(f"\n📝 Security Status Text (Box {i}):")
            result = subprocess.run(
                ["tesseract", f"docs/screenshots/after_security_status_{i}.png", "stdout"],
                capture_output=True,
                text=True
            )
            print(result.stdout[:600])
            print("-" * 60)
    
    # Test credential input fields
    print("\n4️⃣  Testing credential input fields...")
    access_key_input = driver.find_element(By.XPATH, "//input[@placeholder[contains(., 'Access Key')]]")
    secret_key_input = driver.find_element(By.XPATH, "//input[@type='password']")
    
    # Check if inputs are enabled (backend available) or disabled (backend unavailable)
    access_enabled = access_key_input.is_enabled()
    secret_enabled = secret_key_input.is_enabled()
    
    print(f"   Access Key Input: {'✅ Enabled' if access_enabled else '❌ Disabled'}")
    print(f"   Secret Key Input: {'✅ Enabled' if secret_enabled else '❌ Disabled'}")
    
    if access_enabled:
        print("\n5️⃣  Backend is available! Testing credential save...")
        
        # Enter test credentials
        access_key_input.clear()
        access_key_input.send_keys("TEST_ACCESS_KEY_12345")
        secret_key_input.clear()
        secret_key_input.send_keys("TEST_SECRET_KEY_67890")
        time.sleep(1)
        
        # Capture with credentials entered
        driver.save_screenshot("docs/screenshots/after_credentials_entered.png")
        print("✅ Saved: docs/screenshots/after_credentials_entered.png")
        
        # Click Save button
        save_btn = driver.find_element(By.XPATH, "//button[contains(., 'Save')]")
        save_btn.click()
        time.sleep(2)
        
        # Capture after save
        driver.save_screenshot("docs/screenshots/after_credentials_saved.png")
        print("✅ Saved: docs/screenshots/after_credentials_saved.png")
        
        # Check for success message
        try:
            success_msg = driver.find_element(By.XPATH, "//*[contains(text(), 'Saved') or contains(text(), 'Success')]")
            print(f"✅ Success message found: {success_msg.text}")
        except:
            print("⚠️  No success message found")
        
        # Refresh page to verify credentials persist
        print("\n6️⃣  Refreshing page to verify persistence...")
        driver.refresh()
        time.sleep(3)
        
        # Navigate back to Settings
        settings_btn = wait.until(EC.element_to_be_clickable((By.XPATH, "//button[.//span[text()='Settings']]")))
        settings_btn.click()
        time.sleep(2)
        
        # Scroll to API section
        api_section = driver.find_element(By.XPATH, "//*[contains(text(), 'API Credentials')]")
        driver.execute_script("arguments[0].scrollIntoView({block: 'center'});", api_section)
        time.sleep(1)
        
        # Capture after refresh
        driver.save_screenshot("docs/screenshots/after_page_refresh.png")
        print("✅ Saved: docs/screenshots/after_page_refresh.png")
        
        # Check for credentials status
        try:
            creds_status = driver.find_element(By.XPATH, "//*[contains(text(), 'Credentials stored') or contains(text(), 'TEST_ACCESS')]")
            print(f"✅ Credentials persisted: {creds_status.text}")
        except:
            print("⚠️  Credentials status not found")
    
    else:
        print("\n⚠️  Backend is NOT available - inputs are disabled")
        print("   This is expected if the backend server is not running")
    
    # Capture footer status
    print("\n7️⃣  Capturing footer status...")
    footer = driver.find_element(By.XPATH, "//div[contains(@class, 'bg-gray-900')]//span[contains(text(), 'Credentials') or contains(text(), 'Backend')]")
    footer.screenshot("docs/screenshots/after_footer_status.png")
    print("✅ Saved: docs/screenshots/after_footer_status.png")
    
    print("\n" + "=" * 60)
    print("✅ Backend integration testing complete!")
    print("📸 Screenshots saved to docs/screenshots/")
    
except Exception as e:
    print(f"\n❌ ERROR: {e}")
    import traceback
    traceback.print_exc()
    driver.save_screenshot("docs/screenshots/error.png")
finally:
    driver.quit()
