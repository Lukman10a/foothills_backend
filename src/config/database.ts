import mongoose from 'mongoose';
import { env } from './environment';

// Database connection configuration
const connectDB = async (): Promise<void> => {
  try {
    const mongoURI = env.MONGODB_URI;
    const isAtlas = mongoURI.includes('mongodb+srv://');
    
    console.log(`🔄 Connecting to MongoDB ${isAtlas ? 'Atlas' : 'Local'}...`);
    console.log('🔗 Using URI:', mongoURI.replace(/\/\/.*:.*@/, '//<credentials>@')); // Hide credentials in log
    
    // Connection configuration optimized for both local and Atlas
    const connectionOptions = {
      serverSelectionTimeoutMS: isAtlas ? 30000 : 5000,
      socketTimeoutMS: 75000,
      maxPoolSize: 10,
      minPoolSize: 1,
    };

    const conn = await mongoose.connect(mongoURI, connectionOptions);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database: ${conn.connection.name}`);
    console.log(`🌐 Connection Type: ${isAtlas ? 'MongoDB Atlas (Cloud)' : 'Local MongoDB'}`);
    
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
      const isAtlas = env.MONGODB_URI.includes('mongodb+srv://');
      
      console.log('💡 Troubleshooting tips:');
      if (isAtlas) {
        console.log('   📡 MongoDB Atlas Connection Issues:');
        console.log('   1. Verify your username and password in the connection string');
        console.log('   2. Check if your IP address is whitelisted in Atlas Network Access');
        console.log('   3. Ensure your cluster is not paused (check Atlas dashboard)');
        console.log('   4. Verify the cluster URL is correct');
        console.log('   5. Check your internet connection');
        console.log('   6. Make sure you have database access permissions');
      } else {
        console.log('   🏠 Local MongoDB Connection Issues:');
        console.log('   1. Make sure MongoDB is installed and running locally');
        console.log('   2. Check if MongoDB service is started');
        console.log('   3. Verify the connection string: mongodb://localhost:27017/foothills');
      }
      console.log('');
      console.log('🚀 Starting server without database for testing...');
      console.log('⚠️  API endpoints requiring database will not work');
      console.log('💡 Fix database connection to test full functionality');
    } else {
      // Exit the process in production since we need the database
      process.exit(1);
    }
  }
};

export default connectDB; 