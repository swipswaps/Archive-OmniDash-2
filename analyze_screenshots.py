#!/usr/bin/env python3
"""
Analyze screenshots to verify what's actually in them
"""

import subprocess
import os
from PIL import Image
import json

def analyze_screenshot(filepath):
    """Analyze a screenshot and return details"""
    if not os.path.exists(filepath):
        return {'error': 'File not found'}
    
    try:
        img = Image.open(filepath)
        
        # Get basic info
        info = {
            'filename': os.path.basename(filepath),
            'size': f"{img.width}x{img.height}",
            'mode': img.mode,
            'format': img.format,
            'file_size': f"{os.path.getsize(filepath) / 1024:.1f} KB"
        }
        
        # Get dominant colors (simplified)
        colors = img.getcolors(maxcolors=10000)
        if colors:
            # Sort by frequency
            colors.sort(reverse=True)
            top_colors = colors[:5]
            info['top_colors'] = [{'count': c[0], 'rgb': c[1]} for c in top_colors]
        
        # Check for dark theme (lots of dark pixels)
        pixels = list(img.getdata())
        dark_pixels = sum(1 for p in pixels if isinstance(p, tuple) and sum(p[:3]) < 100)
        total_pixels = len(pixels)
        info['dark_percentage'] = f"{(dark_pixels / total_pixels * 100):.1f}%"
        
        return info
        
    except Exception as e:
        return {'error': str(e)}

def main():
    screenshots = [
        'test_screenshots/01_desktop_initial.png',
        'test_screenshots/02_devtools_opened.png',
        'test_screenshots/03_mobile_emulation.png',
        'test_screenshots/04_mobile_sidebar_opened.png',
        'test_screenshots/05_mobile_sidebar_closed.png',
        'test_screenshots/06_desktop_for_error_test.png',
        'test_screenshots/07_item_search_page.png',
        'test_screenshots/08_invalid_input_entered.png',
        'test_screenshots/09_error_message_displayed.png',
    ]
    
    print("=" * 80)
    print("SCREENSHOT ANALYSIS REPORT")
    print("=" * 80)
    
    for screenshot in screenshots:
        print(f"\n📸 {screenshot}")
        info = analyze_screenshot(screenshot)
        
        if 'error' in info:
            print(f"   ❌ Error: {info['error']}")
        else:
            print(f"   Size: {info['size']}")
            print(f"   File Size: {info['file_size']}")
            print(f"   Dark Theme: {info['dark_percentage']}")
            
            # Check if it's mostly dark (dark theme app)
            dark_pct = float(info['dark_percentage'].rstrip('%'))
            if dark_pct > 50:
                print(f"   ✅ Appears to be dark theme UI")
            else:
                print(f"   ⚠️  Not dark theme - might be blank/error")
    
    print("\n" + "=" * 80)
    print("OPENING SCREENSHOTS FOR VISUAL INSPECTION...")
    print("=" * 80)
    
    # Open image viewer with all screenshots
    subprocess.run(['eog'] + screenshots, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)

if __name__ == '__main__':
    main()

