# Quick Database Setup

## Method 1: Via Netlify Dashboard (Easiest)

1. Go to https://app.netlify.com
2. Select your `tracker` site
3. Go to **Integrations** → Find your **Neon integration**
4. Click **"Open database dashboard"**
5. In the Neon dashboard, click **SQL Editor**
6. Copy ALL the contents from `database/schema.sql`
7. Paste into the SQL Editor
8. Click **"Run"**
9. You should see "Success" messages

## Method 2: Via Terminal

If you have database credentials:

```bash
# Get your database URL from Netlify
# Go to Site settings → Environment variables → Find NETLIFY_DATABASE_URL

# Run the schema
psql YOUR_DATABASE_URL < database/schema.sql
```

## Method 3: Manual Steps

If the above don't work, run these SQL commands one by one in Neon's SQL Editor:

### 1. Create the main table
```sql
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
```

### 2. Create indexes
```sql
CREATE INDEX IF NOT EXISTS idx_clients_admit_date ON clients(admit_date);
CREATE INDEX IF NOT EXISTS idx_clients_type ON clients(type);
CREATE INDEX IF NOT EXISTS idx_clients_created_at ON clients(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_linked_id ON clients(linked_id);
CREATE INDEX IF NOT EXISTS idx_clients_assessments ON clients USING GIN (assessments);
```

### 3. Create auto-update trigger
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_clients_updated_at ON clients;
CREATE TRIGGER update_clients_updated_at
    BEFORE UPDATE ON clients
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

## ✅ Verify Setup

Run this query to verify:
```sql
SELECT * FROM clients;
```

You should see an empty table with all the columns. That means it worked!

## 🎯 After Setup

1. Netlify will automatically redeploy (or click "Trigger deploy" in Netlify)
2. Open your live site
3. You should see "Synced" in the header
4. Add a test family - it will save to the database!

## 🔍 Check if Data is Saving

Run this in Neon SQL Editor:
```sql
SELECT id, name, nickname, admit_date FROM clients;
```

You should see your test data!
