const API_BASE_URL = 'http://localhost:3002/api';

export const sessionsApi = {
  async createSession(appName) {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ appName }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to create session');
    }

    return data;
  },

  async getSessions() {
    const response = await fetch(`${API_BASE_URL}/sessions`, {
      method: 'GET',
      credentials: 'include',
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to fetch sessions');
    }

    return data;
  },
};

