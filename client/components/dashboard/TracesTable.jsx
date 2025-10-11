'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Zap, ChevronRight } from 'lucide-react';

export default function TracesTable({ traces, tracesLoading, apiKeysCount, onTraceClick }) {

  const getTraceType = (trace) => {
    if (!trace.spans || trace.spans.length === 0) return 'unknown';
    const firstSpan = trace.spans[0];
    if (firstSpan.name === 'ChatCompletions') return 'chat';
    if (firstSpan.name === 'Embeddings') return 'embedding';
    if (trace.spans.length > 1) return 'chain';
    return 'unknown';
  };

  const getTraceTypeColor = (type) => {
    switch (type) {
      case 'chat': return 'bg-blue-500/10 text-blue-500 border-blue-500/50';
      case 'embedding': return 'bg-purple-500/10 text-purple-500 border-purple-500/50';
      case 'chain': return 'bg-green-500/10 text-green-500 border-green-500/50';
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/50';
    }
  };

  const getTotalTokens = (trace) => {
    return trace.spans.reduce((sum, span) => {
      if (span.tokens) {
        return sum + span.tokens.input + span.tokens.output;
      }
      return sum;
    }, 0);
  };

  const getTotalLatency = (trace) => {
    return trace.spans.reduce((sum, span) => sum + (span.latency || 0), 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  if (tracesLoading) {
    return (
      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="heading-md flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Traces
          </CardTitle>
          <CardDescription className="body-sm">
            Real-time monitoring of your AI application calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (traces.length === 0) {
    return (
      <Card className="glass-effect border-border">
        <CardHeader>
          <CardTitle className="heading-md flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Traces
          </CardTitle>
          <CardDescription className="body-sm">
            Real-time monitoring of your AI application calls
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="heading-sm mb-2">No traces yet</h3>
            <p className="body-md text-muted-foreground mb-4 max-w-md mx-auto">
              Start sending traces from your application to see them here.
            </p>
            {apiKeysCount === 0 && (
              <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 max-w-md mx-auto">
                <p className="body-sm text-yellow-600 dark:text-yellow-400">
                  Generate an API key above to get started
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="glass-effect border-border">
      <CardHeader>
        <CardTitle className="heading-md flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Traces
        </CardTitle>
        <CardDescription className="body-sm">
          Real-time monitoring of your AI application calls
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          {/* Table Header */}
          <div className="bg-muted/30 px-4 py-3 rounded-t-lg border border-border">
            <div className="grid grid-cols-12 gap-4 body-sm font-medium text-muted-foreground">
              <div className="col-span-2">ID</div>
              <div className="col-span-2">Type</div>
              <div className="col-span-2">Name</div>
              <div className="col-span-2 text-right">Latency</div>
              <div className="col-span-2 text-right">Tokens</div>
              <div className="col-span-1 text-center">Status</div>
              <div className="col-span-1"></div>
            </div>
          </div>

          {/* Table Body */}
          <div className="border-x border-b border-border rounded-b-lg">
            {traces.map((trace, idx) => {
              const type = getTraceType(trace);
              const totalTokens = getTotalTokens(trace);
              const totalLatency = getTotalLatency(trace);

              return (
                <div
                  key={trace.traceId}
                  className={`${idx !== 0 ? 'border-t border-border' : ''} hover:bg-muted/30 transition-colors cursor-pointer group`}
                  onClick={() => onTraceClick && onTraceClick(trace)}
                >
                  {/* Table Row */}
                  <div className="grid grid-cols-12 gap-4 px-4 py-4 items-center">
                    <div className="col-span-2">
                      <span className="body-sm font-mono text-muted-foreground">
                        {trace.traceId.substring(0, 8)}
                      </span>
                    </div>
                    
                    <div className="col-span-2">
                      <Badge className={`${getTraceTypeColor(type)} border text-xs`}>
                        {type}
                      </Badge>
                    </div>
                    
                    <div className="col-span-2">
                      <p className="body-sm text-foreground truncate">
                        {trace.spans[0]?.name || 'Unknown'}
                      </p>
                      <p className="body-xs text-muted-foreground">
                        {formatDate(trace.createdAt)}
                      </p>
                    </div>
                    
                    <div className="col-span-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="body-sm">{totalLatency}ms</span>
                      </div>
                    </div>
                    
                    <div className="col-span-2 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="body-sm">{totalTokens}</span>
                      </div>
                    </div>
                    
                    <div className="col-span-1 text-center">
                      <Badge variant="outline" className="text-green-500 border-green-500/50 text-xs">
                        ✓
                      </Badge>
                    </div>

                    <div className="col-span-1 text-right">
                      <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

