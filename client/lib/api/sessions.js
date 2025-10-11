const API_BASE_URL = 'http://localhost:3002/api';

const handleAuthError = (response) => {
  if (response.status === 401 || response.status === 403) {
    // Clear auth and redirect to sign-in
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-storage');
      window.location.href = '/sign-in';
    }
    throw new Error('SESSION_EXPIRED');
  }
};

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

    handleAuthError(response);

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

    handleAuthError(response);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to fetch sessions');
    }

    return data;
  },
};

