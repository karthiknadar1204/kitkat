import Trace from '../models/trace.model.js';
import MetricSnapshot from '../models/metricSnapshot.model.js';
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
    let traceInputTokensList = [];
    let traceOutputTokensList = [];
    let toolMetrics = {}; // { toolName: { count, latencies, errors } }
    let runTypeMetrics = {}; // { runName: { count, latencies, errors, depth } }
    
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
      
      trace.spans.forEach((span, spanIndex) => {
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
        
        // Track tool metrics (for tool breakdown)
        if (spanName.includes('tool')) {
          const toolName = span.name;
          if (!toolMetrics[toolName]) {
            toolMetrics[toolName] = { count: 0, latencies: [], errors: 0 };
          }
          toolMetrics[toolName].count++;
          toolMetrics[toolName].latencies.push(span.latency || 0);
          if (trace.metadata?.error) {
            toolMetrics[toolName].errors++;
          }
        }
        
        // Track run types by depth (depth = span index in the trace)
        const runName = span.name;
        const depth = spanIndex;
        const runKey = `${runName}_depth${depth}`;
        
        if (!runTypeMetrics[runKey]) {
          runTypeMetrics[runKey] = { 
            name: runName, 
            depth: depth, 
            count: 0, 
            latencies: [], 
            errors: 0 
          };
        }
        runTypeMetrics[runKey].count++;
        runTypeMetrics[runKey].latencies.push(span.latency || 0);
        if (trace.metadata?.error) {
          runTypeMetrics[runKey].errors++;
        }
      });
      
      traceLatencies.push(traceLatency);
      traceCosts.push(traceCostAccumulator);
      traceInputTokensList.push(traceInputTokens);
      traceOutputTokensList.push(traceOutputTokens);
    });
    
    // Calculate total cost (keep in dollars, don't round to cents)
    totalCost = traceCosts.reduce((sum, c) => sum + c, 0);
    
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
    
    // Calculate cost per trace percentiles
    const sortedTraceCosts = traceCosts.sort((a, b) => a - b);
    const costP50Index = Math.floor(sortedTraceCosts.length * 0.5);
    const costP99Index = Math.floor(sortedTraceCosts.length * 0.99);
    const medianCostPerTrace = sortedTraceCosts[costP50Index] || 0;
    const p99CostPerTrace = sortedTraceCosts[costP99Index] || 0;
    
    // Calculate input tokens per trace percentiles
    const sortedInputTokens = traceInputTokensList.sort((a, b) => a - b);
    const inputP50Index = Math.floor(sortedInputTokens.length * 0.5);
    const inputP99Index = Math.floor(sortedInputTokens.length * 0.99);
    const inputTokensP50 = sortedInputTokens[inputP50Index] || 0;
    const inputTokensP99 = sortedInputTokens[inputP99Index] || 0;
    
    // Calculate output tokens per trace percentiles
    const sortedOutputTokens = traceOutputTokensList.sort((a, b) => a - b);
    const outputP50Index = Math.floor(sortedOutputTokens.length * 0.5);
    const outputP99Index = Math.floor(sortedOutputTokens.length * 0.99);
    const outputTokensP50 = sortedOutputTokens[outputP50Index] || 0;
    const outputTokensP99 = sortedOutputTokens[outputP99Index] || 0;
    
    // Calculate per-trace averages
    const avgInputTokensPerTrace = runCount > 0 ? Math.round(totalInputTokens / runCount) : 0;
    const avgOutputTokensPerTrace = runCount > 0 ? Math.round(totalOutputTokens / runCount) : 0;
    const avgTotalTokensPerTrace = runCount > 0 ? Math.round(totalTokens / runCount) : 0;
    
    // Process tool metrics
    const toolBreakdown = Object.keys(toolMetrics).map(toolName => {
      const tool = toolMetrics[toolName];
      const toolLatenciesSorted = tool.latencies.sort((a, b) => a - b);
      const toolP50 = toolLatenciesSorted[Math.floor(toolLatenciesSorted.length * 0.5)] || 0;
      return {
        name: toolName,
        count: tool.count,
        medianLatency: toolP50,
        errorRate: tool.count > 0 ? ((tool.errors / tool.count) * 100).toFixed(1) : 0,
      };
    });
    
    // Process run type metrics (depth-based)
    const runTypeBreakdown = Object.keys(runTypeMetrics).map(runKey => {
      const run = runTypeMetrics[runKey];
      const runLatenciesSorted = run.latencies.sort((a, b) => a - b);
      const runP50 = runLatenciesSorted[Math.floor(runLatenciesSorted.length * 0.5)] || 0;
      return {
        name: run.name,
        depth: run.depth,
        count: run.count,
        medianLatency: runP50,
        errorRate: run.count > 0 ? ((run.errors / run.count) * 100).toFixed(1) : 0,
      };
    });
    
    // Calculate error rate
    const errorRate = runCount > 0 ? ((errorCount / runCount) * 100).toFixed(1) : '0.0';
    
    const result = {
      // Basic metrics
      runCount,
      errorRate: parseFloat(errorRate),
      errorCount,
      successCount: runCount - errorCount,
      
      // Token metrics - Totals
      totalTokens,
      totalInputTokens,
      totalOutputTokens,
      
      // Token metrics - Per Trace (Averages)
      avgTokensPerTrace: avgTotalTokensPerTrace,
      avgInputTokensPerTrace,
      avgOutputTokensPerTrace,
      
      // Token metrics - Per Trace (Percentiles)
      inputTokensPerTraceP50: inputTokensP50,
      inputTokensPerTraceP99: inputTokensP99,
      outputTokensPerTraceP50: outputTokensP50,
      outputTokensPerTraceP99: outputTokensP99,
      
      // Cost metrics (in dollars)
      totalCost: Math.round(totalCost * 1000000) / 1000000, // 6 decimal places for micro-costs
      medianCostPerTrace: Math.round(medianCostPerTrace * 1000000) / 1000000, // 6 decimal places
      p99CostPerTrace: Math.round(p99CostPerTrace * 1000000) / 1000000, // 6 decimal places
      
      // Trace latency metrics
      avgTraceLatency,
      traceP50Latency,
      traceP99Latency,
      
      // LLM-specific metrics
      llmCount,
      avgLLMLatency,
      llmP50Latency,
      llmP99Latency,
      
      // Tool breakdown
      toolBreakdown,
      
      // Run type breakdown (by depth)
      runTypeBreakdown,
      
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

export const getTimeSeriesData = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { sessionId } = req.params;
    const { period = 'hourly', days = 7 } = req.query;
    
    console.log(`Fetching time-series data for session ${sessionId}, period: ${period}, days: ${days}`);
    
    // Verify session belongs to user
    const [session] = await db.select().from(sessions).where(eq(sessions.id, parseInt(sessionId)));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - parseInt(days) * 24 * 60 * 60 * 1000);
    
    // Fetch snapshots
    const snapshots = await MetricSnapshot.find({
      sessionId: parseInt(sessionId),
      period: period,
      timestamp: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ timestamp: 1 });
    
    console.log(`Found ${snapshots.length} snapshots for time-series`);
    
    // Format for frontend charting
    const timeSeriesData = snapshots.map(snapshot => ({
      timestamp: snapshot.timestamp,
      ...snapshot.metrics,
    }));
    
    res.json(timeSeriesData);
  } catch (error) {
    console.error('getTimeSeriesData error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Manual trigger for testing - creates snapshot for last hour
export const triggerSnapshot = async (req, res) => {
  try {
    const { id: userId } = req.user;
    const { sessionId } = req.params;
    
    // Verify session belongs to user
    const [session] = await db.select().from(sessions).where(eq(sessions.id, parseInt(sessionId)));
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    if (session.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Import aggregation function
    const { createHourlySnapshots } = await import('../services/snapshotWorker.js');
    
    // Trigger snapshot creation
    await createHourlySnapshots();
    
    res.json({ message: 'Snapshot creation triggered', sessionId: parseInt(sessionId) });
  } catch (error) {
    console.error('triggerSnapshot error:', error);
    res.status(500).json({ error: error.message });
  }
};

