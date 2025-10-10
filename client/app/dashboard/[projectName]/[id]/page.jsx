"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Activity, Clock, DollarSign, Zap, Key, Plus, Copy, Check } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuthStore } from "@/lib/authStore";
import { apiKeysApi } from "@/lib/api/apiKeys";
import { dashboardApi } from "@/lib/api/dashboard";

export default function ProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { isAuthenticated, _hasHydrated } = useAuthStore();
  const [apiKeys, setApiKeys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState({});
  const [newApiKey, setNewApiKey] = useState(null);
  const [traces, setTraces] = useState([]);
  const [stats, setStats] = useState({ 
    runCount: 0,
    errorRate: 0,
    errorCount: 0,
    successCount: 0,
    totalTokens: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    avgTokensPerTrace: 0,
    avgInputTokensPerTrace: 0,
    avgOutputTokensPerTrace: 0,
    totalCost: 0,
    medianCostPerTrace: 0,
    avgTraceLatency: 0,
    traceP50Latency: 0,
    traceP99Latency: 0,
    llmCount: 0,
    avgLLMLatency: 0,
    llmP50Latency: 0,
    llmP99Latency: 0,
    // Legacy
    avgLatency: 0,
    p50Latency: 0,
    p99Latency: 0,
  });
  const [tracesLoading, setTracesLoading] = useState(true);
  const [expandedTrace, setExpandedTrace] = useState(null);

  const projectName = decodeURIComponent(params.projectName);
  const sessionId = params.id;

  useEffect(() => {
    // Wait for store to hydrate before checking auth
    if (!_hasHydrated) return;
    
    if (!isAuthenticated) {
      router.push("/sign-in");
      return;
    }
    fetchApiKeys();
    fetchTraces();
    fetchStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, _hasHydrated]);

  const fetchApiKeys = async () => {
    try {
      setLoading(true);
      const data = await apiKeysApi.getApiKeys();
      setApiKeys(data);
    } catch (err) {
      console.error('Error fetching API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTraces = async () => {
    try {
      setTracesLoading(true);
      const data = await dashboardApi.getTraces(sessionId);
      setTraces(data);
    } catch (err) {
      console.error('Error fetching traces:', err);
    } finally {
      setTracesLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await dashboardApi.getStats(sessionId);
      setStats(data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied({ ...copied, [key]: true });
    setTimeout(() => {
      setCopied({ ...copied, [key]: false });
    }, 2000);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getTraceType = (trace) => {
    if (trace.spans.length > 1) return "chain";
    const spanName = trace.spans[0]?.name || "";
    if (spanName.includes("embedding")) return "embeddings";
    if (spanName.includes("chat") || spanName.includes("llm")) return "chat";
    return "other";
  };

  const getTraceTypeColor = (type) => {
    switch(type) {
      case "chat": return "bg-blue-500/10 text-blue-500 border-blue-500/50";
      case "embeddings": return "bg-purple-500/10 text-purple-500 border-purple-500/50";
      case "chain": return "bg-green-500/10 text-green-500 border-green-500/50";
      default: return "bg-gray-500/10 text-gray-500 border-gray-500/50";
    }
  };

  const getTotalTokens = (trace) => {
    return trace.spans.reduce((sum, span) => 
      sum + (span.tokens?.input || 0) + (span.tokens?.output || 0), 0
    );
  };

  const getTotalLatency = (trace) => {
    return trace.spans.reduce((sum, span) => sum + (span.latency || 0), 0);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-6 py-24">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            className="mb-4"
            onClick={() => router.push("/dashboard")}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>
          <h1 className="heading-lg mb-2">{projectName}</h1>
          <p className="body-md text-muted-foreground">
            Session ID: {sessionId}
          </p>
        </div>

        {/* Stats Overview - Top Row */}
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-primary" />
                <Badge variant="secondary">Live</Badge>
              </div>
              <div className="heading-md mb-1">{stats.runCount.toLocaleString()}</div>
              <p className="body-sm text-muted-foreground">Run Count</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="heading-md mb-1">{stats.totalTokens.toLocaleString()}</div>
              <p className="body-sm text-muted-foreground">Total Tokens</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
              </div>
              <div className="heading-md mb-1">${((stats.totalCost || 0) / 100).toFixed(4)}</div>
              <p className="body-sm text-muted-foreground">Total Cost</p>
            </CardContent>
          </Card>

          <Card className={`glass-effect ${stats.errorRate > 0 ? 'border-red-500/50' : 'border-border'}`}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-2xl ${stats.errorRate > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {stats.errorRate > 0 ? '✗' : '✓'}
                </span>
              </div>
              <div className="heading-md mb-1">{stats.errorRate}%</div>
              <p className="body-sm text-muted-foreground">Error Rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Latency Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">Trace P50</Badge>
              </div>
              <div className="heading-md mb-1">{stats.traceP50Latency}ms</div>
              <p className="body-sm text-muted-foreground">Median Trace Latency</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">Trace P99</Badge>
              </div>
              <div className="heading-md mb-1">{stats.traceP99Latency}ms</div>
              <p className="body-sm text-muted-foreground">P99 Trace Latency</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <Badge variant="outline" className="text-xs">LLM P50</Badge>
              </div>
              <div className="heading-md mb-1">{stats.llmP50Latency}ms</div>
              <p className="body-sm text-muted-foreground">Median LLM Latency</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <Badge variant="outline" className="text-xs">LLM Count</Badge>
              </div>
              <div className="heading-md mb-1">{stats.llmCount}</div>
              <p className="body-sm text-muted-foreground">Total LLM Calls</p>
            </CardContent>
          </Card>
        </div>

        {/* Token Metrics */}
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-green-500" />
                <Badge variant="outline" className="text-xs">Input</Badge>
              </div>
              <div className="heading-md mb-1">{stats.totalInputTokens.toLocaleString()}</div>
              <p className="body-sm text-muted-foreground">Total Input Tokens</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">Output</Badge>
              </div>
              <div className="heading-md mb-1">{stats.totalOutputTokens.toLocaleString()}</div>
              <p className="body-sm text-muted-foreground">Total Output Tokens</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-orange-500" />
                <Badge variant="outline" className="text-xs">Per Trace</Badge>
              </div>
              <div className="heading-md mb-1">{stats.avgTokensPerTrace}</div>
              <p className="body-sm text-muted-foreground">Avg Tokens/Trace</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <Badge variant="outline" className="text-xs">Median</Badge>
              </div>
              <div className="heading-md mb-1">${stats.medianCostPerTrace.toFixed(4)}</div>
              <p className="body-sm text-muted-foreground">Cost Per Trace</p>
            </CardContent>
          </Card>
        </div>

        {/* API Keys Section */}
        <Card className="glass-effect border-border mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="heading-md flex items-center gap-2">
                  <Key className="w-5 h-5" />
                  API Keys
                </CardTitle>
                <CardDescription className="body-sm">
                  Manage your project API keys
                </CardDescription>
              </div>
              <Button
                className="bg-primary hover:bg-primary/90"
                onClick={async () => {
                  try {
                    const keyData = await apiKeysApi.createApiKey(`${projectName} - Key ${apiKeys.length + 1}`);
                    setNewApiKey(keyData.key);
                    await fetchApiKeys();
                  } catch (err) {
                    alert(err.message);
                  }
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                New API Key
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Show newly created API key */}
            {newApiKey && (
              <div className="mb-6 bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="body-sm text-green-600 dark:text-green-400 mb-1 font-medium">
                      ✅ API Key Created Successfully!
                    </p>
                    <p className="body-sm text-muted-foreground mb-3">
                      Copy this key now - you won't be able to see it again.
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setNewApiKey(null)}
                  >
                    ✕
                  </Button>
                </div>
                <div className="relative">
                  <pre className="bg-muted/50 rounded-lg p-3 overflow-x-auto body-sm">
                    <code>{newApiKey}</code>
                  </pre>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="absolute top-2 right-2"
                    onClick={() => copyToClipboard(newApiKey, 'newKey')}
                  >
                    {copied.newKey ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}

            {loading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-16 bg-muted rounded animate-pulse"></div>
                ))}
              </div>
            ) : apiKeys.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="body-md text-muted-foreground">No API keys yet</p>
                <p className="body-sm text-muted-foreground mt-2">Click "New API Key" above to generate your first key</p>
              </div>
            ) : (
              <div className="space-y-3">
                {apiKeys.map((key) => (
                  <div
                    key={key.id}
                    className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border"
                  >
                    <div>
                      <p className="body-md font-medium mb-1">{key.name}</p>
                      <p className="body-sm text-muted-foreground">
                        Created {formatDate(key.createdAt)}
                      </p>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Traces */}
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
            {tracesLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-muted/30 rounded-lg animate-pulse"></div>
                ))}
              </div>
            ) : traces.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="heading-sm mb-2">No traces yet</h3>
                <p className="body-md text-muted-foreground mb-4 max-w-md mx-auto">
                  Start sending traces from your application to see them here.
                </p>
                {apiKeys.length === 0 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/50 rounded-lg p-4 max-w-md mx-auto">
                    <p className="body-sm text-yellow-600 dark:text-yellow-400">
                      Generate an API key above to get started
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {traces.map((trace) => {
                  const type = getTraceType(trace);
                  const isExpanded = expandedTrace === trace.traceId;
                  const totalTokens = getTotalTokens(trace);
                  const totalLatency = getTotalLatency(trace);

                  return (
                    <div
                      key={trace.traceId}
                      className="border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors"
                    >
                      {/* Trace Summary */}
                      <div
                        className="p-4 cursor-pointer bg-muted/20 hover:bg-muted/30 transition-colors"
                        onClick={() => setExpandedTrace(isExpanded ? null : trace.traceId)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-2">
                              <Badge className={`${getTraceTypeColor(type)} border`}>
                                {type}
                              </Badge>
                              <span className="body-sm text-muted-foreground font-mono truncate">
                                {trace.traceId.substring(0, 8)}...
                              </span>
                              <Badge variant="outline" className="text-green-500 border-green-500/50">
                                Success
                              </Badge>
                            </div>
                            <p className="body-sm text-foreground mb-1">
                              {trace.spans[0]?.name || 'Unknown'}
                            </p>
                            <p className="body-xs text-muted-foreground">
                              {formatDate(trace.createdAt)}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <Clock className="w-4 h-4 text-blue-500" />
                                <span className="body-sm">{totalLatency}ms</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-yellow-500" />
                                <span className="body-sm">{totalTokens} tokens</span>
                              </div>
                            </div>
                            <div className="text-2xl text-muted-foreground">
                              {isExpanded ? '▼' : '▶'}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="border-t border-border bg-background p-4 space-y-4">
                          {trace.spans.map((span, idx) => (
                            <div key={idx} className="bg-muted/30 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-3">
                                <h4 className="body-md font-medium">{span.name}</h4>
                                <div className="flex items-center gap-4 text-sm">
                                  <span className="text-muted-foreground">{span.latency}ms</span>
                                  {span.tokens && (
                                    <span className="text-muted-foreground">
                                      {span.tokens.input + span.tokens.output} tokens
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="space-y-3">
                                <div>
                                  <p className="body-sm font-medium text-muted-foreground mb-1">Input:</p>
                                  <pre className="bg-background rounded p-3 text-xs overflow-x-auto">
                                    {JSON.stringify(span.input, null, 2)}
                                  </pre>
                                </div>
                                
                                <div>
                                  <p className="body-sm font-medium text-muted-foreground mb-1">Output:</p>
                                  <pre className="bg-background rounded p-3 text-xs overflow-x-auto">
                                    {JSON.stringify(span.output, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </div>
                          ))}
                          
                          {trace.metadata && Object.keys(trace.metadata).length > 0 && (
                            <div className="bg-muted/30 rounded-lg p-4">
                              <p className="body-sm font-medium text-muted-foreground mb-2">Metadata:</p>
                              <pre className="bg-background rounded p-3 text-xs overflow-x-auto">
                                {JSON.stringify(trace.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

