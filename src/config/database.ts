import mongoose from 'mongoose';
import { DatabaseConfig } from '../types';

// Database connection configuration
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = process.env['MONGODB_URI'] || 'mongodb://localhost:27017/foothills';
    
    const config: DatabaseConfig = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };
    
    const conn = await mongoose.connect(mongoURI, config);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    
    // Handle connection events
    mongoose.connection.on('error', (err: Error) => {
      console.error('❌ MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️ MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('🔄 MongoDB reconnected');
    });

    // Graceful shutdown
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('📴 MongoDB connection closed through app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', (error as Error).message);
    console.log('💡 For development, you can start MongoDB or continue without it');
    console.log('💡 To start MongoDB: brew services start mongodb-community (macOS) or net start MongoDB (Windows)');
    
    // Don't exit the process in development - allow the server to run without DB
    if (process.env['NODE_ENV'] === 'production') {
      process.exit(1);
    }
  }
};

export default connectDB; 