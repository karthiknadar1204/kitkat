import mongoose from 'mongoose';

const spanSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g., 'llm-call'
  input: { type: mongoose.Schema.Types.Mixed, required: true }, // Prompt/params
  output: { type: mongoose.Schema.Types.Mixed, required: true }, // Response
  latency: { type: Number, required: true }, // ms
  tokens: { 
    input: { type: Number, default: 0 },
    output: { type: Number, default: 0 }
  },
  timestamp: { type: Date, default: Date.now }
});

const traceSchema = new mongoose.Schema({
  traceId: { type: String, required: true, unique: true },
  userId: { type: Number, ref: 'users.id', required: true }, // Link to Postgres
  sessionId: { type: Number }, // Optional, refs sessions.id
  appName: { type: String, required: true },
  spans: [spanSchema], // Array of spans (chains/tools)
  feedback: { score: Number, comment: String }, // Later for evals
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Trace', traceSchema);