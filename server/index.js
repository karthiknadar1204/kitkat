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
import dashboardRoutes from './routes/dashboard.route.js'
import { db } from './config/db.js'

// dotenv.config()

// MongoDB connection with retry logic and better options
const connectMongoDB = async (retries = 5) => {
  const options = {
    serverSelectionTimeoutMS: 10000, // Timeout after 10s instead of 30s
    socketTimeoutMS: 45000,
    connectTimeoutMS: 10000,
    maxPoolSize: 10,
    minPoolSize: 2,
    retryWrites: true,
    retryReads: true,
  };

  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_DATABASE_URL, options);
      console.log('✅ MongoDB connected successfully');
      
      // Handle connection events
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected. Attempting to reconnect...');
      });
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err.message);
      });
      
      mongoose.connection.on('reconnected', () => {
        console.log('✅ MongoDB reconnected successfully');
      });
      
      return;
    } catch (error) {
      console.error(`❌ MongoDB connection attempt ${i + 1}/${retries} failed:`, error.message);
      if (i < retries - 1) {
        const delay = Math.min(1000 * Math.pow(2, i), 10000); // Exponential backoff, max 10s
        console.log(`⏳ Retrying in ${delay / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      } else {
        console.error('❌ Could not connect to MongoDB after all retries. Starting server anyway...');
        // Don't exit - let the server run without MongoDB for now
      }
    }
  }
};

connectMongoDB();

const app=express()

app.use(express.json())
app.use(cookieParser())
app.use(express.urlencoded({extended:true}))
app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://kitkat-ten.vercel.app',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    exposedHeaders: ['Set-Cookie']
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
app.use("/api/dashboard",dashboardRoutes)

app.listen(3002,()=>{
    console.log("server is running on port 3002")
})