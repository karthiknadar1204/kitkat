import Trace from '../models/trace.model.js';
import { eq } from 'drizzle-orm';
import { sessions, stats } from '../config/schema.js';  
import { db } from '../config/db.js';
import { calculateCost, extractModelName } from '../utils/pricing.js';

export const getDashboardTraces = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { sessionId } = req.params;
    
    console.log(`Fetching traces for user ${userId}, session ${sessionId}`);
    
    // Verify session belongs to user
    const [session] = await db.select().from(sessions).where(eq(sessions.id, parseInt(sessionId)));
    if (!session) {
      console.log('Session not found:', sessionId);
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.userId !== userId) {
      console.log('Access denied - user mismatch:', { sessionUserId: session.userId, requestUserId: userId });
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const traces = await Trace.find({ sessionId: parseInt(sessionId) })
      .sort({ createdAt: -1 })
      .limit(50);
    
    console.log(`Found ${traces.length} traces`);
    res.json(traces);
  } catch (error) {
    console.error('getDashboardTraces error:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDashboardStats = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { sessionId } = req.params;
    
    console.log(`Fetching stats for user ${userId}, session ${sessionId}`);
    
    // Verify session belongs to user
    const [session] = await db.select().from(sessions).where(eq(sessions.id, parseInt(sessionId)));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get all traces for this session to calculate detailed metrics
    const traces = await Trace.find({ sessionId: parseInt(sessionId) });
    
    // Calculate comprehensive metrics
    let runCount = traces.length;
    let errorCount = 0;
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalTokens = 0;
    let totalCost = 0;
    let traceLatencies = [];
    let llmLatencies = [];
    let llmCount = 0;
    let traceCosts = [];
    
    traces.forEach(trace => {
      // Count errors (check metadata for error flag)
      if (trace.metadata?.error === true) {
        errorCount++;
      }
      
      let traceLatency = 0;
      let traceInputTokens = 0;
      let traceOutputTokens = 0;
      
      // Process each span in the trace
      let traceCostAccumulator = 0;
      
      trace.spans.forEach(span => {
        const inputTokens = span.tokens?.input || 0;
        const outputTokens = span.tokens?.output || 0;
        const spanTokens = inputTokens + outputTokens;
        
        totalInputTokens += inputTokens;
        totalOutputTokens += outputTokens;
        totalTokens += spanTokens;
        
        traceInputTokens += inputTokens;
        traceOutputTokens += outputTokens;
        traceLatency += (span.latency || 0);
        
        // Calculate accurate cost based on model
        const model = extractModelName(span.input);
        const spanCost = calculateCost(model, inputTokens, outputTokens);
        traceCostAccumulator += spanCost;
        
        // Track LLM-specific calls (chat, llm, openai, etc.)
        const spanName = (span.name || '').toLowerCase();
        if (spanName.includes('llm') || spanName.includes('chat') || spanName.includes('openai')) {
          llmCount++;
          llmLatencies.push(span.latency || 0);
        }
      });
      
      traceLatencies.push(traceLatency);
      traceCosts.push(traceCostAccumulator);
    });
    
    // Calculate total cost
    totalCost = Math.round(traceCosts.reduce((sum, c) => sum + c, 0) * 100); // in cents
    
    // Calculate trace latency percentiles
    const sortedTraceLatencies = traceLatencies.sort((a, b) => a - b);
    const traceP50Index = Math.floor(sortedTraceLatencies.length * 0.5);
    const traceP99Index = Math.floor(sortedTraceLatencies.length * 0.99);
    const avgTraceLatency = traceLatencies.length > 0 
      ? Math.round(traceLatencies.reduce((sum, l) => sum + l, 0) / traceLatencies.length)
      : 0;
    const traceP50Latency = sortedTraceLatencies[traceP50Index] || 0;
    const traceP99Latency = sortedTraceLatencies[traceP99Index] || 0;
    
    // Calculate LLM latency percentiles
    const sortedLLMLatencies = llmLatencies.sort((a, b) => a - b);
    const llmP50Index = Math.floor(sortedLLMLatencies.length * 0.5);
    const llmP99Index = Math.floor(sortedLLMLatencies.length * 0.99);
    const avgLLMLatency = llmLatencies.length > 0 
      ? Math.round(llmLatencies.reduce((sum, l) => sum + l, 0) / llmLatencies.length)
      : 0;
    const llmP50Latency = sortedLLMLatencies[llmP50Index] || 0;
    const llmP99Latency = sortedLLMLatencies[llmP99Index] || 0;
    
    // Calculate cost per trace (median)
    const sortedTraceCosts = traceCosts.sort((a, b) => a - b);
    const costP50Index = Math.floor(sortedTraceCosts.length * 0.5);
    const medianCostPerTrace = sortedTraceCosts[costP50Index] || 0;
    
    // Calculate per-trace averages
    const avgInputTokensPerTrace = runCount > 0 ? Math.round(totalInputTokens / runCount) : 0;
    const avgOutputTokensPerTrace = runCount > 0 ? Math.round(totalOutputTokens / runCount) : 0;
    const avgTotalTokensPerTrace = runCount > 0 ? Math.round(totalTokens / runCount) : 0;
    
    // Calculate error rate
    const errorRate = runCount > 0 ? ((errorCount / runCount) * 100).toFixed(1) : '0.0';
    
    const result = {
      // Basic metrics
      runCount,
      errorRate: parseFloat(errorRate),
      errorCount,
      successCount: runCount - errorCount,
      
      // Token metrics
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      avgTokensPerTrace: avgTotalTokensPerTrace,
      avgInputTokensPerTrace,
      avgOutputTokensPerTrace,
      
      // Cost metrics
      totalCost,
      medianCostPerTrace: Math.round(medianCostPerTrace * 10000) / 10000, // 4 decimal places
      
      // Trace latency metrics
      avgTraceLatency,
      traceP50Latency,
      traceP99Latency,
      
      // LLM-specific metrics
      llmCount,
      avgLLMLatency,
      llmP50Latency,
      llmP99Latency,
      
      // Legacy fields for backward compatibility
      avgLatency: avgTraceLatency,
      p50Latency: traceP50Latency,
      p99Latency: traceP99Latency,
    };
    
    console.log('Detailed stats:', result);
    res.json(result);
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.status(500).json({ error: error.message });
  }
};

