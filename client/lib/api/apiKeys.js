const API_BASE_URL = 'http://localhost:3002/api';

export const apiKeysApi = {
  async createApiKey(name) {
    const response = await fetch(`${API_BASE_URL}/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to create API key');
    }

    return data;
  },

  async getApiKeys() {
    const response = await fetch(`${API_BASE_URL}/api-keys`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to fetch API keys');
    }

    return data;
  },
};

