# Root Cause Analysis: All Timestamps Ending in 120000

## 🔍 Problem Statement

User reported seeing 200 records with ALL timestamps ending in `120000`:
- `20100101120000`
- `20100201120000`
- `20100301120000`
- etc.

This pattern indicates **monthly collapsed data** (1st of each month at 12:00:00 noon).

## ✅ Investigation Results

### 1. CDX API is Working Correctly

Direct API test confirms the CDX API returns VARYING timestamps:

```bash
$ curl "https://web.archive.org/cdx/search/cdx?url=sunelec.com&output=json&limit=50&fl=..."
```

**Result:**
```json
["com,sunelec)/", "19991012112003", ...],  ← Varying!
["com,sunelec)/", "20000208035046", ...],  ← Varying!
["com,sunelec)/", "20000302070629", ...],  ← Varying!
```

✅ The CDX API is returning uncollapsed data with varying timestamps.

### 2. Our Code is Correct

`services/waybackService.ts` line 122:
```typescript
const api = `${API_BASE.CDX}?url=${encodedUrl}&output=json&limit=${limit}&fl=...`;
```

✅ No collapse parameter = all unique captures (correct!)

### 3. The REAL Problem: CORS Proxy Missing

**Settings check revealed:**
```json
{
  "accessKey": "",
  "secretKey": "",
  "demoMode": false,
  "corsProxy": ""  ← EMPTY!
}
```

**What happens:**

1. User searches for `sunelec.com` in History mode
2. Code calls `fetchCDX("sunelec.com", 10000)`
3. `getProxiedUrl()` returns raw URL (no proxy configured)
4. Browser tries: `fetch("https://web.archive.org/cdx/search/cdx?...")`
5. **CORS error** (archive.org doesn't allow cross-origin requests)
6. Code catches error at line 150: `catch (error) { return getMockCDX(url); }`
7. Mock service generates 200 fake records with `120000` timestamps

**From `services/mockService.ts` line 50:**
```typescript
const timestamp = `${year}${month.toString().padStart(2, '0')}01120000`;
//                                                              ^^^^^^
//                                                              Always 120000!
```

## 🎯 Root Cause

**The app is falling back to MOCK data because:**
- ❌ No CORS proxy configured in Settings
- ❌ Direct API calls to archive.org fail due to CORS
- ❌ Error handler returns mock data instead of showing error

## 🔧 Solutions

### Option 1: Configure CORS Proxy (Immediate Fix)

User should go to Settings and configure a CORS proxy:
- `https://api.allorigins.win/raw?url=`
- `https://corsproxy.io/?`
- Or any other CORS proxy service

### Option 2: Show Error Instead of Mock Data (Code Fix)

Modify `services/waybackService.ts` line 149-152:
```typescript
// BEFORE (silently returns mock data)
} catch (error) {
  console.error('CDX Error (Falling back to mock):', error);
  return getMockCDX(url);
}

// AFTER (throw error to show user)
} catch (error) {
  console.error('CDX Error:', error);
  if (error.message.includes('CORS') || error.message.includes('Failed to fetch')) {
    throw new Error('CORS Error: Please configure a CORS Proxy in Settings');
  }
  throw error;
}
```

### Option 3: Use Archive.org's Official CORS-Enabled Endpoint

Research if archive.org has a CORS-enabled CDX endpoint.

## 📊 How to Verify Fix

After configuring CORS proxy, timestamps should vary:

**MOCK data (broken):**
```
20100101120000  ← All end in 120000
20100201120000
20100301120000
```

**REAL data (working):**
```
19991012112003  ← Varying endings!
20000208035046
20000302070629
```

## 📝 Documentation Updates

Updated `.augment/rules.md` with:
- ✅ Correct Selenium navigation for Archive-OmniDash-2
- ✅ Component structure (buttons vs links, input types, etc.)
- ✅ Timestamp pattern analysis (120000 = mock data)
- ✅ Common mistakes to avoid

## 🎓 Lessons Learned

1. **Always check settings first** - Demo mode and CORS proxy configuration
2. **Verify API calls directly** - Test CDX API with curl before blaming code
3. **Silent fallbacks are dangerous** - Mock data hides real errors
4. **Document component structure** - Prevents repeated selector mistakes
5. **Use OCR to verify** - Don't guess what's on screen

