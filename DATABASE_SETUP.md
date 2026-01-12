# Database Setup Guide

## ✅ What's Been Done

1. ✅ Database schema created (`database/schema.sql`)
2. ✅ Netlify serverless functions created
3. ✅ React app updated to use database
4. ✅ Code pushed to GitHub: https://github.com/skyar123/tracker

## 🎯 Next Steps: Setup in Netlify

### Step 1: Initialize Database

1. Go to your Netlify dashboard
2. Your Neon database is already connected (you mentioned you added it)
3. Open your Neon database console
4. Run the schema:
   ```bash
   # Copy the contents of database/schema.sql and run it in Neon console
   ```
   Or use psql:
   ```bash
   psql $NETLIFY_DATABASE_URL < database/schema.sql
   ```

### Step 2: Deploy to Netlify

Your code is already pushed to GitHub. Netlify will automatically:
1. Detect the new functions in `netlify/functions/`
2. Deploy them as serverless endpoints
3. Connect to your Neon database using the `NETLIFY_DATABASE_URL` env variable

### Step 3: Migrate Existing Data (Optional)

If you have existing data in localStorage:

1. Export your data using the "Backup" button in the app
2. After the new deployment is live, use the "Restore from Backup" feature
3. It will automatically migrate all data to the database

## 🔌 API Endpoints

Once deployed, your app will have these endpoints:

- `GET /.netlify/functions/get-clients` - Fetch all clients
- `POST /.netlify/functions/save-client` - Save/update a client
- `DELETE /.netlify/functions/delete-client` - Delete a client
- `POST /.netlify/functions/migrate-data` - Bulk import from backup

## ✨ New Features

### Real-Time Sync
- Changes sync to database automatically
- Visual sync indicators (syncing/synced/error)
- Falls back to localStorage if database unavailable

### Multi-Device Access
- Access your caseload from any device
- All data stored server-side
- No need to export/import between devices

### Team Collaboration (Future)
- Multiple users can access same caseload
- Add authentication in the future
- Role-based permissions possible

## 🧪 Testing

After deployment:

1. Open your Netlify site
2. You should see "Synced" indicator in the header
3. Add a test client - it saves to both database and localStorage
4. Refresh the page - data loads from database
5. Open in another browser/device - same data appears

## 🔧 Troubleshooting

### Functions not working?
- Check Netlify function logs in dashboard
- Verify `NETLIFY_DATABASE_URL` environment variable exists
- Make sure database schema is initialized

### Data not syncing?
- App falls back to localStorage automatically
- Check browser console for errors
- Verify you're on the latest deployment

### Need to reset?
- Database data is independent from localStorage
- Export backup before resetting
- Can re-run schema to reset database

## 📊 Database Schema

Tables:
- `clients` - Main client/family records
- Uses JSONB for flexible assessment storage
- Automatic timestamp tracking
- Optimized indexes for performance

## 🚀 Production Ready

Your app now:
- ✅ Stores data in PostgreSQL
- ✅ Has serverless API endpoints
- ✅ Maintains localStorage backup
- ✅ Shows sync status
- ✅ Handles errors gracefully
- ✅ Supports data migration

Ready to scale! 🎉
