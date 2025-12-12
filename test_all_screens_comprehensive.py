#!/usr/bin/env python3
"""
Comprehensive Screen Testing - All Features
Tests every screen for functionality with Selenium + OCR
Identifies inoperative features and UX issues
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

class ComprehensiveScreenTest:
    def __init__(self):
        self.screenshot_dir = 'all_screens_test'
        os.makedirs(self.screenshot_dir, exist_ok=True)
        self.results = []
        self.driver = None
        self.screenshot_counter = 1
        self.issues_found = []
        
    def setup_driver(self):
        """Setup Chrome driver"""
        options = webdriver.ChromeOptions()
        options.add_argument('--start-maximized')
        options.add_argument('--disable-blink-features=AutomationControlled')
        options.add_experimental_option('excludeSwitches', ['enable-logging'])
        
        self.driver = webdriver.Chrome(options=options)
        print("✅ Chrome driver initialized")
        
    def verify_screenshot(self, filepath, expected_texts, test_name):
        """Verify screenshot with OCR"""
        result = subprocess.run(
            ['tesseract', filepath, 'stdout'],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True
        )
        ocr_text = result.stdout
        
        with open(f"{filepath}.txt", 'w') as f:
            f.write(ocr_text)
        
        ocr_lower = ocr_text.lower()
        missing = []
        found = []
        
        for expected in expected_texts:
            if expected.lower() in ocr_lower:
                found.append(expected)
            else:
                missing.append(expected)
        
        return len(missing) == 0, ocr_text, missing
    
    def take_screenshot(self, description, expected_texts):
        """Take and verify screenshot"""
        filename = f"{self.screenshot_counter:02d}_{description.lower().replace(' ', '_').replace('/', '_')}.png"
        filepath = f"{self.screenshot_dir}/{filename}"
        
        print(f"\n📸 {filename}")
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
        print(f"{icon} {test_name}: {message}")
    
    def add_issue(self, screen, issue_type, description, severity='MEDIUM'):
        """Track UX/functionality issues"""
        self.issues_found.append({
            'screen': screen,
            'type': issue_type,
            'description': description,
            'severity': severity
        })
    
    def test_screen_home(self):
        """Test 1: Home/Dashboard Screen"""
        print("\n" + "="*60)
        print("🧪 TEST 1: Home/Dashboard Screen")
        print("="*60)
        
        self.driver.get('http://localhost:3001')
        time.sleep(3)
        
        # Take screenshot
        verified, screenshot, ocr_text, missing = self.take_screenshot(
            'Home Dashboard',
            ['OmniDash', 'Archive OmniDash', 'Active Features']
        )
        
        if not verified:
            self.add_result('Home Screen Load', 'FAILED',
                          f'Missing elements: {missing}',
                          {'screenshot': screenshot})
            self.add_issue('Home', 'LOAD_FAILURE', f'Missing: {missing}', 'HIGH')
            return False
        
        # Check for interactive elements
        try:
            # Find feature cards
            cards = self.driver.find_elements(By.CSS_SELECTOR, "div[class*='cursor-pointer'], button[class*='cursor-pointer']")
            
            if len(cards) == 0:
                self.add_issue('Home', 'NO_INTERACTIVE_ELEMENTS', 
                             'No clickable feature cards found', 'HIGH')
                self.add_result('Home Interactive Elements', 'FAILED',
                              'No interactive elements found',
                              {'screenshot': screenshot})
            else:
                self.add_result('Home Interactive Elements', 'PASSED',
                              f'Found {len(cards)} interactive elements',
                              {'screenshot': screenshot, 'count': len(cards)})
        except Exception as e:
            self.add_issue('Home', 'ELEMENT_SEARCH_ERROR', str(e), 'MEDIUM')
        
        self.add_result('Home Screen', 'PASSED',
                       'Home screen loaded successfully',
                       {'screenshot': screenshot})
        return True
    
    def test_screen_item_search(self):
        """Test 2: Item Search/Metadata Explorer"""
        print("\n" + "="*60)
        print("🧪 TEST 2: Item Search Screen")
        print("="*60)
        
        try:
            # Navigate to Item Search
            nav_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Item Search')]"))
            )
            nav_button.click()
            time.sleep(2)
            
            # Screenshot
            verified, screenshot, ocr_text, missing = self.take_screenshot(
                'Item Search Page',
                ['Metadata', 'Identifier', 'Fetch']
            )
            
            if not verified:
                self.add_issue('Item Search', 'LOAD_FAILURE', f'Missing: {missing}', 'HIGH')
                self.add_result('Item Search Load', 'FAILED',
                              f'Page not loaded: {missing}',
                              {'screenshot': screenshot})
                return False
            
            # Test input field
            try:
                input_field = self.driver.find_element(By.CSS_SELECTOR, "input[type='text']")
                
                # Test with valid identifier
                valid_id = 'internetarchive'
                input_field.clear()
                input_field.send_keys(valid_id)
                time.sleep(1)
                
                # Screenshot with input
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    'Item Search Input Entered',
                    [valid_id]
                )
                
                # Submit
                input_field.send_keys(Keys.RETURN)
                time.sleep(5)  # Wait for API
                
                # Screenshot of results
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    'Item Search Results',
                    []
                )
                
                # Check for results or error
                has_error = 'error' in ocr_text.lower() or 'not found' in ocr_text.lower()
                has_data = 'metadata' in ocr_text.lower() or 'files' in ocr_text.lower() or 'item' in ocr_text.lower()
                
                if has_error:
                    self.add_issue('Item Search', 'API_ERROR', 
                                 'Error fetching valid identifier', 'HIGH')
                    self.add_result('Item Search Functionality', 'FAILED',
                                  'API returned error for valid identifier',
                                  {'screenshot': screenshot})
                elif has_data:
                    self.add_result('Item Search Functionality', 'PASSED',
                                  'Successfully fetched metadata',
                                  {'screenshot': screenshot})
                else:
                    self.add_issue('Item Search', 'NO_RESULTS', 
                                 'No results or error displayed', 'MEDIUM')
                    self.add_result('Item Search Functionality', 'WARNING',
                                  'Unclear if results displayed',
                                  {'screenshot': screenshot})
                
            except NoSuchElementException:
                self.add_issue('Item Search', 'NO_INPUT_FIELD', 
                             'Input field not found', 'HIGH')
                self.add_result('Item Search Input', 'FAILED',
                              'Input field not found',
                              {'screenshot': screenshot})
                return False
                
        except TimeoutException:
            self.add_issue('Item Search', 'NAVIGATION_FAILURE', 
                         'Could not navigate to Item Search', 'HIGH')
            self.add_result('Item Search Navigation', 'FAILED',
                          'Navigation button not found',
                          {})
            return False

        return True

    def test_screen_deep_search(self):
        """Test 3: Deep Search Screen"""
        print("\n" + "="*60)
        print("🧪 TEST 3: Deep Search Screen")
        print("="*60)

        try:
            nav_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Deep Search')]"))
            )
            nav_button.click()
            time.sleep(2)

            verified, screenshot, ocr_text, missing = self.take_screenshot(
                'Deep Search Page',
                ['Query', 'Search']
            )

            if not verified:
                self.add_issue('Deep Search', 'LOAD_FAILURE', f'Missing: {missing}', 'HIGH')
                self.add_result('Deep Search Load', 'FAILED',
                              f'Page not loaded: {missing}',
                              {'screenshot': screenshot})
                return False

            # Check for input fields
            try:
                inputs = self.driver.find_elements(By.CSS_SELECTOR, "input, textarea")
                if len(inputs) == 0:
                    self.add_issue('Deep Search', 'NO_INPUTS',
                                 'No input fields found', 'HIGH')
                    self.add_result('Deep Search Inputs', 'FAILED',
                                  'No input fields',
                                  {'screenshot': screenshot})
                else:
                    self.add_result('Deep Search Inputs', 'PASSED',
                                  f'Found {len(inputs)} input fields',
                                  {'screenshot': screenshot})
            except:
                pass

            self.add_result('Deep Search Screen', 'PASSED',
                          'Deep Search screen loaded',
                          {'screenshot': screenshot})
            return True

        except TimeoutException:
            self.add_issue('Deep Search', 'NAVIGATION_FAILURE',
                         'Could not navigate to Deep Search', 'HIGH')
            self.add_result('Deep Search Navigation', 'FAILED',
                          'Navigation failed',
                          {})
            return False

    def test_screen_wayback(self):
        """Test 4: Wayback Machine Screen"""
        print("\n" + "="*60)
        print("🧪 TEST 4: Wayback Machine Screen")
        print("="*60)

        try:
            nav_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Wayback Machine')]"))
            )
            nav_button.click()
            time.sleep(2)

            verified, screenshot, ocr_text, missing = self.take_screenshot(
                'Wayback Machine Page',
                ['Wayback', 'URL']
            )

            if not verified:
                self.add_issue('Wayback', 'LOAD_FAILURE', f'Missing: {missing}', 'HIGH')
                self.add_result('Wayback Load', 'FAILED',
                              f'Page not loaded: {missing}',
                              {'screenshot': screenshot})
                return False

            # Check for URL input
            try:
                url_input = self.driver.find_element(By.CSS_SELECTOR, "input[type='text'], input[type='url']")
                self.add_result('Wayback Input', 'PASSED',
                              'URL input field found',
                              {'screenshot': screenshot})
            except NoSuchElementException:
                self.add_issue('Wayback', 'NO_INPUT',
                             'URL input field not found', 'HIGH')
                self.add_result('Wayback Input', 'FAILED',
                              'No URL input field',
                              {'screenshot': screenshot})

            self.add_result('Wayback Screen', 'PASSED',
                          'Wayback screen loaded',
                          {'screenshot': screenshot})
            return True

        except TimeoutException:
            self.add_issue('Wayback', 'NAVIGATION_FAILURE',
                         'Could not navigate to Wayback', 'HIGH')
            self.add_result('Wayback Navigation', 'FAILED',
                          'Navigation failed',
                          {})
            return False

    def test_screen_analytics(self):
        """Test 5: Analytics Screen"""
        print("\n" + "="*60)
        print("🧪 TEST 5: Analytics Screen")
        print("="*60)

        try:
            nav_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'View Analytics')]"))
            )
            nav_button.click()
            time.sleep(2)

            verified, screenshot, ocr_text, missing = self.take_screenshot(
                'Analytics Page',
                ['Analytics', 'Views']
            )

            if not verified:
                self.add_issue('Analytics', 'LOAD_FAILURE', f'Missing: {missing}', 'HIGH')
                self.add_result('Analytics Load', 'FAILED',
                              f'Page not loaded: {missing}',
                              {'screenshot': screenshot})
                return False

            self.add_result('Analytics Screen', 'PASSED',
                          'Analytics screen loaded',
                          {'screenshot': screenshot})
            return True

        except TimeoutException:
            self.add_issue('Analytics', 'NAVIGATION_FAILURE',
                         'Could not navigate to Analytics', 'HIGH')
            self.add_result('Analytics Navigation', 'FAILED',
                          'Navigation failed',
                          {})
            return False

    def test_screen_settings(self):
        """Test 6: Settings Screen"""
        print("\n" + "="*60)
        print("🧪 TEST 6: Settings Screen")
        print("="*60)

        try:
            nav_button = WebDriverWait(self.driver, 10).until(
                EC.element_to_be_clickable((By.XPATH, "//button[contains(., 'Settings')]"))
            )
            nav_button.click()
            time.sleep(2)

            verified, screenshot, ocr_text, missing = self.take_screenshot(
                'Settings Page',
                ['Settings', 'API']
            )

            if not verified:
                self.add_issue('Settings', 'LOAD_FAILURE', f'Missing: {missing}', 'HIGH')
                self.add_result('Settings Load', 'FAILED',
                              f'Page not loaded: {missing}',
                              {'screenshot': screenshot})
                return False

            # Check for API key input
            try:
                api_inputs = self.driver.find_elements(By.CSS_SELECTOR, "input[type='text'], input[type='password']")
                if len(api_inputs) > 0:
                    self.add_result('Settings Inputs', 'PASSED',
                                  f'Found {len(api_inputs)} input fields',
                                  {'screenshot': screenshot})
                else:
                    self.add_issue('Settings', 'NO_INPUTS',
                                 'No input fields found', 'MEDIUM')
            except:
                pass

            self.add_result('Settings Screen', 'PASSED',
                          'Settings screen loaded',
                          {'screenshot': screenshot})
            return True

        except TimeoutException:
            self.add_issue('Settings', 'NAVIGATION_FAILURE',
                         'Could not navigate to Settings', 'HIGH')
            self.add_result('Settings Navigation', 'FAILED',
                          'Navigation failed',
                          {})
            return False

    def generate_report(self):
        """Generate comprehensive HTML report"""
        # Count issues by severity
        high_issues = [i for i in self.issues_found if i['severity'] == 'HIGH']
        medium_issues = [i for i in self.issues_found if i['severity'] == 'MEDIUM']
        low_issues = [i for i in self.issues_found if i['severity'] == 'LOW']

        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Comprehensive Screen Test Report</title>
    <style>
        body {{ font-family: system-ui; margin: 40px; background: #0f172a; color: #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; }}
        h1 {{ margin: 0; color: #14b8a6; font-size: 32px; }}
        .summary {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }}
        .card {{ background: #1e293b; padding: 20px; border-radius: 8px; border: 1px solid #334155; }}
        .card h3 {{ margin: 0; color: #94a3b8; font-size: 14px; text-transform: uppercase; }}
        .card .value {{ font-size: 36px; font-weight: bold; }}
        .passed {{ color: #10b981; }}
        .failed {{ color: #ef4444; }}
        .warning {{ color: #f59e0b; }}
        .issues {{ background: #1e293b; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #ef4444; }}
        .issue {{ background: #0f172a; padding: 15px; margin: 10px 0; border-radius: 8px; }}
        .issue.HIGH {{ border-left: 4px solid #ef4444; }}
        .issue.MEDIUM {{ border-left: 4px solid #f59e0b; }}
        .issue.LOW {{ border-left: 4px solid #3b82f6; }}
        .test {{ background: #1e293b; padding: 20px; margin-bottom: 20px; border-radius: 8px; border-left: 4px solid #334155; }}
        .test.PASSED {{ border-left-color: #10b981; }}
        .test.FAILED {{ border-left-color: #ef4444; }}
        .test.WARNING {{ border-left-color: #f59e0b; }}
        .screenshot {{ margin-top: 15px; border-radius: 8px; overflow: hidden; border: 1px solid #334155; }}
        .screenshot img {{ width: 100%; cursor: pointer; }}
        .ocr {{ background: #0f172a; padding: 15px; margin-top: 15px; border-radius: 8px; font-family: monospace; font-size: 11px; max-height: 200px; overflow-y: auto; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🔍 Comprehensive Screen Test Report</h1>
        <p style="color: #94a3b8; margin-top: 10px;">All Screens Tested - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
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

    <div class="summary">
        <div class="card"><h3>Total Issues</h3><div class="value">{len(self.issues_found)}</div></div>
        <div class="card"><h3>High Severity</h3><div class="value failed">🔴 {len(high_issues)}</div></div>
        <div class="card"><h3>Medium Severity</h3><div class="value warning">🟡 {len(medium_issues)}</div></div>
        <div class="card"><h3>Low Severity</h3><div class="value" style="color: #3b82f6;">🔵 {len(low_issues)}</div></div>
    </div>
"""

        # Issues section
        if self.issues_found:
            html += '<div class="issues"><h2 style="color: #ef4444; margin-top: 0;">🐛 Issues Found</h2>'
            for issue in self.issues_found:
                severity_color = '#ef4444' if issue['severity'] == 'HIGH' else '#f59e0b' if issue['severity'] == 'MEDIUM' else '#3b82f6'
                html += f"""
                <div class="issue {issue['severity']}">
                    <strong style="color: {severity_color};">{issue['severity']}</strong> -
                    <strong>{issue['screen']}</strong>: {issue['type']}<br>
                    <span style="color: #94a3b8; font-size: 14px;">{issue['description']}</span>
                </div>
"""
            html += '</div>'

        # Test results
        html += '<h2 style="color: #14b8a6;">Test Results</h2>'
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
                    <img src="{filename}" onclick="window.open('{filename}', '_blank')">
                    <p style="font-size: 12px; color: #94a3b8; margin: 10px;">📸 {filename}</p>
                </div>
                <div class="ocr">
                    <strong style="color: #14b8a6;">OCR Output:</strong><br>
                    {ocr_text[:500]}
                </div>
