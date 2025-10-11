"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function SuccessErrorChart({ successCount, errorCount, title, description }) {
  const data = [
    { name: 'Success', value: successCount, color: '#10b981' },
    { name: 'Errors', value: errorCount, color: '#ef4444' },
  ];

  const COLORS = ['#10b981', '#ef4444'];

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const total = successCount + errorCount;
      const percentage = ((payload[0].value / total) * 100).toFixed(1);
      return (
        <div className="bg-card border border-border rounded-lg shadow-lg p-3">
          <p className="body-sm font-medium mb-1">{payload[0].name}</p>
          <p className="body-xs text-muted-foreground">
            {payload[0].value.toLocaleString()} runs ({percentage}%)
          </p>
        </div>
      );
    }
    return null;
  };

  const renderLabel = (entry) => {
    const total = successCount + errorCount;
    if (total === 0) return '';
    const percentage = ((entry.value / total) * 100).toFixed(0);
    return entry.value > 0 ? `${percentage}%` : '';
  };

  return (
    <Card className="glass-effect border-border">
      <CardHeader>
        <CardTitle className="heading-sm">{title}</CardTitle>
        {description && <CardDescription className="body-xs text-muted-foreground">{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        {(successCount > 0 || errorCount > 0) ? (
          <div className="flex items-center gap-8">
            <ResponsiveContainer width="60%" height={200}>
              <PieChart>
                <Pie
                  data={data.filter(d => d.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={renderLabel}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="flex-1 space-y-3">
              {data.filter(d => d.value > 0).map((entry, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: entry.color }}
                    ></div>
                    <span className="body-sm">{entry.name}</span>
                  </div>
                  <span className="body-sm font-medium">{entry.value.toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 mt-3">
                <div className="flex items-center justify-between">
                  <span className="body-sm font-medium">Total Runs</span>
                  <span className="body-sm font-medium">{(successCount + errorCount).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-[200px] flex flex-col items-center justify-center">
            <p className="body-sm text-muted-foreground">No run data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

