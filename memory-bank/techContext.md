# Technical Context - Foothills Backend

## Technology Stack

### Core Technologies
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v4.18+)
- **Database**: MongoDB (v6+)
- **ODM**: Mongoose (v7+)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Testing**: Postman (API testing)

### Development Tools
- **Package Manager**: npm
- **Environment**: dotenv
- **CORS**: cors middleware
- **Rate Limiting**: express-rate-limit
- **Logging**: winston (future enhancement)
- **API Documentation**: Swagger/OpenAPI (future)

## Project Structure
```
foothills-backend/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── environment.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── serviceController.js
│   │   ├── bookingController.js
│   │   └── categoryController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── validation.js
│   │   ├── errorHandler.js
│   │   └── rateLimiter.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Service.js
│   │   ├── Booking.js
│   │   └── Category.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── services.js
│   │   ├── bookings.js
│   │   └── categories.js
│   ├── services/
│   │   ├── authService.js
│   │   ├── userService.js
│   │   ├── serviceService.js
│   │   ├── bookingService.js
│   │   └── categoryService.js
│   ├── utils/
│   │   ├── responseFormatter.js
│   │   ├── errorHandler.js
│   │   └── validators.js
│   └── app.js
├── tests/
│   └── postman/
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Dependencies

### Production Dependencies
```json
{
  "express": "^4.18.2",
  "mongoose": "^7.5.0",
  "jsonwebtoken": "^9.0.2",
  "bcryptjs": "^2.4.3",
  "joi": "^17.9.2",
  "cors": "^2.8.5",
  "dotenv": "^16.3.1",
  "express-rate-limit": "^6.10.0",
  "helmet": "^7.0.0"
}
```

### Development Dependencies
```json
{
  "nodemon": "^3.0.1",
  "jest": "^29.6.2",
  "supertest": "^6.3.3"
}
```

## Environment Configuration

### Required Environment Variables
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/foothills
MONGODB_URI_TEST=mongodb://localhost:27017/foothills_test

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=24h

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

## Database Configuration

### MongoDB Setup
- Local development: MongoDB Community Edition
- Production: MongoDB Atlas (cloud)
- Connection pooling enabled
- Indexes on frequently queried fields

### Mongoose Configuration
- Strict mode enabled
- Timestamps on all models
- Proper error handling
- Connection event listeners

## Security Configuration

### JWT Settings
- Secret key: 256-bit minimum
- Expiration: 24 hours
- Algorithm: HS256
- Issuer and audience claims

### Password Security
- bcrypt salt rounds: 12
- Minimum password length: 8 characters
- Password complexity requirements
- Rate limiting on auth endpoints

### CORS Configuration
- Whitelist approach for origins
- Credentials support
- Preflight request handling

## Development Setup

### Prerequisites
- Node.js v18+
- MongoDB v6+
- npm or yarn
- Postman (for API testing)

### Installation Steps
1. Clone repository
2. Install dependencies: `npm install`
3. Copy `.env.example` to `.env`
4. Configure environment variables
5. Start MongoDB service
6. Run development server: `npm run dev`

### Scripts
```json
{
  "scripts": {
    "start": "node src/app.js",
    "dev": "nodemon src/app.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/",
    "format": "prettier --write src/"
  }
}
```

## API Testing Strategy

### Postman Collection Structure
- Authentication endpoints
- User management endpoints
- Service management endpoints
- Booking management endpoints
- Category management endpoints

### Test Scenarios
- Happy path testing
- Error handling testing
- Authentication testing
- Authorization testing
- Validation testing

## Performance Considerations

### Database Optimization
- Indexes on query fields
- Lean queries for read operations
- Connection pooling
- Query optimization

### Application Optimization
- Response compression
- Static file serving
- Memory usage monitoring
- Request/response logging

## Deployment Considerations

### Production Environment
- Environment-specific configurations
- Process management (PM2)
- Logging and monitoring
- Health check endpoints
- Graceful shutdown handling

### Security Hardening
- Helmet.js for security headers
- Rate limiting
- Input sanitization
- Error message sanitization
- HTTPS enforcement 