# System Patterns - Foothills Backend Architecture

## Architecture Overview
The Foothills backend follows a layered architecture pattern with clear separation of concerns:

```
┌─────────────────────────────────────┐
│           API Layer                 │
│  (Routes, Controllers, Middleware)  │
├─────────────────────────────────────┤
│         Business Logic              │
│    (Services, Validation)           │
├─────────────────────────────────────┤
│         Data Access Layer           │
│      (Models, Database)             │
└─────────────────────────────────────┘
```

## Core Design Patterns

### 1. MVC Pattern (Model-View-Controller)
- **Models**: Mongoose schemas defining data structure
- **Controllers**: Handle HTTP requests and responses
- **Services**: Business logic layer between controllers and models

### 2. Repository Pattern
- Abstract data access through service layer
- Centralize business logic
- Enable easy testing and maintenance

### 3. Middleware Pattern
- Authentication middleware
- Validation middleware
- Error handling middleware
- Logging middleware

### 4. Factory Pattern
- JWT token generation
- Response formatting
- Error object creation

## Database Design

### Collections Structure
1. **Users Collection**
   ```javascript
   {
     _id: ObjectId,
     email: String (unique),
     password: String (hashed),
     firstName: String,
     lastName: String,
     role: String (enum: ['customer', 'admin', 'provider']),
     createdAt: Date,
     updatedAt: Date
   }
   ```

2. **Services Collection**
   ```javascript
   {
     _id: ObjectId,
     name: String,
     description: String,
     category: String,
     price: Number,
     duration: Number, // in minutes
     availability: [{
       dayOfWeek: Number,
       startTime: String,
       endTime: String
     }],
     isActive: Boolean,
     createdAt: Date,
     updatedAt: Date
   }
   ```

3. **Bookings Collection**
   ```javascript
   {
     _id: ObjectId,
     userId: ObjectId (ref: 'User'),
     serviceId: ObjectId (ref: 'Service'),
     date: Date,
     startTime: String,
     endTime: String,
     status: String (enum: ['pending', 'confirmed', 'cancelled', 'completed']),
     totalPrice: Number,
     notes: String,
     createdAt: Date,
     updatedAt: Date
   }
   ```

4. **Categories Collection**
   ```javascript
   {
     _id: ObjectId,
     name: String,
     description: String,
     isActive: Boolean,
     createdAt: Date,
     updatedAt: Date
   }
   ```

## API Design Patterns

### RESTful Endpoints
- **Users**: `/api/users`
- **Authentication**: `/api/auth`
- **Services**: `/api/services`
- **Bookings**: `/api/bookings`
- **Categories**: `/api/categories`

### Response Format
```javascript
{
  success: Boolean,
  message: String,
  data: Object | Array,
  errors: Array (optional)
}
```

### Error Handling
- Consistent error response format
- HTTP status codes mapping
- Detailed error messages for development
- Sanitized error messages for production

## Security Patterns

### Authentication Flow
1. User registers/logs in
2. Server validates credentials
3. JWT token generated with user info
4. Token sent to client
5. Client includes token in Authorization header
6. Middleware validates token on protected routes

### Password Security
- bcrypt for password hashing
- Salt rounds: 12
- Password validation rules

### JWT Configuration
- Secret key stored in environment variables
- Token expiration: 24 hours
- Refresh token mechanism for extended sessions

## Validation Patterns

### Input Validation
- Joi for request validation
- Mongoose schema validation
- Custom validation middleware
- Sanitization of user inputs

### Business Rule Validation
- Booking availability checking
- User permission validation
- Service availability validation
- Conflict detection

## Error Handling Strategy

### Error Types
1. **Validation Errors**: 400 Bad Request
2. **Authentication Errors**: 401 Unauthorized
3. **Authorization Errors**: 403 Forbidden
4. **Not Found Errors**: 404 Not Found
5. **Server Errors**: 500 Internal Server Error

### Error Middleware
- Global error handler
- Async error wrapper
- Error logging
- Error response formatting

## Performance Patterns

### Database Optimization
- Indexes on frequently queried fields
- Lean queries for read operations
- Pagination for large datasets
- Aggregation pipelines for complex queries

### Caching Strategy
- Redis for session storage (future)
- Response caching for static data
- Database query result caching

### Rate Limiting
- Express-rate-limit middleware
- IP-based rate limiting
- User-based rate limiting for authenticated routes 