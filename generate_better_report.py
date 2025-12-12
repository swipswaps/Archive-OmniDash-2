#!/usr/bin/env python3
"""
Generate better HTML report with embedded OCR text
"""

import os
from datetime import datetime

def read_ocr_file(filepath):
    """Read OCR text file"""
    try:
        with open(filepath, 'r') as f:
            return f.read()
    except:
        return "OCR file not found"

# Test results from the run
results = [
    {
        'test': 'Desktop Initial Load',
        'status': 'PASSED',
        'message': 'All navigation items visible on desktop',
        'screenshot': 'test_screenshots/01_desktop_initial.png',
        'expected': ['OmniDash', 'Home', 'Item Search', 'Deep Search', 'Wayback Machine', 'Settings'],
        'found': ['OmniDash', 'Home', 'Item Search', 'Deep Search', 'Wayback Machine', 'Settings'],
        'missing': []
    },
    {
        'test': 'DevTools Open',
        'status': 'WARNING',
        'message': 'DevTools might not be visible',
        'screenshot': 'test_screenshots/02_devtools_opened.png',
        'expected': ['Elements', 'Console'],
        'found': [],
        'missing': ['Elements', 'Console']
    },
    {
        'test': 'Mobile Hamburger Menu',
        'status': 'WARNING',
        'message': 'Could not verify hamburger menu via OCR (might be icon)',
        'screenshot': 'test_screenshots/03_mobile_view.png',
        'expected': ['☰', 'menu'],
        'found': ['OmniDash'],
        'missing': ['☰', 'menu'],
        'note': 'Manual verification needed - hamburger might be icon'
    },
    {
        'test': 'Item Search Navigation',
        'status': 'FAILED',
        'message': 'Item Search page not loaded',
        'screenshot': 'test_screenshots/04_item_search_page.png',
        'expected': ['Metadata', 'Identifier'],
        'found': [],
        'missing': ['Metadata', 'Identifier']
    }
]

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
        h1 {{ margin: 0; color: #14b8a6; font-size: 32px; }}
        .timestamp {{ color: #94a3b8; margin-top: 10px; }}
        .ocr-notice {{
            margin-top: 15px;
            padding: 15px;
            background: #0f172a;
            border-radius: 8px;
            border-left: 4px solid #14b8a6;
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
        .summary-card .value {{ font-size: 36px; font-weight: bold; }}
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
        .test-name {{ font-weight: bold; font-size: 18px; margin-bottom: 8px; }}
        .test-message {{ color: #cbd5e1; margin-bottom: 10px; }}
        .verification-box {{
            background: #0f172a;
            padding: 15px;
            border-radius: 8px;
            margin-top: 15px;
            border: 1px solid #334155;
        }}
        .verification-box h4 {{
            margin: 0 0 10px 0;
            color: #14b8a6;
            font-size: 14px;
        }}
        .verification-list {{
            font-size: 13px;
            line-height: 1.6;
            color: #94a3b8;
        }}
        .verification-list .item {{
            padding: 4px 0;
        }}
        .verification-list .found {{ color: #10b981; }}
        .verification-list .missing {{ color: #ef4444; }}
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
            cursor: pointer;
        }}
        .screenshot-caption {{
            background: #0f172a;
            padding: 10px;
            font-size: 12px;
            color: #94a3b8;
        }}
        .ocr-output {{
            background: #0f172a;
            padding: 15px;
            margin-top: 15px;
            border-radius: 8px;
            border: 1px solid #334155;
        }}
        .ocr-output h4 {{
            margin: 0 0 10px 0;
            color: #14b8a6;
            font-size: 14px;
        }}
        .ocr-text {{
            font-family: 'Courier New', monospace;
            font-size: 11px;
            line-height: 1.4;
            color: #94a3b8;
            white-space: pre-wrap;
            max-height: 300px;
            overflow-y: auto;
        }}
        .toggle-btn {{
            background: #334155;
            color: #14b8a6;
            border: none;
            padding: 8px 12px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
            margin-top: 10px;
        }}
        .toggle-btn:hover {{ background: #475569; }}
    </style>
</head>
<body>
    <div class="header">
        <h1>🧪 Phase 1 Test Report with OCR Verification</h1>
        <div class="timestamp">Archive OmniDash - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}</div>
        <div class="ocr-notice">
            <strong style="color: #14b8a6;">✅ OCR Verification Enabled</strong><br>
            <span style="color: #94a3b8; font-size: 14px;">
                All screenshots verified with tesseract OCR. Claims are backed by actual text extraction.
                OCR output is embedded below each screenshot.
            </span>
        </div>
    </div>
    
    <div class="summary">
        <div class="summary-card">
            <h3>Total Tests</h3>
            <div class="value">4</div>
        </div>
        <div class="summary-card">
            <h3>Passed</h3>
            <div class="value passed">✅ 1</div>
        </div>
        <div class="summary-card">
            <h3>Failed</h3>
            <div class="value failed">❌ 1</div>
        </div>
        <div class="summary-card">
            <h3>Warnings</h3>
            <div class="value warning">⚠️ 2</div>
        </div>
    </div>
    
    <h2 style="color: #14b8a6; margin-top: 40px;">Test Results</h2>
"""

for result in results:
    status_icon = '✅' if result['status'] == 'PASSED' else '❌' if result['status'] == 'FAILED' else '⚠️'
    
    # Verification details
    verification_html = f"""
    <div class="verification-box">
        <h4>🔍 OCR Verification Results</h4>
        <div class="verification-list">
            <div class="item"><strong>Expected:</strong> {', '.join(result['expected'])}</div>
            <div class="item found"><strong>✅ Found:</strong> {', '.join(result['found']) if result['found'] else 'None'}</div>
            <div class="item missing"><strong>❌ Missing:</strong> {', '.join(result['missing']) if result['missing'] else 'None'}</div>
        </div>
    </div>
    """
    
    # Note if present
    note_html = ''
    if 'note' in result:
        note_html = f'<div style="color: #f59e0b; margin-top: 10px;">⚠️ Note: {result["note"]}</div>'
    
    # Screenshot and OCR
    screenshot_path = result['screenshot']
    ocr_path = f"{screenshot_path}.txt"
    ocr_text = read_ocr_file(ocr_path)
    
    screenshot_html = f"""
    <div class="screenshot">
        <img src="{screenshot_path}" alt="{result['test']}" onclick="window.open('{screenshot_path}', '_blank')">
        <div class="screenshot-caption">
            📸 {screenshot_path} (click to open full size)
        </div>
    </div>
    
    <div class="ocr-output">
        <h4>📄 OCR Text Output</h4>
        <div class="ocr-text">{ocr_text}</div>
    </div>
    """
    
    html += f"""
    <div class="test-result {result['status']}">
        <div class="test-name"><span style="font-size: 24px; margin-right: 10px;">{status_icon}</span>{result['test']}</div>
        <div class="test-message">{result['message']}</div>
        {note_html}
        {verification_html}
        {screenshot_html}
    </div>
    """

html += """
</body>
</html>
"""

# Save report
with open('test_screenshots/complete_ocr_report.html', 'w') as f:
    f.write(html)

print("✅ Report generated: test_screenshots/complete_ocr_report.html")

