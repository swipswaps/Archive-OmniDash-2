# Archive-OmniDash-2 Workspace Rules

## Project Overview
Archive-OmniDash-2 is a React + TypeScript web application providing a unified dashboard for Internet Archive services (metadata search, Wayback Machine, analytics). It runs on ports 3001 (frontend) and 3002 (backend).

## Code Quality Standards

### ❌ FORBIDDEN: Pseudo-Code and Mock Implementations

**User Preference: NO PSEUDO-CODE - All functionality must be real and working**

**NEVER implement fake or simulated functionality:**
- ❌ Status indicators that don't actually validate (e.g., showing "Authenticated" without testing credentials)
- ❌ Mock validation that only checks if data exists, not if it's valid
- ❌ Fake API responses or simulated success states
- ❌ UI elements that appear functional but don't actually work
- ❌ Green checkmarks or success messages without real verification

**ALWAYS implement real, working functionality:**
- ✅ Validate credentials with actual API calls to external services
- ✅ Test authentication against real endpoints (based on official documentation)
- ✅ Return actual error states from real API responses
- ✅ Implement complete workflows, not just UI mockups
- ✅ Use official API documentation and working examples from reputable sources

**Implementation Process:**
1. Research official API documentation (e.g., archive.org/developers)
2. Find working examples from reputable sources (GitHub repos, official docs, forum posts)
3. Implement actual API calls with proper authentication headers
4. Test with both valid and invalid inputs
5. Display real status based on actual API responses (200 OK, 401 Unauthorized, etc.)
6. Handle all error cases with meaningful messages

**Example - Credential Validation:**
```typescript
// ❌ WRONG - Pseudo-code
if (accessKey && secretKey) {
  return { authenticated: true }; // FAKE!
}

// ✅ CORRECT - Real validation
const response = await fetch('https://archive.org/metadata/test', {
  headers: { 'Authorization': `LOW ${accessKey}:${secretKey}` }
});
return { authenticated: response.ok }; // REAL!
```

### Linting & Formatting
- **Always run linters before committing**: `npm run lint` must pass with 0 errors
- **Use Prettier for formatting**: `npm run format` before commits
- **ESLint configuration**: Uses ESLint 9 with TypeScript + React plugins
- **Acceptable warnings**: Up to 40 non-critical warnings are acceptable (unused imports, any types)
- **Zero tolerance for errors**: All ESLint errors must be fixed

### TypeScript Standards
- **Avoid `any` types**: Replace with proper interfaces or `unknown`
- **Type safety**: All function parameters and returns should be typed
- **Strict mode**: TypeScript strict mode is enabled

### Accessibility (WCAG 2.1 Level AA)
- **Keyboard navigation**: All interactive elements must support Tab, Enter, Space
- **ARIA labels**: All buttons, icons, and interactive elements need `aria-label`
- **Focus indicators**: Use `:focus-visible` with teal ring (`#14b8a6`)
- **Semantic HTML**: Use `<header>`, `<nav>`, `<main>`, proper roles
- **Screen reader support**: Add `aria-live`, `aria-current`, `role` attributes
- **Skip links**: Include skip-to-content for keyboard users

## Process Management

### Starting/Stopping the App
- **Use provided scripts**: `npm start`, `npm stop`, `npm run restart`
- **Never run duplicate instances**: Scripts auto-detect running instances
- **Port management**: Frontend on 3001, backend on 3002
- **Clean shutdown**: Always use `npm stop` to free resources properly
- **PID tracking**: Scripts track process IDs in `.pid` files

### Development Workflow
```bash
npm start          # Start with instance detection
npm stop           # Clean shutdown
npm run restart    # Stop + Start
npm run dev        # Direct Vite (no protection)
```

## Security Standards

### Dependency Management
- **Use package managers**: Always use `npm install/uninstall`, never edit package.json manually
- **Audit regularly**: Run `npm audit` and fix HIGH/CRITICAL vulnerabilities
- **Known issue**: `xlsx@0.18.5` has HIGH severity issues - consider replacing with `exceljs`
- **Keep updated**: Update Vite and other dependencies regularly

### API Key Storage
- **Backend encryption**: API keys stored with AES-256-GCM encryption
- **Never commit keys**: Use environment variables or secure backend storage
- **Demo mode**: Support testing without API calls

## File Organization

### Key Directories
- `src/components/` - Reusable UI components (Sidebar, ExportModal, etc.)
- `src/views/` - Page-level components (Dashboard, MetadataExplorer, etc.)
- `src/services/` - API services (iaService, waybackService)
- `src/types/` - TypeScript type definitions
- `backend/` - Node.js backend for secure credential storage

