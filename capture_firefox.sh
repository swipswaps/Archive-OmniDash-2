#!/bin/bash
# Capture screenshot from actual Firefox browser

echo "🔍 Finding Firefox window..."
FIREFOX_WIN=$(xdotool search --name "localhost:3001" | head -1)

if [ -z "$FIREFOX_WIN" ]; then
    echo "❌ No Firefox window found with 'localhost:3001' in title"
    echo "Searching for any Firefox window..."
    FIREFOX_WIN=$(xdotool search --class "firefox" | head -1)
fi

if [ -z "$FIREFOX_WIN" ]; then
    echo "❌ No Firefox window found at all"
    exit 1
fi

echo "✅ Found Firefox window: $FIREFOX_WIN"

# Activate the window
echo "🖱️  Activating Firefox window..."
xdotool windowactivate $FIREFOX_WIN
sleep 1

# Take screenshot of the window
echo "📸 Taking screenshot..."
import -window $FIREFOX_WIN test_screenshots/firefox_actual.png 2>/dev/null || \
    scrot -u -o test_screenshots/firefox_actual.png 2>/dev/null || \
    gnome-screenshot -w -f test_screenshots/firefox_actual.png 2>/dev/null

if [ -f "test_screenshots/firefox_actual.png" ]; then
    echo "✅ Screenshot saved: test_screenshots/firefox_actual.png"
    ls -lh test_screenshots/firefox_actual.png
else
    echo "❌ Screenshot failed"
    exit 1
fi

# Try to click Settings button
echo ""
echo "🖱️  Attempting to click Settings button..."
xdotool windowactivate $FIREFOX_WIN
sleep 0.5

# Click at approximate location of Settings button (left sidebar, near bottom)
# This is a guess - adjust coordinates if needed
xdotool mousemove --window $FIREFOX_WIN 130 550
sleep 0.3
xdotool click 1
sleep 2

# Take another screenshot
echo "📸 Taking Settings page screenshot..."
import -window $FIREFOX_WIN test_screenshots/firefox_settings.png 2>/dev/null || \
    scrot -u -o test_screenshots/firefox_settings.png 2>/dev/null || \
    gnome-screenshot -w -f test_screenshots/firefox_settings.png 2>/dev/null

if [ -f "test_screenshots/firefox_settings.png" ]; then
    echo "✅ Settings screenshot saved: test_screenshots/firefox_settings.png"
    ls -lh test_screenshots/firefox_settings.png
fi

echo ""
echo "✅ Done! Check the screenshots in test_screenshots/"

