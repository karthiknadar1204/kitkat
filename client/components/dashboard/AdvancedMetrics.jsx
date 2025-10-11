'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Zap, DollarSign } from 'lucide-react';

export default function AdvancedMetrics({ stats }) {
  return (
    <div className="mb-8">
      <h2 className="heading-md mb-4">Advanced Metrics</h2>
      
      {/* Latency Metrics */}
      <div className="mb-4">
        <h3 className="body-md font-medium mb-3 text-muted-foreground">Latency Percentiles</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">Trace P50</Badge>
              </div>
              <div className="heading-md mb-1">{stats.traceP50Latency}ms</div>
              <p className="body-sm text-muted-foreground">Trace P50 Latency</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">Trace P99</Badge>
              </div>
              <div className="heading-md mb-1">{stats.traceP99Latency}ms</div>
              <p className="body-sm text-muted-foreground">Trace P99 Latency</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <Badge variant="outline" className="text-xs">LLM P50</Badge>
              </div>
              <div className="heading-md mb-1">{stats.llmP50Latency}ms</div>
              <p className="body-sm text-muted-foreground">LLM P50 Latency</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-purple-500" />
                <Badge variant="outline" className="text-xs">LLM P99</Badge>
              </div>
              <div className="heading-md mb-1">{stats.llmP99Latency}ms</div>
              <p className="body-sm text-muted-foreground">LLM P99 Latency</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-green-500" />
                <Badge variant="outline" className="text-xs">LLM Count</Badge>
              </div>
              <div className="heading-md mb-1">{stats.llmCount}</div>
              <p className="body-sm text-muted-foreground">LLM Calls</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <Badge variant="outline" className="text-xs">Avg</Badge>
              </div>
              <div className="heading-md mb-1">{stats.traceAvgLatency}ms</div>
              <p className="body-sm text-muted-foreground">Avg Trace Latency</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-orange-500" />
                <Badge variant="outline" className="text-xs">Avg</Badge>
              </div>
              <div className="heading-md mb-1">{stats.llmAvgLatency}ms</div>
              <p className="body-sm text-muted-foreground">Avg LLM Latency</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Token Metrics */}
      <div className="mb-4">
        <h3 className="body-md font-medium mb-3 text-muted-foreground">Token Metrics</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <Badge variant="outline" className="text-xs">Total</Badge>
              </div>
              <div className="heading-md mb-1">{stats.totalInputTokens.toLocaleString()}</div>
              <p className="body-sm text-muted-foreground">Total Input Tokens</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-green-500" />
                <Badge variant="outline" className="text-xs">Total</Badge>
              </div>
              <div className="heading-md mb-1">{stats.totalOutputTokens.toLocaleString()}</div>
              <p className="body-sm text-muted-foreground">Total Output Tokens</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">Input P50</Badge>
              </div>
              <div className="heading-md mb-1">{stats.inputTokensPerTraceP50}</div>
              <p className="body-sm text-muted-foreground">Input Tokens/Trace</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-green-500" />
                <Badge variant="outline" className="text-xs">Input P99</Badge>
              </div>
              <div className="heading-md mb-1">{stats.inputTokensPerTraceP99}</div>
              <p className="body-sm text-muted-foreground">Input Tokens/Trace</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">Output P50</Badge>
              </div>
              <div className="heading-md mb-1">{stats.outputTokensPerTraceP50}</div>
              <p className="body-sm text-muted-foreground">Output Tokens/Trace</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <Zap className="w-5 h-5 text-blue-500" />
                <Badge variant="outline" className="text-xs">Output P99</Badge>
              </div>
              <div className="heading-md mb-1">{stats.outputTokensPerTraceP99}</div>
              <p className="body-sm text-muted-foreground">Output Tokens/Trace</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cost Metrics */}
      <div className="mb-4">
        <h3 className="body-md font-medium mb-3 text-muted-foreground">Cost Distribution</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <Badge variant="outline" className="text-xs">P50</Badge>
              </div>
              <div className="heading-md mb-1">${stats.medianCostPerTrace.toFixed(4)}</div>
              <p className="body-sm text-muted-foreground">Median Cost/Trace</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <Badge variant="outline" className="text-xs">P99</Badge>
              </div>
              <div className="heading-md mb-1">${stats.p99CostPerTrace.toFixed(4)}</div>
              <p className="body-sm text-muted-foreground">P99 Cost/Trace</p>
            </CardContent>
          </Card>

          <Card className="glass-effect border-border">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <Badge variant="outline" className="text-xs">Total</Badge>
              </div>
              <div className="heading-md mb-1">${((stats.totalCost || 0) / 100).toFixed(2)}</div>
              <p className="body-sm text-muted-foreground">Total Cost</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tool Breakdown */}
      {stats.toolBreakdown && stats.toolBreakdown.length > 0 && (
        <Card className="glass-effect border-border mb-4">
          <CardHeader>
            <CardTitle className="heading-md">Tool Breakdown</CardTitle>
            <CardDescription className="body-sm">
              Performance metrics by tool
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.toolBreakdown.map((tool, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="body-md font-medium">{tool.name}</p>
                    <p className="body-sm text-muted-foreground">{tool.count} calls</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="body-sm">{tool.medianLatency}ms</p>
                      <p className="body-xs text-muted-foreground">Median Latency</p>
                    </div>
                    <Badge variant={tool.errorRate > 0 ? "destructive" : "secondary"}>
                      {tool.errorRate}% errors
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Run Type Breakdown */}
      {stats.runTypeBreakdown && stats.runTypeBreakdown.length > 0 && (
        <Card className="glass-effect border-border mb-4">
          <CardHeader>
            <CardTitle className="heading-md">Run Types (by Depth)</CardTitle>
            <CardDescription className="body-sm">
              Performance metrics by run name and depth level
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.runTypeBreakdown.slice(0, 10).map((run, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                  <div>
                    <p className="body-md font-medium">{run.name}</p>
                    <p className="body-sm text-muted-foreground">
                      Depth {run.depth} • {run.count} runs
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="body-sm">{run.medianLatency}ms</p>
                      <p className="body-xs text-muted-foreground">Median Latency</p>
                    </div>
                    <Badge variant={run.errorRate > 0 ? "destructive" : "secondary"}>
                      {run.errorRate}% errors
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

