// Minimal Express.js server for Railway deployment
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Simple routes that don't depend on database or complex setup
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sangam Alumni Network</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .status { background: #e8f5e8; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .links { margin: 20px 0; }
        .links a { display: inline-block; margin: 10px 15px 10px 0; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; }
        .links a:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎓 Sangam Alumni Network</h1>
        <div class="status">
          ✅ Server is running successfully!<br>
          🕒 ${new Date().toISOString()}<br>
          🌍 Environment: ${process.env.NODE_ENV || 'development'}<br>
          📂 Working Directory: ${process.cwd()}
        </div>
        <p>Welcome to the Sangam Alumni Network platform. Connect with alumni and students from your institution.</p>
        <div class="links">
          <a href="/health">Health Check</a>
          <a href="/debug">Debug Info</a>
          <a href="/test-db">Test Database</a>
        </div>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    uptime: process.uptime()
  });
});

app.get('/debug', (req, res) => {
  const fs = require('fs');
  
  res.json({
    server: {
      cwd: process.cwd(),
      dirname: __dirname,
      nodeVersion: process.version,
      platform: process.platform
    },
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      DATABASE_URL: process.env.DATABASE_URL ? 'Set' : 'Not set',
      SESSION_SECRET: process.env.SESSION_SECRET ? 'Set' : 'Not set'
    },
    paths: {
      serverDir: __dirname,
      viewsPath: path.join(__dirname, 'views'),
      publicPath: path.join(__dirname, '../public'),
      viewsExists: fs.existsSync(path.join(__dirname, 'views')),
      publicExists: fs.existsSync(path.join(__dirname, '../public'))
    }
  });
});

app.get('/test-db', async (req, res) => {
  try {
    if (!process.env.DATABASE_URL) {
      return res.json({
        status: 'error',
        message: 'DATABASE_URL not set',
        solution: 'Add PostgreSQL database in Railway dashboard'
      });
    }

    const { Sequelize } = require('sequelize');
    const sequelize = new Sequelize(process.env.DATABASE_URL, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    });

    await sequelize.authenticate();
    await sequelize.close();

    res.json({
      status: 'success',
      message: 'Database connection successful',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      status: 'error',
      message: 'Database connection failed',
      error: error.message,
      solution: 'Check DATABASE_URL and ensure PostgreSQL is added in Railway'
    });
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <p><a href="/">Go Home</a></p>
  `);
});

// Error handler
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).send(`
    <h1>500 - Server Error</h1>
    <p>Something went wrong: ${error.message}</p>
    <p><a href="/">Go Home</a></p>
  `);
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Sangam Alumni Network (Simple) running on port ${PORT}`);
  console.log(`🔗 URL: http://0.0.0.0:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📂 Working Directory: ${process.cwd()}`);
  console.log('✅ Server started successfully');
});

module.exports = app;