### Documentation Files
- `UX_ISSUES_AUDIT.md` - Comprehensive UX audit (64 issues documented)
- `UX_ACCESSIBILITY_FIXES_APPLIED.md` - Accessibility implementation details
- `STARTUP_GUIDE.md` - Process management documentation
- `AUDIT_SUMMARY.md` - Security and code quality audit
- `LINT_FIXES_SUMMARY.md` - Linting fixes documentation

## Testing Requirements

### Before Committing
1. Run `npm run lint` - Must pass with 0 errors
2. Run `npm run format` - Format all files
3. Run `npm run type-check` - TypeScript validation
4. Test keyboard navigation (Tab, Enter, Space)
5. Test screen reader compatibility (NVDA/VoiceOver)
6. Test on mobile (touch targets, responsive layout)

### Testing Methodology: How to Verify Code Fixes (MANDATORY)

**THE COMPLETE TESTING WORKFLOW:**

When user asks you to fix code and verify it works, follow this EXACT process:

#### Phase 1: Make Code Changes
1. Understand the issue from user description
2. Use codebase-retrieval to find relevant code
3. Make the fix using str-replace-editor
4. Rebuild: `npm run build` or equivalent
5. **DO NOT claim success yet**

#### Phase 2: Automated Testing with Selenium
Use Selenium to programmatically interact with the app:

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
import time

driver = webdriver.Firefox()  # Visible browser, NOT headless
driver.maximize_window()

try:
    # Navigate through the UI
    driver.get("http://localhost:3001/Archive-OmniDash-2/")
    time.sleep(5)

    # Click elements (use correct selectors from codebase)
    btn = driver.find_element(By.CSS_SELECTOR, "button[aria-label='...']")
    btn.click()

    # Take screenshots at each step
    driver.save_screenshot('selenium_screenshots/step1.png')

    # Extract data from page
    rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")

    # Analyze results
    # Print findings to user

finally:
    driver.quit()
```

**Selenium is for:** Automated navigation, clicking, form filling, data extraction

#### Phase 3: Visual Verification with User's Actual Browser

**CRITICAL:** Selenium creates its OWN browser instance. The user is looking at a DIFFERENT browser window!

To see what the USER sees, use xdotool + scrot + OCR:

```bash
# Find user's actual Firefox window
FIREFOX_WIN=$(xdotool search --name "Archive OmniDash" | head -1)

# Activate it
xdotool windowactivate $FIREFOX_WIN
sleep 1

# Screenshot it
scrot -u user_browser.png

# OCR it
tesseract user_browser.png user_browser 2>/dev/null

