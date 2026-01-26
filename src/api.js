// Simple localStorage-based API - no external dependencies

const STORAGE_KEY = 'cf_caseload_v5';

export const api = {
  async getClients() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
      return [];
    } catch (error) {
      console.error('Error loading clients:', error);
      return [];
    }
  },

  async saveClient(client) {
    try {
      const clients = await this.getClients();
      const existingIndex = clients.findIndex(c => c.id === client.id);
      
      const clientToSave = {
        ...client,
        updatedAt: new Date().toISOString(),
      };

      if (existingIndex >= 0) {
        clients[existingIndex] = clientToSave;
      } else {
        clients.push(clientToSave);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
      return clientToSave;
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  },

  async deleteClient(id) {
    try {
      const clients = await this.getClients();
      const filtered = clients.filter(c => c.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      return { id };
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  async migrateData(clients) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(clients));
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
