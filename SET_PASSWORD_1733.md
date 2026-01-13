# Set Password to 1733 - Quick Guide

## 🎯 Steps to Set Your Password

### Step 1: Go to Netlify Dashboard
1. Open: **https://app.netlify.com**
2. Click on your **tracker** site

### Step 2: Add Environment Variable
1. Click **"Site settings"** (in the top menu)
2. Click **"Environment variables"** (in left sidebar)
3. Click **"Add a variable"** button
4. Fill in:
   - **Key**: `APP_PASSWORD`
   - **Value**: `1733`
5. Click **"Save"**

### Step 3: Redeploy
1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait ~1-2 minutes for deployment

### Step 4: Test It!
1. Open your Netlify site
2. You should see login screen
3. Enter: **`1733`**
4. Click "Login"
5. ✅ You're in!

---

## ✅ That's It!

Your password is now **1733**. Use this PIN to login on:
- Your computer
- Your phone
- Any device

All devices will use the same password and see the same data!

---

## 🔍 Verify It Worked

After redeploying:
1. Open your site
2. Try logging in with `1733`
3. If it works → ✅ Success!
4. If it doesn't → Check Netlify function logs

---

## 📝 Note

- Password is stored securely in Netlify environment variables
- Only you can see it in Netlify dashboard
- Never share your PIN with others
- You can change it anytime by updating the environment variable