# Show user what you see
cat user_browser.txt
```

**Tools and Their Purposes:**
- **Selenium**: Automated browser control (clicking, typing, extracting data)
- **xdotool**: Find and control user's actual window
- **scrot**: Screenshot user's actual window (`scrot -u` = active window)
- **ImageMagick (import)**: Alternative screenshot tool (use scrot instead, more reliable)
- **tesseract**: OCR to read text from screenshots
- **opencv**: Image analysis (pixel comparison, visual regression testing)
- **Playwright**: Alternative to Selenium (can also be used)

#### Phase 4: Verification Protocol

**MANDATORY steps before claiming fix works:**

1. ✅ Run Selenium test to navigate and extract data
2. ✅ Take screenshot of user's actual browser window
3. ✅ Run OCR on screenshot
4. ✅ Show OCR output to user
5. ✅ Analyze the data (e.g., check if timestamps vary)
6. ✅ Show analysis results to user
7. ✅ Ask user to confirm they see the same thing
8. ✅ Only after user confirms, claim success

**CRITICAL RULES:**
1. **NEVER guess what is on screen** - Always use OCR or element inspection
2. **NEVER make claims without verification** - OCR or Selenium element verification required
3. **ALWAYS use Selenium for browser control** - NOT xdotool (unreliable window focus)
4. **ALWAYS share screenshots with user** - Show file paths and OCR excerpts
5. **GUESSING IS NOT ACCEPTABLE** - Verify everything
6. **NEVER claim fix is complete without user verification** - User must confirm they see the fix working
7. **NEVER skip verification steps** - If you promise to screenshot/test, DO IT before claiming success

**EVASION PREVENTION (CRITICAL - USER FRUSTRATION ISSUE):**

The LLM has a pattern of evading verification requests. This is FORBIDDEN.

**Common Evasion Patterns (ALL FORBIDDEN):**
1. ❌ Promising to screenshot/test, then claiming success without doing it
2. ❌ Saying "the fix is deployed, please refresh and test" without YOU testing first
3. ❌ Jumping from "I will verify" to "it's fixed" without showing verification
4. ❌ Making code changes and assuming they work without running them
5. ❌ Encountering an error in testing, then claiming success anyway
6. ❌ Taking screenshots but not showing them to the user
7. ❌ Running OCR but not sharing the OCR output with the user
8. ❌ Saying "I tested it" without showing the test results
9. ❌ Claiming "the issue is fixed" when user explicitly says it's not
10. ❌ Moving on to documentation/commits before verification is complete
11. ❌ **CRITICAL: Apologizing instead of immediately fixing rules.md when user says to**
12. ❌ **CRITICAL: Breaking working features when making changes (REGRESSIONS)**

**MANDATORY Verification Protocol:**
1. ✅ If you promise to test/screenshot, DO IT before saying anything else
2. ✅ Show EVERY screenshot to the user (file path + key OCR excerpts)
3. ✅ Show EVERY test result to the user (timestamps, counts, patterns)
4. ✅ If test fails/errors, ACKNOWLEDGE IT and debug, don't skip ahead
5. ✅ If user says "it's not working", BELIEVE THEM and investigate
6. ✅ Complete ALL promised steps before claiming success
7. ✅ Ask user to confirm they see the fix working before moving on
8. ✅ If you can't verify, SAY SO - don't pretend you did

**REGRESSION PREVENTION PROTOCOL (CRITICAL):**

When user asks to fix a UI issue (e.g., "make labels more readable"):

**BEFORE making ANY code changes:**
1. ✅ Use `view` to see the ENTIRE component file, not just the function
2. ✅ Use codebase-retrieval to understand what the component does
3. ✅ Identify EXACTLY what needs to change (e.g., XAxis properties)
4. ✅ Verify your change won't remove or break existing features
5. ✅ Make MINIMAL changes - only what's needed to fix the issue

**AFTER making code changes:**
1. ✅ Rebuild: `npm run build`
2. ✅ Use Selenium to navigate to the feature
3. ✅ Verify the feature still EXISTS (e.g., chart renders)
4. ✅ Use xdotool + scrot + OCR to check user's actual browser
5. ✅ Verify BOTH: (a) old feature works, (b) new fix applied
6. ✅ Show user the OCR/screenshot proving both work
7. ✅ Ask user to confirm

**Example of REGRESSION:**
- User: "timeline dates are squeezed together"
- Bad LLM: Changes XAxis, accidentally removes entire chart
- Good LLM: Views full component, changes only XAxis interval/angle, verifies chart still renders

**If user says "you removed the working feature":**
1. ✅ Immediately view the file to see what you changed
2. ✅ Identify what was removed/broken
3. ✅ Fix it by restoring the removed code
4. ✅ Update rules.md with specific prevention rule
5. ✅ THEN verify with user's browser

**When User Says "STOP":**
- Immediately stop current action
- Read what user is pointing out
- Acknowledge the specific issue they raised
- Address THAT issue, not what you think the issue is

**When User Mentions Something (e.g., "the export modal"):**
- ❌ DO NOT assume it's currently open/visible
- ✅ FIRST: Look at user's actual window with xdotool + scrot + OCR
- ✅ VERIFY the current state before taking action
- ✅ If user says "check again", it means your previous claim was WRONG

**When Debugging Browser Issues:**
- ❌ DO NOT use Selenium to create a new browser instance
- ✅ Use xdotool to find user's actual Firefox window
- ✅ Use xdotool to press F12 to open DevTools
- ✅ Use xdotool to click Console tab
- ✅ Screenshot and OCR the console to see errors
- ✅ If user provides console logs, READ THEM CAREFULLY
- ✅ Look for error patterns (CORS, fetch failures, etc.)
- ✅ Review chat logs if user mentions "you had this working before"

**When Code Changes Don't Take Effect:**
- ❌ DO NOT assume Ctrl+Shift+R clears JavaScript cache
- ✅ Check if console logs match the new code (e.g., "via corsproxy.io")
- ✅ If old code is running, browser cached the JavaScript modules
- ✅ Tell user to close the tab completely and open a new one
- ✅ Or tell user to use Ctrl+F5 or clear cache manually
- ✅ Verify the dist/ files contain the new code with grep
- ✅ Check dev server is serving the new build (restart if needed)

## CRITICAL: Why CDX API Stopped Working (Dec 13, 2025)

**What Worked Before (chatLog line 3894-3938):**
- AllOrigins proxy (`https://api.allorigins.win/raw?url=...`) was functioning
- Returned real CDX JSON data
- Got 1151 records with varying timestamps (19991012112003, 20000208035046, etc.)

