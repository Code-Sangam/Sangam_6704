# Design Document

## Overview

This design document outlines the architecture and implementation approach for converting the Sangam Alumni Network from a Next.js-based modern React application to a traditional web application stack using Express.js, vanilla JavaScript, React.js, traditional CSS, and SQL database. The conversion will maintain all existing functionality while simplifying the technology stack and following traditional web development patterns.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Layer                             │
├─────────────────────────────────────────────────────────────┤
│  HTML Pages (EJS Templates) + CSS + Vanilla JS + React     │
│  ├── Static Assets (CSS, JS, Images)                       │
│  ├── React Components (Bundled with Webpack)               │
│  └── Client-side JavaScript (Vanilla JS for interactions)  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Express.js Server                         │
├─────────────────────────────────────────────────────────────┤
│  ├── Routes (MVC Pattern)                                   │
│  │   ├── Page Routes (render EJS templates)                │
│  │   ├── API Routes (JSON responses)                       │
│  │   └── Auth Routes (login, register, logout)             │
│  ├── Middleware                                             │
│  │   ├── Authentication (express-session)                  │
│  │   ├── Error Handling                                    │
│  │   ├── Logging (Morgan)                                  │
│  │   └── Static File Serving                               │
│  ├── Controllers (Business Logic)                          │
│  ├── Models (Database Interaction)                         │
│  └── WebSocket Server (Socket.io for real-time chat)      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   Database Layer                            │
├─────────────────────────────────────────────────────────────┤
│  PostgreSQL/MySQL Database                                 │
│  ├── Users Table                                           │
│  ├── Profiles Table                                        │
│  ├── Messages Table                                        │
│  ├── Sessions Table                                        │
│  └── Settings Table                                        │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack Mapping

| Current (Next.js) | Target (Traditional) | Purpose |
|-------------------|---------------------|---------|
| Next.js App Router | Express.js + EJS | Server-side rendering and routing |
| TypeScript | JavaScript ES6+ | Programming language |
| Drizzle ORM + LibSQL | Sequelize + PostgreSQL | Database ORM and storage |
| Tailwind CSS | Traditional CSS | Styling |
| Radix UI | Custom HTML + CSS | UI components |
| better-auth | express-session + bcrypt | Authentication |
| Next.js API Routes | Express.js routes | API endpoints |
| Vercel deployment | Traditional hosting | Deployment |

## Components and Interfaces

### 1. Server Architecture (Express.js)

#### Main Application Structure
```
server/
├── app.js                 # Main Express application
├── config/
│   ├── database.js        # Database configuration
│   ├── session.js         # Session configuration
│   └── webpack.config.js  # Frontend build configuration
├── controllers/
│   ├── authController.js  # Authentication logic
│   ├── userController.js  # User management
│   ├── chatController.js  # Chat functionality
│   └── profileController.js # Profile management
├── models/
│   ├── User.js           # User model (Sequelize)
│   ├── Profile.js        # Profile model
│   ├── Message.js        # Message model
│   └── Session.js        # Session model
├── routes/
│   ├── index.js          # Main page routes
│   ├── auth.js           # Authentication routes
│   ├── api.js            # API routes
│   ├── chat.js           # Chat routes
│   └── profile.js        # Profile routes
├── middleware/
│   ├── auth.js           # Authentication middleware
│   ├── validation.js     # Input validation
│   └── errorHandler.js   # Error handling
├── views/
│   ├── layouts/
│   │   └── main.ejs      # Main layout template
│   ├── pages/
│   │   ├── home.ejs      # Homepage
│   │   ├── login.ejs     # Login page
│   │   ├── register.ejs  # Registration page
│   │   ├── profile.ejs   # Profile page
│   │   ├── chat.ejs      # Chat page
│   │   └── settings.ejs  # Settings page
│   └── partials/
│       ├── navbar.ejs    # Navigation component
│       └── footer.ejs    # Footer component
└── sockets/
    └── chatSocket.js     # WebSocket handlers for chat
```

#### Express.js Application Setup
```javascript
// app.js
const express = require('express');
const session = require('express-session');
const SequelizeStore = require('connect-session-sequelize')(session.Store);
const { sequelize } = require('./config/database');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware setup
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', './views');

// Session configuration
const sessionStore = new SequelizeStore({ db: sequelize });
app.use(session({
  secret: process.env.SESSION_SECRET,
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: { secure: false, maxAge: 24 * 60 * 60 * 1000 }
}));
```

### 2. Frontend Architecture

#### Client-Side Structure
```
public/
├── css/
│   ├── main.css          # Main stylesheet
│   ├── components.css    # Component styles
│   ├── responsive.css    # Media queries
│   └── themes.css        # Color themes
├── js/
│   ├── main.js           # Main application JavaScript
│   ├── auth.js           # Authentication handling
│   ├── chat.js           # Chat functionality
│   ├── profile.js        # Profile interactions
│   └── components/
│       ├── navbar.js     # Navigation component
│       ├── modal.js      # Modal component
│       └── form.js       # Form handling
├── react/
│   ├── components/       # React components (bundled)
│   │   ├── ChatInterface.jsx
│   │   ├── ProfileCard.jsx
│   │   └── SettingsPanel.jsx
│   └── index.jsx         # React entry point
├── images/
└── fonts/
```

