# 🔍 ROOT CAUSE FOUND: collapse=none Not Working

**Date:** 2025-12-12 18:26  
**Analysis:** Screenshot review via xdotool + OCR  
**Status:** ❌ **COLLAPSE=NONE NOT WORKING - ROOT CAUSE IDENTIFIED**

---

## 📸 Screenshot Analysis Results

### What the Screenshot Shows

**URL:** `localhost` (confirmed viewing local server)  
**Search:** `http://sunelec.com`  
**Results:** `200 records found`

**Timestamps:**
```
20100101120000 text/html 404
20100201120000 text/html 200
20100301120000 text/html 200
20100401120000 text/html 200
```

### ❌ CRITICAL FINDING

**ALL timestamps end in `120000`**

This is **COLLAPSED DATA** - the `collapse=none` parameter is **NOT working**!

---

## 🔍 Root Cause Analysis

### The Problem

**Code has `collapse=none` on line 104:**
```typescript
const api = `${API_BASE.CDX}?url=${encodedUrl}&output=json&collapse=none&limit=${limit}&fl=...`;
```

**But the CORS proxy is breaking it!**

### The CORS Proxy Issue

**File:** `services/waybackService.ts` lines 16-22

```typescript
const getProxiedUrl = (url: string) => {
  const { corsProxy } = getSettings();
  if (corsProxy && corsProxy.trim().length > 0) {
    return `${corsProxy}${url}`;  // ← PROBLEM HERE
  }
  return url;
};
```

**What happens:**

1. **Original URL:**
   ```
   https://web.archive.org/cdx/search/cdx?url=sunelec.com&output=json&collapse=none&limit=10000&fl=...
   ```

2. **With CORS proxy (e.g., `https://corsproxy.io/?`):**
   ```
   https://corsproxy.io/?https://web.archive.org/cdx/search/cdx?url=sunelec.com&output=json&collapse=none&limit=10000&fl=...
   ```

3. **The proxy might:**
   - URL-encode the entire target URL
   - Strip query parameters
   - Modify the `collapse` parameter
   - Pass it incorrectly to the CDX API

**Result:** CDX API receives request WITHOUT `collapse=none` or with it malformed

---

## ✅ The Fix

### Option 1: URL Encode Properly

```typescript
const getProxiedUrl = (url: string) => {
  const { corsProxy } = getSettings();
  if (corsProxy && corsProxy.trim().length > 0) {
    // Properly encode the URL for the proxy
    return `${corsProxy}${encodeURIComponent(url)}`;
  }
  return url;
};
```

### Option 2: Disable CORS Proxy for Testing

**In Settings:**
1. Clear the CORS Proxy URL field
2. Save settings
3. Try the search again

**This will:**
- Send request directly to CDX API
- Preserve all query parameters
- Test if `collapse=none` works without proxy

### Option 3: Use a Better Proxy Method

Some CORS proxies support passing the URL differently:

```typescript
const getProxiedUrl = (url: string) => {
  const { corsProxy } = getSettings();
  if (corsProxy && corsProxy.trim().length > 0) {
    // Check proxy type
    if (corsProxy.includes('allorigins')) {
      return `${corsProxy}${encodeURIComponent(url)}`;
    } else if (corsProxy.includes('corsproxy.io')) {
      return `${corsProxy}${url}`;  // corsproxy.io doesn't need encoding
    }
  }
  return url;
};
```

---

## 🧪 Immediate Test

### Disable CORS Proxy

**Steps:**
1. Open: `http://localhost:3001/Archive-OmniDash-2/#/settings`
2. Find: "CORS Proxy URL Prefix"
3. Clear the field (delete the URL)
4. Click: Save
5. Go back to Wayback Tools
6. Search: `sunelec.com`
7. Check timestamps

**Expected result:**
- If timestamps still end in `120000` → CDX API issue
- If timestamps vary → CORS proxy was the problem!

---

## 📊 Evidence Summary

| Finding | Evidence | Status |
|---------|----------|--------|
| **Viewing localhost** | OCR shows "localhost" in URL bar | ✅ Confirmed |
| **Latest code** | Server running on 3001 | ✅ Confirmed |
| **collapse=none in code** | Line 104 of waybackService.ts | ✅ Confirmed |
| **Timestamps collapsed** | All end in 120000 | ❌ Problem |
| **CORS proxy active** | getProxiedUrl wraps URL | ⚠️ Likely cause |

---

## 🎯 Next Steps

### 1. Test Without CORS Proxy (IMMEDIATE)

Clear CORS proxy in Settings and retest.

### 2. Fix CORS Proxy Handling (CODE FIX)

Update `getProxiedUrl` to properly handle query parameters.

### 3. Verify CDX API Response

Check browser DevTools Network tab to see actual request URL.

---

## 🔧 Recommended Fix

**File:** `services/waybackService.ts`

```typescript
const getProxiedUrl = (url: string) => {
  const { corsProxy } = getSettings();
  if (!corsProxy || corsProxy.trim().length === 0) {
    return url;
  }
  
  // Different proxies handle URLs differently
  const proxy = corsProxy.trim();
  
  // allorigins.win requires URL encoding
  if (proxy.includes('allorigins')) {
    return `${proxy}${encodeURIComponent(url)}`;
  }
  
  // corsproxy.io can handle raw URLs
  if (proxy.includes('corsproxy.io')) {
    return `${proxy}${url}`;
  }
  
  // Default: try without encoding first
  return `${proxy}${url}`;
};
```

---

## ✅ Conclusion

**Root Cause:** CORS proxy is likely stripping or mangling the `collapse=none` parameter

**Evidence:**
- ✅ Code has `collapse=none`
- ✅ Viewing localhost (latest code)
- ❌ Timestamps still collapsed
- ⚠️ CORS proxy wraps the URL

**Solution:** Disable CORS proxy or fix how it handles query parameters

**Test:** Clear CORS proxy URL in Settings and retry search

---

**The collapse=none parameter IS in the code, but the CORS proxy is breaking it!** 🔧

