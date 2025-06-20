import mongoose from 'mongoose';
import { env } from './environment';

// Database connection configuration
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = env.MONGODB_URI;
    
    console.log('🔄 Connecting to MongoDB Atlas...');
    console.log('🔗 Using URI:', mongoURI.replace(/\/\/.*:.*@/, '//<credentials>@')); // Hide credentials in log
    
    // Simplified configuration for Atlas
    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    
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
    
    if (env.NODE_ENV === 'development') {
      console.log('💡 Please check your MongoDB Atlas connection string in .env file');
      console.log('💡 Make sure your IP address is whitelisted in Atlas');
      console.log('💡 Verify your username and password are correct');
      console.log('💡 Ensure your cluster is not paused');
    }
    
    // Exit the process since we need the database for the API to work
    process.exit(1);
  }
};

export default connectDB; 