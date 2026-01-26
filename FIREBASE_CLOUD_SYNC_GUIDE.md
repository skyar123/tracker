# Firebase Cloud Sync Setup Guide

## Why Firebase?

Firebase offers a **completely free tier** that's perfect for your use case:
- **Firestore Database**: 1GB storage, 50K reads/day, 20K writes/day (FREE)
- **Firebase Authentication**: Unlimited users with Google/Gmail login (FREE)
- **Real-time sync**: Data automatically syncs across all devices
- **No credit card required** for the free tier (Spark Plan)

## Free Tier Limits (Spark Plan)

✅ **Included FREE:**
- 1 GB database storage
- 50,000 document reads per day
- 20,000 document writes per day
- 10 GB/month network egress
- Unlimited authentication users
- Real-time database listeners

For a caseload tracker with ~10-50 clients, this is **more than enough** and will stay free.

## Setup Steps

### 1. Create Firebase Project

1. Go to https://console.firebase.google.com/
2. Click "Add project"
3. Name it (e.g., "cf-assessment-tracker")
4. **Disable Google Analytics** (to keep it simple)
5. Click "Create project"

### 2. Enable Authentication (Gmail Login)

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Click **Google** provider
3. Toggle "Enable"
4. Set project support email
5. Click "Save"
6. Copy the **Web client ID** (you'll need this)

### 3. Create Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Choose **Start in test mode** (we'll add security rules later)
3. Select a location (choose closest to you)
4. Click "Enable"

### 4. Get Your Firebase Config

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps"
3. Click **Web** icon (`</>`)
4. Register app (name it "CF Tracker")
5. Copy the `firebaseConfig` object

### 5. Install Firebase in Your Project

```bash
npm install firebase
```

### 6. Create Firebase Config File

Create `src/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Your Firebase config (from step 4)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export default app;
```

### 7. Update API to Use Firestore

Replace `src/api.js` with Firestore version:

```javascript
import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot 
} from 'firebase/firestore';
import { db, auth } from './firebase.js';

// Get current user's ID
const getUserId = () => {
  const user = auth.currentUser;
  if (!user) throw new Error('User not authenticated');
  return user.uid;
};

// Get user's clients collection reference
const getClientsRef = () => {
  return collection(db, 'users', getUserId(), 'clients');
};

export const api = {
  // Get all clients for current user
  async getClients() {
    try {
      const clientsRef = getClientsRef();
      const snapshot = await getDocs(clientsRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  },

  // Save/update a client
  async saveClient(client) {
    try {
      const clientsRef = getClientsRef();
      const clientRef = doc(clientsRef, client.id);
      
      const clientToSave = {
        ...client,
        updatedAt: new Date().toISOString(),
      };

      await setDoc(clientRef, clientToSave, { merge: true });
      return clientToSave;
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  },

  // Delete a client
  async deleteClient(id) {
    try {
      const clientsRef = getClientsRef();
      const clientRef = doc(clientsRef, id);
      await deleteDoc(clientRef);
      return { id };
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  // Real-time listener (optional - for live updates)
  subscribeToClients(callback) {
    const clientsRef = getClientsRef();
    return onSnapshot(clientsRef, (snapshot) => {
      const clients = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(clients);
    });
  },

  // Migrate data (import)
  async migrateData(clients) {
    try {
      const clientsRef = getClientsRef();
      const batch = [];
      
      clients.forEach(client => {
        const clientRef = doc(clientsRef, client.id);
        batch.push(setDoc(clientRef, {
          ...client,
          updatedAt: new Date().toISOString(),
        }));
      });

      await Promise.all(batch);
      return {
        imported: clients.length,
        total: clients.length,
        errors: null,
      };
    } catch (error) {
      console.error('Error migrating data:', error);
      throw error;
    }
  },
};
```

### 8. Add Authentication to App.jsx

Add login/logout functionality:

```javascript
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from './firebase.js';

// In your component:
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

// Check auth state on mount
useEffect(() => {
  const unsubscribe = auth.onAuthStateChanged((user) => {
    setUser(user);
    setLoading(false);
  });
  return () => unsubscribe();
}, []);

// Login function
const handleLogin = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
  } catch (error) {
    console.error('Login error:', error);
    alert('Failed to sign in. Please try again.');
  }
};

// Logout function
const handleLogout = async () => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Logout error:', error);
  }
};

// Show login screen if not authenticated
if (loading) {
  return <div>Loading...</div>;
}

if (!user) {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md">
        <h1 className="text-2xl font-bold text-slate-800 mb-4 text-center">
          CF Assessment Tracker
        </h1>
        <p className="text-slate-600 mb-6 text-center">
          Sign in with your Google account to access your caseload
        </p>
        <button
          onClick={handleLogin}
          className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
            <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
            <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
            <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
          </svg>
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
```

### 9. Add Security Rules

In Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/clients/{clientId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 10. Deploy to Netlify (Optional - for hosting)

1. Push your code to GitHub
2. Go to https://app.netlify.com/
3. Click "Add new site" → "Import an existing project"
4. Connect GitHub repository
5. Build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
6. Click "Deploy site"

**Netlify is FREE** for:
- 100 GB bandwidth/month
- 300 build minutes/month
- Automatic HTTPS
- Custom domains

## Data Structure in Firestore

```
users/
  {userId}/
    clients/
      {clientId}/
        - All client data (name, dob, assessments, etc.)
```

Each user's data is isolated and secure.

## Benefits

✅ **Free forever** (within limits)
✅ **Automatic sync** across devices
✅ **Real-time updates** (if you use listeners)
✅ **Secure** (Google authentication)
✅ **No backend code** needed
✅ **Works offline** (Firestore has offline persistence)

## Migration from LocalStorage

When user first logs in, you can migrate their localStorage data:

```javascript
// After successful login
const migrateLocalToCloud = async () => {
  const localData = localStorage.getItem('cf_caseload_v5');
  if (localData) {
    const clients = JSON.parse(localData);
    await api.migrateData(clients);
    // Optionally clear localStorage after migration
    localStorage.removeItem('cf_caseload_v5');
  }
};
```

## Cost Monitoring

Firebase will email you if you approach limits. For a caseload tracker:
- **Storage**: ~1MB per 100 clients (well under 1GB)
- **Reads**: ~50 reads per day per active user (well under 50K)
- **Writes**: ~10 writes per day per active user (well under 20K)

You'll likely **never exceed** the free tier!
