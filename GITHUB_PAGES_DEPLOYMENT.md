# 🚀 GitHub Pages Deployment Guide

**Repository:** https://github.com/swipswaps/Archive-OmniDash-2  
**Target:** GitHub Pages Static Hosting

---

## ⚠️ CRITICAL LIMITATION

**GitHub Pages CANNOT host the backend server!**

GitHub Pages only serves **static files** (HTML, CSS, JavaScript). This app has a **Node.js backend** for secure credential storage that **cannot run on GitHub Pages**.

---

## 🎯 Two Deployment Options

### Option 1: Frontend Only (Limited Functionality) ⚠️

Deploy just the frontend to GitHub Pages. **Credentials will NOT work** because there's no backend.

**What Works:**
- ✅ UI and navigation
- ✅ Item search (public API)
- ✅ Deep search (public API)
- ✅ Wayback tools (read-only)
- ✅ Analytics (public data)

**What DOESN'T Work:**
- ❌ Credential storage (no backend)
- ❌ Credential validation (no backend)
- ❌ SavePageNow (requires credentials)
- ❌ Authenticated API calls

### Option 2: Full Deployment (Recommended) ✅

Deploy frontend to GitHub Pages + backend to a cloud service.

**Frontend:** GitHub Pages (free)  
**Backend:** Heroku, Railway, Render, DigitalOcean, etc. (free tier available)

---

## 📋 Option 1: Frontend-Only Deployment

### Step 1: Update Vite Configuration

**File:** `vite.config.ts`

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/Archive-OmniDash-2/',  // ADD THIS - must match repo name
  server: {
    port: 3001,
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  },
  optimizeDeps: {
    include: ['xlsx'],
  },
});
```

**Important:** `base` must match your repository name exactly!

---

### Step 2: Update Backend Service for GitHub Pages

**File:** `services/backendService.ts`

```typescript
// Detect if running on GitHub Pages (no backend available)
const isGitHubPages = window.location.hostname.includes('github.io');

const BACKEND_URL = isGitHubPages 
  ? null  // No backend on GitHub Pages
  : (import.meta.env.VITE_BACKEND_URL || 'http://localhost:3002');

export const backendService = {
  async saveCredentials(accessKey: string, secretKey: string) {
    if (!BACKEND_URL) {
      throw new Error('Backend not available on GitHub Pages. Please deploy backend separately.');
    }
    // ... rest of code
  },
  
  async healthCheck(): Promise<boolean> {
    if (!BACKEND_URL) return false;
    // ... rest of code
  }
};
```

---

### Step 3: Build for Production

```bash
npm run build
```

This creates a `dist/` folder with static files.

---

### Step 4: Deploy to GitHub Pages

**Method A: Using GitHub Actions (Recommended)**

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Build
        run: npm run build
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

**Method B: Manual Deployment**

```bash
# Build the app
npm run build

# Install gh-pages package
npm install -D gh-pages

# Add to package.json scripts:
# "deploy": "gh-pages -d dist"

# Deploy
npm run deploy
```

---

### Step 5: Enable GitHub Pages

1. Go to repository **Settings**
2. Click **Pages** in sidebar
3. Under **Source**, select:
   - **GitHub Actions** (if using Method A)
   - **gh-pages branch** (if using Method B)
4. Click **Save**

**Your site will be at:**
```
https://swipswaps.github.io/Archive-OmniDash-2/
```

---

## 📋 Option 2: Full Deployment (Frontend + Backend)

### Frontend: GitHub Pages

Follow **Option 1** steps above, but update backend URL.

### Backend: Deploy to Cloud Service

**Recommended Services:**

1. **Railway.app** (Free tier: 500 hours/month)
2. **Render.com** (Free tier: 750 hours/month)
3. **Fly.io** (Free tier: 3 shared VMs)
4. **Heroku** (Paid: $5/month)

---

### Example: Deploy Backend to Railway

1. **Create `railway.json` in `backend/` folder:**

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS"
  },
  "deploy": {
    "startCommand": "node server.js",
    "restartPolicyType": "ON_FAILURE",
    "restartPolicyMaxRetries": 10
  }
}
```

