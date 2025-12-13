# Archive‑OmniDash‑2 CDX API Incident Report (Audit‑Grade)

## Document Purpose
This document is a **strict audit‑grade reconstruction** of the Archive‑OmniDash‑2 CDX API failure and recovery. It intentionally excludes narrative smoothing, inferred success, or unverified claims. Every statement is constrained to what was **observed, logged, or code‑verified** in the attached chat logs and repository history.

Where behavior was *assumed*, *later disproven*, or *not conclusively verified*, it is explicitly labeled as such.

---

## Scope
- Timeframe: **Dec 12–13, 2025**
- Systems:
  - React + TypeScript frontend (Vite)
  - Express backend (credential storage)
  - Internet Archive CDX + Wayback APIs
  - GitHub Pages deployment
- Tooling referenced:
  - Selenium
  - OCR (tesseract)
  - Browser DevTools logs

---

## Executive Summary (Factual)

1. **The application entered a partially‑degraded state** where CDX results silently fell back to mock data while logging success.
2. **Credential validation indicators were pseudo‑logic**, not real API verification.
3. **Initial Selenium tests produced misleading conclusions** due to incorrect window capture and lack of OCR verification.
4. **The root cause of the CDX failure was third‑party proxy instability (AllOrigins)** combined with premature success logging and missing timeout handling.
5. **The final fix required timeout enforcement, multi‑proxy fallback, and JSON validation before logging success.**
6. **After the fix, correct CDX data was confirmed by the user**, not inferred by automation.

---

## Phase 1 – Initial State (Observed)

### Codebase Characteristics
- React 18 + TypeScript
- Tailwind CSS (initially CDN)
- Internet Archive CDX API access via direct fetch with CORS fallback

### Observed Issues
- Mobile UX deficiencies
- Generic error handling
- No automated validation of API credentials

> These observations are supported by lint output, code inspection, and user‑initiated review. No runtime verification occurred at this stage.

---

## Phase 2 – Testing Failures (Critical)

### Selenium Testing (Initial)

**Observed behavior:**
- Screenshots were captured, but:
  - Wrong windows were frequently captured (VS Code, terminal)
  - Captions did not match screenshot contents
  - Tests ran headless without user‑visible confirmation

**Critical failure:**
- Assertions were made **without reading screenshots**
- OCR was not initially applied

**User intervention:**
The user explicitly halted progress after identifying that claims did not match screenshots and required:
- OCR verification
- No guessing
- Evidence‑based claims only

> Any claims of UI correctness made prior to OCR enforcement are **invalid**.

---

## Phase 3 – OCR Enforcement (Corrective Action)

### New Rule (Observed)
All screenshots must:
1. Be captured from the correct window
2. Undergo OCR
3. Have expected text verified before claims are made

### Results
- OCR revealed multiple screenshots contained:
  - No relevant UI text
  - Incorrect application state
  - Entirely different applications

**Conclusion:**
Previous Selenium results were **non‑evidentiary**.

---

## Phase 4 – Credential Validation Discovery (Confirmed)

### Symptom (User‑Observed)
- API keys replaced with mock values
- UI still showed:
  - “Authenticated”
  - “Creds Active”

### Code Verification
- Frontend status indicators depended on:
  - Boolean presence of accessKey
- Backend returned:
  - `hasCredentials: !!creds`

### Finding (Confirmed)
There was **no API call validating credentials** against Archive.org.

> This is a confirmed design flaw, not a regression.

---

## Phase 5 – CDX API Data Corruption

### Observed Symptoms
- Search results dropped from ~1,151 records to exactly 200
- All timestamps ended in `120000`
- Chart data showed uniform distribution

### Console Logs (Observed)
```
Direct CDX fetch blocked by CORS. Attempting automatic fallback via AllOrigins
✅ CORS fallback successful
```

### Reality
- Data was mock
- “Success” was logged **before validation**

---

## Phase 6 – Root Cause Analysis (Verified)

### External Dependency Failure
- AllOrigins proxy began:
  - Timing out (HTTP 408)
  - Returning invalid JSON with HTTP 200

### Internal Code Failures
1. No timeout on fetch
2. Success logged before JSON parse
3. Invalid JSON caused exception
4. Catch block silently returned mock data

### Reproduction
- `curl` to AllOrigins returned timeout
- Same behavior on localhost and GitHub Pages

---

## Phase 7 – Corrective Fix (Verified)

### Required Fix Components
- AbortController timeout (5s)
- Content‑type validation
- JSON parse verification
- Multi‑proxy fallback
- Success logging **only after validation**
- No silent mock fallback

### Outcome
- CDX returned ~1,151 records
- Timestamps varied correctly
- Chart data normalized

> Final confirmation was provided by the user after live testing.

---

## Phase 8 – Deployment Notes (Verified)

### GitHub Pages Failure
- Node 18 incompatible with Vite version

### Fix
- Node 20 enforced in GitHub Actions

### Additional Post‑Deploy Fixes
- Removed `overflow-hidden` blocking scroll
- Added missing YAxis in charts

---

## What Was *Not* Proven

The following were **implemented but not conclusively verified via automation** at the time claimed:
- Mobile hamburger menu behavior
- Sidebar collapse state
- Selenium viewport accuracy

These require **manual confirmation or corrected automation**.

---

## Lessons (Audit‑Relevant)

1. **Logs are not evidence**
2. **Screenshots without OCR are not evidence**
3. **Status indicators must reflect real API state**
4. **Never log success before validation**
5. **Third‑party proxies are failure points and must be sandboxed**

---

## Final Status (As Verified)

- CDX API: ✅ Working
- Mock data fallback: ❌ Removed
- Credential validation: ✅ Implemented
- UI verification: ⚠️ Partial, manual confirmation required

---

## Certification
This document intentionally avoids narrative framing. It reflects **only what was verified, observed, or explicitly corrected**.

Any future changes must be validated against these criteria.

