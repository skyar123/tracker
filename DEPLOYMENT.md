# Deployment Guide

## Step 1: Push to GitHub

Your code is committed and ready. To push to GitHub:

### Option A: Using GitHub CLI (Recommended)

1. Authenticate with GitHub:
   ```bash
   gh auth login
   ```

2. Create the repository and push:
   ```bash
   gh repo create tracker --public --source=. --remote=origin --push
   ```

### Option B: Manual Setup

1. Go to https://github.com/new
2. Create a new repository named `tracker`
3. **DO NOT** initialize with README, .gitignore, or license
4. Run these commands:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/tracker.git
   git branch -M main
   git push -u origin main
   ```

Replace `YOUR_USERNAME` with your GitHub username.

## Step 2: Deploy to Netlify

### Option A: Connect via GitHub (Recommended)

1. Go to https://app.netlify.com
2. Click "Add new site" → "Import an existing project"
3. Choose "GitHub" and authorize Netlify
4. Select the `tracker` repository
5. Netlify will auto-detect the build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
6. Click "Deploy site"

### Option B: Deploy via Netlify CLI

1. Install Netlify CLI:
   ```bash
   npm install -g netlify-cli
   ```

2. Login to Netlify:
   ```bash
   netlify login
   ```

3. Deploy:
   ```bash
   npm run build
   netlify deploy --prod
   ```

### Option C: Drag & Drop

1. Build the project:
   ```bash
   npm install
   npm run build
   ```

2. Go to https://app.netlify.com/drop
3. Drag the `dist` folder to the page

## Build Configuration

The project is already configured with `netlify.toml`:
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirects configured

## Environment Variables

No environment variables are required for this project.

## Custom Domain (Optional)

After deployment, you can add a custom domain in Netlify's site settings.
