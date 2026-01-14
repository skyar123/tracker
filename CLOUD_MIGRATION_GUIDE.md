# ☁️ How to Save Your Data to the Cloud Database

## 🎯 Quick Answer: 3 Steps to Cloud Sync

### Step 1: Set Up Database (One-Time Setup)
1. Go to **Neon Dashboard** (via Netlify → Integrations → Neon)
2. Click **"SQL Editor"**
3. Copy and paste the SQL from `database/schema.sql`
4. Click **"Run"**
5. ✅ Database ready!

### Step 2: Export Your Current Data
1. Open your app
2. Click **"Backup"** button (top right, Database icon)
3. Click **"Download Backup"**
4. Saves a JSON file with all your families

### Step 3: Restore to Cloud
1. Still in Backup modal
2. Click **"Restore from Backup"**
3. Click **"Choose Backup File"**
4. Select the JSON file you just downloaded
5. Confirm
6. ✅ **All data uploads to cloud database!**

---

## 📊 How Migrate Function Works

The `migrate-data.js` function:

```javascript
// Receives: Array of clients from backup file
// Does: Inserts each client into Neon database
// Updates: If client already exists (by ID), updates it
// Returns: How many imported successfully
```

### What Gets Saved:
- ✅ All client info (name, nickname, DOB, admit date)
- ✅ Caregiver name
- ✅ Notes
- ✅ Type (child/pregnant)
- ✅ Linked sibling IDs
- ✅ **All assessment dates** (base_intake, base_sniff, 6mo_asq3, etc.)
- ✅ M-CHAT high risk flag

### Database Table Structure:
```sql
clients (
  id TEXT PRIMARY KEY,
  name TEXT,
  nickname TEXT,
  dob DATE,
  admit_date DATE,
  type TEXT,
  caregiver TEXT,
  notes TEXT,
  linked_id TEXT,
  mchat_high_risk BOOLEAN,
  assessments JSONB,  -- Stores all assessment dates
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

---

## 🔄 Automatic Cloud Sync

**Your app already saves to cloud automatically when you:**

1. **Add a new family** → Saves to database immediately
2. **Edit a family** → Updates database
3. **Toggle assessments** → Updates database
4. **Delete a family** → Removes from database

**Check the header** - you'll see:
- 🔄 "Syncing..." (while saving)
- ✅ "Synced" (when done)
- ❌ "Sync Error" (if database not set up)

---

## 🚨 Why Your Phone Shows Blank Screen

**Problem**: Data is only in localStorage on your computer, not in cloud database yet.

**Solution**: Migrate your data!

1. On computer: Backup → Download
2. Restore from that backup (uploads to database)
3. Refresh phone → Data appears! ✅

---

## ✅ Verify Data is in Cloud

### Method 1: Check in Neon
1. Neon Dashboard → SQL Editor
2. Run: `SELECT COUNT(*) FROM clients;`
3. Should show number of families

### Method 2: Check on Another Device
1. Open app on phone
2. Data should load automatically
3. Make change on computer
4. Refresh phone → Change appears!

---

## 🛠️ Troubleshooting

### "Failed to sync to database"
**Cause**: Database schema not run yet

**Fix**: Run `database/schema.sql` in Neon SQL Editor

### "No data on phone"
**Cause**: Data not migrated to database

**Fix**: Use Backup → Restore to upload data

### "Sync Error" in header
**Cause**: Database connection broken

**Fix**: 
1. Check `NETLIFY_DATABASE_URL` in Netlify env vars
2. Verify Neon database is running
3. Check Netlify function logs

---

## 📝 Current Status Check

**Where is your data right now?**

- [ ] **localStorage only** (computer browser) → Need to migrate
- [ ] **Cloud database** (Neon) → Synced across devices ✅
- [ ] **Both** → Perfect! Redundant backup ✅

**To check:**
1. Open app on phone
2. If blank → Data only in localStorage
3. If shows families → Data in cloud! ✅

---

## 🎯 Quick Migration Steps (Copy-Paste Ready)

1. **Open app** on computer
2. **Click "Backup"** button
3. **Click "Download Backup"** → Save file
4. **Click "Restore from Backup"**
5. **Select the file** you just saved
6. **Confirm** → Wait for "Backup restored successfully!"
7. **Check header** → Should show "Synced" ✅
8. **Open on phone** → Data should appear! 🎉

---

## 💡 Pro Tips

1. **Export regularly** - Keep backups as safety net
2. **Check sync status** - Header shows "Synced" when working
3. **Test migration** - Make change, check it appears on phone
4. **Use restore** - If data missing anywhere, restore from backup

Your data is now safe in the cloud! ☁️✨
