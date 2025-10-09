import express from 'express'
import {  logout, signup, signin } from '../controllers/auth.controller.js'
import mongoose from 'mongoose'
import { db } from '../config/db.js'

const authRoutes=express.Router()

authRoutes.post("/register",signup)
authRoutes.post("/login",signin)
authRoutes.post("/logout",logout)

// Health check endpoint
authRoutes.get("/health", async (req, res) => {
  try {
    // Check MongoDB connection
    const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    
    // Check PostgreSQL connection
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

export default authRoutes