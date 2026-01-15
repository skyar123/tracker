import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  setDoc,
  writeBatch,
} from 'firebase/firestore';

import { db } from './firebase.js';

const clientsCollection = collection(db, 'clients');

export const api = {
  async getClients() {
    try {
      const snapshot = await getDocs(query(clientsCollection, orderBy('admitDate', 'desc')));
      return snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
    } catch (error) {
      console.error('Error fetching clients:', error);
      const saved = localStorage.getItem('cf_caseload_v5');
      return saved ? JSON.parse(saved) : [];
    }
  },

  async saveClient(client) {
    try {
      const clientRef = doc(db, 'clients', client.id);
      await setDoc(
        clientRef,
        {
          ...client,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      return client;
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  },

  async deleteClient(id) {
    try {
      const clientRef = doc(db, 'clients', id);
      await deleteDoc(clientRef);
      return { id };
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  async migrateData(clients) {
    try {
      const batch = writeBatch(db);
      clients.forEach((client) => {
        const clientRef = doc(db, 'clients', client.id);
        batch.set(
          clientRef,
          {
            ...client,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        );
      });
      await batch.commit();
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