"""

            html += f"""
    <div class="test {result['status']}">
        <h3><span style="font-size: 24px; margin-right: 10px;">{icon}</span>{result['test']}</h3>
        <p style="color: #cbd5e1;">{result['message']}</p>
        {screenshot_html}
    </div>
"""

        html += "</body></html>"

        report_path = f"{self.screenshot_dir}/comprehensive_report.html"
        with open(report_path, 'w') as f:
            f.write(html)

        return report_path

    def run_all_tests(self):
        """Run all screen tests"""
        print("\n" + "="*60)
        print("🚀 Comprehensive Screen Testing")
        print("="*60)
        print("\n📋 Testing all screens for functionality and UX issues\n")

        try:
            self.setup_driver()

            self.test_screen_home()
            self.test_screen_item_search()
            self.test_screen_deep_search()
            self.test_screen_wayback()
            self.test_screen_analytics()
            self.test_screen_settings()

        finally:
            report_path = self.generate_report()

            total = len(self.results)
            passed = sum(1 for r in self.results if r['status'] == 'PASSED')
            failed = sum(1 for r in self.results if r['status'] == 'FAILED')
            warning = sum(1 for r in self.results if r['status'] == 'WARNING')

            print("\n" + "="*60)
            print("📊 Summary")
            print("="*60)
            print(f"Tests: {total} | ✅ {passed} | ❌ {failed} | ⚠️ {warning}")
            print(f"Issues Found: {len(self.issues_found)}")
            print("="*60)
            print(f"\n📄 Report: {report_path}")

            print("\n⚠️  Browser will remain open")
            print("   Press Enter to close and open report...")
            input()

            if self.driver:
                self.driver.quit()

            subprocess.Popen(['xdg-open', report_path])

if __name__ == '__main__':
    suite = ComprehensiveScreenTest()
    suite.run_all_tests()


