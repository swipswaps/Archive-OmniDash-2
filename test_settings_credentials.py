#!/usr/bin/env python3
"""
Test Settings API Credentials Persistence
Verifies that access key and secret key persist after save
"""

import time
import subprocess
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys

class SettingsCredentialsTest:
    def __init__(self):
        self.screenshot_dir = 'settings_test'
        os.makedirs(self.screenshot_dir, exist_ok=True)
        self.driver = None
        
    def setup_driver(self):
        options = webdriver.ChromeOptions()
        options.add_argument('--start-maximized')
        self.driver = webdriver.Chrome(options=options)
        print("✅ Chrome driver initialized")
        
    def take_screenshot(self, name):
        filepath = f"{self.screenshot_dir}/{name}.png"
        self.driver.save_screenshot(filepath)
        print(f"📸 {name}.png")
        return filepath
    
    def test_credentials_persistence(self):
        """Test that credentials persist after save"""
        print("\n" + "="*60)
        print("🧪 Testing API Credentials Persistence")
        print("="*60)
        
        self.driver.get('http://localhost:3001')
        time.sleep(3)
        
        # Navigate to Settings
        print("\n1️⃣ Navigating to Settings...")
        settings_btn = WebDriverWait(self.driver, 10).until(
            EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Settings')]"))
        )
        settings_btn.click()
        time.sleep(2)
        
        self.take_screenshot('01_settings_page')
        
        # Find input fields
        print("\n2️⃣ Finding input fields...")
        access_key_input = self.driver.find_element(By.XPATH, "//input[@type='text' and contains(@placeholder, 'Access Key')]")
        secret_key_input = self.driver.find_element(By.XPATH, "//input[@type='password']")
        
        # Enter test credentials
        test_access_key = "TEST_ACCESS_KEY_12345"
        test_secret_key = "TEST_SECRET_KEY_67890"
        
        print(f"\n3️⃣ Entering credentials...")
        print(f"   Access Key: {test_access_key}")
        print(f"   Secret Key: {test_secret_key}")
        
        access_key_input.clear()
        access_key_input.send_keys(test_access_key)
        
        secret_key_input.clear()
        secret_key_input.send_keys(test_secret_key)
        
        time.sleep(1)
        self.take_screenshot('02_credentials_entered')
        
        # Click Save
        print("\n4️⃣ Clicking Save button...")
        save_btn = self.driver.find_element(By.XPATH, "//button[contains(., 'Save')]")
        save_btn.click()
        time.sleep(3)  # Wait for save
        
        self.take_screenshot('03_after_save')
        
        # Check if credentials are still in the fields
        print("\n5️⃣ Checking if credentials persisted...")
        access_key_value = access_key_input.get_attribute('value')
        secret_key_value = secret_key_input.get_attribute('value')
        
        print(f"   Access Key in field: '{access_key_value}'")
        print(f"   Secret Key in field: '{secret_key_value}'")
        
        if access_key_value == test_access_key:
            print("   ✅ Access Key PERSISTED")
        else:
            print(f"   ❌ Access Key CLEARED (expected: {test_access_key}, got: '{access_key_value}')")
        
        if secret_key_value == test_secret_key:
            print("   ✅ Secret Key PERSISTED")
        else:
            print(f"   ❌ Secret Key CLEARED (expected: {test_secret_key}, got: '{secret_key_value}')")
        
        # Navigate away and back
        print("\n6️⃣ Navigating away and back to test persistence...")
        home_btn = self.driver.find_element(By.XPATH, "//button[contains(., 'Home')]")
        home_btn.click()
        time.sleep(2)
        
        settings_btn = self.driver.find_element(By.XPATH, "//button[contains(., 'Settings')]")
        settings_btn.click()
        time.sleep(2)
        
        self.take_screenshot('04_returned_to_settings')
        
        # Check again
        access_key_input = self.driver.find_element(By.XPATH, "//input[@type='text' and contains(@placeholder, 'Access Key')]")
        secret_key_input = self.driver.find_element(By.XPATH, "//input[@type='password']")
        
        access_key_value_after = access_key_input.get_attribute('value')
        secret_key_value_after = secret_key_input.get_attribute('value')
        
        print(f"   Access Key after navigation: '{access_key_value_after}'")
        print(f"   Secret Key after navigation: '{secret_key_value_after}'")
        
        if access_key_value_after == test_access_key:
            print("   ✅ Access Key PERSISTED after navigation")
        else:
            print(f"   ❌ Access Key LOST after navigation")
        
        if secret_key_value_after == test_secret_key:
            print("   ✅ Secret Key PERSISTED after navigation")
        else:
            print(f"   ❌ Secret Key LOST after navigation")
        
        # Summary
        print("\n" + "="*60)
        print("📊 Test Results")
        print("="*60)
        
        immediate_persist = (access_key_value == test_access_key and secret_key_value == test_secret_key)
        navigation_persist = (access_key_value_after == test_access_key and secret_key_value_after == test_secret_key)
        
        if immediate_persist and navigation_persist:
            print("✅ PASSED: Credentials persist correctly")
        elif immediate_persist and not navigation_persist:
            print("⚠️  PARTIAL: Credentials persist immediately but lost after navigation")
        elif not immediate_persist:
            print("❌ FAILED: Credentials cleared immediately after save")
        
        print("\n⚠️  Press Enter to close browser...")
        input()
        
    def run(self):
        try:
            self.setup_driver()
            self.test_credentials_persistence()
        finally:
            if self.driver:
                self.driver.quit()

if __name__ == '__main__':
    test = SettingsCredentialsTest()
    test.run()

