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

### Selenium Testing Standards (MANDATORY - NO EXCEPTIONS)

**CRITICAL RULES:**
1. **NEVER guess what is on screen** - Always use OCR or element inspection
2. **NEVER make claims without verification** - OCR or Selenium element verification required
3. **ALWAYS use Selenium for browser control** - NOT xdotool (unreliable window focus)
4. **ALWAYS share screenshots with user** - Embedded in HTML reports with OCR text
5. **GUESSING IS NOT ACCEPTABLE** - Verify everything

**Proper Method: Selenium + OCR + Screenshots**

1. **Use Selenium for Browser Control (MANDATORY)**
   ```python
   from selenium import webdriver
   from selenium.webdriver.common.by import By
   from selenium.webdriver.support.ui import WebDriverWait
   from selenium.webdriver.support import expected_conditions as EC

   # Use Selenium, NOT xdotool
   driver = webdriver.Chrome()
   driver.get('http://localhost:3001')

   # Wait for elements (don't guess)
   element = WebDriverWait(driver, 10).until(
       EC.presence_of_element_located((By.XPATH, "//button[contains(., 'Item Search')]"))
   )

   # Click with Selenium (reliable)
   element.click()
   ```

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