**What Changed:**
- AllOrigins started returning HTTP 408 timeout with body: "Oops... Request Timeout."
- Content-type: `text/plain;charset=UTF-8` (not application/json)
- But sometimes returns HTTP 200 with content-type: application/json and EMPTY or INVALID JSON body
- This passes initial validation but fails JSON parsing
- Falls back to mock data (200 records, all timestamps ending in 120000)

**The Fix (Self-Healing Proxy Fallback):**
1. Try AllOrigins first
2. Check res.ok AND content-type AND actually parse the JSON to validate
3. If AllOrigins returns error message or invalid JSON, immediately try corsproxy.io
4. If corsproxy.io fails, throw error (don't silently fall back to mock data)
5. This makes the code robust to external proxy failures

**Code Location:** `services/waybackService.ts` lines 138-180

**Testing:** After rebuild, hard refresh browser and check console for:
- "AllOrigins returned invalid JSON, trying corsproxy.io..."
- "✅ CORS fallback successful via corsproxy.io"
- Should see 1000+ records instead of 200

**How to Actually Look at User's Browser (PROVEN METHOD):**

When user says "LOOK AT THE OPEN FIREFOX WINDOW", do this EXACT sequence:

```bash
# 1. Find the user's actual Firefox window by name
FIREFOX_WIN=$(xdotool search --name "Archive OmniDash" | head -1)

# 2. Activate it (bring to front)
xdotool windowactivate $FIREFOX_WIN

# 3. Wait for window to activate
sleep 1

# 4. Screenshot using scrot -u (active window)
scrot -u user_firefox_screenshot.png

# 5. OCR it
tesseract user_firefox_screenshot.png user_firefox_screenshot 2>/dev/null

# 6. Show FULL OCR output to user
cat user_firefox_screenshot.txt
```

**DO NOT:**
- ❌ Use Selenium's window (that's a different browser instance)
- ❌ Use `import -window` (has issues)
- ❌ Assume what's on screen without OCR
- ❌ Show only first 100 lines if user needs to see timestamps

**DO:**
- ✅ Use xdotool to find user's actual window
- ✅ Use scrot -u for screenshot
- ✅ Show complete OCR output
- ✅ If user says scroll, use: `xdotool key Page_Down`

**Correct Pattern:**
```
User: "Look at the Firefox window"
LLM: [Runs xdotool + scrot + OCR commands above]
LLM: "Here's what I see in YOUR Firefox window:
     - Screenshot: user_firefox_screenshot.png
     - OCR output shows:
       [paste ACTUAL OCR text]
     - I can see: [describe what OCR shows]

     What should I look for?"
```

**Incorrect Pattern (FORBIDDEN):**
```
User: "Look at the Firefox window"
LLM: "I'll take a screenshot..."
[Uses Selenium or wrong window]
LLM: "I see the page loaded. The fix is working!"
[User: "No it's not, you're not looking at MY window"]
```

### Complete Example: How We Fixed the CORS and Timeline Issues

**Issue 1: CORS Fallback Not Working (Timestamps All Ending in 120000)**

1. **User reported**: All timestamps end in 120000 (mock data)
2. **Initial mistake**: Made code changes, claimed "fix deployed, please test"
3. **User correction**: "You didn't test it, you're evading"
4. **Proper approach**:
   - Used Selenium to navigate: Click Wayback → History → Enter URL → Search
   - Used xdotool to find user's actual Firefox window
   - Used scrot to screenshot user's window
   - Used tesseract OCR to read what user sees
   - Found "1151 records found" in OCR
   - Scrolled down with `xdotool key Page_Down`
   - OCR showed varying timestamps (112003, 035046, 070629, etc.)
   - **Asked user to confirm**: "Can you confirm you see these varying timestamps?"
   - **User confirmed**: "yes"
   - **Only then claimed success**

**Issue 2: Timeline Chart Year Labels Squeezed/Unreadable**

1. **User reported**: "timeline dates are squeezed together and hard to read"
2. **Proper approach**:
   - Used xdotool to screenshot user's window
   - OCR showed garbled text where timeline should be
   - Used codebase-retrieval to find timeline chart code
   - Found XAxis with `interval={0}` forcing all 25+ year labels to display
   - Made fix: `interval="preserveStartEnd"`, `angle={-45}`, increased height
   - Rebuilt: `npm run build`
   - **Told user to refresh browser**
   - **User confirmed**: "that works"
   - **Only then claimed success**

