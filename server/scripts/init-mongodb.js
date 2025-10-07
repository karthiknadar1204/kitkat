import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Trace from '../models/trace.model.js';

dotenv.config();

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_DATABASE_URL);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create collections and indexes
const initDatabase = async () => {
  try {
    // Create the Trace collection
    await Trace.createCollection();
    console.log('✅ Trace collection created');

    // Create indexes for better performance
    await Trace.collection.createIndex({ traceId: 1 }, { unique: true });
    console.log('✅ Unique index on traceId created');

    await Trace.collection.createIndex({ userId: 1 });
    console.log('✅ Index on userId created');

    await Trace.collection.createIndex({ sessionId: 1 });
    console.log('✅ Index on sessionId created');

    await Trace.collection.createIndex({ appName: 1 });
    console.log('✅ Index on appName created');

    await Trace.collection.createIndex({ createdAt: -1 });
    console.log('✅ Index on createdAt created');

    console.log('🎉 MongoDB database initialized successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
};

// Run the initialization
connectDB().then(initDatabase);
