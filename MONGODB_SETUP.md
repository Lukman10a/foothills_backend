# MongoDB Atlas Connection Setup Guide

## Overview
Your Foothills Booking Platform is already configured to work with MongoDB Atlas. This guide will help you connect your existing cluster to the application.

## Prerequisites
- MongoDB Atlas cluster already created ✅
- Node.js and npm installed
- Project dependencies installed (`npm install`)

## Step 1: Get Your MongoDB Connection String

1. **Login to MongoDB Atlas**: Go to [https://cloud.mongodb.com](https://cloud.mongodb.com)
2. **Select Your Cluster**: Choose the cluster you created
3. **Click "Connect"**: Find the "Connect" button on your cluster
4. **Choose "Connect your application"**
5. **Select Driver**: Choose "Node.js" and version "4.1 or later"
6. **Copy the connection string**: It should look like:
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```

## Step 2: Configure Environment Variables

1. **Open the `.env` file** in your project root (already created for you)
2. **Replace the placeholders** in the `MONGODB_URI` with your actual credentials:

```env
# Replace these values with your actual MongoDB Atlas credentials:
MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster-url.mongodb.net/foothills?retryWrites=true&w=majority
```

### Example:
If your connection string is:
```
mongodb+srv://john:mypassword123@cluster0.abc123.mongodb.net/?retryWrites=true&w=majority
```

Your `.env` should have:
```env
MONGODB_URI=mongodb+srv://john:mypassword123@cluster0.abc123.mongodb.net/foothills?retryWrites=true&w=majority
```

## Step 3: Database User Setup

Make sure you have a database user with proper permissions:

1. **Go to Database Access** in your MongoDB Atlas dashboard
2. **Add Database User** (if not already created)
3. **Set Authentication Method**: Username and Password
4. **Set Database User Privileges**: 
   - Built-in Role: `readWrite` for your database
   - Or `Atlas Admin` for full access during development
5. **Add User**

## Step 4: Network Access Configuration

Ensure your IP address is whitelisted:

1. **Go to Network Access** in your MongoDB Atlas dashboard
2. **Add IP Address**:
   - For development: Add your current IP or use `0.0.0.0/0` (allows access from anywhere - less secure)
   - For production: Add specific IP addresses of your servers
3. **Confirm**

## Step 5: Test the Connection

1. **Start your application**:
   ```bash
   npm run dev
   ```

2. **Check the console output**:
   - You should see: `✅ MongoDB Connected: cluster0.xxxxx.mongodb.net`
   - And: `📊 Database: foothills`

3. **Test the API**:
   - Open: `http://localhost:3000/api/health`
   - Should return a health check response

## Step 6: Verify Database Connection

Your application includes helpful connection logging:

### Success indicators:
- `🔄 Connecting to MongoDB Atlas...`
- `✅ MongoDB Connected: [cluster-host]`
- `📊 Database: foothills`

### Error indicators:
- `❌ Database connection failed:`
- `❌ MongoDB connection error:`

## Common Issues and Solutions

### 1. Authentication Failed
**Error**: `Authentication failed`
**Solution**: 
- Double-check username and password in `.env`
- Ensure the database user exists and has proper permissions
- Make sure password doesn't contain special characters that need URL encoding

### 2. Network Timeout
**Error**: `Server selection timed out`
**Solution**:
- Check if your IP address is whitelisted in Network Access
- Verify your internet connection
- Try adding `0.0.0.0/0` temporarily for testing

### 3. Database Not Found
**Error**: Database connection works but collections aren't found
**Solution**:
- The database `foothills` will be created automatically when you first write data
- Collections will be created when you first insert documents

### 4. SSL/TLS Issues
**Error**: SSL handshake failed
**Solution**:
- Ensure you're using `mongodb+srv://` (not `mongodb://`)
- Check if your network blocks SSL connections

## Environment Variables Reference

```env
# Required for MongoDB connection
MONGODB_URI=mongodb+srv://username:password@cluster-url/foothills?retryWrites=true&w=majority

# Optional - for testing
MONGODB_URI_TEST=mongodb+srv://username:password@cluster-url/foothills-test?retryWrites=true&w=majority

# Other required variables
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production-minimum-32-characters
NODE_ENV=development
PORT=3000
CORS_ORIGIN=http://localhost:3000
```

## Security Best Practices

1. **Never commit `.env` to version control** (already in `.gitignore`)
2. **Use strong passwords** for database users
3. **Restrict IP access** in production
4. **Use different databases** for development, testing, and production
5. **Change JWT_SECRET** to a secure random string in production

## Database Schema

Your application uses Mongoose models located in `src/models/`. The main collections will be:
- `users` - User accounts and authentication
- `services` - Booking services and properties
- `bookings` - Reservation data
- `categories` - Service categories
- `reviews` - User reviews and ratings

## Next Steps

1. **Replace the placeholder values** in `.env` with your actual MongoDB Atlas credentials
2. **Run the application** with `npm run dev`
3. **Test the API endpoints** to ensure everything works
4. **Check the MongoDB Atlas dashboard** to see your database and collections being created

## Support

If you encounter issues:
1. Check the console output for specific error messages
2. Verify all credentials and network settings
3. Test the connection string directly in MongoDB Compass
4. Refer to the MongoDB Atlas documentation

---

**Note**: This setup is configured for MongoDB Atlas (cloud). If you're using a local MongoDB instance, you'll need to adjust the connection string format.