**Key Lessons:**
1. ✅ Always verify with user's actual browser window (xdotool + scrot + OCR)
2. ✅ Show OCR output to user before making claims
3. ✅ Ask user to confirm they see the fix
4. ✅ Only claim success after user confirmation
5. ✅ If user says "stop" or "you're evading", immediately acknowledge and correct
6. ✅ Rebuild after code changes: `npm run build`
7. ✅ Tell user to hard refresh: Ctrl+Shift+R

**Proper Method: Selenium + OCR + Screenshots**

1. **Use Selenium for Browser Control (MANDATORY)**
   ```python
   from selenium import webdriver
   from selenium.webdriver.common.by import By
   from selenium.webdriver.support.ui import WebDriverWait
   from selenium.webdriver.support import expected_conditions as EC

   # Use Selenium, NOT xdotool
   driver = webdriver.Firefox()  # Use Firefox (visible browser)
   driver.maximize_window()
   driver.get('http://localhost:3001/Archive-OmniDash-2/')

   # Wait for elements (don't guess)
   element = WebDriverWait(driver, 10).until(
       EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Item Search')]"))
   )

   # Click with Selenium (reliable)
   element.click()
   ```

### Navigating Archive-OmniDash-2 with Selenium (REQUIRED READING)

**Component Structure (from actual code - DO NOT GUESS):**

1. **Sidebar Navigation** (`components/Sidebar.tsx`):
   - Uses `<button>` elements (NOT `<a>` links) ← **CRITICAL**
   - Each button has `aria-label="Navigate to {Page Name}"`
   - Button contains an icon + text label
   - Selector: `button[aria-label='Navigate to Wayback Machine']`

2. **Wayback Tools Page** (`views/WaybackTools.tsx`):
   - **Mode Tabs**: Four buttons for different modes
     - "Check" tab (available mode) - **DEFAULT**
     - "Save" tab (save mode)
     - "History" tab (cdx mode) - **THIS IS THE CDX HISTORY VIEW** ← **IMPORTANT**
     - "Library" tab (saved mode)
   - **URL Input**: `<input type="text">` (NOT `type="url"`) ← **CRITICAL**
   - **Submit Button**: Text changes based on mode:
     - "Check" (available mode)
     - "Save Now" (save mode)
     - "Search History" (cdx/History mode) ← **USE THIS FOR CDX SEARCH**
   - **Results Table**: `<table>` with timestamps in first column
     - Selector: `table tbody tr`
     - Timestamp cell: First `<td>` in each row

**CORRECT Selenium Navigation Pattern (MANDATORY):**

```python
from selenium import webdriver
from selenium.webdriver.common.by import By
import time
import subprocess

# ALWAYS use visible browser (NOT headless)
driver = webdriver.Firefox()
driver.maximize_window()

# Step 1: Load homepage
driver.get("http://localhost:3001/Archive-OmniDash-2/")
time.sleep(5)
driver.save_screenshot('test_1_homepage.png')

# Step 2: Click Wayback Machine in sidebar (use aria-label)
wayback_btn = driver.find_element(By.CSS_SELECTOR, "button[aria-label='Navigate to Wayback Machine']")
wayback_btn.click()
time.sleep(3)
driver.save_screenshot('test_2_wayback_page.png')

# Step 3: Click "History" tab to switch to CDX mode
history_tab = driver.find_element(By.XPATH, "//button[contains(text(), 'History')]")
history_tab.click()
time.sleep(2)
driver.save_screenshot('test_3_history_tab.png')

# Step 4: Enter URL in text input
url_input = driver.find_element(By.CSS_SELECTOR, "input[type='text']")
url_input.clear()
url_input.send_keys("sunelec.com")
time.sleep(1)
driver.save_screenshot('test_4_url_entered.png')

# Step 5: Click "Search History" button
search_btn = driver.find_element(By.XPATH, "//button[contains(text(), 'Search History')]")
search_btn.click()
time.sleep(20)  # Wait for API response
driver.save_screenshot('test_5_after_search.png')

# Step 6: Extract timestamps from table
rows = driver.find_elements(By.CSS_SELECTOR, "table tbody tr")
timestamps = []
for row in rows[:100]:
    cells = row.find_elements(By.TAG_NAME, "td")
    if cells:
        ts = cells[0].text.strip()
        if ts and len(ts) >= 14:
            timestamps.append(ts)

# Step 7: Analyze timestamp patterns
endings = [ts[-6:] for ts in timestamps]  # Last 6 digits (HHMMSS)
unique_endings = set(endings)

if len(unique_endings) == 1 and list(unique_endings)[0] == "120000":
    print("❌ COLLAPSED DATA - All timestamps end in 120000")
    print("   This indicates MOCK data (Demo Mode OR API failure)")
else:
    print(f"✅ REAL DATA - {len(unique_endings)} different patterns")
```

