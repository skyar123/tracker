# Debugging Blank Screen Issue

## Why You See Blank Screen on Phone

The app is trying to load from the database, but:
- Database may not be set up yet
- OR data is only in localStorage on your computer
- OR Netlify functions aren't working

## Step-by-Step Fix:

### Step 1: Check Browser Console (Desktop)

On your **computer** where you see the data:

1. Open your Netlify site
2. Press **F12** (or Cmd+Option+I on Mac)
3. Click **Console** tab
4. Look for errors - any red text?
5. Take a screenshot and share it with me

### Step 2: Check Netlify Function Logs

1. Go to https://app.netlify.com
2. Click your **tracker** site
3. Click **Functions** tab (left sidebar)
4. Do you see these functions?
   - `get-clients`
   - `save-client`
   - `delete-client`
   - `migrate-data`

**If NO functions shown:**
- Functions didn't deploy
- Need to redeploy

**If YES - check logs:**
- Click on `get-clients`
- Check recent logs
- Look for errors

### Step 3: Verify Database Setup

**CRITICAL: Have you run the database schema yet?**

If NO, that's the problem! Do this now:

1. Go to Netlify dashboard
2. Find your Neon integration
3. Click "Open Neon Dashboard"
4. Click "SQL Editor"
5. Run this SQL:

```sql
-- Check if table exists
SELECT * FROM clients;
```

**If you get ERROR: "relation clients does not exist"**
→ Database not set up! Run the schema from `database/schema.sql`

**If you get empty result (no rows)**
→ Database exists but no data yet! Need to migrate data.

### Step 4: Check Sync Status

On your **computer** (where data exists):

1. Open your Netlify site
2. Look at the header
3. What does it say?
   - ✅ "Synced" (green) = Good, but data not there yet
   - 🔄 "Syncing..." = Still uploading
   - ❌ "Sync Error" (red) = Database connection issue

### Step 5: Migrate Your Data

If database is set up but no data:

**On your computer:**
1. Click the **"Backup"** button
2. Click **"Download Backup"**
3. Then click **"Restore from Backup"**
4. Select the file you just downloaded
5. This will upload all data to database!

**Check on phone:**
- Refresh the app
- Data should appear!

---

## Quick Test: Is Database Working?

### Test #1: Check Netlify Environment Variables

1. Netlify → Site settings → Environment variables
2. Look for: `NETLIFY_DATABASE_URL`
3. **Is it there?**
   - YES → Database connected ✅
   - NO → Database not connected ❌

### Test #2: Test Function Directly

Try this URL in your browser:
```
https://YOUR-SITE-NAME.netlify.app/.netlify/functions/get-clients
```

Replace `YOUR-SITE-NAME` with your actual Netlify site name.

**What do you see?**

**Option A: JSON response like `{"success":true,"data":[]}`**
→ Functions work! Database empty. Need to migrate data.

**Option B: Error 404**
→ Functions didn't deploy. Need to redeploy.

**Option C: Error 500 with message**
→ Database connection issue. Share error with me.

---

## Most Likely Issue: Database Not Set Up Yet

Based on your symptoms, you probably haven't:
1. Run the database schema in Neon
2. Migrated your local data to database

### Fix It Now:

**Step 1: Set up database** (2 minutes)
- See: `database/schema.sql`
- Run it in Neon SQL Editor

**Step 2: Migrate data** (30 seconds)
- Computer: Backup → Download
- Computer: Restore from that backup
- This uploads to database

**Step 3: Verify on phone**
- Refresh app
- Should see all your clients!

---

## Fallback: Use localStorage Only

If database is too much trouble right now:

**Option 1: Remove database integration temporarily**
- Edit `src/App.jsx`
- Comment out the database loading
- Use localStorage only
- I can help with this if needed

**Option 2: Keep both**
- Add "Sync to Database" button
- Manual sync when you want
- Still works offline

---

## Tell Me What You See:

1. **On your computer** - does the header show "Synced" or "Sync Error"?
2. **In Netlify Functions tab** - do you see 4 functions listed?
3. **Have you run the database schema yet?** (Yes/No)
4. **When you open Console (F12)** - any red errors?

Share these answers and I'll tell you exactly what to fix!
