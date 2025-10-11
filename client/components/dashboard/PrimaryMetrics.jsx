'use client';

import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Activity, Clock, Zap } from 'lucide-react';

export default function PrimaryMetrics({ stats }) {
  return (
    <div className="grid md:grid-cols-4 gap-6 mb-8">
      <Card className="glass-effect border-border hover:border-primary/30 transition-colors">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <Activity className="w-5 h-5 text-primary" />
            <Badge variant="secondary" className="text-xs">Live</Badge>
          </div>
          <div className="heading-xl mb-1">{stats.runCount.toLocaleString()}</div>
          <p className="body-sm text-muted-foreground">Total Runs</p>
        </CardContent>
      </Card>

      <Card className="glass-effect border-border hover:border-primary/30 transition-colors">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div className="heading-xl mb-1">{stats.traceP50Latency}ms</div>
          <p className="body-sm text-muted-foreground">Median Latency</p>
        </CardContent>
      </Card>

      <Card className="glass-effect border-border hover:border-primary/30 transition-colors">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <Zap className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="heading-xl mb-1">{stats.totalTokens.toLocaleString()}</div>
          <p className="body-sm text-muted-foreground">Total Tokens</p>
        </CardContent>
      </Card>

      <Card className={`glass-effect ${stats.errorRate > 0 ? 'border-red-500/50' : 'border-green-500/30'} hover:border-primary/30 transition-colors`}>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <span className={`text-2xl ${stats.errorRate > 0 ? 'text-red-500' : 'text-green-500'}`}>
              {stats.errorRate > 0 ? '✗' : '✓'}
            </span>
            <Badge variant={stats.errorRate > 0 ? "destructive" : "secondary"} className="text-xs">
              {stats.errorRate}%
            </Badge>
          </div>
          <div className="heading-xl mb-1">${((stats.totalCost || 0) / 100).toFixed(2)}</div>
          <p className="body-sm text-muted-foreground">Total Cost</p>
        </CardContent>
      </Card>
    </div>
  );
}

