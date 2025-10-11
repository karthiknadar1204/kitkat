'use client';

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Clock, Zap, Activity, Copy, Check } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function TraceDetailSidebar({ isOpen, trace, onClose }) {
  const [copied, setCopied] = useState({});
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small delay to ensure DOM is ready before triggering transition
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
      // Wait for transition to complete before removing from DOM
      const timer = setTimeout(() => setShouldRender(false), 350);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!trace || !shouldRender) return null;

  const getTraceType = () => {
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

  const getTotalTokens = () => {
    return trace.spans.reduce((sum, span) => {
      if (span.tokens) {
        return sum + span.tokens.input + span.tokens.output;
      }
      return sum;
    }, 0);
  };

  const getTotalLatency = () => {
    return trace.spans.reduce((sum, span) => sum + (span.latency || 0), 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString();
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  const type = getTraceType();
  const totalTokens = getTotalTokens();
  const totalLatency = getTotalLatency();

  return (
    <>
      {/* Backdrop */}
      <div 
        className={`fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-all duration-300 ease-in-out ${
          isVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div 
        className={`fixed top-0 right-0 h-full w-full md:w-[700px] lg:w-[800px] bg-background border-l border-border z-50 overflow-y-auto shadow-2xl transition-all duration-300 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        {/* Header */}
        <div className="sticky top-0 bg-background/95 backdrop-blur-sm border-b border-border px-6 py-4 z-10">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Activity className="w-6 h-6 text-primary" />
                <h2 className="heading-lg">Trace Details</h2>
                <Badge className={`${getTraceTypeColor(type)} border text-xs`}>
                  {type}
                </Badge>
              </div>
              <div className="flex items-center gap-4 text-muted-foreground body-sm">
                <span className="font-mono">{trace.traceId}</span>
                <span>{formatDate(trace.createdAt)}</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="hover:bg-muted"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Clock className="w-4 h-4 text-blue-500" />
                <span className="body-sm">Total Latency</span>
              </div>
              <p className="heading-md text-foreground">{totalLatency}ms</p>
            </div>
            <div className="bg-muted/30 rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Zap className="w-4 h-4 text-yellow-500" />
                <span className="body-sm">Total Tokens</span>
              </div>
              <p className="heading-md text-foreground">{totalTokens}</p>
            </div>
          </div>

          {/* Spans */}
          <div>
            <h3 className="heading-sm mb-4">Spans ({trace.spans.length})</h3>
            <div className="space-y-4">
              {trace.spans.map((span, idx) => (
                <div 
                  key={idx} 
                  className="bg-muted/20 border border-border rounded-lg p-5 hover:bg-muted/30 transition-colors"
                >
                  {/* Span Header */}
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-border">
                    <div>
                      <h4 className="body-lg font-semibold mb-1">{span.name}</h4>
                      <div className="flex items-center gap-4 text-muted-foreground body-sm">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{span.latency}ms</span>
                        </div>
                        {span.tokens && (
                          <div className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5" />
                            <span>
                              {span.tokens.input + span.tokens.output} tokens
                              <span className="text-xs ml-1">
                                (↑{span.tokens.input} ↓{span.tokens.output})
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    {span.model && (
                      <Badge variant="outline" className="body-xs">
                        {span.model}
                      </Badge>
                    )}
                  </div>

                  {/* Input */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <p className="body-sm font-semibold text-muted-foreground">Input</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => copyToClipboard(JSON.stringify(span.input, null, 2), `input-${idx}`)}
                      >
                        {copied[`input-${idx}`] ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-background rounded-lg p-4 border border-border">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words font-mono">
                        {JSON.stringify(span.input, null, 2)}
                      </pre>
                    </div>
                  </div>

                  {/* Output */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <p className="body-sm font-semibold text-muted-foreground">Output</p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 px-2"
                        onClick={() => copyToClipboard(JSON.stringify(span.output, null, 2), `output-${idx}`)}
                      >
                        {copied[`output-${idx}`] ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </Button>
                    </div>
                    <div className="bg-background rounded-lg p-4 border border-border">
                      <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words font-mono">
                        {JSON.stringify(span.output, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Metadata */}
          {trace.metadata && Object.keys(trace.metadata).length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="heading-sm">Metadata</h3>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2"
                  onClick={() => copyToClipboard(JSON.stringify(trace.metadata, null, 2), 'metadata')}
                >
                  {copied.metadata ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                </Button>
              </div>
              <div className="bg-muted/20 border border-border rounded-lg p-4">
                <pre className="text-xs overflow-x-auto whitespace-pre-wrap break-words font-mono">
                  {JSON.stringify(trace.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background/95 backdrop-blur-sm border-t border-border px-6 py-4">
          <Button
            size="lg"
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
        </div>
      </div>
    </>
  );
}

