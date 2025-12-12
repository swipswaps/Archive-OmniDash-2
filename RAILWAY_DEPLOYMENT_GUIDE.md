# 🚂 Railway Backend Deployment Guide

**Backend:** Archive OmniDash Secure Credential Storage  
**Status:** ✅ Ready to Deploy  
**Estimated Time:** 5-10 minutes

---

## 🎯 What You're Deploying

**Backend Features:**
- ✅ Secure credential storage (AES-256-GCM encryption)
- ✅ Real credential validation with Archive.org API
- ✅ API proxy for authenticated requests
- ✅ CORS configured for GitHub Pages

**Files Ready:**
- `backend/server.js` - Main server
- `backend/package.json` - Dependencies
- `backend/railway.json` - Railway configuration
- `backend/Procfile` - Process configuration

---

## 📋 Step-by-Step Deployment

### Step 1: Sign Up for Railway

1. Go to: https://railway.app/
2. Click **"Start a New Project"** or **"Login"**
3. Sign in with GitHub (recommended)
4. Authorize Railway to access your repositories

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose **"Archive-OmniDash-2"** repository
4. Railway will detect the repository

### Step 3: Configure Deployment

**Important:** Railway needs to deploy ONLY the backend folder.

**Option A: Use Railway Dashboard**

1. After selecting the repo, click **"Add variables"**
2. Set **Root Directory**: `backend`
3. Railway will auto-detect Node.js

**Option B: Use Railway CLI (Recommended)**

```bash
# In the backend directory
cd backend

# Login to Railway
railway login
# This will open a browser - authorize the app

# Initialize project
railway init
# Select: "Create new project"
# Name it: "archive-omnidash-backend"

# Link to project
railway link
# Select the project you just created

# Deploy
railway up
```

### Step 4: Set Environment Variables

**Required Variables:**

1. **ENCRYPTION_KEY** (Required)
   ```bash
   # Generate a secure key
   openssl rand -hex 32
   ```
   
   Copy the output (64 characters) and add to Railway:
   - Go to your project → Variables
   - Add: `ENCRYPTION_KEY` = `<your-generated-key>`

2. **FRONTEND_URL** (Optional)
   - Add: `FRONTEND_URL` = `https://swipswaps.github.io`

**In Railway Dashboard:**
1. Click on your service
2. Go to **"Variables"** tab
3. Click **"New Variable"**
4. Add each variable
5. Click **"Deploy"** to apply changes

**Using CLI:**
```bash
# Generate encryption key
ENCRYPTION_KEY=$(openssl rand -hex 32)

# Set variables
railway variables set ENCRYPTION_KEY=$ENCRYPTION_KEY
railway variables set FRONTEND_URL=https://swipswaps.github.io
```

### Step 5: Get Your Backend URL

**In Railway Dashboard:**
1. Click on your service
2. Go to **"Settings"** tab
3. Scroll to **"Domains"**
4. Click **"Generate Domain"**
5. Copy the URL (e.g., `archive-omnidash-backend.up.railway.app`)

**Using CLI:**
```bash
railway domain
```

Example URL:
```
https://archive-omnidash-backend.up.railway.app
```

### Step 6: Test Backend

```bash
# Test health endpoint
curl https://your-backend-url.up.railway.app/api/health

# Expected response:
# {"status":"ok","message":"Archive OmniDash Backend is running"}
```

---

## 🔧 Railway CLI Commands (Quick Reference)

```bash
# Install Railway CLI (already done)
npm install -g @railway/cli

# Login
railway login

# Initialize project
cd backend
railway init

# Deploy
railway up

# View logs
railway logs

# Open dashboard
railway open

# Get domain
railway domain

# Set environment variable
railway variables set KEY=value

# List variables
railway variables

# Check status
railway status
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Backend deployed successfully
- [ ] Environment variables set (ENCRYPTION_KEY, FRONTEND_URL)
- [ ] Domain generated
- [ ] Health check works: `curl https://your-url.up.railway.app/api/health`
- [ ] CORS allows GitHub Pages origin
- [ ] Logs show no errors: `railway logs`

