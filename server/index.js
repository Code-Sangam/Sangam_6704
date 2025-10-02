// Ultra-minimal Express server for Railway
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting ultra-minimal server...');
console.log('📂 Current directory:', process.cwd());
console.log('📂 __dirname:', __dirname);

app.get('/', (req, res) => {
  res.send(`
    <h1>🎓 Sangam Alumni Network</h1>
    <p>✅ Server is running successfully!</p>
    <p>🕒 ${new Date().toISOString()}</p>
    <p>🌍 Environment: ${process.env.NODE_ENV || 'development'}</p>
    <p>📂 Directory: ${process.cwd()}</p>
    <p><a href="/health">Health Check</a></p>
  `);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    port: PORT,
    cwd: process.cwd(),
    dirname: __dirname
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🔗 URL: http://0.0.0.0:${PORT}`);
});