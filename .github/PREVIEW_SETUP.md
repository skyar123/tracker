# GitHub Actions Preview Setup Guide

## What This Does

The workflow creates **isolated database branches** for each pull request:
- Each PR gets its own temporary Neon database
- Schema is automatically initialized
- Database is deleted when PR is closed
- Branches expire after 2 weeks

## Required Setup

### 1. Get Neon Project ID

1. Go to your Neon dashboard: https://console.neon.tech
2. Select your project
3. Copy the **Project ID** (looks like: `ancient-river-12345`)

### 2. Get Neon API Key

1. In Neon dashboard, click your profile (top right)
2. Go to **Account settings** → **API keys**
3. Click **"Generate new API key"**
4. Give it a name like "GitHub Actions"
5. Copy the API key (starts with `neon_`)

### 3. Add to GitHub Secrets/Variables

Go to your GitHub repo:
**Settings** → **Secrets and variables** → **Actions**

#### Add Secret:
- Click **"New repository secret"**
- Name: `NEON_API_KEY`
- Value: Your Neon API key (from step 2)
- Click **"Add secret"**

#### Add Variable:
- Switch to **"Variables"** tab
- Click **"New repository variable"**
- Name: `NEON_PROJECT_ID`
- Value: Your Project ID (from step 1)
- Click **"Add variable"**

## How It Works

### When You Create a PR:
1. ✅ Workflow creates a new database branch
2. ✅ Runs `database/schema.sql` to initialize it
3. ✅ Posts a comment with details
4. ✅ Netlify preview deploy uses this database

### When You Update a PR:
1. 🔄 Workflow updates the database branch
2. 🔄 Shows schema changes in PR comment

### When You Close/Merge a PR:
1. 🧹 Workflow deletes the database branch
2. 🧹 Cleans up resources

## Testing the Workflow

After setup:

1. Create a test branch: `git checkout -b test-preview`
2. Make a small change to README
3. Push: `git push origin test-preview`
4. Create a PR on GitHub
5. Watch the Actions tab - should see workflow running
6. PR will get a comment when database is ready!

## Benefits

✅ **Isolated Testing** - Each PR has its own database  
✅ **Automatic Cleanup** - No manual database management  
✅ **Schema Validation** - See database changes in PRs  
✅ **Safe Previews** - Test without affecting production  
✅ **Cost Efficient** - Branches auto-expire after 2 weeks  

## Troubleshooting

**Workflow fails?**
- Check you added both `NEON_API_KEY` (secret) and `NEON_PROJECT_ID` (variable)
- Verify API key has correct permissions
- Check Actions logs for specific errors

**Database not connecting?**
- Netlify preview needs to use the branch URL
- Check Netlify environment variables

**Want longer expiration?**
- Edit `.github/workflows/neon-preview.yml`
- Change `+14 days` to `+30 days` or whatever you need

## Next Steps

After this is working, you can:
1. Add test data to preview databases
2. Run automated tests against preview databases
3. Add performance benchmarks
4. Set up staging environments

Pretty cool, right? 🚀