---

## 🔗 Update Frontend with Backend URL

Once backend is deployed, update GitHub Pages:

### Step 1: Add Backend URL to GitHub Secrets

1. Go to: https://github.com/swipswaps/Archive-OmniDash-2/settings/secrets/actions
2. Click **"New repository secret"**
3. Name: `VITE_BACKEND_URL`
4. Value: Your Railway URL (e.g., `https://archive-omnidash-backend.up.railway.app`)
5. Click **"Add secret"**

### Step 2: Trigger Redeployment

```bash
# Make a small change to trigger rebuild
git commit --allow-empty -m "Update backend URL"
git push origin main
```

Or manually trigger workflow:
1. Go to: https://github.com/swipswaps/Archive-OmniDash-2/actions
2. Click **"Deploy to GitHub Pages"**
3. Click **"Run workflow"**
4. Click **"Run workflow"** button

---

## 📊 Expected Results

### Backend Logs (Railway)

```
🚀 Archive OmniDash Backend running on port 3002
🔐 Encryption key: 1a2b3c4d...
📁 Credentials file: /app/credentials.enc
🌐 CORS enabled for: http://localhost:3001, https://swipswaps.github.io
```

### Frontend (After Update)

Visit: https://swipswaps.github.io/Archive-OmniDash-2/

1. Go to **Settings**
2. Enter Archive.org credentials
3. Click **"Test Credentials"**
4. Should see: ✅ "Credentials validated successfully"

---

## 🐛 Troubleshooting

### Issue 1: Deployment Fails

**Error:** Build fails or deployment crashes

**Solution:**
1. Check Railway logs: `railway logs`
2. Verify `package.json` has all dependencies
3. Ensure `server.js` has no syntax errors
4. Check Node.js version (should use 18+)

### Issue 2: ENCRYPTION_KEY Not Set

**Error:** "ENCRYPTION_KEY environment variable not set"

**Solution:**
```bash
# Generate key
openssl rand -hex 32

# Set in Railway
railway variables set ENCRYPTION_KEY=<generated-key>
```

### Issue 3: CORS Errors

**Error:** Frontend can't connect to backend

**Solution:**
1. Check CORS configuration in `server.js`
2. Verify `FRONTEND_URL` is set correctly
3. Check Railway logs for CORS errors
4. Ensure GitHub Pages URL is in CORS origins

### Issue 4: 503 Service Unavailable

**Error:** Backend URL returns 503

**Solution:**
1. Check Railway dashboard - service might be sleeping
2. Free tier sleeps after inactivity
3. First request wakes it up (takes 10-30 seconds)
4. Subsequent requests are fast

---

## 💰 Railway Free Tier Limits

- **500 hours/month** of usage
- **512 MB RAM**
- **1 GB disk**
- **Sleeps after inactivity** (wakes on request)

**Enough for:** Development, testing, personal use

**Upgrade if needed:** $5/month for more resources

---

## 🚀 Quick Start (CLI Method)

```bash
# 1. Navigate to backend
cd backend

# 2. Login to Railway
railway login

# 3. Initialize project
railway init

# 4. Generate encryption key
ENCRYPTION_KEY=$(openssl rand -hex 32)

# 5. Set environment variables
railway variables set ENCRYPTION_KEY=$ENCRYPTION_KEY
railway variables set FRONTEND_URL=https://swipswaps.github.io

# 6. Deploy
railway up

# 7. Get domain
railway domain

# 8. Test
curl $(railway domain)/api/health
```

---

## ✅ Success Indicators

When deployment is successful:

1. **Railway Dashboard:**
   - Service shows "Active" status
   - Logs show "Backend running on port..."
   - Domain is generated

2. **Health Check:**
   ```bash
   curl https://your-url.up.railway.app/api/health
   # Returns: {"status":"ok",...}
   ```

3. **Frontend:**
   - Settings page shows "Backend Available"
   - Credentials can be saved
   - "Test Credentials" button works

---

**Ready to deploy! Follow the steps above to get your backend running on Railway.** 🚂

