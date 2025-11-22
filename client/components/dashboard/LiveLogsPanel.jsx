'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLiveLogs } from '@/lib/hooks/useLiveLogs';
import { 
  Radio, 
  Wifi, 
  WifiOff, 
  Trash2, 
  Filter,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';

const getEventColor = (event) => {
  switch (event) {
    case 'trace-received':
      return 'text-blue-500';
    case 'trace-started':
      return 'text-purple-500';
    case 'span-started':
      return 'text-yellow-500';
    case 'span-completed':
      return 'text-green-500';
    case 'trace-completed':
      return 'text-green-600';
    case 'trace-error':
      return 'text-red-500';
    default:
      return 'text-gray-500';
  }
};

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    fractionalSecondDigits: 3,
  });
};

export default function LiveLogsPanel({ sessionId, className = '' }) {
  const { logs, isConnected, activeTracesCount, clearLogs } = useLiveLogs(sessionId);
  const [filter, setFilter] = useState('all'); // 'all', 'trace', 'span', 'error'
  const [isExpanded, setIsExpanded] = useState(true);
  const logsEndRef = useRef(null);

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (filter === 'all') return logs;
    if (filter === 'trace') {
      return logs.filter(
        (log) =>
          log.event === 'trace-received' ||
          log.event === 'trace-started' ||
          log.event === 'trace-completed' ||
          log.event === 'trace-error'
      );
    }
    if (filter === 'span') {
      return logs.filter(
        (log) => log.event === 'span-started' || log.event === 'span-completed'
      );
    }
    if (filter === 'error') {
      return logs.filter((log) => log.event === 'trace-error');
    }
    return logs;
  }, [logs, filter]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isExpanded && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [filteredLogs, isExpanded]);

  return (
    <Card className={`glass-effect border-border ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="heading-sm flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Live Logs
              {isConnected ? (
                <Badge variant="secondary" className="bg-green-500/20 text-green-500 border-green-500/50">
                  <Wifi className="w-3 h-3 mr-1" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-red-500/20 text-red-500 border-red-500/50">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Disconnected
                </Badge>
              )}
            </CardTitle>
            {activeTracesCount > 0 && (
              <Badge variant="outline" className="text-xs">
                {activeTracesCount} active
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 border rounded-md p-1">
              <Button
                variant={filter === 'all' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setFilter('all')}
              >
                All
              </Button>
              <Button
                variant={filter === 'trace' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setFilter('trace')}
              >
                Traces
              </Button>
              <Button
                variant={filter === 'span' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setFilter('span')}
              >
                Spans
              </Button>
              <Button
                variant={filter === 'error' ? 'default' : 'ghost'}
                size="sm"
                className="h-7 px-2 text-xs"
                onClick={() => setFilter('error')}
              >
                Errors
              </Button>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearLogs}
              className="h-8 w-8 p-0"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="h-8 w-8 p-0"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      {isExpanded && (
        <CardContent className="p-0">
          <div className="h-96 overflow-y-auto bg-black/20 rounded-lg p-4 font-mono text-sm">
            {process.env.NODE_ENV === 'development' && (
              <div className="text-xs text-yellow-500 mb-2">
                Debug: {logs.length} total logs, {filteredLogs.length} filtered, connected: {isConnected ? 'yes' : 'no'}
              </div>
            )}
            {filteredLogs.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center">
                  <Radio className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No logs yet</p>
                  <p className="text-xs mt-1">
                    {isConnected
                      ? 'Waiting for trace events...'
                      : 'Connecting to live logs...'}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 py-1 hover:bg-white/5 rounded px-2 transition-colors"
                  >
                    <span className="text-muted-foreground text-xs min-w-[100px]">
                      {formatTimestamp(log.timestamp)}
                    </span>
                    <span
                      className={`font-medium min-w-[120px] ${getEventColor(
                        log.event
                      )}`}
                    >
                      {log.event}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {log.traceId && (
                          <Badge
                            variant="outline"
                            className="text-xs font-mono bg-primary/10"
                          >
                            {log.traceId.slice(0, 8)}...
                          </Badge>
                        )}
                        {log.data?.spanName && (
                          <span className="text-muted-foreground text-xs">
                            span: {log.data.spanName}
                          </span>
                        )}
                        {log.data?.latency !== undefined && (
                          <span className="text-muted-foreground text-xs">
                            {log.data.latency}ms
                          </span>
                        )}
                        {log.data?.inputTokens !== undefined &&
                          log.data?.outputTokens !== undefined && (
                            <span className="text-muted-foreground text-xs">
                              tokens: {log.data.inputTokens + log.data.outputTokens}
                            </span>
                          )}
                        {log.data?.error && (
                          <span className="text-red-500 text-xs">
                            {log.data.error}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={logsEndRef} />
              </div>
            )}
          </div>
          {filteredLogs.length > 0 && (
            <div className="px-4 py-2 text-xs text-muted-foreground border-t">
              Showing {filteredLogs.length} of {logs.length} logs
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

