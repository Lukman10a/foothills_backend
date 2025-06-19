# 🏔️ Foothills Booking Platform API

A comprehensive, scalable booking platform API built with Node.js, Express.js, TypeScript, and MongoDB. This API provides a complete solution for service booking, user management, and business analytics.

## 🚀 Features

### Core Features
- **User Authentication & Authorization** - JWT-based authentication with role-based access control
- **Service Management** - CRUD operations for services with provider management
- **Booking System** - Advanced booking with conflict detection and availability checking
- **Category Management** - Organized service categorization
- **Statistics & Analytics** - Comprehensive business insights and reporting

### Advanced Features
- **Business Logic** - Conflict detection, availability checking, status management
- **Advanced Search & Filtering** - Full-text search, filtering, sorting, and pagination
- **Real-time Validation** - Input sanitization and comprehensive validation
- **Performance Optimized** - Database aggregation, indexing, and query optimization
- **Security** - Rate limiting, CORS, helmet, input validation

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Joi
- **Documentation**: OpenAPI/Swagger
- **Security**: bcrypt, helmet, rate limiting
- **Development**: nodemon, rimraf

## 📋 Prerequisites

- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <repository-url>
cd foothills
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory:
```env
NODE_ENV=development
PORT=3000
MONGODB_URI=mongodb://localhost:27017/foothills
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRE=7d
CORS_ORIGIN=http://localhost:3000
```

### 4. Start the Server
```bash
# Development mode
npm run dev

# Production build
npm run build
npm start
```

## 📚 API Documentation

### Interactive Documentation
- **Swagger UI**: `http://localhost:3000/api-docs`
- **API Overview**: `http://localhost:3000/api`

### Base URL
```
http://localhost:3000/api
```

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### User Roles
- **customer**: Can book services and manage their bookings
- **provider**: Can create services and manage their bookings
- **admin**: Full access to all features

## 📖 API Endpoints

### Authentication
```
POST   /api/auth/register     - Register a new user
POST   /api/auth/login        - Login user
GET    /api/auth/me           - Get current user profile
POST   /api/auth/logout       - Logout user
POST   /api/auth/refresh      - Refresh JWT token
```

### Categories
```
GET    /api/categories        - Get all categories
POST   /api/categories        - Create category (admin only)
GET    /api/categories/:id    - Get category by ID
PUT    /api/categories/:id    - Update category (admin only)
DELETE /api/categories/:id    - Delete category (admin only)
```

### Services
```
GET    /api/services          - Get all services (with search/filtering)
POST   /api/services          - Create service (provider/admin)
GET    /api/services/:id      - Get service by ID
PUT    /api/services/:id      - Update service (owner/admin)
DELETE /api/services/:id      - Delete service (owner/admin)
GET    /api/services/provider/:providerId - Get services by provider
```

### Bookings
```
GET    /api/bookings          - Get all bookings (role-based)
POST   /api/bookings          - Create booking
GET    /api/bookings/:id      - Get booking by ID
PUT    /api/bookings/:id      - Update booking (owner/admin)
DELETE /api/bookings/:id      - Cancel booking (owner/admin)
GET    /api/bookings/user/:userId - Get user bookings
```

### Statistics
```
GET    /api/statistics/dashboard   - Dashboard statistics
GET    /api/statistics/trends      - Booking trends
GET    /api/statistics/services    - Service performance
GET    /api/statistics/categories  - Category performance
GET    /api/statistics/users       - User activity (admin only)
```

## 🔍 Advanced Features

### Search & Filtering
The API supports advanced search and filtering:

```bash
# Search services
GET /api/services?search=haircut

# Filter by category and price range
GET /api/services?category=507f1f77bcf86cd799439012&priceMin=50&priceMax=100

# Sort and paginate
GET /api/services?sort=price&order=asc&page=1&limit=10
```

### Business Logic
- **Conflict Detection**: Prevents double bookings
- **Availability Checking**: Validates time slot availability
- **Status Management**: Enforces booking status transitions
- **Role-based Access**: Ensures proper authorization

## 🧪 Testing

### Manual Testing with Postman
1. Import the provided Postman collection
2. Set up environment variables
3. Test endpoints in sequence (register → login → use token)

### Example API Calls

#### Register a User
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "password": "password123",
    "role": "customer"
  }'
```

#### Create a Service
```bash
curl -X POST http://localhost:3000/api/services \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "name": "Haircut & Styling",
    "description": "Professional haircut and styling service",
    "price": 50.00,
    "duration": 60,
    "category": "507f1f77bcf86cd799439012"
  }'
```

#### Create a Booking
```bash
curl -X POST http://localhost:3000/api/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <your-token>" \
  -d '{
    "serviceId": "507f1f77bcf86cd799439013",
    "date": "2024-01-15T10:00:00Z",
    "notes": "Please arrive 10 minutes early"
  }'
```

## 📁 Project Structure

```
foothills/
├── src/
│   ├── config/           # Configuration files
│   ├── controllers/      # Route controllers
│   ├── docs/            # API documentation
│   ├── middleware/      # Custom middleware
│   ├── models/          # Mongoose models
│   ├── routes/          # API routes
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   ├── validations/     # Validation schemas
│   └── app.ts           # Main application file
├── memory-bank/         # Project documentation
├── .env                 # Environment variables
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## 🔧 Development

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run clean        # Clean build directory
npm run lint         # Run ESLint
npm run test         # Run tests (when implemented)
```

### Environment Variables
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` |
| `PORT` | Server port | `3000` |
| `MONGODB_URI` | MongoDB connection string | Required |
| `JWT_SECRET` | JWT secret key | Required |
| `JWT_EXPIRE` | JWT expiration time | `7d` |
| `CORS_ORIGIN` | CORS allowed origin | `http://localhost:3000` |

## 🚀 Deployment

### Production Build
```bash
npm run build
npm start
```

### Environment Setup
Ensure all required environment variables are set in production:
- `NODE_ENV=production`
- `MONGODB_URI` (production database)
- `JWT_SECRET` (strong secret key)
- `CORS_ORIGIN` (production domain)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Contact: support@foothills.com

## 🔄 Version History

- **v1.0.0** - Initial release with core booking functionality
- **v1.1.0** - Added advanced search and filtering
- **v1.2.0** - Enhanced business logic and statistics
- **v1.3.0** - Complete API documentation and testing

---

**Built with ❤️ for the Foothills Booking Platform** 