**Common Mistakes to AVOID:**

- ❌ Using `//a[contains(text(), 'Wayback Machine')]` - sidebar uses `<button>`, not `<a>`
- ❌ Using `input[type='url']` - the input is `type='text'`
- ❌ Looking for button text "Check" in History mode - it changes to "Search History"
- ❌ Using hash routing like `driver.get('...#/wayback')` - must click sidebar buttons
- ❌ Forgetting to click "History" tab - default mode is "Check" (available)
- ❌ Not waiting long enough for API response (needs 15-25 seconds)
- ❌ Using headless mode - ALWAYS use visible browser

**Timestamp Analysis for Debugging:**

- **MOCK data pattern**: All timestamps end in `120000` (monthly snapshots)
  - Example: `20100101120000`, `20100201120000`, `20100301120000`
  - Generated by `services/mockService.ts` line 50
  - Indicates: Demo Mode enabled OR API call failed (check browser console)

- **REAL data pattern**: Varying timestamp endings
  - Example: `19991012112003`, `20000208035046`, `20000302070629`
  - From actual CDX API
  - Indicates: API working correctly

2. **Screenshot + OCR Verification (MANDATORY)**
   - Take screenshot at EVERY major test step using Selenium
   - **IMMEDIATELY run OCR** on the screenshot
   - **VERIFY expected text is present** in OCR output
   - **IF VERIFICATION FAILS** → Mark test as FAILED, do not proceed
   - **ONLY IF VERIFIED** → Make claims about screenshot content
   - Save to `test_screenshots/` directory
   - Use descriptive filenames: `01_feature_state.png`, `02_feature_action.png`
   - Include screenshots in test failure cases: `feature_FAILED.png`
   - Embed screenshots AND OCR text in HTML test reports

2. **OCR Verification Requirements (MANDATORY)**
   ```python
   # REQUIRED after EVERY screenshot
   def verify_screenshot(filepath, expected_texts, test_name):
       """
       Verify screenshot contains expected text using OCR.

       Args:
           filepath: Path to screenshot
           expected_texts: List of strings that MUST be present
           test_name: Name of test for error reporting

       Returns:
           (success: bool, ocr_text: str, missing: list)
       """
       # Run OCR
       result = subprocess.run(
           ['tesseract', filepath, 'stdout'],
           capture_output=True, text=True, stderr=subprocess.DEVNULL
       )
       ocr_text = result.stdout.lower()

       # Check for expected texts
       missing = []
       for expected in expected_texts:
           if expected.lower() not in ocr_text:
               missing.append(expected)

       # Report results
       if missing:
           print(f"❌ {test_name} VERIFICATION FAILED")
           print(f"   Screenshot: {filepath}")
           print(f"   Missing text: {missing}")
           print(f"   OCR found: {ocr_text[:300]}")
           return False, ocr_text, missing
       else:
           print(f"✅ {test_name} VERIFIED")
           print(f"   Found: {expected_texts}")
           return True, ocr_text, []
   ```

3. **Screenshot Naming Convention**
   ```
   01_initial_state.png
   02_action_performed.png
   03_result_verified.png
   04_feature_FAILED.png (for failures)
   05_feature_WARNING.png (for warnings)
   ```

4. **Test Report Requirements**
   - Generate HTML report with embedded screenshots
   - Include OCR verification results for each screenshot
   - Show expected vs actual text for failed verifications
   - Include screenshot thumbnails inline with test results
   - Link screenshots to full-size images
   - Save report to `test_screenshots/test_report.html`
   - Auto-open report in browser after test completion

5. **Screenshot Best Practices**
   - Wait for React hydration (3-5 seconds) before screenshots
   - Wait additional 1-2 seconds after actions before screenshots
   - Capture full viewport, not just elements
   - Use descriptive alt text in HTML reports
   - Include timestamp in screenshot metadata
   - Save OCR output to .txt file alongside screenshot
   - Compress images if larger than 500KB

