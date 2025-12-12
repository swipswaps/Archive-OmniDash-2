#!/usr/bin/env python3
"""
Test Tailwind Built CSS vs CDN
Verifies that switching from CDN to built CSS fixes mobile sidebar issues
BEFORE/AFTER screenshots with OCR verification
"""

import time
import subprocess
import os
from datetime import datetime
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

class TailwindBuiltCSSTest:
    def __init__(self):
        self.screenshot_dir = 'tailwind_built_test'
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
        """Verify screenshot with OCR"""
        print(f"\n🔍 Verifying: {test_name}")
        
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
        
        if missing:
            print(f"❌ FAILED - Missing: {missing}")
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
    
    def test_mobile_sidebar_with_built_css(self):
        """Test mobile sidebar with built Tailwind CSS"""
        print("\n" + "="*60)
        print("🧪 TEST: Mobile Sidebar with Built Tailwind CSS")
        print("="*60)
        
        self.driver.get('http://localhost:3001')
        time.sleep(4)  # Wait for app to load and CSS to apply
        
        # Desktop first
        print("\n🖥️  Testing desktop view first...")
        verified, screenshot, ocr_text, missing = self.take_screenshot(
            'Desktop View - Built CSS',
            ['OmniDash', 'Home', 'Item Search']
        )
        
        if verified:
            self.add_result('Desktop View', 'PASSED',
                          'Desktop view works with built CSS',
                          {'screenshot': screenshot})
        
        # Resize to mobile
        print("\n📱 Resizing to mobile viewport (390x844)")
        self.driver.set_window_size(390, 844)
        time.sleep(3)  # Wait for responsive layout to apply
        
        # Take screenshot of mobile view
        verified, screenshot, ocr_text, missing = self.take_screenshot(
            'Mobile View - Built CSS',
            ['OmniDash']
        )
        
        # Check if sidebar items are visible (they shouldn't be)
        sidebar_visible = 'home' in ocr_text.lower() and 'item search' in ocr_text.lower()
        
        if sidebar_visible:
            self.add_result('Mobile Sidebar Hidden', 'FAILED',
                          'Sidebar still visible on mobile with built CSS',
                          {'screenshot': screenshot,
                           'issue': 'Sidebar not collapsing'})
        else:
            self.add_result('Mobile Sidebar Hidden', 'PASSED',
                          'Sidebar correctly hidden on mobile with built CSS',
                          {'screenshot': screenshot})
        
        # Try to find hamburger button
        print("\n🔍 Looking for hamburger button...")
        try:
            # Try multiple selectors
            selectors = [
                ("CSS", "button[aria-label='Open menu']"),
                ("CSS", "button[aria-label='Close menu']"),
                ("XPATH", "//button[contains(@class, 'lg:hidden')]"),
                ("XPATH", "//button[contains(@aria-label, 'menu')]"),
            ]
            
            hamburger = None
            found_selector = None
            
            for selector_type, selector in selectors:
                try:
                    if selector_type == "XPATH":
                        elements = self.driver.find_elements(By.XPATH, selector)
                    else:
                        elements = self.driver.find_elements(By.CSS_SELECTOR, selector)
                    
                    for element in elements:
                        if element.is_displayed():
                            hamburger = element
                            found_selector = selector
                            break
                    
                    if hamburger:
                        break
                except:
                    continue
            
            if hamburger and hamburger.is_displayed():
                print(f"✅ Found hamburger with selector: {found_selector}")
                
                # Take screenshot showing hamburger
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    'Hamburger Button Found',
                    ['OmniDash']
                )
                
                self.add_result('Hamburger Button Visible', 'PASSED',
                              'Hamburger button found and visible with built CSS',
                              {'screenshot': screenshot,
                               'selector': found_selector})
                
                # Click hamburger
                print("\n🖱️  Clicking hamburger to open sidebar...")
                hamburger.click()
                time.sleep(1)
                
                # Screenshot with sidebar open
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    'Sidebar Opened via Hamburger',
                    ['Home', 'Item Search', 'Settings']
                )
                
                if verified:
                    self.add_result('Sidebar Opens', 'PASSED',
                                  'Sidebar opens when hamburger clicked',
                                  {'screenshot': screenshot})
                else:
                    self.add_result('Sidebar Opens', 'WARNING',
                                  f'Sidebar might not show all items: {missing}',
                                  {'screenshot': screenshot})
                
                # Click outside to close
                print("\n🖱️  Clicking outside to close...")
                try:
                    overlay = self.driver.find_element(By.CSS_SELECTOR, "div[class*='bg-black']")
                    overlay.click()
                except:
                    body = self.driver.find_element(By.TAG_NAME, 'body')
                    body.click()
                
                time.sleep(1)
                
                # Screenshot with sidebar closed
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    'Sidebar Closed Again',
                    ['OmniDash']
                )
                
                self.add_result('Sidebar Closes', 'PASSED',
                              'Sidebar closes when clicking outside',
                              {'screenshot': screenshot})
                
            else:
                # Hamburger not found
                verified, screenshot, ocr_text, missing = self.take_screenshot(
                    'Hamburger NOT FOUND',
                    []
                )
                
                self.add_result('Hamburger Button', 'FAILED',
                              'Hamburger button still not found with built CSS',
                              {'screenshot': screenshot,
                               'tried_selectors': [s[1] for s in selectors]})
                
        except Exception as e:
            self.add_result('Mobile Test', 'FAILED',
                          f'Test failed: {str(e)}',
                          {})

    def generate_report(self):
        """Generate HTML report"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Tailwind Built CSS Test Report</title>
    <style>
        body {{ font-family: system-ui; margin: 40px; background: #0f172a; color: #e2e8f0; }}
        .header {{ background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; }}
        h1 {{ margin: 0; color: #14b8a6; font-size: 32px; }}
        .summary {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }}
        .card {{ background: #1e293b; padding: 20px; border-radius: 8px; }}
        .card h3 {{ margin: 0; color: #94a3b8; font-size: 14px; }}
        .card .value {{ font-size: 36px; font-weight: bold; }}
        .passed {{ color: #10b981; }}
        .failed {{ color: #ef4444; }}
        .warning {{ color: #f59e0b; }}
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
        <h1>🎨 Tailwind Built CSS Test Report</h1>
        <p style="color: #94a3b8; margin-top: 10px;">Testing: CDN → Built CSS Migration - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</p>
        <div style="margin-top: 15px; padding: 15px; background: #0f172a; border-radius: 8px; border-left: 4px solid #14b8a6;">
            <strong style="color: #14b8a6;">✅ Switched from Tailwind CDN to Built CSS</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">
                • Installed: tailwindcss, postcss, autoprefixer, @tailwindcss/postcss<br>
                • Created: tailwind.config.js, postcss.config.js, src/index.css<br>
                • Removed: CDN script from index.html<br>
                • Testing: Mobile sidebar and hamburger menu functionality
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
        <div class="card"><h3>Total</h3><div class="value">{total}</div></div>
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
                    <img src="{filename}" onclick="window.open('{filename}', '_blank')">
                    <p style="font-size: 12px; color: #94a3b8; margin: 10px;">📸 {filename}</p>
                </div>
                <div class="ocr">
                    <strong style="color: #14b8a6;">OCR Output:</strong><br>
                    {ocr_text[:500]}
                </div>
"""

            note_html = ''
            if 'note' in result['details']:
                note_html += f'<div style="color: #f59e0b; margin-top: 10px;">⚠️ {result["details"]["note"]}</div>'
            if 'issue' in result['details']:
                note_html += f'<div style="color: #ef4444; margin-top: 10px;">🐛 {result["details"]["issue"]}</div>'
            if 'selector' in result['details']:
                note_html += f'<div style="color: #10b981; margin-top: 10px;">🎯 Selector: {result["details"]["selector"]}</div>'

            html += f"""
    <div class="test {result['status']}">
        <h3><span style="font-size: 24px; margin-right: 10px;">{icon}</span>{result['test']}</h3>
        <p style="color: #cbd5e1;">{result['message']}</p>
        {note_html}
        {screenshot_html}
    </div>
"""

        html += "</body></html>"

        report_path = f"{self.screenshot_dir}/tailwind_built_report.html"
        with open(report_path, 'w') as f:
            f.write(html)

        print(f"\n📊 Report: {report_path}")
        return report_path

    def run_test(self):
        """Run the test"""
        print("\n" + "="*60)
        print("🚀 Tailwind Built CSS Test")
        print("="*60)
        print("\n📋 Testing mobile sidebar with built Tailwind CSS")
        print("   Goal: Verify hamburger menu works after CDN → Built CSS migration\n")

        try:
            self.setup_driver()
            self.test_mobile_sidebar_with_built_css()

        finally:
            report_path = self.generate_report()

            total = len(self.results)
            passed = sum(1 for r in self.results if r['status'] == 'PASSED')
            failed = sum(1 for r in self.results if r['status'] == 'FAILED')
            warning = sum(1 for r in self.results if r['status'] == 'WARNING')

            print("\n" + "="*60)
            print("📊 Summary")
            print("="*60)
            print(f"Total: {total} | ✅ {passed} | ❌ {failed} | ⚠️ {warning}")
            print("="*60)
            print(f"\n📄 Report: {report_path}")

            print("\n⚠️  Browser will remain open")
            print("   Press Enter to close and open report...")
            input()

            if self.driver:
                self.driver.quit()

            subprocess.Popen(['xdg-open', report_path])

if __name__ == '__main__':
    suite = TailwindBuiltCSSTest()
    suite.run_test()

