#!/bin/bash
# Capture the actual BROWSER window, not VSCode

echo "🔍 Finding all windows..."
xdotool search --class "" 2>/dev/null | while read win_id; do
    win_name=$(xdotool getwindowname $win_id 2>/dev/null)
    win_class=$(xdotool getwindowclassname $win_id 2>/dev/null)
    echo "Window ID: $win_id | Class: $win_class | Name: $win_name"
done | grep -i -E "(firefox|chrome|browser)" | head -20

echo ""
echo "🎯 Looking specifically for browser windows..."

# Try to find Firefox
FIREFOX_WIN=$(xdotool search --class "Navigator" 2>/dev/null | head -1)
if [ -z "$FIREFOX_WIN" ]; then
    FIREFOX_WIN=$(xdotool search --classname "firefox" 2>/dev/null | head -1)
fi
if [ -z "$FIREFOX_WIN" ]; then
    FIREFOX_WIN=$(xdotool search --class "firefox" 2>/dev/null | head -1)
fi

# Try to find Chrome
CHROME_WIN=$(xdotool search --class "Chrome" 2>/dev/null | head -1)
if [ -z "$CHROME_WIN" ]; then
    CHROME_WIN=$(xdotool search --classname "google-chrome" 2>/dev/null | head -1)
fi

echo ""
if [ -n "$FIREFOX_WIN" ]; then
    echo "✅ Found Firefox window: $FIREFOX_WIN"
    WIN_TO_USE=$FIREFOX_WIN
    BROWSER="Firefox"
elif [ -n "$CHROME_WIN" ]; then
    echo "✅ Found Chrome window: $CHROME_WIN"
    WIN_TO_USE=$CHROME_WIN
    BROWSER="Chrome"
else
    echo "❌ No browser window found"
    exit 1
fi

echo "📸 Capturing $BROWSER window..."
xdotool windowactivate $WIN_TO_USE
sleep 1

# Use import (ImageMagick) to capture the specific window
import -window $WIN_TO_USE test_screenshots/browser_capture.png

if [ -f "test_screenshots/browser_capture.png" ]; then
    echo "✅ Screenshot saved: test_screenshots/browser_capture.png"
    file test_screenshots/browser_capture.png
    ls -lh test_screenshots/browser_capture.png
else
    echo "❌ Screenshot failed"
    exit 1
fi
