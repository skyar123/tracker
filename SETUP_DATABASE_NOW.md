# 🚀 Quick Database Setup - Save Progress on All Devices

## What This Does
Your CF Assessment Tracker will save all data to a cloud database, so:
- ✅ Access from any device (phone, tablet, computer)
- ✅ All devices see the same data
- ✅ No more export/import needed
- ✅ Automatic backups

## Step 1: Connect Neon Database to Netlify (2 minutes)

### Option A: If you haven't added Neon yet

1. Go to your Netlify dashboard: https://app.netlify.com
2. Click on your `tracker` site
3. Go to **Integrations** tab
4. Click **"Browse integrations"** or search for "Neon"
5. Click **"Add integration"** next to Neon
6. Follow prompts to connect (it's free!)
7. Choose **"Create new database"** or use existing

### Option B: If Neon is already connected

1. Go to Netlify → Your site → **Integrations**
2. Find Neon, click **"Manage"** or **"Open Neon Dashboard"**

## Step 2: Initialize the Database (1 minute)

### In Neon Dashboard:

1. Click **"SQL Editor"** in the left sidebar
2. **Copy and paste this entire code block:**

```sql
-- Create the main table
CREATE TABLE IF NOT EXISTS clients (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT,
  dob DATE,
  admit_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('child', 'pregnant')),
  caregiver TEXT,
  notes TEXT,
  linked_id TEXT,
  mchat_high_risk BOOLEAN DEFAULT FALSE,
  assessments JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_clients_admit_date ON clients(admit_date);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_linked_id ON clients(linked_id);
CREATE INDEX IF NOT EXISTS idx_clients_assessments ON clients USING GIN (assessments);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

3. Click **"Run"** or press **Ctrl+Enter**
4. You should see: ✅ "Success" messages

### Verify it worked:
Run this query:
```sql
SELECT * FROM clients;
```
Should show an empty table with columns. That's perfect! ✅

## Step 3: Redeploy Your Site (30 seconds)

1. Go back to Netlify dashboard
2. Click **"Deploys"** tab
3. Click **"Trigger deploy"** → **"Deploy site"**
4. Wait ~1 minute for deployment

## Step 4: Test It! (1 minute)

1. **Open your live site** (the Netlify URL)
2. Look at the header - you should see:
   - 🔄 **"Syncing..."** (briefly)
   - ✅ **"Synced"** (green checkmark)
3. **Add a test family**
4. **Refresh the page** - data should still be there!
5. **Open on another device** - same data appears! 🎉

## Step 5: Migrate Existing Data (if you have any)

If you already have families in your tracker:

1. Click the **"Backup"** button (top right)
2. Click **"Download Backup"** to save a copy
3. Click **"Restore from Backup"**
4. Choose the backup file you just downloaded
5. Confirm - it will upload everything to the database!

## ✅ Success Checklist

- [ ] Neon database added to Netlify
- [ ] Schema ran successfully in Neon SQL Editor
- [ ] Site redeployed
- [ ] "Synced" indicator shows in app header
- [ ] Test family saves and loads correctly
- [ ] Can access from multiple devices

## 🔍 How to Verify Data is Saving

In Neon SQL Editor, run:
```sql
SELECT id, name, nickname, admit_date, created_at 
FROM clients 
ORDER BY created_at DESC;
```

You should see all your families listed! 🎊

## 🆘 Troubleshooting

### App shows "Sync Error"
- Check Netlify function logs: Deploys → Functions tab
- Make sure database schema ran successfully
- Verify `NETLIFY_DATABASE_URL` exists in Environment variables

### Data not showing on other devices
- Make sure you're on the latest deployment
- Clear browser cache and refresh
- Check that "Synced" indicator shows (not "Sync Error")

### Starting Fresh
To clear all data and start over:
```sql
DELETE FROM clients;
```

### Want to see what's in the database
```sql
-- Count families
SELECT COUNT(*) FROM clients;

-- List all families
SELECT name, nickname, admit_date FROM clients;

-- See recent activity
SELECT name, updated_at FROM clients ORDER BY updated_at DESC LIMIT 10;
```

## 🎉 You're Done!

Your tracker now:
- ✅ Saves to cloud database automatically
- ✅ Syncs across all devices instantly
- ✅ Has automatic backups (Neon handles this)
- ✅ Never loses data (even if you clear browser cache)

Test it out - add a family on your computer, then check your phone! 📱💻
