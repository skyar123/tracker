// API utility functions for database operations

const API_BASE = '/.netlify/functions';

function getAuthHeader() {
  const token = localStorage.getItem('cf_auth_token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
}

export const api = {
  // Login
  async login(password) {
    try {
      const response = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error('Invalid password');
      }

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('cf_auth_token', data.token);
        return data.token;
      }
      throw new Error('Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Fetch all clients from database
  async getClients() {
    try {
      const response = await fetch(`${API_BASE}/get-clients`, {
        headers: getAuthHeader(),
      });
      
      if (response.status === 401) {
        // Not authenticated - clear token and throw
        localStorage.removeItem('cf_auth_token');
        throw new Error('Unauthorized');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch clients');
      }
      
      return data.data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      // Fall back to localStorage if database fails
      const saved = localStorage.getItem('cf_caseload_v5');
      return saved ? JSON.parse(saved) : [];
    }
  },

  // Save a client to database
  async saveClient(client) {
    try {
      const response = await fetch(`${API_BASE}/save-client`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify(client),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to save client');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error saving client:', error);
      throw error;
    }
  },

  // Delete a client from database
  async deleteClient(id) {
    try {
      const response = await fetch(`${API_BASE}/delete-client`, {
        method: 'DELETE',
        headers: getAuthHeader(),
        body: JSON.stringify({ id }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete client');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error deleting client:', error);
      throw error;
    }
  },

  // Migrate data from localStorage backup to database
  async migrateData(clients) {
    try {
      const response = await fetch(`${API_BASE}/migrate-data`, {
        method: 'POST',
        headers: getAuthHeader(),
        body: JSON.stringify({ clients }),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to migrate data');
      }
      
      return data.data;
    } catch (error) {
      console.error('Error migrating data:', error);
      throw error;
    }
  },
};
