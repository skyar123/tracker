# Quick Start: Firebase Setup (5 Minutes)

## Step 1: Create Firebase Project (2 min)

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name: `cf-tracker` (or your choice)
4. **Disable Google Analytics** (uncheck)
5. Click "Create project"

## Step 2: Enable Gmail Login (1 min)

1. Left sidebar → **Authentication**
2. Click "Get started"
3. Click **Google** → Enable → Save
4. Done!

## Step 3: Create Database (1 min)

1. Left sidebar → **Firestore Database**
2. Click "Create database"
3. Select **"Start in test mode"**
4. Choose location (closest to you)
5. Click "Enable"

## Step 4: Get Your Config (1 min)

1. Click gear icon ⚙️ → **Project settings**
2. Scroll to "Your apps"
3. Click **Web** icon `</>`
4. App nickname: `CF Tracker`
5. **Copy the `firebaseConfig` object**

## Step 5: Install & Configure

```bash
npm install firebase
```

Create `src/firebase.js` and paste your config.

That's it! Your app is ready for cloud sync.

## Next Steps

See `FIREBASE_CLOUD_SYNC_GUIDE.md` for full implementation code.
