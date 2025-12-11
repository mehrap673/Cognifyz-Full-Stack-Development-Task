# 🚀 ModernApp - Advanced Server-Side Rendering Application

A full-stack Node.js application demonstrating advanced server-side rendering, authentication, external API integration, caching, and background job processing.

![Node.js](https://img.shields.io/badge/Node.js-v18+-green)
![Express](https://img.shields.io/badge/Express-v4.18-blue)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green)
![Redis](https://img.shields.io/badge/Redis-v5.0-red)

## 📋 Table of Contents

- [Features](#features)
- [Technologies Used](#technologies-used)
- [Installation](#installation)
- [Configuration](#configuration)
- [Tasks Completed](#tasks-completed)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Usage](#usage)
- [Screenshots](#screenshots)
- [License](#license)

## ✨ Features

### Authentication & Authorization
- ✅ User registration with advanced form validation
- ✅ Email/Password authentication with JWT
- ✅ Google OAuth 2.0 integration
- ✅ Role-based access control (User/Admin)
- ✅ Secure password hashing with bcrypt
- ✅ HTTP-only cookie-based sessions

### External API Integration
- ✅ Weather API (OpenWeatherMap)
- ✅ News API (NewsAPI.org)
- ✅ GitHub User API
- ✅ Currency Exchange API
- ✅ Random User API
- ✅ Random Quote API

### Advanced Server Features
- ✅ **Redis Caching** - Server-side response caching with TTL
- ✅ **Winston Logging** - Structured logging with daily rotation
- ✅ **Morgan Request Logging** - HTTP request/response logging
- ✅ **Bull Job Queue** - Background email and data processing
- ✅ **Compression** - Gzip compression for responses
- ✅ **Rate Limiting** - API rate limiting per IP

### Security Features
- ✅ Helmet.js security headers
- ✅ XSS protection
- ✅ NoSQL injection prevention
- ✅ HPP (HTTP Parameter Pollution) protection
- ✅ CORS enabled
- ✅ Content Security Policy (CSP)

### UI/UX
- ✅ Server-side rendering with EJS
- ✅ Responsive Bootstrap 5 design
- ✅ Dark/Light mode support
- ✅ Interactive dashboards
- ✅ Real-time API testing interface

## 🛠️ Technologies Used

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB Atlas** - Cloud database
- **Mongoose** - MongoDB ODM
- **Redis** - In-memory caching
- **Bull** - Background job queue
- **Passport.js** - Authentication middleware

### Logging & Monitoring
- **Winston** - Advanced logging
- **Morgan** - HTTP request logger
- **Winston-daily-rotate-file** - Log rotation

### Security
- **Helmet** - Security headers
- **bcryptjs** - Password hashing
- **JWT** - Token authentication
- **express-rate-limit** - Rate limiting
- **xss-clean** - XSS protection
- **express-mongo-sanitize** - NoSQL injection prevention

### Frontend
- **EJS** - Templating engine
- **Bootstrap 5** - CSS framework
- **Bootstrap Icons** - Icon library

### External APIs
- OpenWeatherMap
- NewsAPI
- GitHub API
- ExchangeRate-API

## 📦 Installation

### Prerequisites
Node.js v18+ installed

MongoDB Atlas account

Redis server (local or cloud)

Google OAuth credentials

API keys for external services

text

### Step 1: Clone Repository
git clone <your-repo-url>
cd server-side-rendering-app

text

### Step 2: Install Dependencies
npm install

text

### Step 3: Setup Redis

**Option A: Windows (Portable)**
Download Redis from: https://github.com/tporadowski/redis/releases
Extract to C:\redis
cd C:\redis
.\redis-server.exe

text

**Option B: WSL/Linux**
sudo apt update
sudo apt install redis-server
sudo service redis-server start

text

**Option C: Docker**
docker run -d -p 6379:6379 --name redis-server redis:latest

text

### Step 4: Configure Environment Variables

Create `.env` file in root:

Server
PORT=3000
NODE_ENV=development

MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname

JWT
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRE=7d

Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=

Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/api/auth/google/callback

External APIs
WEATHER_API_KEY=your_openweather_api_key
NEWS_API_KEY=your_newsapi_key
GITHUB_TOKEN=your_github_token
EXCHANGE_API_KEY=your_exchange_api_key

Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

text

### Step 5: Run Application
Development mode with nodemon
npm run dev

Production mode
npm start

text

Visit: `http://localhost:3000`

## 📚 Tasks Completed

### ✅ Task 1: Basic Server Setup
- Express.js server configuration
- EJS templating engine setup
- Static file serving
- Environment variable configuration

### ✅ Task 2: User Registration & Authentication
- Advanced registration form with validation
- User model with Mongoose schema
- Password hashing with bcrypt
- JWT token generation
- Secure authentication flow

### ✅ Task 3: MongoDB Integration
- MongoDB Atlas cloud database
- Mongoose ODM setup
- User CRUD operations
- Database connection handling
- Error handling

### ✅ Task 4: Server-Side Rendering
- EJS templates for all pages
- Dynamic data rendering
- Partial components (navbar, footer)
- Landing page with features
- User dashboard
- Admin dashboard

### ✅ Task 5: Google OAuth Integration
- Passport.js Google Strategy
- OAuth 2.0 flow implementation
- User profile from Google
- Automatic account creation
- Session management

### ✅ Task 6: External API Integration
- Weather API integration
- News API with filtering
- GitHub user lookup
- Currency exchange rates
- Random user generator
- Quote API
- API usage tracking

### ✅ Task 7: Rate Limiting & Security
- Express-rate-limit middleware
- Different limits per route type
- IP-based rate limiting
- Helmet security headers
- XSS protection
- NoSQL injection prevention
- HPP protection

### ✅ Task 8: Advanced Server-Side Features

#### 1. Middleware Implementation
- **Body Parsing**: JSON and URL-encoded data
- **Request Logging**: Morgan + Winston integration
- **Compression**: Gzip response compression
- **Cookie Parsing**: Secure cookie handling

#### 2. Server-Side Caching (Redis)
- Response caching with configurable TTL
- Cache hit/miss logging
- Pattern-based cache clearing
- Admin cache management API
- Automatic cache invalidation

#### 3. Background Jobs (Bull Queue)
- **Email Queue**: Async welcome emails
- **Data Processing Queue**: User analytics
- **Scheduled Jobs**: 
  - Hourly analytics calculation
  - Daily inactive user cleanup
- Job retry logic with exponential backoff
- Job completion/failure tracking

#### 4. Advanced Logging (Winston)
- Structured JSON logging
- Daily rotating log files
- Separate error logs
- Console logging with colors
- Request/response logging
- Performance metrics

## 🔌 API Documentation

### Authentication Endpoints

#### Register User
POST /api/auth/register
Content-Type: application/json

{
"username": "johndoe",
"email": "john@example.com",
"password": "SecurePass123!",
"confirmPassword": "SecurePass123!",
"phone": "+1234567890",
"age": 25,
"gender": "male",
"country": "India",
"bio": "Software Developer",
"skills": ["JavaScript", "Node.js"],
"newsletter": true,
"terms": true
}

text

#### Login
POST /api/auth/login
Content-Type: application/json

{
"email": "john@example.com",
"password": "SecurePass123!"
}

text

#### Google OAuth
GET /api/auth/google

Redirects to Google OAuth consent screen
text

#### Get Current User
GET /api/auth/me
Authorization: Bearer <token>

text

#### Logout
POST /api/auth/logout
Authorization: Bearer <token>

text

### External API Endpoints

#### Weather
GET /api/external/weather/:city
Authorization: Bearer <token>

Response:
{
"success": true,
"data": {
"city": "Mumbai",
"country": "IN",
"temperature": 28,
"description": "clear sky",
"humidity": 65,
"wind_speed": 3.5
},
"cached": false
}

text

#### News
GET /api/external/news?country=us&category=technology
Authorization: Bearer <token>

Response:
{
"success": true,
"data": {
"articles": [...]
}
}

text

#### GitHub User
GET /api/external/github/:username
Authorization: Bearer <token>

Response:
{
"success": true,
"data": {
"login": "torvalds",
"name": "Linus Torvalds",
"bio": "...",
"public_repos": 5,
"followers": 200000
},
"cached": true
}

text

#### Exchange Rates
GET /api/external/exchange/:base
Authorization: Bearer <token>

text

### Admin Endpoints

#### Get All Users
GET /api/users
Authorization: Bearer <admin-token>

text

#### Delete User
DELETE /api/users/:id
Authorization: Bearer <admin-token>

text

#### Clear Cache
DELETE /api/admin/cache/:pattern?
Authorization: Bearer <admin-token>

Response:
{
"success": true,
"message": "Cleared 5 cache entries",
"pattern": "*"
}

text

#### View Logs
GET /api/admin/logs
Authorization: Bearer <admin-token>

Response:
{
"success": true,
"logs": ["combined-2025-12-11.log", "error-2025-12-11.log"]
}

text

## 📁 Project Structure

server-side-rendering-app/
├── config/
│ ├── database.js # MongoDB connection
│ ├── passport.js # Passport strategies
│ ├── redis.js # Redis client config
│ └── logger.js # Winston logger config
├── middleware/
│ ├── auth.js # JWT authentication
│ ├── rateLimiter.js # Rate limiting
│ ├── errorHandler.js # Global error handler
│ ├── requestLogger.js # Morgan logger
│ └── cache.js # Redis caching
├── models/
│ └── User.js # User mongoose model
├── services/
│ └── externalApi.js # External API service
├── jobs/
│ ├── emailQueue.js # Email background jobs
│ └── dataProcessingQueue.js # Data processing jobs
├── utils/
│ └── jwt.js # JWT utilities
├── views/
│ ├── components/
│ │ ├── navbar.ejs
│ │ └── footer.ejs
│ ├── landing.ejs
│ ├── login.ejs
│ ├── register-advanced.ejs
│ ├── user-dashboard.ejs
│ ├── api-dashboard.ejs
│ ├── external-apis.ejs
│ └── all-users.ejs
├── public/
│ ├── css/
│ │ └── custom.css
│ └── js/
├── logs/ # Auto-generated log files
│ ├── combined-.log
│ └── error-.log
├── .env
├── server.js # Main application file
├── package.json
└── README.md

text

## 🚀 Usage

### For Regular Users

1. **Register**: Visit `/register-advanced`
   - Fill advanced registration form
   - Receive welcome email (background job)

2. **Login**: Use email/password or Google OAuth

3. **Dashboard**: View your profile and stats

4. **External APIs**: Test various APIs
   - Weather lookup
   - Latest tech news
   - GitHub profiles
   - Currency rates

### For Administrators

1. **Login as Admin**: 
   - Email: `admin@test.com`
   - Password: `Admin@123`

2. **Admin Dashboard**: `/api-dashboard`
   - View all users
   - System statistics
   - API usage metrics

3. **Manage Cache**: Clear Redis cache via API

4. **View Logs**: Access system logs

## 📊 Caching Strategy

| Endpoint | Cache Duration | Key Pattern |
|----------|---------------|-------------|
| Weather | 10 minutes | `cache:/api/external/weather/:city` |
| News | 5 minutes | `cache:/api/external/news?...` |
| Exchange | 1 hour | `cache:/api/external/exchange/:base` |
| GitHub | 30 minutes | `cache:/api/external/github/:username` |

## 📝 Logging

Logs are stored in `logs/` directory:
- `combined-YYYY-MM-DD.log` - All logs
- `error-YYYY-MM-DD.log` - Error logs only

Log retention: 14 days (auto-cleanup)

## 🔒 Security Best Practices

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens stored in HTTP-only cookies
- ✅ Rate limiting on all routes
- ✅ Input validation and sanitization
- ✅ XSS protection
- ✅ CSRF protection
- ✅ Secure headers with Helmet
- ✅ NoSQL injection prevention

## 🐛 Common Issues

### Redis Connection Error
Make sure Redis is running
redis-cli ping # Should return PONG

text

### MongoDB Connection Error
Check .env MONGODB_URI
Whitelist your IP in MongoDB Atlas
text

### Port Already in Use
Change PORT in .env or kill existing process
npx kill-port 3000

text

## 📈 Performance Features

- **Compression**: Gzip compression reduces response size by ~70%
- **Caching**: Redis caching reduces API calls and response time
- **Background Jobs**: Async email sending doesn't block requests
- **Rate Limiting**: Prevents server overload
- **Connection Pooling**: MongoDB connection reuse


## 🙏 Acknowledgments

- Cogznify Internship Program
- OpenWeatherMap API
- NewsAPI.org
- MongoDB Atlas
- Redis Labs
- Bootstrap Team

---

**Made with ❤️ using Node.js, Express, MongoDB, Redis & Passion**