6. **MANDATORY Test Structure - Copy This Template**
   ```python
   import subprocess
   import time

   def verify_screenshot(filepath, expected_texts, test_name):
       """
       MANDATORY: Verify screenshot contains expected text using OCR.
       NEVER skip this step. NEVER make claims without verification.
       """
       # Run OCR
       result = subprocess.run(
           ['tesseract', filepath, 'stdout'],
           capture_output=True, text=True, stderr=subprocess.DEVNULL
       )
       ocr_text = result.stdout.lower()

       # Save OCR output
       with open(f"{filepath}.txt", 'w') as f:
           f.write(result.stdout)

       # Check for ALL expected texts
       missing = []
       for expected in expected_texts:
           if expected.lower() not in ocr_text:
               missing.append(expected)

       # Report results
       if missing:
           print(f"❌ {test_name} VERIFICATION FAILED")
           print(f"   Screenshot: {filepath}")
           print(f"   Missing: {missing}")
           print(f"   OCR output saved to: {filepath}.txt")
           print(f"   OCR preview: {ocr_text[:200]}")
           return False, ocr_text, missing
       else:
           print(f"✅ {test_name} VERIFIED")
           print(f"   Found all expected: {expected_texts}")
           return True, ocr_text, []

   def test_feature_example(self):
       """Example test with MANDATORY OCR verification"""
       driver.get('http://localhost:3001')
       time.sleep(3)  # Wait for React hydration

       # Step 1: Take screenshot
       screenshot_path = 'test_screenshots/01_initial.png'
       driver.save_screenshot(screenshot_path)

       # Step 2: VERIFY screenshot (MANDATORY - DO NOT SKIP)
       verified, ocr_text, missing = verify_screenshot(
           screenshot_path,
           expected_texts=['OmniDash', 'Home', 'Item Search'],
           test_name='Initial Page Load'
       )

       # Step 3: Check verification result
       if not verified:
           # Test FAILED - do not proceed
           self.add_result('Initial Load', 'FAILED',
                          f'Missing: {missing}',
                          {'screenshot': screenshot_path})
           return False

       # Step 4: Only proceed if verified
       self.add_result('Initial Load', 'PASSED',
                      'All expected elements present',
                      {'screenshot': screenshot_path})

       # Perform action
       element = driver.find_element(By.XPATH, "//button[contains(., 'Item Search')]")
       element.click()
       time.sleep(2)  # Wait for navigation

       # Step 5: Take screenshot after action
       screenshot_path = 'test_screenshots/02_after_click.png'
       driver.save_screenshot(screenshot_path)

       # Step 6: VERIFY screenshot (MANDATORY - DO NOT SKIP)
       verified, ocr_text, missing = verify_screenshot(
           screenshot_path,
           expected_texts=['Metadata', 'Fetch', 'Identifier'],
           test_name='Item Search Page'
       )

       # Step 7: Check verification result
       if not verified:
           self.add_result('Navigation', 'FAILED',
                          f'Missing: {missing}',
                          {'screenshot': screenshot_path})
           return False

       self.add_result('Navigation', 'PASSED',
                      'Item Search page loaded correctly',
                      {'screenshot': screenshot_path})

       return True
   ```

7. **CRITICAL RULES - NO EXCEPTIONS**
   - ❌ NEVER claim what a screenshot shows without OCR verification
   - ❌ NEVER skip OCR verification "to save time"
   - ❌ NEVER assume a screenshot captured the right thing
   - ❌ NEVER make UX improvements without testing them with screenshots
   - ✅ ALWAYS run OCR immediately after taking screenshot
   - ✅ ALWAYS check verification result before proceeding
   - ✅ ALWAYS fail the test if verification fails
   - ✅ ALWAYS save OCR output to .txt file for review
   - ✅ ALWAYS include BEFORE and AFTER screenshots when making UX improvements
   - ✅ ALWAYS verify improvements work via OCR before claiming success

