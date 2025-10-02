# Sangam Alumni Network - Traditional Stack

A comprehensive alumni networking platform built with traditional web technologies: Express.js, EJS, vanilla JavaScript, traditional CSS, and SQL database.

## 🚀 Features

### Core Functionality
- **User Authentication**: Secure login/register with bcrypt password hashing
- **Real-time Chat**: Socket.io powered messaging with typing indicators
- **Profile Management**: Comprehensive user profiles with role-based features
- **Settings Management**: Account settings, privacy controls, and session management
- **Dashboard**: Role-specific dashboards for students, alumni, and faculty
- **File Sharing**: Upload and share images and documents in chat
- **Responsive Design**: Mobile-first responsive design across all pages

### User Roles
- **Students**: Connect with alumni, seek mentorship, participate in events
- **Alumni**: Mentor students, share experiences, network with peers
- **Faculty**: Guide students, manage courses, collaborate with colleagues

## 🛠 Technology Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web application framework
- **EJS** - Server-side templating engine
- **PostgreSQL** - Primary database
- **Sequelize** - Object-Relational Mapping (ORM)
- **Socket.io** - Real-time communication
- **bcrypt** - Password hashing
- **express-session** - Session management

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Modern styling with custom properties
- **Vanilla JavaScript** - Client-side interactivity
- **React.js** - For complex interactive components (hybrid approach)
- **Webpack** - Module bundling and asset optimization

### Security & Performance
- **Helmet.js** - Security headers
- **Rate Limiting** - API protection
- **CSRF Protection** - Cross-site request forgery prevention
- **Input Validation** - Server-side validation with Joi
- **File Upload Security** - Multer with file type validation

## 📋 Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn package manager

## 🔧 Installation

1. **Clone and Setup**
   ```bash
   cd server
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and settings
   ```

3. **Database Setup**
   ```bash
   # Create database
   createdb sangam_alumni_network
   
   # Run migrations
   npm run db:migrate
   
   # Seed initial data (optional)
   npm run db:seed
   ```

4. **Verify Setup**
   ```bash
   npm run verify
   ```

5. **Build Assets**
   ```bash
   npm run build
   ```

6. **Start Application**
   ```bash
   # Development
   npm run dev
   
   # Production
   npm start
   ```

## 🧪 Testing

### Integration Tests
```bash
npm run test:integration
```

### Unit Tests
```bash
npm test
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Profile creation and editing
- [ ] Real-time chat messaging
- [ ] File upload in chat
- [ ] Settings management
- [ ] Password change
- [ ] Session management
- [ ] Mobile responsiveness

## 📁 Project Structure

```
server/
├── app.js                 # Main application entry point
├── config/
│   ├── database.js        # Database configuration
│   └── session.js         # Session configuration
├── controllers/           # Business logic controllers
│   ├── authController.js
│   ├── chatController.js
│   ├── profileController.js
│   ├── settingsController.js
│   └── dashboardController.js
├── middleware/            # Express middleware
│   ├── auth.js
│   ├── errorHandler.js
│   ├── validation.js
│   └── upload.js
├── models/                # Sequelize models
│   ├── index.js
│   ├── User.js
│   ├── Profile.js
│   ├── Message.js
│   └── Session.js
├── routes/                # Express routes
│   ├── index.js
│   ├── auth.js
│   ├── api.js
│   ├── chat.js
│   └── profile.js
├── services/              # Business logic services
│   └── chatService.js
├── sockets/               # Socket.io handlers
│   └── chatSocket.js
├── views/                 # EJS templates
│   ├── layouts/
│   ├── pages/
│   └── partials/
├── public/                # Static assets
│   ├── css/
│   ├── js/
│   ├── images/
│   └── react/             # React components
└── scripts/               # Utility scripts
    ├── test-integration.js
    └── verify-setup.js
```

## 🔐 Security Features

- **Password Security**: bcrypt hashing with configurable salt rounds
- **Session Security**: Secure session management with database storage
- **CSRF Protection**: Cross-site request forgery prevention
- **Rate Limiting**: API endpoint protection against abuse
- **Input Validation**: Comprehensive server-side validation
- **File Upload Security**: File type and size validation
- **Security Headers**: Helmet.js for security headers
- **SQL Injection Prevention**: Sequelize ORM protection

## 🌐 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/change-password` - Change password

### Chat
- `GET /api/chat/messages/:userId` - Get conversation messages
- `POST /api/chat/messages` - Send message
- `POST /api/chat/upload` - Upload file
- `GET /api/chat/conversations` - Get conversation list
- `GET /api/chat/search` - Search messages

### Profile
- `GET /api/profile/:userId` - Get user profile
- `PUT /api/profile/update` - Update profile
- `GET /api/profiles/search` - Search profiles

### Settings
- `PUT /api/settings/privacy` - Update privacy settings
- `GET /api/settings/activity` - Get account activity
- `GET /api/settings/sessions` - Get active sessions
- `DELETE /api/settings/sessions/:id` - Terminate session

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/dashboard/activity` - Get recent activity
- `GET /api/dashboard/connections` - Get user connections

## 🔄 Real-time Features

### Socket.io Events
- `user:join` - User joins chat
- `user:online` / `user:offline` - User presence
- `message:send` / `message:receive` - Real-time messaging
- `typing:start` / `typing:stop` - Typing indicators
- `message:read` - Read receipts
- `message:edit` / `message:delete` - Message modifications

## 🎨 Styling Architecture

### CSS Organization
- `main.css` - Global styles and utilities
- `layout.css` - Layout and grid systems
- `components.css` - Reusable UI components
- `forms.css` - Form styling
- `responsive.css` - Media queries
- `chat.css` - Chat interface styles
- `settings.css` - Settings page styles
- `dashboard.css` - Dashboard styles

### Design System
- **Colors**: CSS custom properties for consistent theming
- **Typography**: Responsive typography scale
- **Spacing**: Consistent spacing system
- **Components**: Reusable component library
- **Responsive**: Mobile-first responsive design

## 🚀 Deployment

### Production Setup
1. Set `NODE_ENV=production`
2. Configure production database
3. Build assets: `npm run build`
4. Start with process manager: `pm2 start app.js`

### Environment Variables
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host:port/dbname
SESSION_SECRET=your-secret-key
PORT=3000
BCRYPT_ROUNDS=12
CLIENT_URL=https://yourdomain.com
```

## 📈 Performance Optimizations

- **Database Indexing**: Optimized database queries with proper indexes
- **Connection Pooling**: Database connection pooling
- **Asset Compression**: Gzip compression for responses
- **Caching**: Browser caching strategies
- **Bundle Optimization**: Webpack code splitting and minification
- **Image Optimization**: Optimized image serving

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check DATABASE_URL in .env
   - Ensure PostgreSQL is running
   - Verify database exists

2. **Session Issues**
   - Check SESSION_SECRET in .env
   - Verify sessions table exists
   - Clear browser cookies

3. **Socket.io Connection Issues**
   - Check CORS configuration
   - Verify client and server versions match
   - Check firewall settings

4. **File Upload Issues**
   - Check uploads directory permissions
   - Verify file size limits
   - Check multer configuration

### Debug Mode
```bash
DEBUG=* npm run dev
```

## 📞 Support

For issues and questions:
1. Check the troubleshooting section above
2. Review the integration test results
3. Check server logs for detailed error messages
4. Verify all environment variables are set correctly

## 🎯 Next Steps

After successful setup:
1. Customize the design and branding
2. Add additional features as needed
3. Configure production deployment
4. Set up monitoring and logging
5. Implement backup strategies

---

**Built with ❤️ using traditional web technologies**