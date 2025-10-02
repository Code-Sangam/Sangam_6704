#!/usr/bin/env node

// Setup Verification Script
require('dotenv').config();

const fs = require('fs');
const path = require('path');

class SetupVerifier {
  constructor() {
    this.checks = [];
    this.warnings = [];
  }
  
  async verifySetup() {
    console.log('🔍 Sangam Alumni Network - Setup Verification');
    console.log('=============================================\n');
    
    // File structure checks
    this.checkFileStructure();
    
    // Environment checks
    this.checkEnvironmentVariables();
    
    // Database checks
    await this.checkDatabaseSetup();
    
    // Dependencies checks
    this.checkDependencies();
    
    // Configuration checks
    this.checkConfigurations();
    
    // Print results
    this.printResults();
  }
  
  checkFileStructure() {
    console.log('📁 Checking file structure...');
    
    const requiredFiles = [
      'app.js',
      'package.json',
      'config/database.js',
      'config/session.js',
      'models/index.js',
      'models/User.js',
      'models/Profile.js',
      'models/Message.js',
      'controllers/authController.js',
      'controllers/chatController.js',
      'controllers/profileController.js',
      'controllers/settingsController.js',
      'controllers/dashboardController.js',
      'routes/index.js',
      'routes/auth.js',
      'routes/api.js',
      'routes/chat.js',
      'routes/profile.js',
      'middleware/auth.js',
      'middleware/errorHandler.js',
      'middleware/validation.js',
      'middleware/upload.js',
      'sockets/chatSocket.js',
      'services/chatService.js',
      'views/layouts/main.ejs',
      'views/pages/home.ejs',
      'views/pages/login.ejs',
      'views/pages/register.ejs',
      'views/pages/chat.ejs',
      'views/pages/settings.ejs',
      'views/pages/dashboard.ejs',
      '../public/css/main.css',
      '../public/css/chat.css',
      '../public/css/settings.css',
      '../public/css/dashboard.css',
      '../public/js/main.js',
      '../public/js/chat.js',
      '../public/js/settings.js',
      '../public/js/dashboard.js'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      const exists = fs.existsSync(filePath);
      this.addCheck(`File: ${file}`, exists, 
        exists ? 'File exists' : 'File missing');
    });
  }
  
  checkEnvironmentVariables() {
    console.log('🌍 Checking environment variables...');
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'SESSION_SECRET',
      'NODE_ENV'
    ];
    
    const optionalEnvVars = [
      'PORT',
      'BCRYPT_ROUNDS',
      'CLIENT_URL'
    ];
    
    requiredEnvVars.forEach(envVar => {
      const exists = !!process.env[envVar];
      this.addCheck(`Env: ${envVar}`, exists, 
        exists ? 'Environment variable set' : 'Environment variable missing');
    });
    
    optionalEnvVars.forEach(envVar => {
      const exists = !!process.env[envVar];
      if (!exists) {
        this.addWarning(`Optional env var ${envVar} not set (using default)`);
      }
    });
  }
  
  async checkDatabaseSetup() {
    console.log('🗄️ Checking database setup...');
    
    try {
      const { sequelize } = require('../config/database');
      
      // Test connection
      await sequelize.authenticate();
      this.addCheck('Database Connection', true, 'Database connection successful');
      
      // Check if tables exist
      const tables = await sequelize.getQueryInterface().showAllTables();
      const requiredTables = ['users', 'profiles', 'messages', 'sessions'];
      
      requiredTables.forEach(table => {
        const exists = tables.includes(table);
        this.addCheck(`Table: ${table}`, exists, 
          exists ? 'Table exists' : 'Table missing - run migrations');
      });
      
    } catch (error) {
      this.addCheck('Database Setup', false, error.message);
    }
  }
  
  checkDependencies() {
    console.log('📦 Checking dependencies...');
    
    const packageJson = require('../package.json');
    const requiredDeps = [
      'express',
      'ejs',
      'sequelize',
      'socket.io',
      'bcrypt',
      'express-session',
      'connect-session-sequelize'
    ];
    
    requiredDeps.forEach(dep => {
      const exists = packageJson.dependencies[dep] || packageJson.devDependencies[dep];
      this.addCheck(`Dependency: ${dep}`, !!exists, 
        exists ? `Version: ${exists}` : 'Dependency missing');
    });
  }
  
  checkConfigurations() {
    console.log('⚙️ Checking configurations...');
    
    // Check webpack config
    const webpackExists = fs.existsSync(path.join(__dirname, '..', 'webpack.config.js'));
    this.addCheck('Webpack Config', webpackExists, 
      webpackExists ? 'Webpack configured' : 'Webpack config missing');
    
    // Check babel config
    const babelExists = fs.existsSync(path.join(__dirname, '..', '.babelrc'));
    this.addCheck('Babel Config', babelExists, 
      babelExists ? 'Babel configured' : 'Babel config missing');
    
    // Check if uploads directory exists
    const uploadsDir = path.join(__dirname, '../../uploads');
    const uploadsExists = fs.existsSync(uploadsDir);
    if (!uploadsExists) {
      try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        this.addCheck('Uploads Directory', true, 'Uploads directory created');
      } catch (error) {
        this.addCheck('Uploads Directory', false, 'Failed to create uploads directory');
      }
    } else {
      this.addCheck('Uploads Directory', true, 'Uploads directory exists');
    }
  }
  
  addCheck(name, passed, message) {
    this.checks.push({ name, passed, message });
  }
  
  addWarning(message) {
    this.warnings.push(message);
  }
  
  printResults() {
    console.log('\n📊 Setup Verification Results:');
    console.log('=' .repeat(60));
    
    let passedCount = 0;
    let totalCount = this.checks.length;
    
    this.checks.forEach(check => {
      const status = check.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${check.name}: ${check.message}`);
      if (check.passed) passedCount++;
    });
    
    if (this.warnings.length > 0) {
      console.log('\n⚠️ Warnings:');
      this.warnings.forEach(warning => {
        console.log(`⚠️ ${warning}`);
      });
    }
    
    console.log('=' .repeat(60));
    console.log(`Results: ${passedCount}/${totalCount} checks passed`);
    
    if (passedCount === totalCount) {
      console.log('🎉 Setup verification completed successfully!');
      console.log('\n🚀 You can now start the server with: npm start');
    } else {
      console.log('⚠️ Some checks failed. Please review and fix the issues above.');
      console.log('\n📚 Common fixes:');
      console.log('- Run database migrations: npm run db:migrate');
      console.log('- Install missing dependencies: npm install');
      console.log('- Check environment variables in .env file');
    }
  }
}

// Run verification
const verifier = new SetupVerifier();
verifier.verifySetup().catch(error => {
  console.error('❌ Setup verification failed:', error);
  process.exit(1);
});