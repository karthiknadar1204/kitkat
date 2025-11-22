import { useState, useEffect, useRef, useCallback } from 'react';


const getWebSocketUrl = () => {
  if (process.env.NEXT_PUBLIC_WS_URL) {
    return process.env.NEXT_PUBLIC_WS_URL;
  }
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3002';
  

  let baseUrl = apiBaseUrl.replace(/\/api\/?$/, '');
  

  const wsUrl = baseUrl
    .replace('http://', 'ws://')
    .replace('https://', 'wss://');
  
  return `${wsUrl}/ws`;
};

const WS_URL = getWebSocketUrl();

export const useLiveLogs = (sessionId) => {
  const [logs, setLogs] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeTraces, setActiveTraces] = useState(new Set());
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const maxLogs = 500;

  const connect = useCallback(() => {
    if (!sessionId) return;

    if (wsRef.current) {
      wsRef.current.close();
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      const wsUrl = `${WS_URL}?sessionId=${sessionId}`;
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('✅ WebSocket connected');
        }
        setIsConnected(true);
        reconnectAttempts.current = 0;
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);

          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log('📨 WebSocket message received:', data.type, data);
          }

          if (data.type === 'connected') {
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('WebSocket connection confirmed:', data.message);
            }
            return;
          }

          if (data.type === 'pong') {
            return; // Ignore pong messages
          }

          if (data.type === 'log') {
            if (process.env.NODE_ENV === 'development') {
              // eslint-disable-next-line no-console
              console.log('📥 Received log event:', data.event || data.type, data);
            }
            
            const logEntry = {
              id: `${data.traceId}-${data.timestamp}-${Math.random()}`,
              timestamp: data.timestamp || new Date().toISOString(),
              type: data.type || 'log',
              event: data.event || data.type,
              traceId: data.traceId,
              sessionId: data.sessionId,
              data: data,
            };

            setLogs((prevLogs) => {
              const newLogs = [logEntry, ...prevLogs].slice(0, maxLogs);
              if (process.env.NODE_ENV === 'development') {
                // eslint-disable-next-line no-console
                console.log('📝 Updated logs state:', newLogs.length, 'logs, latest:', logEntry.event);
              }
              return newLogs;
            });

            if (data.event === 'trace-started' || data.event === 'trace-received') {
              setActiveTraces((prev) => new Set([...prev, data.traceId]));
            } else if (
              data.event === 'trace-completed' ||
              data.event === 'trace-error'
            ) {
              setActiveTraces((prev) => {
                const newSet = new Set(prev);
                newSet.delete(data.traceId);
                return newSet;
              });
            }
          }
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Error parsing WebSocket message:', error);
          }
        }
      };

      ws.onerror = (error) => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.error('WebSocket error:', error);
        }
        setIsConnected(false);
      };

      ws.onclose = () => {
        if (process.env.NODE_ENV === 'development') {
          // eslint-disable-next-line no-console
          console.log('WebSocket disconnected');
        }
        setIsConnected(false);

        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current += 1;
          const delay = Math.min(1000 * Math.pow(2, reconnectAttempts.current - 1), 10000);
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.log(`Reconnecting in ${delay}ms... (attempt ${reconnectAttempts.current}/${maxReconnectAttempts})`);
          }
          
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        } else {
          if (process.env.NODE_ENV === 'development') {
            // eslint-disable-next-line no-console
            console.error('Max reconnection attempts reached');
          }
        }
      };

      wsRef.current = ws;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        // eslint-disable-next-line no-console
        console.error('Error creating WebSocket connection:', error);
      }
      setIsConnected(false);
    }
  }, [sessionId]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);


  useEffect(() => {
    if (!sessionId) return;

    connect();

    return () => {
      disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  return {
    logs,
    isConnected,
    activeTracesCount: activeTraces.size,
    activeTraces: Array.from(activeTraces),
    connect,
    disconnect,
    clearLogs,
  };
};

