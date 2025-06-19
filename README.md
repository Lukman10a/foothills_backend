# Foothills Booking Platform - Backend API

A complete and scalable MVP backend for the Foothills booking platform built with Node.js, Express.js, and MongoDB.

## 🚀 Features

- **Authentication**: JWT-based authentication system
- **User Management**: Registration, login, and profile management
- **Booking System**: Create, read, update, delete bookings with availability checking
- **Service Management**: Service catalog with categories and pricing
- **Security**: Password hashing, rate limiting, CORS, and security headers
- **Validation**: Comprehensive input validation with Joi
- **Error Handling**: Global error handling with consistent response format

## 🛠️ Technology Stack

- **Runtime**: Node.js (v18+)
- **Framework**: Express.js (v4.18+)
- **Database**: MongoDB (v6+)
- **ODM**: Mongoose (v7+)
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **Validation**: Joi
- **Testing**: Postman (API testing)

## 📋 Prerequisites

- Node.js v18 or higher
- MongoDB v6 or higher
- npm or yarn package manager

## 🚀 Quick Start

### 1. Clone the repository
```bash
git clone <repository-url>
cd foothills
```

### 2. Install dependencies
```bash
npm install
```

### 3. Environment setup
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
# See Environment Variables section below
```

### 4. Start MongoDB
Make sure MongoDB is running on your system:
```bash
# On Windows
net start MongoDB

# On macOS/Linux
sudo systemctl start mongod
```

### 5. Run the application
```bash
# Development mode (with hot reload)
npm run dev

# Production mode
npm start
```

The API will be available at `http://localhost:3000`

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

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

## 📚 API Endpoints

### Health Check
- `GET /health` - API health status

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `DELETE /api/users/profile` - Delete user account

### Services
- `GET /api/services` - Get all services
- `GET /api/services/:id` - Get service by ID
- `POST /api/services` - Create new service (Admin only)
- `PUT /api/services/:id` - Update service (Admin only)
- `DELETE /api/services/:id` - Delete service (Admin only)

### Bookings
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking by ID
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Categories
- `GET /api/categories` - Get all categories
- `GET /api/categories/:id` - Get category by ID
- `POST /api/categories` - Create new category (Admin only)
- `PUT /api/categories/:id` - Update category (Admin only)
- `DELETE /api/categories/:id` - Delete category (Admin only)

## 🧪 Testing

### API Testing with Postman
1. Import the Postman collection from `tests/postman/`
2. Set up environment variables in Postman
3. Run the test suite

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 📁 Project Structure

```
foothills-backend/
├── src/
│   ├── config/          # Database & environment config
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Auth, validation, error handling
│   ├── models/          # Mongoose schemas
│   ├── routes/          # API route definitions
│   ├── services/        # Business logic layer
│   ├── utils/           # Helper functions
│   └── app.js          # Main application file
├── tests/
│   └── postman/        # Postman test collections
├── .env.example        # Environment variables template
├── .gitignore          # Git ignore rules
├── package.json        # Project dependencies and scripts
└── README.md          # Project documentation
```

## 🔒 Security Features

- **Password Hashing**: bcrypt with 12 salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Protection against brute force attacks
- **CORS**: Cross-origin resource sharing configuration
- **Helmet**: Security headers for Express
- **Input Validation**: Comprehensive validation with Joi
- **Error Handling**: Sanitized error messages in production

## 🚀 Deployment

### Production Considerations
- Set `NODE_ENV=production`
- Use a strong JWT secret
- Configure proper CORS origins
- Set up MongoDB Atlas or production MongoDB
- Use environment variables for all sensitive data
- Set up proper logging and monitoring

### Environment Variables for Production
```env
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/foothills
JWT_SECRET=your-very-strong-production-secret
CORS_ORIGIN=https://yourdomain.com
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions, please open an issue in the repository. 