2. **Add `Procfile` in `backend/` folder:**

```
web: node server.js
```

3. **Update `backend/server.js` for production:**

```javascript
const PORT = process.env.PORT || 3002;

// Add CORS for GitHub Pages
app.use(cors({
  origin: [
    'http://localhost:3001',
    'https://swipswaps.github.io'
  ],
  credentials: true
}));
```

4. **Deploy to Railway:**

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Deploy
railway up
```

5. **Get backend URL:**

Railway will give you a URL like:
```
https://archive-omnidash-backend.up.railway.app
```

6. **Update frontend environment:**

Create `.env.production`:

```
VITE_BACKEND_URL=https://archive-omnidash-backend.up.railway.app
```

7. **Rebuild and redeploy frontend:**

```bash
npm run build
npm run deploy
```

---

## 🔧 Configuration Summary

### Files to Modify

1. **`vite.config.ts`**
   - Add `base: '/Archive-OmniDash-2/'`

2. **`services/backendService.ts`**
   - Detect GitHub Pages environment
   - Handle missing backend gracefully

3. **`.github/workflows/deploy.yml`** (create)
   - Automated deployment workflow

4. **`backend/server.js`**
   - Update CORS for GitHub Pages domain
   - Use `process.env.PORT`

5. **`.env.production`** (create)
   - Set production backend URL

---

## 📊 Deployment Comparison

| Feature | GitHub Pages Only | GitHub Pages + Backend |
|---------|------------------|----------------------|
| **Cost** | Free | Free (with free tier) |
| **Setup** | Easy | Moderate |
| **Credentials** | ❌ No | ✅ Yes |
| **Full Features** | ❌ No | ✅ Yes |
| **Maintenance** | Low | Medium |

---

## ✅ Testing Deployment

### After Deployment

1. **Visit your site:**
   ```
   https://swipswaps.github.io/Archive-OmniDash-2/
   ```

2. **Test features:**
   - ✅ Navigation works
   - ✅ Item search works
   - ✅ UI renders correctly
   - ⚠️ Check backend connection (if deployed)

3. **Check browser console:**
   - Look for CORS errors
   - Check API calls
   - Verify asset loading

---

## 🐛 Common Issues

### Issue 1: Blank Page

**Cause:** Wrong `base` path in `vite.config.ts`

**Fix:**
```typescript
base: '/Archive-OmniDash-2/',  // Must match repo name exactly
```

### Issue 2: 404 on Refresh

**Cause:** GitHub Pages doesn't support client-side routing

**Fix:** Add `404.html` that redirects to `index.html`:

```html
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <script>
      sessionStorage.redirect = location.href;
    </script>
    <meta http-equiv="refresh" content="0;URL='/Archive-OmniDash-2/'">
  </head>
</html>
```

### Issue 3: Backend Not Connecting

**Cause:** CORS or wrong backend URL

**Fix:**
1. Check backend CORS settings
2. Verify `VITE_BACKEND_URL` in `.env.production`
3. Check browser console for errors

### Issue 4: Assets Not Loading

**Cause:** Wrong asset paths

**Fix:**
```typescript
// vite.config.ts
build: {
  assetsDir: 'assets',
  rollupOptions: {
    output: {
      assetFileNames: 'assets/[name]-[hash][extname]'
    }
  }
}
```

---

## 📝 Recommended Approach

**For Development/Testing:**
- Use **Option 1** (Frontend only on GitHub Pages)
- Good for demos, UI testing, public features

**For Production:**
- Use **Option 2** (Frontend + Backend)
- Deploy backend to Railway/Render
- Full functionality with credentials

---

## 🔗 Useful Links

- **GitHub Pages Docs:** https://docs.github.com/en/pages
- **Vite Deployment:** https://vitejs.dev/guide/static-deploy.html
- **Railway Docs:** https://docs.railway.app/
- **Render Docs:** https://render.com/docs

---

**Next Steps:** Choose your deployment option and follow the steps above!

