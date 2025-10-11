const API_BASE_URL = 'http://localhost:3002/api';

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

  async getTimeSeries(sessionId, period = 'hourly', days = 7) {
    try {
      const response = await fetch(
        `${API_BASE_URL}/dashboard/timeseries/${sessionId}?period=${period}&days=${days}`, 
        {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('TimeSeries fetch error:', response.status, errorText);
        throw new Error(`Failed to fetch time-series: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('getTimeSeries error:', error);
      throw error;
    }
  },
};
