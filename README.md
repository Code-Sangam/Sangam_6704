# Sangam Alumni Network - Traditional Stack

A traditional web application for alumni networking built with Express.js, EJS, PostgreSQL, and vanilla JavaScript. This is a converted version of the original Next.js application, designed to use familiar web development patterns and technologies.

## 🚀 Technology Stack

### Backend
- **Express.js** - Web application framework
- **EJS** - Server-side templating engine
- **PostgreSQL** - Primary database
- **Sequelize** - Database ORM
- **Socket.io** - Real-time communication
- **bcrypt** - Password hashing
- **express-session** - Session management

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with CSS variables
- **Vanilla JavaScript** - Client-side functionality
- **React.js** - Selected interactive components (bundled with Webpack)

### Development Tools
- **Webpack** - Module bundling for React components
- **Babel** - JavaScript transpilation
- **nodemon** - Development server auto-restart
- **Winston** - Logging
- **Jest** - Testing framework

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (v16 or higher)
- **PostgreSQL** (v12 or higher)
- **npm** or **yarn** package manager

## 🛠️ Installation & Setup

### 1. Clone the Repository
```bash
git clone <repository-url>
cd sangam-alumni-network
```

### 2. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install frontend build dependencies (if using React components)
npm install --save-dev webpack webpack-cli babel-loader @babel/core @babel/preset-react
```

### 3. Database Setup
```bash
# Create PostgreSQL database
createdb sangam_alumni_network

# Or using psql
psql -U postgres
CREATE DATABASE sangam_alumni_network;
\q
```

### 4. Environment Configuration
```bash
# Copy environment template
cp .env.example .env

# Edit .env file with your configuration
nano .env
```

**Required Environment Variables:**
```env
NODE_ENV=development
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=sangam_alumni_network
DB_USER=postgres
DB_PASSWORD=your_password
SESSION_SECRET=your-secret-key
```

### 5. Database Migration (when implemented)
```bash
# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

## 🚀 Running the Application

### Development Mode
```bash
# Start development server with auto-restart
npm run dev

# Or start normally
npm start
```

The application will be available at `http://localhost:3000`

### Production Mode
```bash
# Build frontend assets
npm run build

# Start production server
NODE_ENV=production npm start
```

## 📁 Project Structure

```
sangam-alumni-network/
├── server/
│   ├── app.js                 # Main Express application
│   ├── package.json           # Server dependencies
│   ├── config/
│   │   ├── database.js        # Database configuration
│   │   └── webpack.config.js  # Frontend build config
│   ├── controllers/           # Business logic controllers
│   ├── models/               # Sequelize database models
│   ├── routes/               # Express route handlers
│   ├── middleware/           # Custom middleware
│   ├── views/                # EJS templates
│   │   ├── layouts/          # Layout templates
│   │   ├── pages/            # Page templates
│   │   └── partials/         # Reusable components
│   └── sockets/              # Socket.io handlers
├── public/                   # Static assets
│   ├── css/                  # Stylesheets
│   ├── js/                   # Client-side JavaScript
│   ├── images/               # Images and icons
│   └── uploads/              # User uploaded files
├── logs/                     # Application logs
├── .env.example              # Environment template
└── README.md                 # This file
```

## 🎯 Features

### ✅ Implemented
- Express.js server with EJS templating
- Basic routing structure (home, auth, profile, chat)
- Session-based authentication setup
- Real-time chat infrastructure with Socket.io
- Responsive CSS framework with custom variables
- Error handling and logging middleware
- File upload support structure
- Security middleware (helmet, CORS)

### 🔄 In Progress
- Database models and migrations
- Authentication controllers
- User profile management
- Chat functionality
- Settings management

### 📋 Planned
- Email notifications
- Social login integration
- Advanced search and filtering
- Mobile responsive optimizations
- Performance monitoring

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start development server with nodemon
npm start           # Start production server

# Building
npm run build       # Build frontend React components
npm run build:dev   # Build in development mode

# Database
npm run db:migrate  # Run database migrations
npm run db:seed     # Seed database with initial data
npm run db:reset    # Reset database (drop, create, migrate, seed)

# Testing
npm test           # Run test suite
npm run test:watch # Run tests in watch mode

# Linting
npm run lint       # Check code style
```

### Adding New Features

1. **Routes**: Add new routes in `server/routes/`
2. **Controllers**: Create business logic in `server/controllers/`
3. **Models**: Define database models in `server/models/`
4. **Views**: Create EJS templates in `server/views/pages/`
5. **Styles**: Add CSS in `public/css/`
6. **Client JS**: Add JavaScript in `public/js/`

### Database Migrations

```bash
# Create new migration
npx sequelize-cli migration:generate --name create-users-table

# Run migrations
npm run db:migrate

# Rollback migration
npx sequelize-cli db:migrate:undo
```

## 🔒 Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing protection
- **bcrypt** - Password hashing
- **express-session** - Secure session management
- **Input validation** - Server-side validation with Joi
- **Rate limiting** - API rate limiting
- **CSRF protection** - Cross-site request forgery protection

## 📊 Monitoring & Logging

- **Winston** - Structured logging
- **Morgan** - HTTP request logging
- **Error tracking** - Comprehensive error handling
- **Performance monitoring** - Response time tracking

## 🚀 Deployment

### Traditional Hosting (VPS/Dedicated Server)

1. **Server Setup**
```bash
# Install Node.js and PostgreSQL on server
# Clone repository
# Install dependencies
npm install --production
```

2. **Process Management**
```bash
# Install PM2 for process management
npm install -g pm2

# Start application with PM2
pm2 start app.js --name sangam-alumni

# Setup PM2 startup
pm2 startup
pm2 save
```

3. **Nginx Configuration**
```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /static {
        alias /path/to/your/app/public;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

### Environment Variables for Production

```env
NODE_ENV=production
PORT=3000
DB_HOST=your-db-host
DB_NAME=sangam_alumni_network_prod
SESSION_SECRET=your-production-secret
REDIS_HOST=your-redis-host
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](../../issues) page
2. Create a new issue with detailed information
3. Contact the development team

## 🔄 Migration from Next.js

This application was converted from a Next.js-based system to use traditional web technologies. Key changes include:

- **Next.js App Router** → **Express.js + EJS**
- **TypeScript** → **JavaScript ES6+**
- **Drizzle ORM** → **Sequelize**
- **Tailwind CSS** → **Custom CSS**
- **better-auth** → **express-session + bcrypt**
- **Vercel deployment** → **Traditional hosting**

The conversion maintains all original functionality while using more traditional and widely-supported web technologies.