#### React Component Integration
React components will be bundled using Webpack and integrated into EJS templates:

```javascript
// webpack.config.js
module.exports = {
  entry: './public/react/index.jsx',
  output: {
    path: path.resolve(__dirname, 'public/dist'),
    filename: 'react-bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      }
    ]
  }
};
```

### 3. Database Design

#### Database Schema (PostgreSQL/MySQL)
```sql
-- Users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('student', 'alumni', 'faculty') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Profiles table
CREATE TABLE profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  bio TEXT,
  profile_picture VARCHAR(255),
  company VARCHAR(255),
  position VARCHAR(255),
  graduation_year INTEGER,
  university VARCHAR(255),
  major VARCHAR(255),
  linkedin_url VARCHAR(255),
  github_url VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
  id SERIAL PRIMARY KEY,
  sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  message_type ENUM('text', 'image', 'file') DEFAULT 'text',
  read_at TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sessions table (for express-session)
CREATE TABLE sessions (
  sid VARCHAR(36) PRIMARY KEY,
  expires TIMESTAMP,
  data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### Sequelize Models
```javascript
// models/User.js
const { DataTypes } = require('sequelize');
const bcrypt = require('bcrypt');

module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: { isEmail: true }
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('student', 'alumni', 'faculty'),
      allowNull: false
    }
  });

  User.prototype.validatePassword = function(password) {
    return bcrypt.compare(password, this.passwordHash);
  };

  return User;
};
```

## Data Models

### User Management
- **User Model**: Core user authentication and role management
- **Profile Model**: Extended user information for alumni/students
- **Session Model**: User session management for authentication

### Communication System
- **Message Model**: Chat messages between users
- **Room Model**: Group chat functionality (future enhancement)
- **Notification Model**: System notifications

### Application State
- **Settings Model**: User preferences and configuration
- **Activity Model**: User activity logging
- **Device Model**: Connected device tracking

## Error Handling

### Server-Side Error Handling
```javascript
// middleware/errorHandler.js
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Validation Error',
      details: err.errors
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Unauthorized Access'
    });
  }
  
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
};
```

### Client-Side Error Handling
```javascript
// public/js/errorHandler.js
class ErrorHandler {
  static showError(message, type = 'error') {
    const errorDiv = document.createElement('div');
    errorDiv.className = `alert alert-${type}`;
    errorDiv.textContent = message;
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
  
  static handleApiError(response) {
    if (!response.ok) {
      return response.json().then(data => {
        throw new Error(data.error || 'Network error occurred');
      });
    }
    return response.json();
  }
}
```

## Testing Strategy

### Backend Testing
- **Unit Tests**: Jest for testing controllers, models, and utilities
- **Integration Tests**: Supertest for testing API endpoints
- **Database Tests**: In-memory database for testing database operations

### Frontend Testing
- **Component Tests**: React Testing Library for React components
- **E2E Tests**: Playwright or Cypress for full user flow testing
- **Manual Testing**: Cross-browser compatibility testing

### Testing Structure
```
tests/
├── unit/
│   ├── controllers/
│   ├── models/
│   └── utils/
├── integration/
│   ├── api/
│   └── auth/
├── frontend/
│   ├── components/
│   └── pages/
└── e2e/
    ├── auth.spec.js
    ├── chat.spec.js
    └── profile.spec.js
```

## Security Considerations

### Authentication Security
- Password hashing with bcrypt (minimum 12 rounds)
- Session-based authentication with secure cookies
- CSRF protection using csurf middleware
- Rate limiting for login attempts

### Data Protection
- Input validation and sanitization
- SQL injection prevention through ORM
- XSS protection with proper output encoding
- File upload validation and restrictions

### Infrastructure Security
- Environment variable management
- HTTPS enforcement in production
- Security headers (helmet.js)
- Database connection security

## Performance Optimization

### Server-Side Optimization
- Database query optimization with indexes
- Connection pooling for database
- Caching with Redis for sessions and frequently accessed data
- Gzip compression for responses

### Client-Side Optimization
- CSS and JavaScript minification
- Image optimization and lazy loading
- Bundle splitting for React components
- Browser caching strategies

## Deployment Strategy

### Traditional Hosting Setup
- Node.js server deployment (PM2 for process management)
- PostgreSQL/MySQL database setup
- Nginx reverse proxy for static files and load balancing
- Environment-specific configuration management

### Development Workflow
- Local development with nodemon
- Database migrations with Sequelize CLI
- Build process for frontend assets
- Environment variable management with dotenv