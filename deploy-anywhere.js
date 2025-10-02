// Universal deployment script for any Node.js hosting platform
const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Log deployment info
console.log('🚀 Universal Deployment Script Starting...');
console.log('📅 Timestamp:', new Date().toISOString());
console.log('🌍 Environment:', process.env.NODE_ENV || 'development');
console.log('🔌 Port:', PORT);
console.log('📂 Working Directory:', process.cwd());
console.log('🔧 Node Version:', process.version);
console.log('💻 Platform:', process.platform);

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check (required by most platforms)
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sangam Alumni Network is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    platform: 'Universal Deployment',
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    version: '1.0.0'
  });
});

// Root route
app.get('/', (req, res) => {
  const platform = process.env.RENDER ? 'Render' : 
                   process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 
                   process.env.DYNO ? 'Heroku' : 
                   process.env.VERCEL ? 'Vercel' : 
                   'Unknown Platform';

  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Sangam Alumni Network</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
        }
        .container { 
          background: white;
          padding: 40px;
          border-radius: 20px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 600px;
          width: 90%;
          text-align: center;
        }
        h1 { 
          color: #2c3e50;
          margin-bottom: 20px;
          font-size: 2.5em;
        }
        .success { 
          background: #d4edda;
          color: #155724;
          padding: 20px;
          border-radius: 10px;
          margin: 20px 0;
          border-left: 5px solid #28a745;
        }
        .info { 
          background: #f8f9fa;
          padding: 15px;
          border-radius: 8px;
          margin: 15px 0;
          font-family: 'Courier New', monospace;
          font-size: 0.9em;
          text-align: left;
        }
        .links { margin: 20px 0; }
        .links a { 
          display: inline-block;
          margin: 5px 10px;
          padding: 10px 20px;
          background: #007bff;
          color: white;
          text-decoration: none;
          border-radius: 25px;
          transition: background 0.3s;
        }
        .links a:hover { background: #0056b3; }
        .platform { 
          background: #e9ecef;
          padding: 10px;
          border-radius: 5px;
          margin: 10px 0;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎓 Sangam Alumni Network</h1>
        
        <div class="success">
          <h2>🎉 Deployment Successful!</h2>
          <p>Your alumni network platform is now live and running.</p>
        </div>

        <div class="platform">
          🚀 Deployed on: ${platform}
        </div>

        <div class="info">
          📅 Deployed: ${new Date().toISOString()}<br>
          🌍 Environment: ${process.env.NODE_ENV || 'development'}<br>
          🔧 Node.js: ${process.version}<br>
          ⚡ Uptime: ${Math.floor(process.uptime())} seconds<br>
          💾 Memory: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB
        </div>

        <p><strong>Welcome to your alumni networking platform!</strong> Connect with alumni and students from your institution.</p>

        <div class="links">
          <a href="/health">Health Check</a>
          <a href="/test">Test API</a>
        </div>

        <p><small>This is a simplified version. The full platform with chat, profiles, and database features will be available once the complete setup is configured.</small></p>
      </div>
    </body>
    </html>
  `);
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    message: '✅ Test endpoint working',
    platform: process.env.RENDER ? 'Render' : 
              process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 
              process.env.DYNO ? 'Heroku' : 
              'Unknown',
    timestamp: new Date().toISOString(),
    success: true
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    name: 'Sangam Alumni Network API',
    version: '1.0.0',
    status: 'running',
    endpoints: {
      health: '/health',
      test: '/test',
      home: '/'
    },
    deployment: {
      platform: process.env.RENDER ? 'Render' : 
                process.env.RAILWAY_ENVIRONMENT ? 'Railway' : 
                process.env.DYNO ? 'Heroku' : 
                'Unknown',
      timestamp: new Date().toISOString()
    }
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `The endpoint ${req.method} ${req.path} does not exist`,
    availableEndpoints: ['/', '/health', '/test', '/api']
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    error: 'Internal Server Error',
    message: 'Something went wrong on the server',
    timestamp: new Date().toISOString()
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ Server started successfully!');
  console.log(`🔗 Local URL: http://localhost:${PORT}`);
  console.log(`🌐 Public URL: Check your hosting platform dashboard`);
  console.log('🎉 Sangam Alumni Network is live!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

module.exports = app;