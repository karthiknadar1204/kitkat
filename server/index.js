import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.route.js'
import sessionsRoutes from './routes/sessions.route.js'
import tracesRoutes from './routes/traces.route.js'
import apiKeysRoutes from './routes/apiKeys.route.js'
import { db } from './config/db.js'

// dotenv.config()
(async () => {
  try {
    await mongoose.connect(process.env.MONGODB_DATABASE_URL);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
})();

const app=express()

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))
app.use(cors({
    origin:process.env.FRONTEND_URL,
    credentials:true
}))
app.use(bodyParser.json())

// Health check endpoint
app.get("/health", async (req, res) => {
  try {
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    let postgresStatus = 'disconnected';
    try {
      await db.execute('SELECT 1');
      postgresStatus = 'connected';
    } catch (err) {
      postgresStatus = 'error';
    }
    
    const isHealthy = mongoStatus === 'connected' && postgresStatus === 'connected';
    
    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        mongodb: mongoStatus,
        postgresql: postgresStatus,
        server: 'running'
      },
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development'
    });
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

app.use("/api/auth",authRoutes)
app.use("/api/sessions",sessionsRoutes)
app.use("/api/traces",tracesRoutes)
app.use("/api/api-keys",apiKeysRoutes)
app.listen(3002,()=>{
    console.log("server is running on port 3002")  
})