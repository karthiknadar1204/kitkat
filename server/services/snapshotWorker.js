import Trace from '../models/trace.model.js';
import MetricSnapshot from '../models/metricSnapshot.model.js';
import { db } from '../config/db.js';
import { sessions } from '../config/schema.js';
import { calculateCost, extractModelName } from '../utils/pricing.js';

/**
 * Aggregate metrics for a specific time period
 */
async function aggregateMetrics(sessionId, startTime, endTime) {
  const traces = await Trace.find({
    sessionId: sessionId,
    createdAt: {
      $gte: startTime,
      $lt: endTime,
    },
  });

  if (traces.length === 0) {
    return null; // No data for this period
  }

  // Calculate all metrics (same logic as dashboard.controller.js)
  let runCount = traces.length;
  let errorCount = 0;
  let totalInputTokens = 0;
  let totalOutputTokens = 0;
  let totalTokens = 0;
  let traceLatencies = [];
  let llmLatencies = [];
  let llmCount = 0;
  let traceCosts = [];
  let traceInputTokensList = [];
  let traceOutputTokensList = [];
  let toolMetrics = {};
  let runTypeMetrics = {};

  traces.forEach(trace => {
    if (trace.metadata?.error === true) {
      errorCount++;
    }

    let traceLatency = 0;
    let traceInputTokens = 0;
    let traceOutputTokens = 0;
    let traceCostAccumulator = 0;

    trace.spans.forEach((span, spanIndex) => {
      const inputTokens = span.tokens?.input || 0;
      const outputTokens = span.tokens?.output || 0;

      totalInputTokens += inputTokens;
      totalOutputTokens += outputTokens;
      totalTokens += inputTokens + outputTokens;

      traceInputTokens += inputTokens;
      traceOutputTokens += outputTokens;
      traceLatency += (span.latency || 0);

      const model = extractModelName(span.input);
      const spanCost = calculateCost(model, inputTokens, outputTokens);
      traceCostAccumulator += spanCost;

      const spanName = (span.name || '').toLowerCase();
      if (spanName.includes('llm') || spanName.includes('chat') || spanName.includes('openai')) {
        llmCount++;
        llmLatencies.push(span.latency || 0);
      }

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

  // Calculate percentiles
  const sortedTraceLatencies = traceLatencies.sort((a, b) => a - b);
  const sortedLLMLatencies = llmLatencies.sort((a, b) => a - b);
  const sortedTraceCosts = traceCosts.sort((a, b) => a - b);
  const sortedInputTokens = traceInputTokensList.sort((a, b) => a - b);
  const sortedOutputTokens = traceOutputTokensList.sort((a, b) => a - b);

  const getP50 = (arr) => arr[Math.floor(arr.length * 0.5)] || 0;
  const getP99 = (arr) => arr[Math.floor(arr.length * 0.99)] || 0;
  const getAvg = (arr) => arr.length > 0 ? Math.round(arr.reduce((sum, v) => sum + v, 0) / arr.length) : 0;

  // Process tool breakdown
  const toolBreakdown = Object.keys(toolMetrics).map(toolName => {
    const tool = toolMetrics[toolName];
    const toolLatenciesSorted = tool.latencies.sort((a, b) => a - b);
    return {
      name: toolName,
      count: tool.count,
      medianLatency: getP50(toolLatenciesSorted),
      errorRate: tool.count > 0 ? parseFloat(((tool.errors / tool.count) * 100).toFixed(1)) : 0,
    };
  });

  // Process run type breakdown
  const runTypeBreakdown = Object.keys(runTypeMetrics).map(runKey => {
    const run = runTypeMetrics[runKey];
    const runLatenciesSorted = run.latencies.sort((a, b) => a - b);
    return {
      name: run.name,
      depth: run.depth,
      count: run.count,
      medianLatency: getP50(runLatenciesSorted),
      errorRate: run.count > 0 ? parseFloat(((run.errors / run.count) * 100).toFixed(1)) : 0,
    };
  });

  const errorRate = runCount > 0 ? parseFloat(((errorCount / runCount) * 100).toFixed(1)) : 0;

  return {
    runCount,
    errorRate,
    errorCount,
    successCount: runCount - errorCount,
    
    totalTokens,
    totalInputTokens,
    totalOutputTokens,
    
    avgTokensPerTrace: runCount > 0 ? Math.round(totalTokens / runCount) : 0,
    avgInputTokensPerTrace: runCount > 0 ? Math.round(totalInputTokens / runCount) : 0,
    avgOutputTokensPerTrace: runCount > 0 ? Math.round(totalOutputTokens / runCount) : 0,
    inputTokensPerTraceP50: getP50(sortedInputTokens),
    inputTokensPerTraceP99: getP99(sortedInputTokens),
    outputTokensPerTraceP50: getP50(sortedOutputTokens),
    outputTokensPerTraceP99: getP99(sortedOutputTokens),
    
    totalCost: Math.round(traceCosts.reduce((sum, c) => sum + c, 0) * 100), // in cents
    medianCostPerTrace: Math.round(getP50(sortedTraceCosts) * 10000) / 10000,
    p99CostPerTrace: Math.round(getP99(sortedTraceCosts) * 10000) / 10000,
    
    avgTraceLatency: getAvg(traceLatencies),
    traceP50Latency: getP50(sortedTraceLatencies),
    traceP99Latency: getP99(sortedTraceLatencies),
    
    llmCount,
    avgLLMLatency: getAvg(llmLatencies),
    llmP50Latency: getP50(sortedLLMLatencies),
    llmP99Latency: getP99(sortedLLMLatencies),
    
    toolBreakdown,
    runTypeBreakdown,
  };
}

/**
 * Create hourly snapshots for all active sessions
 */
export async function createHourlySnapshots() {
  try {
    console.log('📸 Starting hourly snapshot creation...');
    
    const now = new Date();
    // For testing: include traces from the current hour too
    const lastHourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() - 1, 0, 0, 0);
    const lastHourEnd = new Date(); // Use current time instead of top of hour

    // Get all active sessions
    const allSessions = await db.select().from(sessions);
    
    console.log(`Processing ${allSessions.length} sessions...`);

    for (const session of allSessions) {
      try {
        const metrics = await aggregateMetrics(session.id, lastHourStart, lastHourEnd);
        
        if (!metrics) {
          console.log(`  Session ${session.id} (${session.appName}): No traces in last hour`);
          continue;
        }

        // Save snapshot
        await MetricSnapshot.create({
          sessionId: session.id,
          period: 'hourly',
          timestamp: lastHourStart,
          metrics: metrics,
        });

        console.log(`  ✅ Session ${session.id} (${session.appName}): ${metrics.runCount} traces aggregated`);
      } catch (err) {
        console.error(`  ❌ Error processing session ${session.id}:`, err.message);
      }
    }

    console.log('✅ Hourly snapshot creation complete!');
  } catch (error) {
    console.error('❌ Hourly snapshot creation failed:', error);
  }
}

/**
 * Create daily snapshots by aggregating hourly snapshots
 */
export async function createDailySnapshots() {
  try {
    console.log('📸 Starting daily snapshot creation...');
    
    const now = new Date();
    const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0, 0);
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    const allSessions = await db.select().from(sessions);

    for (const session of allSessions) {
      try {
        // Get all hourly snapshots for yesterday
        const hourlySnapshots = await MetricSnapshot.find({
          sessionId: session.id,
          period: 'hourly',
          timestamp: {
            $gte: yesterday,
            $lt: today,
          },
        });

        if (hourlySnapshots.length === 0) {
          continue;
        }

        // Aggregate hourly snapshots into daily
        const dailyMetrics = hourlySnapshots.reduce((acc, snapshot) => {
          const m = snapshot.metrics;
          return {
            runCount: acc.runCount + m.runCount,
            errorCount: acc.errorCount + m.errorCount,
            successCount: acc.successCount + m.successCount,
            totalTokens: acc.totalTokens + m.totalTokens,
            totalInputTokens: acc.totalInputTokens + m.totalInputTokens,
            totalOutputTokens: acc.totalOutputTokens + m.totalOutputTokens,
            totalCost: acc.totalCost + m.totalCost,
            llmCount: acc.llmCount + m.llmCount,
            
            // For averages/percentiles, we'd need to recalculate from raw traces or use weighted averages
            // For now, just use the last hourly snapshot's values as approximation
            ...m
          };
        }, {
          runCount: 0,
          errorCount: 0,
          successCount: 0,
          totalTokens: 0,
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCost: 0,
          llmCount: 0,
        });

        // Calculate daily error rate
        dailyMetrics.errorRate = dailyMetrics.runCount > 0 
          ? parseFloat(((dailyMetrics.errorCount / dailyMetrics.runCount) * 100).toFixed(1))
          : 0;

        await MetricSnapshot.create({
          sessionId: session.id,
          period: 'daily',
          timestamp: yesterday,
          metrics: dailyMetrics,
        });

        console.log(`  ✅ Session ${session.id}: Daily snapshot created for ${yesterday.toDateString()}`);
      } catch (err) {
        console.error(`  ❌ Error creating daily snapshot for session ${session.id}:`, err.message);
      }
    }

    console.log('✅ Daily snapshot creation complete!');
  } catch (error) {
    console.error('❌ Daily snapshot creation failed:', error);
  }
}


/**
 * Start the snapshot worker with cron-like scheduling
 */
export function startSnapshotWorker() {
  console.log('🚀 Starting snapshot worker...');

  // Run hourly snapshots every hour
  const runHourly = () => {
    const now = new Date();
    const msUntilNextHour = (60 - now.getMinutes()) * 60 * 1000 - now.getSeconds() * 1000;
    
    setTimeout(() => {
      createHourlySnapshots();
      // Then schedule to run every hour
      setInterval(createHourlySnapshots, 60 * 60 * 1000);
    }, msUntilNextHour);
    
    console.log(`⏰ Hourly snapshots scheduled (next run in ${Math.round(msUntilNextHour / 1000 / 60)} minutes)`);
  };

  // Run daily snapshots at midnight
  const runDaily = () => {
    const now = new Date();
    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0);
    const msUntilMidnight = tomorrow - now;
    
    setTimeout(() => {
      createDailySnapshots();
      // Then schedule to run every day
      setInterval(createDailySnapshots, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
    
    console.log(`🌙 Daily snapshots scheduled (next run in ${Math.round(msUntilMidnight / 1000 / 60 / 60)} hours)`);
  };

  runHourly();
  runDaily();
}

