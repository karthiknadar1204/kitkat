import mongoose from 'mongoose';

const metricSnapshotSchema = new mongoose.Schema({
  sessionId: { type: Number, required: true, index: true },
  period: { type: String, enum: ['hourly', 'daily'], required: true },
  timestamp: { type: Date, required: true, index: true },
  
  metrics: {
    // Basic metrics
    runCount: { type: Number, default: 0 },
    errorRate: { type: Number, default: 0 },
    errorCount: { type: Number, default: 0 },
    successCount: { type: Number, default: 0 },
    
    // Token metrics - Totals
    totalTokens: { type: Number, default: 0 },
    totalInputTokens: { type: Number, default: 0 },
    totalOutputTokens: { type: Number, default: 0 },
    
    // Token metrics - Per Trace
    avgTokensPerTrace: { type: Number, default: 0 },
    avgInputTokensPerTrace: { type: Number, default: 0 },
    avgOutputTokensPerTrace: { type: Number, default: 0 },
    inputTokensPerTraceP50: { type: Number, default: 0 },
    inputTokensPerTraceP99: { type: Number, default: 0 },
    outputTokensPerTraceP50: { type: Number, default: 0 },
    outputTokensPerTraceP99: { type: Number, default: 0 },
    
    // Cost metrics
    totalCost: { type: Number, default: 0 },
    medianCostPerTrace: { type: Number, default: 0 },
    p99CostPerTrace: { type: Number, default: 0 },
    
    // Trace latency metrics
    avgTraceLatency: { type: Number, default: 0 },
    traceP50Latency: { type: Number, default: 0 },
    traceP99Latency: { type: Number, default: 0 },
    
    // LLM-specific metrics
    llmCount: { type: Number, default: 0 },
    avgLLMLatency: { type: Number, default: 0 },
    llmP50Latency: { type: Number, default: 0 },
    llmP99Latency: { type: Number, default: 0 },
    
    // Breakdowns (stored as arrays)
    toolBreakdown: [{ 
      name: String, 
      count: Number, 
      medianLatency: Number, 
      errorRate: Number 
    }],
    
    runTypeBreakdown: [{ 
      name: String, 
      depth: Number, 
      count: Number, 
      medianLatency: Number, 
      errorRate: Number 
    }],
  },
  
  createdAt: { type: Date, default: Date.now }
});

// Compound index for efficient time-range queries
metricSnapshotSchema.index({ sessionId: 1, period: 1, timestamp: -1 });

export default mongoose.model('MetricSnapshot', metricSnapshotSchema);

