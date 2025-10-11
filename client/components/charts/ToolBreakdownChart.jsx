"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

export default function ToolBreakdownChart({ toolBreakdown, title, description }) {
  const data = toolBreakdown.map((tool, index) => ({
    name: tool.name,
    value: tool.count,
    color: COLORS[index % COLORS.length],
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = toolBreakdown.reduce((sum, t) => sum + t.count, 0);
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="body-sm font-medium mb-1">{payload[0].name}</p>
          <p className="body-xs text-muted-foreground">
            {payload[0].value} calls ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry) => {
    const total = toolBreakdown.reduce((sum, t) => sum + t.count, 0);
    const percentage = ((entry.value / total) * 100).toFixed(0);
    return percentage > 5 ? `${percentage}%` : ''; // Only show label if > 5%
  };

  return (
    <Card className="glass-effect border-border">
      <CardHeader>
        <CardTitle className="heading-sm">{title}</CardTitle>
        {description && <CardDescription className="body-xs text-muted-foreground">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {toolBreakdown && toolBreakdown.length > 0 ? (
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex-1 space-y-2 max-h-[200px] overflow-y-auto">
              {data.map((entry, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="body-sm truncate">{entry.name}</span>
                  </div>
                  <span className="body-sm font-medium">{entry.value}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center">
            <p className="body-sm text-muted-foreground">No tool data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

