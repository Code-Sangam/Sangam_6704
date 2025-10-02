// Root-level Express server for Railway (fallback)
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting root-level server...');
console.log('📂 Current directory:', process.cwd());

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Sangam Alumni Network</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f0f8ff; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; }
        .status { background: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745; }
        .info { background: #e2e3e5; padding: 10px; border-radius: 5px; font-family: monospace; font-size: 12px; }
        a { color: #007bff; text-decoration: none; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>🎓 Sangam Alumni Network</h1>
        <div class="status">
          ✅ <strong>Server is running successfully!</strong>
        </div>
        <div class="info">
          🕒 Timestamp: ${new Date().toISOString()}<br>
          🌍 Environment: ${process.env.NODE_ENV || 'development'}<br>
          📂 Working Directory: ${process.cwd()}<br>
          🔧 Node Version: ${process.version}<br>
          🚀 Port: ${PORT}
        </div>
        <p><strong>Great news!</strong> Your Railway deployment is working. This is a simplified version of your alumni network platform.</p>
        <p>🔗 <a href="/health">Health Check (JSON)</a></p>
      </div>
    </body>
    </html>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'SUCCESS',
    message: 'Railway deployment working',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    port: PORT,
    nodeVersion: process.version,
    platform: process.platform,
    cwd: process.cwd()
  });
});

app.get('/test', (req, res) => {
  res.json({
    message: 'Test endpoint working',
    railway: 'deployment successful',
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).send(`
    <h1>404 - Page Not Found</h1>
    <p>The page "${req.url}" doesn't exist.</p>
    <p><a href="/">← Go Home</a></p>
  `);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Sangam Alumni Network server running on port ${PORT}`);
  console.log(`🔗 Access at: http://0.0.0.0:${PORT}`);
  console.log(`📱 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log('🎉 Railway deployment successful!');
});

module.exports = app;