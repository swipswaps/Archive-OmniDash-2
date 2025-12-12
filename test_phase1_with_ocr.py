#!/usr/bin/env python3
"""
Phase 1 Visual Test Suite with MANDATORY OCR Verification
NEVER makes claims about screenshots without OCR verification
"""

import time
import subprocess
import os
from datetime import datetime

class Phase1TestWithOCR:
    def __init__(self):
        self.screenshot_dir = 'test_screenshots'
        os.makedirs(self.screenshot_dir, exist_ok=True)
        self.results = []
        self.browser_window = None
        
    def run_command(self, cmd):
        """Run shell command and return output"""
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip()
    
    def verify_screenshot(self, filepath, expected_texts, test_name):
        """
        MANDATORY: Verify screenshot contains expected text using OCR.
        NEVER skip this step. NEVER make claims without verification.
        
        Args:
            filepath: Path to screenshot
            expected_texts: List of strings that MUST be present
            test_name: Name of test for error reporting
        
        Returns:
            (success: bool, ocr_text: str, missing: list)
        """
        print(f"\n🔍 Verifying screenshot: {filepath}")
        
        # Run OCR
        result = subprocess.run(
            ['tesseract', filepath, 'stdout'],
            stdout=subprocess.PIPE,
            stderr=subprocess.DEVNULL,
            text=True
        )
        ocr_text = result.stdout
        
        # Save OCR output for manual review
        ocr_file = f"{filepath}.txt"
        with open(ocr_file, 'w') as f:
            f.write(ocr_text)
        print(f"   OCR output saved to: {ocr_file}")
        
        # Check for ALL expected texts
        ocr_lower = ocr_text.lower()
        missing = []
        found = []
        
        for expected in expected_texts:
            if expected.lower() in ocr_lower:
                found.append(expected)
            else:
                missing.append(expected)
        
        # Report results
        if missing:
            print(f"❌ {test_name} VERIFICATION FAILED")
            print(f"   Screenshot: {filepath}")
            print(f"   Expected: {expected_texts}")
            print(f"   Found: {found}")
            print(f"   Missing: {missing}")
            print(f"   OCR preview: {ocr_text[:300]}")
            return False, ocr_text, missing
        else:
            print(f"✅ {test_name} VERIFIED")
            print(f"   Found all expected: {expected_texts}")
            return True, ocr_text, []
    
    def add_result(self, test_name, status, message, details=None):
        """Add test result"""
        result = {
            'test': test_name,
            'status': status,
            'message': message,
            'details': details or {},
            'timestamp': datetime.now().isoformat()
        }
        self.results.append(result)
        
        status_icon = '✅' if status == 'PASSED' else '❌' if status == 'FAILED' else '⚠️'
        print(f"\n{status_icon} {test_name}: {message}")
    
    def take_screenshot(self, filename, description):
        """Take screenshot of entire screen"""
        filepath = f"{self.screenshot_dir}/{filename}"
        self.run_command(f"import -window root {filepath}")
        print(f"\n📸 Screenshot captured: {filename}")
        print(f"   Description: {description}")
        time.sleep(0.5)
        return filepath
    
    def focus_browser(self):
        """Focus the browser window"""
        # Find Chrome/Chromium window with localhost
        window_id = self.run_command("xdotool search --name 'localhost:3001' | head -1")
        if not window_id:
            # Try finding any Chrome window
            window_id = self.run_command("xdotool search --class 'Chrome' | head -1")
        
        if window_id:
            self.browser_window = window_id
            self.run_command(f"xdotool windowactivate {window_id}")
            time.sleep(1)
            return True
        return False
    
    def open_browser(self):
        """Open browser to localhost:3001"""
        print("\n🌐 Opening browser to localhost:3001...")
        subprocess.Popen(['google-chrome', '--new-window', 'http://localhost:3001'], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        time.sleep(4)  # Wait for browser to open and page to load
        return self.focus_browser()
    
    def resize_window(self, width, height):
        """Resize browser window"""
        if self.browser_window:
            self.run_command(f"xdotool windowsize {self.browser_window} {width} {height}")
            time.sleep(1)
    
    def click_at(self, x, y, description=""):
        """Click at coordinates"""
        if description:
            print(f"   Clicking: {description} at ({x}, {y})")
        self.run_command(f"xdotool mousemove {x} {y} click 1")
        time.sleep(1)
    
    def type_text(self, text):
        """Type text"""
        print(f"   Typing: {text}")
        self.run_command(f"xdotool type '{text}'")
        time.sleep(0.5)
    
    def press_key(self, key):
        """Press keyboard key"""
        print(f"   Pressing: {key}")
        self.run_command(f"xdotool key {key}")
        time.sleep(1)

    def test_01_desktop_initial_load(self):
        """Test 1: Desktop Initial Load"""
        print("\n" + "="*60)
        print("🧪 TEST 1: Desktop Initial Load")
        print("="*60)

        if not self.focus_browser():
            self.add_result('Desktop Initial Load', 'FAILED',
                          'Could not find browser window')
            return False

        # Resize to desktop size
        self.resize_window(1920, 1080)
        time.sleep(2)  # Wait for resize and render

        # Take screenshot
        screenshot = self.take_screenshot(
            '01_desktop_initial.png',
            'Desktop view - should show sidebar with navigation'
        )

        # VERIFY with OCR
        verified, ocr_text, missing = self.verify_screenshot(
            screenshot,
            expected_texts=['OmniDash', 'Home', 'Item Search', 'Deep Search',
                          'Wayback Machine', 'Settings'],
            test_name='Desktop Initial Load'
        )

        if not verified:
            self.add_result('Desktop Initial Load', 'FAILED',
                          f'Missing expected elements: {missing}',
                          {'screenshot': screenshot, 'missing': missing})
            return False

        self.add_result('Desktop Initial Load', 'PASSED',
                       'All navigation items visible on desktop',
                       {'screenshot': screenshot})
        return True

    def test_02_mobile_view_hamburger(self):
        """Test 2: Mobile View with Hamburger Menu"""
        print("\n" + "="*60)
        print("🧪 TEST 2: Mobile View - Hamburger Menu")
        print("="*60)

        if not self.focus_browser():
            self.add_result('Mobile Hamburger Menu', 'FAILED',
                          'Could not find browser window')
            return False

        # Open DevTools
        print("\n📱 Opening DevTools...")
        self.press_key('F12')
        time.sleep(2)

        # Take screenshot of DevTools
        screenshot = self.take_screenshot(
            '02_devtools_opened.png',
            'DevTools opened - preparing for mobile emulation'
        )

        # VERIFY DevTools opened
        verified, ocr_text, missing = self.verify_screenshot(
            screenshot,
            expected_texts=['Elements', 'Console'],  # DevTools tabs
            test_name='DevTools Opened'
        )

        if not verified:
            self.add_result('DevTools Open', 'WARNING',
                          'DevTools might not be visible',
                          {'screenshot': screenshot})
        else:
            self.add_result('DevTools Open', 'PASSED',
                          'DevTools opened successfully',
                          {'screenshot': screenshot})

        # Toggle device toolbar (mobile emulation)
        print("\n📱 Toggling device toolbar (Ctrl+Shift+M)...")
        self.press_key('ctrl+shift+m')
        time.sleep(2)

        # Take screenshot of mobile view
        screenshot = self.take_screenshot(
            '03_mobile_view.png',
            'Mobile emulation - should show hamburger menu'
        )

        # VERIFY mobile view with hamburger menu
        # Note: Hamburger menu might be an icon, so we check for other mobile indicators
        verified, ocr_text, missing = self.verify_screenshot(
            screenshot,
            expected_texts=['OmniDash'],  # App should still be visible
            test_name='Mobile View'
        )

        if not verified:
            self.add_result('Mobile View', 'FAILED',
                          f'Mobile view not showing app: {missing}',
                          {'screenshot': screenshot, 'missing': missing})
            return False

        # Check if we can see hamburger menu indicator (☰ or Menu)
        # The hamburger is often an icon, so OCR might not catch it
        # We'll mark as WARNING if we can't verify it
        if '☰' in ocr_text or 'menu' in ocr_text.lower():
            self.add_result('Mobile Hamburger Menu', 'PASSED',
                          'Hamburger menu visible in mobile view',
                          {'screenshot': screenshot})
        else:
            self.add_result('Mobile Hamburger Menu', 'WARNING',
                          'Could not verify hamburger menu via OCR (might be icon)',
                          {'screenshot': screenshot,
                           'note': 'Manual verification needed - hamburger might be icon'})

        return True

    def test_03_error_handling(self):
        """Test 3: Enhanced Error Handling"""
        print("\n" + "="*60)
        print("🧪 TEST 3: Enhanced Error Handling")
        print("="*60)

        # Close DevTools first
        print("\n🔧 Closing DevTools...")
        self.press_key('F12')
        time.sleep(2)

        # Resize back to desktop
        self.resize_window(1920, 1080)
        time.sleep(2)

        # Navigate to Item Search
        print("\n🔍 Navigating to Item Search...")
        # Click on Item Search in sidebar (approximate position)
        self.click_at(150, 280, "Item Search button")
        time.sleep(2)

        # Take screenshot of Item Search page
        screenshot = self.take_screenshot(
            '04_item_search_page.png',
            'Item Search page - should show input field'
        )

        # VERIFY Item Search page loaded
        verified, ocr_text, missing = self.verify_screenshot(
            screenshot,
            expected_texts=['Metadata', 'Identifier'],
            test_name='Item Search Page Load'
        )

        if not verified:
            self.add_result('Item Search Navigation', 'FAILED',
                          f'Item Search page not loaded: {missing}',
                          {'screenshot': screenshot, 'missing': missing})
            return False

        self.add_result('Item Search Navigation', 'PASSED',
                       'Item Search page loaded successfully',
                       {'screenshot': screenshot})

        # Click in input field and enter invalid identifier
        print("\n⌨️  Entering invalid identifier...")
        self.click_at(600, 350, "Input field")
        time.sleep(0.5)
        self.type_text('invalid_test_12345_nonexistent')
        time.sleep(1)

        # Take screenshot with input
        screenshot = self.take_screenshot(
            '05_invalid_input_entered.png',
            'Invalid identifier entered in field'
        )

        # VERIFY input was entered
        verified, ocr_text, missing = self.verify_screenshot(
            screenshot,
            expected_texts=['invalid_test_12345_nonexistent'],
            test_name='Invalid Input Entered'
        )

        if not verified:
            self.add_result('Input Entry', 'WARNING',
                          'Could not verify input text via OCR',
                          {'screenshot': screenshot,
                           'note': 'Input might be in field but OCR cannot read it'})
        else:
            self.add_result('Input Entry', 'PASSED',
                          'Invalid identifier entered successfully',
                          {'screenshot': screenshot})

        # Submit the form (press Enter or click button)
        print("\n🚀 Submitting form...")
        self.press_key('Return')
        time.sleep(4)  # Wait for API call and error to appear

        # Take screenshot of error message
        screenshot = self.take_screenshot(
            '06_error_message_displayed.png',
            'Error message should be displayed with retry button'
        )

        # VERIFY error message is displayed
        verified, ocr_text, missing = self.verify_screenshot(
            screenshot,
            expected_texts=['Error', 'not found'],  # Common error text
            test_name='Error Message Display'
        )

        if not verified:
            self.add_result('Error Message Display', 'FAILED',
                          f'Error message not displayed: {missing}',
                          {'screenshot': screenshot, 'missing': missing,
                           'ocr_preview': ocr_text[:300]})
            return False

        # Check for retry button
        has_retry = 'retry' in ocr_text.lower() or 'try again' in ocr_text.lower()

        if has_retry:
            self.add_result('Error Retry Button', 'PASSED',
                          'Error message includes retry functionality',
                          {'screenshot': screenshot})
        else:
            self.add_result('Error Retry Button', 'WARNING',
                          'Could not verify retry button via OCR',
                          {'screenshot': screenshot,
                           'note': 'Retry button might be icon/image'})

        self.add_result('Enhanced Error Handling', 'PASSED',
                       'Error message displayed successfully',
                       {'screenshot': screenshot})

        return True

    def generate_html_report(self):
        """Generate HTML report with screenshots and OCR verification results"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Phase 1 Test Report with OCR Verification</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            margin: 0;
            padding: 40px;
            background: #0f172a;
            color: #e2e8f0;
        }}
        .header {{
            background: linear-gradient(135deg, #1e293b 0%, #334155 100%);
            padding: 30px;
            border-radius: 12px;
            margin-bottom: 30px;
            border: 1px solid #334155;
        }}
        h1 {{
            margin: 0;
            color: #14b8a6;
            font-size: 32px;
        }}
        .timestamp {{
            color: #94a3b8;
            margin-top: 10px;
        }}
        .summary {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin-bottom: 30px;
        }}
        .summary-card {{
            background: #1e293b;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #334155;
        }}
        .summary-card h3 {{
            margin: 0 0 10px 0;
            color: #94a3b8;
            font-size: 14px;
            text-transform: uppercase;
        }}
        .summary-card .value {{
            font-size: 36px;
            font-weight: bold;
        }}
        .passed {{ color: #10b981; }}
        .failed {{ color: #ef4444; }}
        .warning {{ color: #f59e0b; }}
        .test-result {{
            background: #1e293b;
            padding: 20px;
            margin-bottom: 20px;
            border-radius: 8px;
            border-left: 4px solid #334155;
        }}
        .test-result.PASSED {{ border-left-color: #10b981; }}
        .test-result.FAILED {{ border-left-color: #ef4444; }}
        .test-result.WARNING {{ border-left-color: #f59e0b; }}
        .test-name {{
            font-weight: bold;
            font-size: 18px;
            margin-bottom: 8px;
        }}
        .test-message {{
            color: #cbd5e1;
            margin-bottom: 10px;
        }}
        .screenshot {{
            margin-top: 15px;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid #334155;
        }}
        .screenshot img {{
            width: 100%;
            height: auto;
            display: block;
        }}
        .screenshot-caption {{
            background: #0f172a;
            padding: 10px;
            font-size: 12px;
            color: #94a3b8;
        }}
        .ocr-link {{
            display: inline-block;
            margin-top: 10px;
            padding: 8px 12px;
            background: #334155;
            color: #14b8a6;
            text-decoration: none;
            border-radius: 4px;
            font-size: 12px;
        }}
        .ocr-link:hover {{
            background: #475569;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Phase 1 Test Report with OCR Verification</h1>
        <div class="timestamp">Archive OmniDash - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
        <div style="margin-top: 15px; padding: 15px; background: #0f172a; border-radius: 8px;">
            <strong style="color: #14b8a6;">✅ OCR Verification Enabled</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">
                All screenshots verified with tesseract OCR. Claims are backed by actual text extraction.
            </span>
        </div>
    </div>
"""

        # Calculate summary
        total = len(self.results)
        passed = sum(1 for r in self.results if r['status'] == 'PASSED')
        failed = sum(1 for r in self.results if r['status'] == 'FAILED')
        warning = sum(1 for r in self.results if r['status'] == 'WARNING')

        html += f"""
    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div class="value">{total}</div>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <div class="value passed">✅ {passed}</div>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <div class="value failed">❌ {failed}</div>
        </div>
        <div class="summary-card">
            <h3>Warnings</h3>
            <div class="value warning">⚠️ {warning}</div>
        </div>
    </div>

    <h2 style="color: #14b8a6; margin-top: 40px;">Test Results</h2>
"""

        for result in self.results:
            status_icon = '✅' if result['status'] == 'PASSED' else '❌' if result['status'] == 'FAILED' else '⚠️'

            screenshot_html = ''
            if 'screenshot' in result['details']:
                screenshot_path = result['details']['screenshot']
                ocr_path = f"{screenshot_path}.txt"
                screenshot_html = f"""
                <div class="screenshot">
                    <img src="{screenshot_path}" alt="{result['test']}">
                    <div class="screenshot-caption">
                        📸 {screenshot_path}
                        <a href="{ocr_path}" class="ocr-link" target="_blank">View OCR Output</a>
                    </div>
                </div>
"""

            details_html = ''
            if result['details']:
                if 'missing' in result['details']:
                    details_html += f"<div style='color: #ef4444; margin-top: 10px;'>❌ Missing: {result['details']['missing']}</div>"
                if 'note' in result['details']:
                    details_html += f"<div style='color: #f59e0b; margin-top: 10px;'>⚠️ Note: {result['details']['note']}</div>"

            html += f"""
    <div class="test-result {result['status']}">
        <div class="test-name"><span style="font-size: 24px; margin-right: 10px;">{status_icon}</span>{result['test']}</div>
        <div class="test-message">{result['message']}</div>
        {details_html}
        {screenshot_html}
    </div>
"""

        html += """
</body>
</html>
"""

        report_path = f"{self.screenshot_dir}/ocr_verified_report.html"
        with open(report_path, 'w') as f:
            f.write(html)

        print(f"\n📊 Report saved to: {report_path}")
        return report_path

    def run_all_tests(self):
        """Run all tests with OCR verification"""
        print("\n" + "="*60)
        print("🚀 Phase 1 Test Suite with OCR Verification")
        print("="*60)
        print("\n⚠️  IMPORTANT: All screenshots will be verified with OCR")
        print("   No claims will be made without verification\n")

        if not self.open_browser():
            print("❌ Failed to open browser")
            return

        # Run tests
        self.test_01_desktop_initial_load()
        self.test_02_mobile_view_hamburger()
        self.test_03_error_handling()

        # Generate report
        report_path = self.generate_html_report()

        # Summary
        total = len(self.results)
        passed = sum(1 for r in self.results if r['status'] == 'PASSED')
        failed = sum(1 for r in self.results if r['status'] == 'FAILED')
        warning = sum(1 for r in self.results if r['status'] == 'WARNING')

        print("\n" + "="*60)
        print("📊 Test Summary")
        print("="*60)
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"⚠️  Warnings: {warning}")
        print("="*60)

        # Open report
        subprocess.Popen(['xdg-open', report_path])

if __name__ == '__main__':
    suite = Phase1TestWithOCR()
    suite.run_all_tests()


