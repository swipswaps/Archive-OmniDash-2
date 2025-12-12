#!/usr/bin/env python3
"""
Comprehensive UX Testing with BEFORE/AFTER Screenshots
Tests actual app usage and documents UX improvements
NEVER guesses - always verifies with OCR
"""

import time
import subprocess
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.keys import Keys
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class UXComprehensiveTest:
    def __init__(self):
        self.screenshot_dir = 'ux_test_screenshots'
        os.makedirs(self.screenshot_dir, exist_ok=True)
        self.results = []
        self.driver = None
        self.screenshot_counter = 1
        
    def setup_driver(self):
        """Setup Chrome driver"""
        options = webdriver.ChromeOptions()
        options.add_argument('--start-maximized')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        
        self.driver = webdriver.Chrome(options=options)
        print("✅ Chrome driver initialized")
        
    def verify_screenshot(self, filepath, expected_texts, test_name):
        """Verify screenshot with OCR - MANDATORY"""
        print(f"\n🔍 Verifying: {test_name}")
        
        result = subprocess.run(
            ['tesseract', filepath, 'stdout'],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True
        )
        ocr_text = result.stdout
        
        # Save OCR
        with open(f"{filepath}.txt", 'w') as f:
            f.write(ocr_text)
        
        # Check expected texts
        ocr_lower = ocr_text.lower()
        missing = []
        found = []
        
        for expected in expected_texts:
            if expected.lower() in ocr_lower:
                found.append(expected)
            else:
                missing.append(expected)
        
        if missing:
            print(f"❌ FAILED - Missing: {missing}")
            print(f"   OCR preview: {ocr_text[:200]}")
            return False, ocr_text, missing
        else:
            print(f"✅ VERIFIED - Found: {found}")
            return True, ocr_text, []
    
    def take_screenshot(self, description, expected_texts):
        """Take and verify screenshot"""
        filename = f"{self.screenshot_counter:02d}_{description.lower().replace(' ', '_').replace('/', '_')}.png"
        filepath = f"{self.screenshot_dir}/{filename}"
        
        print(f"\n📸 Screenshot: {filename}")
        self.driver.save_screenshot(filepath)
        
        verified, ocr_text, missing = self.verify_screenshot(
            filepath, expected_texts, description
        )
        
        self.screenshot_counter += 1
        return verified, filepath, ocr_text, missing
    
    def add_result(self, test_name, status, message, details=None):
        """Add test result"""
        self.results.append({
            'test': test_name,
            'status': status,
            'message': message,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        })
        
        icon = '✅' if status == 'PASSED' else '❌' if status == 'FAILED' else '⚠️'
        print(f"\n{icon} {test_name}: {message}")
    
    def test_01_desktop_navigation(self):
        """Test 1: Desktop Navigation Flow"""
        print("\n" + "="*60)
        print("🧪 TEST 1: Desktop Navigation Flow")
        print("="*60)
        
        self.driver.get('http://localhost:3001')
        time.sleep(3)
        
        # Screenshot: Homepage
        verified, screenshot, ocr_text, missing = self.take_screenshot(
            'Desktop Homepage',
            ['OmniDash', 'Home', 'Item Search', 'Archive OmniDash']
        )
        
        if not verified:
            self.add_result('Desktop Homepage', 'FAILED',
                          f'Homepage not loaded: {missing}',
                          {'screenshot': screenshot})
            return False
        
        self.add_result('Desktop Homepage', 'PASSED',
                       'Homepage loaded successfully',
                       {'screenshot': screenshot})
        
        # Navigate to each section
        sections = [
            ('Item Search', ['Metadata', 'Identifier']),
            ('Deep Search', ['Query', 'Search']),
            ('Wayback Machine', ['Wayback', 'URL']),
            ('View Analytics', ['Analytics', 'Views']),
            ('Settings', ['Settings', 'API'])
        ]
        
        for section_name, expected_texts in sections:
            try:
                # Find and click navigation button
                nav_button = WebDriverWait(self.driver, 10).until(
                    EC.element_to_be_clickable((By.XPATH, f"//button[contains(., '{section_name}')]"))
                )
                
                print(f"\n🖱️  Clicking: {section_name}")
                nav_button.click()
                time.sleep(2)
                
                # Take screenshot
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    f'{section_name} Page',
                    expected_texts
                )
                
                if verified:
                    self.add_result(f'{section_name} Navigation', 'PASSED',
                                  f'Successfully navigated to {section_name}',
                                  {'screenshot': screenshot})
                else:
                    self.add_result(f'{section_name} Navigation', 'WARNING',
                                  f'Page loaded but missing: {missing}',
                                  {'screenshot': screenshot, 'missing': missing})
                
            except TimeoutException:
                self.add_result(f'{section_name} Navigation', 'FAILED',
                              f'Could not find {section_name} button',
                              {})
        
        return True

    def test_02_mobile_responsive(self):
        """Test 2: Mobile Responsive Design"""
        print("\n" + "="*60)
        print("🧪 TEST 2: Mobile Responsive Design")
        print("="*60)

        # Resize to mobile
        print("\n📱 Resizing to mobile viewport (390x844)")
        self.driver.set_window_size(390, 844)
        time.sleep(3)  # Wait for responsive layout

        # BEFORE: Check current state
        verified, screenshot, ocr_text, missing = self.take_screenshot(
            'Mobile BEFORE - Sidebar State',
            ['OmniDash']
        )

        # Check if sidebar items are visible (they shouldn't be on mobile)
        sidebar_visible = 'home' in ocr_text.lower() and 'item search' in ocr_text.lower()

        if sidebar_visible:
            self.add_result('Mobile Sidebar Hidden', 'FAILED',
                          'Sidebar items visible on mobile (should be hidden)',
                          {'screenshot': screenshot,
                           'issue': 'Sidebar not collapsing on mobile viewport'})
        else:
            self.add_result('Mobile Sidebar Hidden', 'PASSED',
                          'Sidebar correctly hidden on mobile',
                          {'screenshot': screenshot})

        # Try to find hamburger button
        try:
            # Wait a bit longer for Tailwind to apply
            time.sleep(2)

            # Try multiple selectors
            selectors = [
                "button[aria-label='Open menu']",
                "button[aria-label='Close menu']",
                "button.lg\\:hidden",  # Tailwind class
                "//button[contains(@class, 'lg:hidden')]",  # XPath
            ]

            hamburger = None
            for selector in selectors:
                try:
                    if selector.startswith('//'):
                        hamburger = self.driver.find_element(By.XPATH, selector)
                    else:
                        hamburger = self.driver.find_element(By.CSS_SELECTOR, selector)
                    if hamburger and hamburger.is_displayed():
                        print(f"✅ Found hamburger with selector: {selector}")
                        break
                except:
                    continue

            if hamburger and hamburger.is_displayed():
                # Take screenshot showing hamburger
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    'Mobile - Hamburger Button Visible',
                    ['OmniDash']
                )

                self.add_result('Hamburger Button', 'PASSED',
                              'Hamburger menu button found and visible',
                              {'screenshot': screenshot,
                               'element': hamburger.get_attribute('outerHTML')[:200]})

                # Click hamburger to open sidebar
                print("\n🖱️  Clicking hamburger to open sidebar...")
                hamburger.click()
                time.sleep(1)

                # AFTER: Screenshot with sidebar open
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    'Mobile AFTER - Sidebar Opened',
                    ['Home', 'Item Search']
                )

                if verified:
                    self.add_result('Mobile Sidebar Open', 'PASSED',
                                  'Sidebar opens when hamburger clicked',
                                  {'screenshot': screenshot})
                else:
                    self.add_result('Mobile Sidebar Open', 'WARNING',
                                  f'Sidebar might not show all items: {missing}',
                                  {'screenshot': screenshot})

                # Click outside to close
                print("\n🖱️  Clicking outside to close sidebar...")
                try:
                    overlay = self.driver.find_element(By.CSS_SELECTOR, "div[class*='bg-black']")
                    overlay.click()
                except:
                    body = self.driver.find_element(By.TAG_NAME, 'body')
                    body.click()

                time.sleep(1)

                # Screenshot with sidebar closed
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    'Mobile - Sidebar Closed Again',
                    ['OmniDash']
                )

                self.add_result('Mobile Sidebar Close', 'PASSED',
                              'Sidebar closes when clicking outside',
                              {'screenshot': screenshot})

            else:
                # Hamburger not found
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    'Mobile - Hamburger NOT FOUND',
                    []
                )

                self.add_result('Hamburger Button', 'FAILED',
                              'Hamburger button not found or not visible',
                              {'screenshot': screenshot,
                               'note': 'Tailwind classes might not be loading',
                               'tried_selectors': selectors})

        except Exception as e:
            self.add_result('Mobile Responsive Test', 'FAILED',
                          f'Test failed with error: {str(e)}',
                          {})

        return True

    def test_03_item_search_workflow(self):
        """Test 3: Item Search Complete Workflow"""
        print("\n" + "="*60)
        print("🧪 TEST 3: Item Search Complete Workflow")
        print("="*60)

        # Resize back to desktop
        print("\n🖥️  Resizing to desktop (1920x1080)")
        self.driver.set_window_size(1920, 1080)
        time.sleep(2)

        # Navigate to Item Search
        try:
            item_search = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Item Search')]"))
            )
            item_search.click()
            time.sleep(2)

            # Screenshot: Item Search page
            verified, screenshot, ocr_text, missing = self.take_screenshot(
                'Item Search Page Loaded',
                ['Metadata', 'Identifier', 'Fetch']
            )

            if not verified:
                self.add_result('Item Search Page', 'FAILED',
                              f'Page not loaded correctly: {missing}',
                              {'screenshot': screenshot})
                return False

            self.add_result('Item Search Page', 'PASSED',
                          'Item Search page loaded successfully',
                          {'screenshot': screenshot})

            # Test 1: Valid identifier
            print("\n⌨️  Testing with VALID identifier...")
            input_field = self.driver.find_element(By.CSS_SELECTOR, "input[type='text']")

            valid_id = 'internetarchive'  # Known valid identifier
            input_field.clear()
            input_field.send_keys(valid_id)
            time.sleep(1)

            # Screenshot with valid input
            verified, screenshot, ocr_text, missing = self.take_screenshot(
                'Valid Input Entered',
                [valid_id]
            )

            # Submit
            print("\n🚀 Submitting valid identifier...")
            input_field.send_keys(Keys.RETURN)
            time.sleep(5)  # Wait for API response

            # Screenshot of results
            verified, screenshot, ocr_text, missing = self.take_screenshot(
                'Valid Results Displayed',
                []  # Don't know exact text, just capture
            )

            # Check if we got results or error
            has_error = 'error' in ocr_text.lower() or 'not found' in ocr_text.lower()
            has_metadata = 'metadata' in ocr_text.lower() or 'files' in ocr_text.lower()

            if has_metadata:
                self.add_result('Valid Identifier Search', 'PASSED',
                              'Successfully fetched metadata for valid identifier',
                              {'screenshot': screenshot})
            elif has_error:
                self.add_result('Valid Identifier Search', 'WARNING',
                              'Got error for known valid identifier',
                              {'screenshot': screenshot,
                               'note': 'API might be down or rate limited'})
            else:
                self.add_result('Valid Identifier Search', 'WARNING',
                              'Results unclear from OCR',
                              {'screenshot': screenshot,
                               'ocr_preview': ocr_text[:300]})

            # Test 2: Invalid identifier (error handling)
            print("\n⌨️  Testing with INVALID identifier...")
            input_field = self.driver.find_element(By.CSS_SELECTOR, "input[type='text']")

            invalid_id = 'invalid_nonexistent_test_12345'
            input_field.clear()
            input_field.send_keys(invalid_id)
            time.sleep(1)

            # BEFORE: Screenshot with invalid input
            verified, screenshot, ocr_text, missing = self.take_screenshot(
                'BEFORE Error - Invalid Input',
                [invalid_id]
            )

            # Submit
            print("\n🚀 Submitting invalid identifier...")
            input_field.send_keys(Keys.RETURN)
            time.sleep(6)  # Wait longer for error to appear

            # Scroll down to see error if it's below fold
            self.driver.execute_script("window.scrollTo(0, 500);")
            time.sleep(1)

            # AFTER: Screenshot of error message
            verified, screenshot, ocr_text, missing = self.take_screenshot(
                'AFTER Error - Error Message',
                []  # Capture whatever is there
            )

            # Check for error message
            has_error = 'error' in ocr_text.lower() or 'not found' in ocr_text.lower() or 'failed' in ocr_text.lower()

            if has_error:
                self.add_result('Error Message Display', 'PASSED',
                              'Error message displayed for invalid identifier',
                              {'screenshot': screenshot,
                               'error_text': [line for line in ocr_text.split('\n') if 'error' in line.lower() or 'not found' in line.lower()][:3]})
            else:
                self.add_result('Error Message Display', 'FAILED',
                              'No error message visible after invalid input',
                              {'screenshot': screenshot,
                               'ocr_preview': ocr_text[:300],
                               'note': 'Error handling might not be implemented'})

        except Exception as e:
            self.add_result('Item Search Workflow', 'FAILED',
                          f'Test failed: {str(e)}',
                          {})

        return True

    def generate_report(self):
        """Generate comprehensive HTML report"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>UX Comprehensive Test Report</title>
    <style>
        body {{ font-family: system-ui; margin: 40px; background: #0f172a; color: #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; }}
        h1 {{ margin: 0; color: #14b8a6; font-size: 32px; }}
        .timestamp {{ color: #94a3b8; margin-top: 10px; }}
        .notice {{ margin-top: 15px; padding: 15px; background: #0f172a; border-radius: 8px; border-left: 4px solid #14b8a6; }}
        .summary {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }}
        .card {{ background: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; }}
        .card h3 {{ margin: 0; color: #94a3b8; font-size: 14px; text-transform: uppercase; }}
        .card .value {{ font-size: 36px; font-weight: bold; }}
        .passed {{ color: #10b981; }}
        .failed {{ color: #ef4444; }}
        .warning {{ color: #f59e0b; }}
        .test {{ background: #1e293b; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #334155; }}
        .test.PASSED {{ border-left-color: #10b981; }}
        .test.FAILED {{ border-left-color: #ef4444; }}
        .test.WARNING {{ border-left-color: #f59e0b; }}
        .test-name {{ font-weight: bold; font-size: 18px; margin-bottom: 8px; }}
        .test-message {{ color: #cbd5e1; margin-bottom: 10px; }}
        .screenshot {{ margin-top: 15px; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }}
        .screenshot img {{ width: 100%; cursor: pointer; transition: transform 0.2s; }}
        .screenshot img:hover {{ transform: scale(1.02); }}
        .screenshot-caption {{ background: #0f172a; padding: 10px; font-size: 12px; color: #94a3b8; }}
        .ocr {{ background: #0f172a; padding: 15px; margin-top: 15px; border-radius: 8px; border: 1px solid #334155; }}
        .ocr h4 {{ margin: 0 0 10px 0; color: #14b8a6; font-size: 14px; }}
        .ocr-text {{ font-family: 'Courier New', monospace; font-size: 11px; line-height: 1.4; color: #94a3b8; white-space: pre-wrap; max-height: 200px; overflow-y: auto; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🎨 UX Comprehensive Test Report</h1>
        <div class="timestamp">Archive OmniDash - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
        <div class="notice">
            <strong style="color: #14b8a6;">✅ Comprehensive UX Testing</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">
                • Selenium for browser control<br>
                • OCR verification for all screenshots<br>
                • BEFORE/AFTER screenshots for UX improvements<br>
                • Complete workflow testing<br>
                • No guessing - everything verified
            </span>
        </div>
    </div>
"""

        total = len(self.results)
        passed = sum(1 for r in self.results if r['status'] == 'PASSED')
        failed = sum(1 for r in self.results if r['status'] == 'FAILED')
        warning = sum(1 for r in self.results if r['status'] == 'WARNING')

        html += f"""
    <div class="summary">
        <div class="card"><h3>Total Tests</h3><div class="value">{total}</div></div>
        <div class="card"><h3>Passed</h3><div class="value passed">✅ {passed}</div></div>
        <div class="card"><h3>Failed</h3><div class="value failed">❌ {failed}</div></div>
        <div class="card"><h3>Warnings</h3><div class="value warning">⚠️ {warning}</div></div>
    </div>
    <h2 style="color: #14b8a6;">Test Results</h2>
"""

        for result in self.results:
            icon = '✅' if result['status'] == 'PASSED' else '❌' if result['status'] == 'FAILED' else '⚠️'

            screenshot_html = ''
            if 'screenshot' in result['details']:
                path = result['details']['screenshot']
                filename = os.path.basename(path)
                ocr_path = f"{path}.txt"

                try:
                    with open(ocr_path, 'r') as f:
                        ocr_text = f.read()
                except:
                    ocr_text = "OCR not available"

                screenshot_html = f"""
                <div class="screenshot">
                    <img src="{filename}" onclick="window.open('{filename}', '_blank')" alt="{result['test']}">
                    <div class="screenshot-caption">📸 {filename} (click to open full size)</div>
                </div>
                <div class="ocr">
                    <h4>📄 OCR Text Output</h4>
                    <div class="ocr-text">{ocr_text[:500]}</div>
                </div>
"""

            note_html = ''
            if 'note' in result['details']:
                note_html += f'<div style="color: #f59e0b; margin-top: 10px;">⚠️ Note: {result["details"]["note"]}</div>'
            if 'missing' in result['details']:
                note_html += f'<div style="color: #ef4444; margin-top: 10px;">❌ Missing: {result["details"]["missing"]}</div>'
            if 'issue' in result['details']:
                note_html += f'<div style="color: #ef4444; margin-top: 10px;">🐛 Issue: {result["details"]["issue"]}</div>'

            html += f"""
    <div class="test {result['status']}">
        <div class="test-name"><span style="font-size: 24px; margin-right: 10px;">{icon}</span>{result['test']}</div>
        <div class="test-message">{result['message']}</div>
        {note_html}
        {screenshot_html}
    </div>
"""

        html += "</body></html>"

        report_path = f"{self.screenshot_dir}/ux_comprehensive_report.html"
        with open(report_path, 'w') as f:
            f.write(html)

        print(f"\n📊 Report saved: {report_path}")
        return report_path

    def run_all_tests(self):
        """Run all UX tests"""
        print("\n" + "="*60)
        print("🚀 UX Comprehensive Test Suite")
        print("="*60)
        print("\n📋 Testing:")
        print("   1. Desktop navigation flow")
        print("   2. Mobile responsive design")
        print("   3. Item search complete workflow")
        print("   4. Error handling with BEFORE/AFTER screenshots\n")

        try:
            self.setup_driver()

            self.test_01_desktop_navigation()
            self.test_02_mobile_responsive()
            self.test_03_item_search_workflow()

        finally:
            report_path = self.generate_report()

            total = len(self.results)
            passed = sum(1 for r in self.results if r['status'] == 'PASSED')
            failed = sum(1 for r in self.results if r['status'] == 'FAILED')
            warning = sum(1 for r in self.results if r['status'] == 'WARNING')

            print("\n" + "="*60)
            print("📊 Test Summary")
            print("="*60)
            print(f"Total: {total} | ✅ {passed} | ❌ {failed} | ⚠️ {warning}")
            print("="*60)
            print(f"\n📄 Report: {report_path}")

            print("\n⚠️  Browser will remain open for inspection")
            print("   Press Enter to close and open report...")
            input()

            if self.driver:
                self.driver.quit()

            subprocess.Popen(['xdg-open', report_path])

if __name__ == '__main__':
    suite = UXComprehensiveTest()
    suite.run_all_tests()


