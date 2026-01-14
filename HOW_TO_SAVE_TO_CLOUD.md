# How to Save Your Data to the Cloud Database

## 🎯 Quick Guide: Migrate Data to Cloud

Your app has a built-in feature to upload all your local data to the cloud database!

---

## 📤 Method 1: Using Backup & Restore (Easiest)

### Step 1: Export Your Current Data
1. Open your CF Assessment Tracker app
2. Click the **"Backup"** button (top right, with Database icon)
3. Click **"Download Backup"**
4. This saves a JSON file with all your families

### Step 2: Restore to Cloud Database
1. Still in the Backup modal
2. Click **"Restore from Backup"** → **"Choose Backup File"**
3. Select the JSON file you just downloaded
4. Confirm the restore
5. **All your data uploads to the cloud database!** ✅

### What Happens:
- ✅ All clients uploaded to Neon database
- ✅ All assessment dates saved
- ✅ Data syncs across all devices
- ✅ Shows "Synced" in header

---

## 📤 Method 2: Automatic Sync (Already Working)

Your app **automatically saves to cloud** when you:
- ✅ Add a new family
- ✅ Edit a family (name, dates, caregiver, etc.)
- ✅ Toggle assessments (check/uncheck)
- ✅ Delete a family

**Check the header** - you should see:
- 🔄 "Syncing..." (while saving)
- ✅ "Synced" (when done)
- ❌ "Sync Error" (if database not set up)

---

## 🔍 How the Migrate Function Works

The `migrate-data.js` function:

1. **Receives** an array of clients from your backup file
2. **Inserts** each client into the Neon database
3. **Updates** if client already exists (by ID)
4. **Returns** how many were imported

### What Gets Saved:
- ✅ Client ID
- ✅ Name, nickname
- ✅ DOB, admit date
- ✅ Type (child/pregnant)
- ✅ Caregiver name
- ✅ Notes
- ✅ Linked sibling IDs
- ✅ M-CHAT high risk flag
- ✅ **All assessment dates** (JSONB format)

---

## 🚨 Troubleshooting

### "Failed to sync to database"
**Problem**: Database not set up yet

**Fix**:
1. Go to Neon dashboard
2. Run the SQL schema (see `database/schema.sql`)
3. Then try restore again

### "No data showing on phone"
**Problem**: Data only in localStorage, not in database

**Fix**:
1. On computer: Export backup
2. Restore from backup (uploads to database)
3. Refresh phone - data should appear!

### "Sync Error" showing
**Problem**: Database connection issue

**Fix**:
1. Check Netlify environment variables
2. Verify `NETLIFY_DATABASE_URL` exists
3. Check Neon dashboard - is database running?

---

## ✅ Verify Data is in Cloud

### Check in Neon Database:

1. Go to Neon dashboard
2. Click **SQL Editor**
3. Run this query:

```sql
SELECT id, name, nickname, admit_date, created_at 
FROM clients 
ORDER BY created_at DESC;
```

**You should see all your families listed!** 🎉

### Check in Your App:

1. Open app on **different device** (phone)
2. Data should load automatically
3. Make a change on computer
4. Refresh phone - change should appear!

---

## 📊 Current Data Status

### Where is your data?

**On your computer:**
- ✅ localStorage (browser storage)
- ✅ Cloud database (if migrated)

**On your phone:**
- ❌ Nothing (if database not set up)
- ✅ Cloud database (if migrated)

### To Fix Blank Screen on Phone:

1. **Set up database** (run schema in Neon)
2. **Migrate data** (use Backup → Restore)
3. **Refresh phone** - data appears!

---

## 🎯 Quick Checklist

To get cloud sync working:

- [ ] Database schema run in Neon ✅
- [ ] Data migrated to database (Backup → Restore)
- [ ] Header shows "Synced" ✅
- [ ] Data appears on phone ✅

---

## 💡 Pro Tips

1. **Export regularly** - Keep backups as safety net
2. **Check sync status** - Look for "Synced" in header
3. **Test on phone** - Make change on computer, check phone
4. **Use restore** - If data missing, restore from backup

Your data is safe in the cloud! ☁️
