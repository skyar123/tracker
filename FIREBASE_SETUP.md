# Firebase Setup (Firestore)

## 1) Create Firebase Project
1. Go to https://console.firebase.google.com
2. Create a new project
3. Add a Web App to get config values

## 2) Enable Firestore
1. Go to **Build → Firestore Database**
2. Click **Create database**
3. Start in **Test mode** for development

## 3) Configure Environment Variables
Create a `.env` file (or set env vars in Netlify) using `.env.example`:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

## 4) Deploy on Netlify
Set the same variables in Netlify:
1. Site settings → Environment variables
2. Add each `VITE_FIREBASE_*` key
3. Trigger a new deploy

## 5) Verify
Open the app, add a family, refresh the page. It should persist across devices.

## Notes
- Data is stored in the `clients` collection.
- IDs are the client `id` values in the app.
