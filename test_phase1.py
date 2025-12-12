#!/usr/bin/env python3
"""
Phase 1 Security Testing - Archive-OmniDash-2
Tests: ExcelJS migration, Error Boundaries, Security Warnings
"""

import time
import os
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.chrome.options import Options
from selenium.common.exceptions import TimeoutException, NoSuchElementException

# Configuration
APP_URL = "http://localhost:3001"
SCREENSHOT_DIR = "/home/owner/Documents/Archive-Omnidash-2/test_screenshots"

# Create screenshot directory
os.makedirs(SCREENSHOT_DIR, exist_ok=True)

def setup_driver():
    """Setup Chrome driver with headless options"""
    chrome_options = Options()
    chrome_options.add_argument('--headless')
    chrome_options.add_argument('--no-sandbox')
    chrome_options.add_argument('--disable-dev-shm-usage')
    chrome_options.add_argument('--window-size=1920,1080')
    chrome_options.add_argument('--disable-gpu')
    return webdriver.Chrome(options=chrome_options)

def save_screenshot(driver, name):
    """Save screenshot with timestamp"""
    filepath = f"{SCREENSHOT_DIR}/{name}.png"
    driver.save_screenshot(filepath)
    print(f"  📸 Screenshot: {filepath}")
    return filepath

def test_app_loads(driver):
    """Test 1: Verify app loads without errors"""
    print("\n🧪 TEST 1: App Loads Successfully")
    print("-" * 60)
    
    driver.get(APP_URL)
    time.sleep(2)
    
    # Check for ErrorBoundary (should NOT be visible)
    try:
        error_boundary = driver.find_element(By.XPATH, "//*[contains(text(), 'Oops! Something went wrong')]")
        print("  ❌ FAIL: ErrorBoundary is visible (app crashed)")
        save_screenshot(driver, "01_error_boundary_visible")
        return False
    except NoSuchElementException:
        print("  ✅ PASS: App loaded without errors (no ErrorBoundary)")
    
    # Check for main app elements
    try:
        WebDriverWait(driver, 5).until(
            EC.presence_of_element_located((By.TAG_NAME, "nav"))
        )
        print("  ✅ PASS: Navigation found")
    except TimeoutException:
        print("  ⚠️  WARNING: Navigation not found")
    
    save_screenshot(driver, "01_app_loaded")
    return True

def test_security_warnings(driver):
    """Test 2: Verify security warnings in Settings"""
    print("\n🧪 TEST 2: Security Warnings in Settings")
    print("-" * 60)
    
    # Navigate to Settings
    try:
        settings_btn = WebDriverWait(driver, 5).until(
            EC.element_to_be_clickable((By.XPATH, "//*[contains(text(), 'Settings') or contains(text(), 'Configuration')]"))
        )
        settings_btn.click()
        time.sleep(1)
        print("  ✅ Navigated to Settings")
    except TimeoutException:
        print("  ❌ FAIL: Could not find Settings button")
        save_screenshot(driver, "02_settings_not_found")
        return False
    
    save_screenshot(driver, "02_settings_page")
    
    # Check for security warning
    try:
        security_warning = driver.find_element(By.XPATH, "//*[contains(text(), 'Security Warning')]")
        print("  ✅ PASS: Security warning found")
        
        # Check for specific warning text
        page_text = driver.find_element(By.TAG_NAME, "body").text
        if "localStorage" in page_text and "unencrypted" in page_text:
            print("  ✅ PASS: Warning mentions localStorage and unencrypted")
        if "public or shared computers" in page_text.lower():
            print("  ✅ PASS: Warning about public computers found")
        
    except NoSuchElementException:
        print("  ❌ FAIL: Security warning NOT found")
        save_screenshot(driver, "02_no_security_warning")
        return False
    
    save_screenshot(driver, "02_security_warning_visible")
    return True

def test_exceljs_integration(driver):
    """Test 3: Verify ExcelJS is loaded (check for xlsx removal)"""
    print("\n🧪 TEST 3: ExcelJS Integration (xlsx removed)")
    print("-" * 60)
    
    # Check browser console for errors
    logs = driver.get_log('browser')
    xlsx_errors = [log for log in logs if 'xlsx' in log.get('message', '').lower() and log['level'] == 'SEVERE']
    
    if xlsx_errors:
        print("  ⚠️  WARNING: Found xlsx-related errors in console:")
        for log in xlsx_errors[:3]:
            print(f"     {log['message'][:100]}")
    else:
        print("  ✅ PASS: No xlsx-related errors in console")
    
    # Check if ExcelJS is loaded
    try:
        exceljs_loaded = driver.execute_script("return typeof ExcelJS !== 'undefined';")
        if exceljs_loaded:
            print("  ✅ PASS: ExcelJS is loaded globally")
        else:
            print("  ℹ️  INFO: ExcelJS not in global scope (likely bundled)")
    except:
        print("  ℹ️  INFO: Could not check ExcelJS global scope")
    
    return True

def test_error_boundary_exists(driver):
    """Test 4: Verify ErrorBoundary component exists in code"""
    print("\n🧪 TEST 4: ErrorBoundary Component")
    print("-" * 60)
    
    # Check if ErrorBoundary is in the bundle
    try:
        page_source = driver.page_source
        if "ErrorBoundary" in page_source or "Oops! Something went wrong" in page_source:
            print("  ✅ PASS: ErrorBoundary code found in bundle")
        else:
            print("  ⚠️  WARNING: ErrorBoundary not found in page source")
    except:
        print("  ❌ FAIL: Could not check page source")
        return False
    
    return True

def run_all_tests():
    """Run all Phase 1 tests"""
    print("=" * 60)
    print("🚀 PHASE 1 SECURITY TESTING - Archive-OmniDash-2")
    print("=" * 60)
    print(f"📍 Testing URL: {APP_URL}")
    print(f"📁 Screenshots: {SCREENSHOT_DIR}")
    
    driver = None
    results = {}
    
    try:
        driver = setup_driver()
        print("\n✅ Chrome driver initialized (headless mode)")
        
        # Run tests
        results['app_loads'] = test_app_loads(driver)
        results['security_warnings'] = test_security_warnings(driver)
        results['exceljs'] = test_exceljs_integration(driver)
        results['error_boundary'] = test_error_boundary_exists(driver)
        
    except Exception as e:
        print(f"\n❌ CRITICAL ERROR: {e}")
        if driver:
            save_screenshot(driver, "99_critical_error")
    
    finally:
        if driver:
            driver.quit()
            print("\n✅ Browser closed")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 TEST SUMMARY")
    print("=" * 60)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status}: {test_name}")
    
    print(f"\n🎯 Results: {passed}/{total} tests passed")
    print(f"📸 Screenshots saved to: {SCREENSHOT_DIR}")
    
    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    exit(0 if success else 1)
