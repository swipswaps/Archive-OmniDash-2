#!/usr/bin/env python3
"""
Selenium Test Suite for Phase 1 Improvements
Tests mobile responsiveness, error handling, and UI improvements
"""

import time
import json
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains
from selenium.common.exceptions import TimeoutException, NoSuchElementException

class Phase1TestSuite:
    def __init__(self):
        self.results = {
            'timestamp': datetime.now().isoformat(),
            'tests': [],
            'summary': {
                'total': 0,
                'passed': 0,
                'failed': 0,
                'warnings': 0
            }
        }
        
    def setup_driver(self, mobile=False):
        """Setup Chrome driver with optional mobile viewport"""
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')
        
        if mobile:
            # iPhone 12 Pro viewport
            mobile_emulation = {
                "deviceMetrics": {"width": 390, "height": 844, "pixelRatio": 3.0},
                "userAgent": "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15"
            }
            options.add_experimental_option("mobileEmulation", mobile_emulation)
        
        return webdriver.Chrome(options=options)
    
    def add_result(self, test_name, status, message, details=None):
        """Add test result"""
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'details': details or {}
        }
        self.results['tests'].append(result)
        self.results['summary']['total'] += 1
        self.results['summary'][status] += 1
        
        status_icon = '✅' if status == 'passed' else '❌' if status == 'failed' else '⚠️'
        print(f"{status_icon} {test_name}: {message}")
    
    def test_mobile_sidebar(self):
        """Test 1: Mobile Sidebar Responsiveness"""
        print("\n🧪 Testing Mobile Sidebar...")
        driver = self.setup_driver(mobile=True)

        try:
            driver.get('http://localhost:3001')
            wait = WebDriverWait(driver, 10)
            time.sleep(2)  # Wait for React to hydrate

            # Screenshot 1: Mobile view initial state
            driver.save_screenshot('test_screenshots/01_mobile_initial.png')

            # Check if hamburger menu button exists
            try:
                hamburger = wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'button[aria-label*="menu"]'))
                )

                # Screenshot 2: Hamburger menu visible
                driver.save_screenshot('test_screenshots/02_mobile_hamburger_visible.png')

                self.add_result(
                    'Mobile Hamburger Menu',
                    'passed',
                    'Hamburger menu button found on mobile viewport',
                    {'button_text': hamburger.get_attribute('aria-label'), 'screenshot': '02_mobile_hamburger_visible.png'}
                )
            except TimeoutException:
                driver.save_screenshot('test_screenshots/02_mobile_hamburger_FAILED.png')
                self.add_result(
                    'Mobile Hamburger Menu',
                    'failed',
                    'Hamburger menu button not found on mobile viewport',
                    {'screenshot': '02_mobile_hamburger_FAILED.png'}
                )
                return
            
            # Check if sidebar is hidden by default on mobile
            try:
                sidebar = driver.find_element(By.CSS_SELECTOR, 'aside, div[class*="sidebar"]')
                is_hidden = '-translate-x-full' in sidebar.get_attribute('class')

                # Screenshot 3: Sidebar hidden state
                driver.save_screenshot('test_screenshots/03_mobile_sidebar_hidden.png')

                if is_hidden:
                    self.add_result(
                        'Mobile Sidebar Hidden',
                        'passed',
                        'Sidebar is hidden by default on mobile',
                        {'screenshot': '03_mobile_sidebar_hidden.png'}
                    )
                else:
                    self.add_result(
                        'Mobile Sidebar Hidden',
                        'warning',
                        'Sidebar might be visible on mobile (check transform classes)',
                        {'screenshot': '03_mobile_sidebar_hidden.png'}
                    )
            except NoSuchElementException:
                driver.save_screenshot('test_screenshots/03_mobile_sidebar_FAILED.png')
                self.add_result(
                    'Mobile Sidebar Hidden',
                    'failed',
                    'Sidebar element not found',
                    {'screenshot': '03_mobile_sidebar_FAILED.png'}
                )

            # Test hamburger menu click
            try:
                hamburger.click()
                time.sleep(0.5)  # Wait for animation

                # Screenshot 4: Sidebar opened
                driver.save_screenshot('test_screenshots/04_mobile_sidebar_opened.png')

                # Check if sidebar is now visible
                sidebar = driver.find_element(By.CSS_SELECTOR, 'aside, div[class*="sidebar"]')
                is_visible = 'translate-x-0' in sidebar.get_attribute('class')

                if is_visible:
                    self.add_result(
                        'Mobile Sidebar Toggle',
                        'passed',
                        'Sidebar opens when hamburger menu is clicked',
                        {'screenshot': '04_mobile_sidebar_opened.png'}
                    )
                else:
                    self.add_result(
                        'Mobile Sidebar Toggle',
                        'warning',
                        'Sidebar toggle might not be working (check classes)',
                        {'screenshot': '04_mobile_sidebar_opened.png'}
                    )
            except Exception as e:
                driver.save_screenshot('test_screenshots/04_mobile_sidebar_toggle_FAILED.png')
                self.add_result(
                    'Mobile Sidebar Toggle',
                    'failed',
                    f'Error clicking hamburger menu: {str(e)}',
                    {'screenshot': '04_mobile_sidebar_toggle_FAILED.png'}
                )
                
        finally:
            driver.quit()
    
    def test_desktop_sidebar(self):
        """Test 2: Desktop Sidebar (Always Visible)"""
        print("\n🧪 Testing Desktop Sidebar...")
        driver = self.setup_driver(mobile=False)

        try:
            driver.get('http://localhost:3001')
            driver.set_window_size(1920, 1080)
            wait = WebDriverWait(driver, 10)
            time.sleep(2)  # Wait for React to hydrate

            # Screenshot 5: Desktop view
            driver.save_screenshot('test_screenshots/05_desktop_view.png')

            # Check if sidebar is visible on desktop
            try:
                sidebar = wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'aside, div[class*="sidebar"]'))
                )

                # Screenshot 6: Desktop sidebar visible
                driver.save_screenshot('test_screenshots/06_desktop_sidebar_visible.png')

                # Hamburger should not be visible on desktop
                hamburgers = driver.find_elements(By.CSS_SELECTOR, 'button[aria-label*="menu"]')
                hamburger_hidden = len(hamburgers) == 0 or not hamburgers[0].is_displayed()

                if hamburger_hidden:
                    self.add_result(
                        'Desktop Hamburger Hidden',
                        'passed',
                        'Hamburger menu is hidden on desktop viewport',
                        {'screenshot': '06_desktop_sidebar_visible.png'}
                    )
                else:
                    driver.save_screenshot('test_screenshots/06_desktop_hamburger_WARNING.png')
                    self.add_result(
                        'Desktop Hamburger Hidden',
                        'warning',
                        'Hamburger menu might be visible on desktop',
                        {'screenshot': '06_desktop_hamburger_WARNING.png'}
                    )

            except TimeoutException:
                driver.save_screenshot('test_screenshots/06_desktop_sidebar_FAILED.png')
                self.add_result(
                    'Desktop Sidebar',
                    'failed',
                    'Sidebar not found on desktop viewport',
                    {'screenshot': '06_desktop_sidebar_FAILED.png'}
                )

        finally:
            driver.quit()

    def test_error_handling(self):
        """Test 3: Enhanced Error Handling"""
        print("\n🧪 Testing Error Handling...")
        driver = self.setup_driver(mobile=False)

        try:
            driver.get('http://localhost:3001')
            wait = WebDriverWait(driver, 10)
            time.sleep(2)  # Wait for React to hydrate

            # Screenshot 7: Initial state
            driver.save_screenshot('test_screenshots/07_error_test_initial.png')

            # Navigate to Metadata Explorer
            try:
                metadata_link = wait.until(
                    EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Item Search')]"))
                )
                metadata_link.click()
                time.sleep(1)

                # Screenshot 8: Metadata Explorer page
                driver.save_screenshot('test_screenshots/08_metadata_explorer.png')

                # Try to fetch invalid item to trigger error
                input_field = wait.until(
                    EC.presence_of_element_located((By.CSS_SELECTOR, 'input[type="text"]'))
                )
                input_field.send_keys('invalid_item_12345_nonexistent')

                # Screenshot 9: Input entered
                driver.save_screenshot('test_screenshots/09_invalid_input_entered.png')

                # Click search button
                search_button = driver.find_element(By.CSS_SELECTOR, 'button[type="submit"]')
                search_button.click()

                time.sleep(3)  # Wait for error to appear

                # Screenshot 10: Error displayed
                driver.save_screenshot('test_screenshots/10_error_displayed.png')

                # Check for enhanced error message
                try:
                    error_element = driver.find_element(By.CSS_SELECTOR, '[class*="red"]')
                    error_text = error_element.text

                    # Check for retry button
                    retry_buttons = driver.find_elements(By.XPATH, "//button[contains(., 'Retry')]")
                    has_retry = len(retry_buttons) > 0

                    # Check for suggestions
                    has_suggestions = '💡' in error_text or 'Try:' in error_text or 'suggestion' in error_text.lower()

                    if has_retry and has_suggestions:
                        self.add_result(
                            'Enhanced Error Messages',
                            'passed',
                            'Error has retry button and suggestions',
                            {'error_preview': error_text[:100], 'screenshot': '10_error_displayed.png'}
                        )
                    elif has_retry:
                        self.add_result(
                            'Enhanced Error Messages',
                            'warning',
                            'Error has retry button but no suggestions visible',
                            {'screenshot': '10_error_displayed.png'}
                        )
                    else:
                        self.add_result(
                            'Enhanced Error Messages',
                            'warning',
                            'Error displayed but missing retry button',
                            {'screenshot': '10_error_displayed.png'}
                        )

                except NoSuchElementException:
                    driver.save_screenshot('test_screenshots/10_error_FAILED.png')
                    self.add_result(
                        'Enhanced Error Messages',
                        'failed',
                        'No error message displayed for invalid item',
                        {'screenshot': '10_error_FAILED.png'}
                    )

            except Exception as e:
                driver.save_screenshot('test_screenshots/10_error_exception_FAILED.png')
                self.add_result(
                    'Enhanced Error Messages',
                    'failed',
                    f'Error during test: {str(e)}',
                    {'screenshot': '10_error_exception_FAILED.png'}
                )

        finally:
            driver.quit()

    def test_code_quality(self):
        """Test 4: Code Quality Checks"""
        print("\n🧪 Testing Code Quality...")

        import subprocess

        # Test TypeScript compilation
        try:
            result = subprocess.run(
                ['npm', 'run', 'type-check'],
                cwd='/home/owner/Documents/Archive-Omnidash-2',
                capture_output=True,
                text=True,
                timeout=30
            )

            if result.returncode == 0:
                self.add_result(
                    'TypeScript Compilation',
                    'passed',
                    'No TypeScript errors found'
                )
            else:
                self.add_result(
                    'TypeScript Compilation',
                    'failed',
                    'TypeScript errors detected',
                    {'output': result.stderr[:200]}
                )
        except Exception as e:
            self.add_result(
                'TypeScript Compilation',
                'failed',
                f'Error running type-check: {str(e)}'
            )

        # Test ESLint
        try:
            result = subprocess.run(
                ['npm', 'run', 'lint'],
                cwd='/home/owner/Documents/Archive-Omnidash-2',
                capture_output=True,
                text=True,
                timeout=30
            )

            output = result.stdout + result.stderr

            # Check for errors vs warnings
            if '0 errors' in output or result.returncode == 0:
                warnings_match = output.count('warning')
                self.add_result(
                    'ESLint Check',
                    'passed',
                    f'No ESLint errors (found {warnings_match} warnings)',
                    {'warnings_count': warnings_match}
                )
            else:
                self.add_result(
                    'ESLint Check',
                    'failed',
                    'ESLint errors detected',
                    {'output': output[:200]}
                )
        except Exception as e:
            self.add_result(
                'ESLint Check',
                'failed',
                f'Error running lint: {str(e)}'
            )

    def test_ui_elements(self):
        """Test 5: UI Elements Present"""
        print("\n🧪 Testing UI Elements...")
        driver = self.setup_driver(mobile=False)

        try:
            driver.get('http://localhost:3001')
            wait = WebDriverWait(driver, 10)

            # Check for main navigation items
            nav_items = ['Home', 'Item Search', 'Deep Search', 'Wayback Machine', 'View Analytics', 'Settings']
            found_items = []

            for item in nav_items:
                try:
                    element = driver.find_element(By.XPATH, f"//button[contains(., '{item}')]")
                    found_items.append(item)
                except NoSuchElementException:
                    pass

            if len(found_items) == len(nav_items):
                self.add_result(
                    'Navigation Items',
                    'passed',
                    f'All {len(nav_items)} navigation items found',
                    {'items': found_items}
                )
            else:
                missing = set(nav_items) - set(found_items)
                self.add_result(
                    'Navigation Items',
                    'warning',
                    f'Found {len(found_items)}/{len(nav_items)} navigation items',
                    {'missing': list(missing)}
                )

            # Check for status indicators
            try:
                status_elements = driver.find_elements(By.CSS_SELECTOR, '[role="status"]')
                if len(status_elements) > 0:
                    self.add_result(
                        'Status Indicators',
                        'passed',
                        f'Found {len(status_elements)} status indicator(s)'
                    )
                else:
                    self.add_result(
                        'Status Indicators',
                        'warning',
                        'No status indicators found'
                    )
            except Exception as e:
                self.add_result(
                    'Status Indicators',
                    'failed',
                    f'Error checking status indicators: {str(e)}'
                )

        finally:
            driver.quit()

    def generate_report(self):
        """Generate HTML report"""
        summary = self.results['summary']

        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Phase 1 Test Report - Archive OmniDash</title>
    <style>
        body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; margin: 40px; background: #0f172a; color: #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; border: 1px solid #334155; }}
        h1 {{ margin: 0; color: #14b8a6; font-size: 32px; }}
        .timestamp {{ color: #94a3b8; margin-top: 10px; }}
        .summary {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }}
        .summary-card {{ background: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; }}
        .summary-card h3 {{ margin: 0 0 10px 0; color: #94a3b8; font-size: 14px; text-transform: uppercase; }}
        .summary-card .value {{ font-size: 36px; font-weight: bold; }}
        .passed {{ color: #10b981; }}
        .failed {{ color: #ef4444; }}
        .warning {{ color: #f59e0b; }}
        .test-result {{ background: #1e293b; padding: 20px; margin-bottom: 15px; border-radius: 8px; border-left: 4px solid #334155; }}
        .test-result.passed {{ border-left-color: #10b981; }}
        .test-result.failed {{ border-left-color: #ef4444; }}
        .test-result.warning {{ border-left-color: #f59e0b; }}
        .test-name {{ font-weight: bold; font-size: 18px; margin-bottom: 8px; }}
        .test-message {{ color: #cbd5e1; margin-bottom: 10px; }}
        .test-details {{ background: #0f172a; padding: 12px; border-radius: 4px; font-family: monospace; font-size: 12px; color: #94a3b8; }}
        .icon {{ font-size: 24px; margin-right: 10px; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Phase 1 Test Report</h1>
        <div class="timestamp">Archive OmniDash - {self.results['timestamp']}</div>
    </div>

    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div class="value">{summary['total']}</div>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <div class="value passed">✅ {summary['passed']}</div>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <div class="value failed">❌ {summary['failed']}</div>
        </div>
        <div class="summary-card">
            <h3>Warnings</h3>
            <div class="value warning">⚠️ {summary['warnings']}</div>
        </div>
    </div>

    <h2 style="color: #14b8a6; margin-top: 40px;">Test Results</h2>
"""

        for test in self.results['tests']:
            status_icon = '✅' if test['status'] == 'passed' else '❌' if test['status'] == 'failed' else '⚠️'
            details_html = ''
            screenshot_html = ''

            # Add screenshot if available
            if test['details'] and 'screenshot' in test['details']:
                screenshot_path = test['details']['screenshot']
                screenshot_html = f'''
                <div style="margin-top: 15px;">
                    <h4 style="color: #94a3b8; font-size: 14px; margin-bottom: 8px;">📸 Screenshot:</h4>
                    <img src="{screenshot_path}" style="max-width: 100%; border-radius: 8px; border: 1px solid #334155;" alt="Test screenshot">
                </div>
                '''

            if test['details']:
                details_html = f'<div class="test-details">{json.dumps(test["details"], indent=2)}</div>'

            html += f"""
    <div class="test-result {test['status']}">
        <div class="test-name"><span class="icon">{status_icon}</span>{test['test']}</div>
        <div class="test-message">{test['message']}</div>
        {details_html}
        {screenshot_html}
    </div>
"""

        html += """
</body>
</html>
"""

        with open('test_screenshots/phase1_test_report.html', 'w') as f:
            f.write(html)

        print(f"\n📊 Report saved to: test_screenshots/phase1_test_report.html")

    def run_all_tests(self):
        """Run all tests"""
        print("=" * 60)
        print("🚀 Starting Phase 1 Test Suite")
        print("=" * 60)

        self.test_mobile_sidebar()
        self.test_desktop_sidebar()
        self.test_error_handling()
        self.test_code_quality()
        self.test_ui_elements()

        self.generate_report()

        print("\n" + "=" * 60)
        print("📊 Test Summary")
        print("=" * 60)
        print(f"Total Tests: {self.results['summary']['total']}")
        print(f"✅ Passed: {self.results['summary']['passed']}")
        print(f"❌ Failed: {self.results['summary']['failed']}")
        print(f"⚠️  Warnings: {self.results['summary']['warnings']}")
        print("=" * 60)

if __name__ == '__main__':
    suite = Phase1TestSuite()
    suite.run_all_tests()

