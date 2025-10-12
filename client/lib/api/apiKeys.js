const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

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

export const apiKeysApi = {
  async createApiKey(name, sessionId) {
    const response = await fetch(`${API_BASE_URL}/api-keys`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ name, sessionId }),
    });

    handleAuthError(response);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to create API key');
    }

    return data;
  },

  async getApiKeys(sessionId) {
    const url = sessionId 
      ? `${API_BASE_URL}/api-keys?sessionId=${sessionId}`
      : `${API_BASE_URL}/api-keys`;
    
    const response = await fetch(url, {
      method: 'GET',
      credentials: 'include',
    });

    handleAuthError(response);

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || data.message || 'Failed to fetch API keys');
    }

    return data;
  },
};

