# Fix "Invalid Password" Error

## 🔍 Quick Fix Steps

### Step 1: Check if Environment Variable is Set

1. Go to **Netlify** → Your site → **Site settings** → **Environment variables**
2. Look for `APP_PASSWORD`
3. **Is it there?**
   - ✅ **YES** → Check the value (should be `1733`)
   - ❌ **NO** → Add it (see Step 2)

### Step 2: Add/Update APP_PASSWORD

1. In **Environment variables**:
   - Click **"Add a variable"** (or edit existing)
   - **Key**: `APP_PASSWORD`
   - **Value**: `1733`
   - Click **"Save"**

### Step 3: Redeploy (CRITICAL!)

**This is the most important step!**

1. Go to **"Deploys"** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Wait for it to finish (1-2 minutes)
4. Status should show **"Published"** (green)

### Step 4: Try Again

1. **Hard refresh** your browser: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
2. Enter PIN: `1733`
3. Click "Login"

---

## 🆘 If Still Not Working

### Check Netlify Function Logs:

1. Go to **Netlify** → Your site → **Functions** tab
2. Click on **`login`** function
3. Check **"Logs"** tab
4. Look for errors

### Try Default Password:

If `APP_PASSWORD` isn't set, default is: **`1234`**

Try logging in with `1234` to test if functions work.

### Check Browser Console:

1. Press **F12** (or Cmd+Option+I on Mac)
2. Click **Console** tab
3. Try logging in
4. Look for red errors
5. Share any errors you see

---

## ✅ Most Common Issues:

### Issue 1: Environment Variable Not Set
**Fix**: Add `APP_PASSWORD` = `1733` in Netlify

### Issue 2: Didn't Redeploy After Setting Variable
**Fix**: Go to Deploys → Trigger deploy

### Issue 3: Typo in Password
**Fix**: Double-check `APP_PASSWORD` value is exactly `1733` (no spaces)

### Issue 4: Function Not Deployed
**Fix**: Check Functions tab - should see `login` function

---

## 🧪 Quick Test:

Try this URL in your browser (replace YOUR-SITE):
```
https://YOUR-SITE.netlify.app/.netlify/functions/login
```

You should see an error (that's normal - it needs POST). But if you get 404, the function didn't deploy.

---

## 📝 Checklist:

- [ ] `APP_PASSWORD` exists in Netlify environment variables
- [ ] Value is exactly `1733` (no spaces, no quotes)
- [ ] Site was redeployed after setting variable
- [ ] Hard refreshed browser (Ctrl+Shift+R)
- [ ] Tried default password `1234` to test

---

## 💡 Quick Fix Right Now:

**If you just want to test it works:**

1. Try password: **`1234`** (default)
2. If that works → Your functions are fine, just need to set `APP_PASSWORD`
3. If that doesn't work → Functions might not be deployed

Let me know what happens when you try `1234`!
