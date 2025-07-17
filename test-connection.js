const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🔄 Testing MongoDB connection...');
    console.log('🔗 Using URI:', process.env.MONGODB_URI.replace(/\/\/.*:.*@/, '//<credentials>@'));
    
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 30000,
      socketTimeoutMS: 75000,
    });

    console.log('✅ MongoDB Connected Successfully!');
    console.log('📊 Host:', conn.connection.host);
    console.log('📊 Database:', conn.connection.name);
    console.log('📊 Ready State:', conn.connection.readyState);
    
    // Test a simple operation
    const collections = await conn.connection.db.listCollections().toArray();
    console.log('📦 Available collections:', collections.map(c => c.name));
    
    await mongoose.connection.close();
    console.log('✅ Connection test completed successfully!');
    console.log('🎉 Your MongoDB Atlas cluster is ready to use!');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error.message);
    console.log('\n💡 Troubleshooting tips:');
    console.log('1. Check your MONGODB_URI in .env file');
    console.log('2. Verify your username and password are correct');
    console.log('3. Ensure your IP address is whitelisted in MongoDB Atlas');
    console.log('4. Make sure your cluster is not paused');
    console.log('5. Check if you have proper database permissions');
    process.exit(1);
  }
}

testConnection();