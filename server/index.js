import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import bodyParser from 'body-parser'
import mongoose from 'mongoose'
import authRoutes from './routes/auth.route.js'
import sessionsRoutes from './routes/sessions.route.js'
import tracesRoutes from './routes/traces.route.js'

// dotenv.config()
// MongoDB Connection IIFE
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
app.use("/api/auth",authRoutes)
app.use("/api/sessions",sessionsRoutes)
app.use("/api/traces",tracesRoutes)
app.listen(3002,()=>{
    console.log("server is running on port 3002")  
})