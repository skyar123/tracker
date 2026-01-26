// Example Firebase API implementation
// This replaces src/api.js when using Firebase

import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where,
  onSnapshot,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from './firebase.js';

// Get current user's ID
const getUserId = () => {
  const user = auth.currentUser;
  if (!user) {
    throw new Error('User not authenticated. Please sign in.');
  }
  return user.uid;
};

// Get user's clients collection reference
const getClientsRef = () => {
  const userId = getUserId();
  return collection(db, 'users', userId, 'clients');
};

// Get a specific client document reference
const getClientRef = (clientId) => {
  const clientsRef = getClientsRef();
  return doc(clientsRef, clientId);
};

export const api = {
  // Get all clients for current user
  async getClients() {
    try {
      const clientsRef = getClientsRef();
      const snapshot = await getDocs(clientsRef);
      const clients = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      return clients;
    } catch (error) {
      console.error('Error loading clients:', error);
      // If not authenticated, return empty array
      if (error.message.includes('authenticated')) {
        return [];
      }
      throw error;
    }
  },

  // Save/update a client
  async saveClient(client) {
    try {
      const clientRef = getClientRef(client.id);
      
      const clientToSave = {
        ...client,
        updatedAt: new Date().toISOString(),
        // Optional: Add server timestamp
        // updatedAt: serverTimestamp(),
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
      const clientRef = getClientRef(id);
      await deleteDoc(clientRef);
      return { id };
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  // Real-time listener (optional - for live sync across tabs/devices)
  subscribeToClients(callback) {
    try {
      const clientsRef = getClientsRef();
      return onSnapshot(clientsRef, (snapshot) => {
        const clients = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        callback(clients);
      }, (error) => {
        console.error('Error in real-time listener:', error);
        // Fallback to regular getClients
        this.getClients().then(callback);
      });
    } catch (error) {
      console.error('Error setting up listener:', error);
      // Fallback to regular getClients
      this.getClients().then(callback);
    }
  },

  // Migrate data (import/backup restore)
  async migrateData(clients) {
    try {
      const clientsRef = getClientsRef();
      const batch = [];
      
      clients.forEach(client => {
        const clientRef = doc(clientsRef, client.id);
        batch.push(setDoc(clientRef, {
          ...client,
          updatedAt: new Date().toISOString(),
        }, { merge: true }));
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