8. **UX Improvement Testing Requirements (MANDATORY)**
   When making UX improvements, ALWAYS:

   a) **Take BEFORE screenshot:**
   ```python
   # Before making any changes
   verified, screenshot, ocr_text, missing = take_screenshot(
       'Before UX Fix - Issue Name',
       ['expected', 'elements']
   )
   # Document the problem in OCR
   ```

   b) **Make the improvement to code**

   c) **Reload the app in browser:**
   ```python
   driver.refresh()
   time.sleep(3)  # Wait for reload
   ```

   d) **Take AFTER screenshot:**
   ```python
   verified, screenshot, ocr_text, missing = take_screenshot(
       'After UX Fix - Issue Name',
       ['expected', 'new', 'elements']
   )
   # Verify the fix worked via OCR
   ```

   e) **Compare and document:**
   - Show both screenshots in HTML report
   - Highlight what changed
   - Verify improvement via OCR
   - If OCR verification fails, the fix didn't work

   **Example:**
   ```python
   # BEFORE: Take screenshot showing the problem
   verified, before_screenshot, ocr_text, missing = take_screenshot(
       'Before - Mobile Sidebar Always Visible',
       ['Home', 'Item Search', 'Settings']  # Sidebar items visible
   )

   # Make the fix (add hamburger menu code)
   # ... edit files ...

   # Reload app
   driver.refresh()
   time.sleep(3)

   # AFTER: Take screenshot showing the fix
   verified, after_screenshot, ocr_text, missing = take_screenshot(
       'After - Hamburger Menu Added',
       ['OmniDash']  # Only app name visible, sidebar hidden
   )

   # Verify hamburger button exists
   hamburger = driver.find_element(By.CSS_SELECTOR, "button[aria-label='Open menu']")
   assert hamburger is not None, "Hamburger button not found after fix"
   ```

6. **HTML Report Template**
   - Must include screenshot gallery
   - Show screenshots inline with test results
   - Use responsive image sizing (max-width: 100%)
   - Add border and shadow for visibility
   - Include screenshot path in test details JSON

### Accessibility Testing Checklist
- [ ] Tab through entire app
- [ ] Activate all buttons with Enter/Space
- [ ] Verify focus indicators visible
- [ ] Test skip-to-content link
- [ ] Screen reader announces all elements
- [ ] All images have alt text
- [ ] Status messages use aria-live

## UX Principles

### Error Handling
- **Specific error messages**: Never use generic "Unknown error"
- **Recovery suggestions**: Provide actionable next steps with 💡 emoji
- **Retry mechanisms**: Add retry buttons on failures
- **Input validation**: Validate before API calls with helpful messages

### User Feedback
- **Loading states**: Show spinners/progress during API calls
- **Empty states**: Helpful messages when no data available
- **Toast notifications**: Use for success/error feedback
- **Status visibility**: Show which service/engine is active

### Mobile Responsiveness
- **Touch targets**: Minimum 44x44px for all interactive elements
- **Responsive breakpoints**: Use 768px for mobile/desktop split
- **Collapsible sidebar**: Hamburger menu on mobile
- **Text sizing**: Minimum 16px on mobile

## Git Workflow

### Commit Standards
- **Descriptive messages**: Explain what and why
- **Atomic commits**: One logical change per commit
- **Test before push**: Ensure app runs and tests pass

### Repository Structure
- **Main repo**: https://github.com/swipswaps/Archive-OmniDash-2
- **Branch strategy**: Use feature branches for major changes
- **Documentation**: Update relevant .md files with changes

## Performance Guidelines

### CORS Handling
- **Smart fallback**: Auto-switch APIs when CORS blocked
- **Backend proxy**: Use secure backend for sensitive operations
- **Error recovery**: Graceful degradation when services unavailable

### Code Efficiency
- **Lazy loading**: Use React.lazy for route-based code splitting
- **Memoization**: Use useMemo/useCallback for expensive operations
- **Debouncing**: Debounce search inputs and API calls

## Automation Preferences

### Testing & Debugging
- **Use xdotool + screenshots FIRST**: For visual UI testing with real browser interaction
- **Use Selenium with screenshots**: For automated testing with visual verification
- **Fallback to Playwright**: If Selenium unavailable
- **Avoid manual instructions**: Automate error-prone tasks

### Visual Testing Priority
1. **xdotool + ImageMagick** - Best for visual verification (real browser, real screenshots)
2. **Selenium (non-headless) + screenshots** - Good for automated testing with visual proof
3. **Playwright** - Fallback option
4. **Manual testing** - Last resort only

## Code Review Checklist

Before marking work complete:
- [ ] ESLint passes with 0 errors
- [ ] Prettier formatting applied
- [ ] TypeScript types are correct
- [ ] Accessibility features added (ARIA, keyboard, focus)
- [ ] Error messages are specific and helpful
- [ ] Mobile responsive (tested at 768px breakpoint)
- [ ] Documentation updated
- [ ] No security vulnerabilities introduced
- [ ] Process management scripts work
- [ ] App starts/stops cleanly

## Notes
- **Production ready**: Code quality rated 9/10
- **WCAG compliant**: Level AA accessibility achieved
- **Smart CORS fallback**: Handles Internet Archive API limitations
- **Secure backend**: AES-256-GCM encrypted credential storage

