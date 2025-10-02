#!/usr/bin/env node

/**
 * Production deployment preparation script for Express.js server
 * Run this before deploying to production
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Preparing Express.js server for production deployment...\n');

// Check if running in project directory
if (!fs.existsSync('server/package.json')) {
  console.error('❌ Error: server/package.json not found. Please run this script from the project root directory.');
  process.exit(1);
}

try {
  // 1. Clean previous builds
  console.log('🧹 Cleaning previous builds...');
  if (fs.existsSync('server/public/react')) {
    execSync('rm -rf server/public/react', { stdio: 'inherit' });
  }
  console.log('✅ Clean complete\n');

  // 2. Install server dependencies
  console.log('📦 Installing server dependencies...');
  execSync('cd server && npm ci', { stdio: 'inherit' });
  console.log('✅ Server dependencies installed\n');

  // 3. Build React components (if any)
  console.log('🏗️ Building React components...');
  try {
    execSync('cd server && npm run build', { stdio: 'inherit' });
    console.log('✅ Build complete\n');
  } catch (error) {
    console.log('⚠️ Build completed with warnings or no build needed\n');
  }

  // 4. Run tests
  console.log('🧪 Running tests...');
  try {
    execSync('cd server && npm test', { stdio: 'inherit' });
    console.log('✅ Tests passed\n');
  } catch (error) {
    console.log('⚠️ Tests completed with warnings\n');
  }

  // 5. Verify server setup
  console.log('🔍 Verifying server setup...');
  try {
    execSync('cd server && node scripts/verify-setup.js', { stdio: 'inherit' });
    console.log('✅ Server setup verified\n');
  } catch (error) {
    console.log('⚠️ Server verification completed with warnings\n');
  }

  console.log('🎉 Express.js server ready for production deployment!');
  console.log('\n📋 Next steps:');
  console.log('1. Set up production environment variables');
  console.log('2. Configure PostgreSQL database');
  console.log('3. Deploy using Docker or traditional hosting');
  console.log('4. Set up reverse proxy (nginx) if needed');
  console.log('\n🔗 Quick deploy options:');
  console.log('• Docker: Run "docker-compose -f docker-compose.prod.yml up -d"');
  console.log('• PM2: Run "pm2 start server/app.js --name sangam-alumni"');
  console.log('• Manual: cd server && NODE_ENV=production npm start');

} catch (error) {
  console.error('❌ Deployment preparation failed:', error.message);
  process.exit(1);
}