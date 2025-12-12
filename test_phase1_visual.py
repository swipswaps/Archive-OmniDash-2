#!/usr/bin/env python3
"""
Visual Test Suite for Phase 1 Improvements
Uses xdotool to interact with browser and take real screenshots
"""

import time
import subprocess
import os
from datetime import datetime

class VisualTestSuite:
    def __init__(self):
        self.screenshot_dir = 'test_screenshots'
        os.makedirs(self.screenshot_dir, exist_ok=True)
        self.browser_window = None
        self.results = []
        
    def run_command(self, cmd):
        """Run shell command and return output"""
        result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
        return result.stdout.strip()
    
    def take_screenshot(self, filename, description):
        """Take screenshot of active window"""
        filepath = f"{self.screenshot_dir}/{filename}"
        self.run_command(f"import -window root {filepath}")
        print(f"📸 Screenshot: {filename} - {description}")
        self.results.append({
            'file': filename,
            'description': description,
            'timestamp': datetime.now().isoformat()
        })
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
            time.sleep(0.5)
            return True
        return False
    
    def click_element(self, x, y):
        """Click at coordinates"""
        self.run_command(f"xdotool mousemove {x} {y} click 1")
        time.sleep(0.5)
    
    def type_text(self, text):
        """Type text"""
        self.run_command(f"xdotool type '{text}'")
        time.sleep(0.3)
    
    def resize_window(self, width, height):
        """Resize browser window"""
        if self.browser_window:
            self.run_command(f"xdotool windowsize {self.browser_window} {width} {height}")
            time.sleep(1)
    
    def open_browser(self):
        """Open browser to localhost:3001"""
        print("🌐 Opening browser...")
        subprocess.Popen(['google-chrome', '--new-window', 'http://localhost:3001'], 
                        stdout=subprocess.DEVNULL, 
                        stderr=subprocess.DEVNULL)
        time.sleep(3)
        return self.focus_browser()
    
    def test_desktop_view(self):
        """Test 1: Desktop View"""
        print("\n🧪 Test 1: Desktop View")
        
        if not self.focus_browser():
            print("❌ Could not find browser window")
            return
        
        # Resize to desktop
        self.resize_window(1920, 1080)
        
        # Screenshot 1: Desktop initial view
        self.take_screenshot(
            "01_desktop_initial.png",
            "Desktop view - Initial state with sidebar visible"
        )
        
        print("✅ Desktop view captured")
    
    def test_mobile_view(self):
        """Test 2: Mobile View with Hamburger Menu"""
        print("\n🧪 Test 2: Mobile View")
        
        if not self.focus_browser():
            print("❌ Could not find browser window")
            return
        
        # Open DevTools and toggle device toolbar
        self.run_command("xdotool key F12")
        time.sleep(1)
        
        # Screenshot 2: DevTools opened
        self.take_screenshot(
            "02_devtools_opened.png",
            "DevTools opened"
        )
        
        # Toggle device toolbar (Ctrl+Shift+M)
        self.run_command("xdotool key ctrl+shift+m")
        time.sleep(1)
        
        # Screenshot 3: Mobile emulation
        self.take_screenshot(
            "03_mobile_emulation.png",
            "Mobile emulation mode - Should show hamburger menu"
        )
        
        print("✅ Mobile view captured")
    
    def test_hamburger_interaction(self):
        """Test 3: Hamburger Menu Interaction"""
        print("\n🧪 Test 3: Hamburger Menu Interaction")
        
        # Click hamburger menu (approximate position top-left)
        # This will need adjustment based on actual position
        self.click_element(50, 150)
        time.sleep(0.5)
        
        # Screenshot 4: Sidebar opened
        self.take_screenshot(
            "04_mobile_sidebar_opened.png",
            "Mobile sidebar opened after clicking hamburger"
        )
        
        # Click outside to close
        self.click_element(400, 400)
        time.sleep(0.5)
        
        # Screenshot 5: Sidebar closed
        self.take_screenshot(
            "05_mobile_sidebar_closed.png",
            "Mobile sidebar closed after clicking outside"
        )
        
        print("✅ Hamburger interaction captured")

    def test_error_handling(self):
        """Test 4: Enhanced Error Handling"""
        print("\n🧪 Test 4: Enhanced Error Handling")

        # Close DevTools first
        self.run_command("xdotool key F12")
        time.sleep(1)

        # Resize back to desktop
        self.resize_window(1920, 1080)
        time.sleep(1)

        # Screenshot 6: Back to desktop
        self.take_screenshot(
            "06_desktop_for_error_test.png",
            "Desktop view for error handling test"
        )

        # Click on "Item Search" in sidebar (approximate position)
        self.click_element(150, 250)
        time.sleep(1)

        # Screenshot 7: Item Search page
        self.take_screenshot(
            "07_item_search_page.png",
            "Item Search page loaded"
        )

        # Click in input field and type invalid identifier
        self.click_element(600, 300)
        time.sleep(0.5)
        self.type_text("invalid_test_12345_nonexistent")

        # Screenshot 8: Invalid input entered
        self.take_screenshot(
            "08_invalid_input_entered.png",
            "Invalid identifier entered in search field"
        )

        # Press Enter or click Fetch button
        self.run_command("xdotool key Return")
        time.sleep(3)

        # Screenshot 9: Error message displayed
        self.take_screenshot(
            "09_error_message_displayed.png",
            "Enhanced error message with retry button and suggestions"
        )

        print("✅ Error handling captured")

    def generate_html_report(self):
        """Generate HTML report with screenshots"""
        html = f"""<!DOCTYPE html>
<html>
<head>
    <title>Phase 1 Visual Test Report</title>
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
        .screenshot-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }}
        .screenshot-card {{
            background: #1e293b;
            border-radius: 12px;
            overflow: hidden;
            border: 1px solid #334155;
            transition: transform 0.2s;
        }}
        .screenshot-card:hover {{
            transform: translateY(-4px);
            border-color: #14b8a6;
        }}
        .screenshot-card img {{
            width: 100%;
            height: auto;
            display: block;
            border-bottom: 1px solid #334155;
        }}
        .screenshot-info {{
            padding: 20px;
        }}
        .screenshot-title {{
            font-weight: bold;
            color: #14b8a6;
            margin-bottom: 8px;
            font-size: 16px;
        }}
        .screenshot-desc {{
            color: #cbd5e1;
            font-size: 14px;
            line-height: 1.5;
        }}
        .screenshot-time {{
            color: #64748b;
            font-size: 12px;
            margin-top: 8px;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>📸 Phase 1 Visual Test Report</h1>
        <div class="timestamp">Archive OmniDash - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
    </div>

    <div class="screenshot-grid">
"""

        for i, result in enumerate(self.results, 1):
            html += f"""
        <div class="screenshot-card">
            <img src="{result['file']}" alt="{result['description']}">
            <div class="screenshot-info">
                <div class="screenshot-title">Screenshot {i}: {result['file']}</div>
                <div class="screenshot-desc">{result['description']}</div>
                <div class="screenshot-time">{result['timestamp']}</div>
            </div>
        </div>
"""

        html += """
    </div>
</body>
</html>
"""

        report_path = f"{self.screenshot_dir}/visual_test_report.html"
        with open(report_path, 'w') as f:
            f.write(html)

        print(f"\n📊 Report saved to: {report_path}")
        return report_path

    def run_all_tests(self):
        """Run all visual tests"""
        print("=" * 60)
        print("🚀 Starting Phase 1 Visual Test Suite")
        print("=" * 60)

        if not self.open_browser():
            print("❌ Failed to open browser")
            return

        self.test_desktop_view()
        self.test_mobile_view()
        self.test_hamburger_interaction()
        self.test_error_handling()

        report_path = self.generate_html_report()

        print("\n" + "=" * 60)
        print(f"✅ Tests Complete - {len(self.results)} screenshots captured")
        print("=" * 60)

        # Open report in browser
        subprocess.Popen(['xdg-open', report_path])

if __name__ == '__main__':
    suite = VisualTestSuite()
    suite.run_all_tests()


