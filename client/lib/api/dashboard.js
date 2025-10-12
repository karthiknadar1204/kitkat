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

export const dashboardApi = {
  async getTraces(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/traces/${sessionId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      handleAuthError(response);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Traces fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch traces: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('getTraces error:', error);
      throw error;
    }
  },

  async getStats(sessionId) {
    try {
      const response = await fetch(`${API_BASE_URL}/dashboard/stats/${sessionId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      handleAuthError(response);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Stats fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch stats: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('getStats error:', error);
      throw error;
    }
  },
};
