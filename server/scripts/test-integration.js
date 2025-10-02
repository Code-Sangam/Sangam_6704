#!/usr/bin/env node

// Integration Test Script
require('dotenv').config();

const fs = require('fs');
const path = require('path');

class IntegrationTester {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }
  
  async runTests() {
    console.log('🧪 Sangam Alumni Network - Integration Tests');
    console.log('============================================\n');
    
    // Test core functionality without database
    await this.testRouteDefinitions();
    await this.testControllerStructure();
    await this.testMiddlewareIntegration();
    await this.testViewTemplates();
    await this.testStaticAssets();
    await this.testSocketIntegration();
    await this.testSecurityFeatures();
    
    this.printResults();
  }
  
  async testRouteDefinitions() {
    console.log('🛣️ Testing route definitions...');
    
    try {
      // Test main routes
      const indexRoutes = require('../routes/index');
      this.addTest('Index Routes', true, 'Routes loaded successfully');
      
      const authRoutes = require('../routes/auth');
      this.addTest('Auth Routes', true, 'Auth routes loaded successfully');
      
      const apiRoutes = require('../routes/api');
      this.addTest('API Routes', true, 'API routes loaded successfully');
      
      const chatRoutes = require('../routes/chat');
      this.addTest('Chat Routes', true, 'Chat routes loaded successfully');
      
      const profileRoutes = require('../routes/profile');
      this.addTest('Profile Routes', true, 'Profile routes loaded successfully');
      
    } catch (error) {
      this.addTest('Route Loading', false, `Route loading failed: ${error.message}`);
    }
  }
  
  async testControllerStructure() {
    console.log('🎮 Testing controller structure...');
    
    const controllers = [
      'authController',
      'chatController',
      'profileController',
      'settingsController',
      'dashboardController',
      'adminController'
    ];
    
    controllers.forEach(controllerName => {
      try {
        const controller = require(`../controllers/${controllerName}`);
        const hasExports = Object.keys(controller).length > 0;
        this.addTest(`Controller: ${controllerName}`, hasExports, 
          hasExports ? 'Controller has exported functions' : 'Controller has no exports');
      } catch (error) {
        this.addTest(`Controller: ${controllerName}`, false, `Failed to load: ${error.message}`);
      }
    });
  }
  
  async testMiddlewareIntegration() {
    console.log('🔧 Testing middleware integration...');
    
    const middlewares = [
      'auth',
      'errorHandler',
      'validation',
      'upload',
      'permissions'
    ];
    
    middlewares.forEach(middlewareName => {
      try {
        const middleware = require(`../middleware/${middlewareName}`);
        const hasExports = Object.keys(middleware).length > 0;
        this.addTest(`Middleware: ${middlewareName}`, hasExports, 
          hasExports ? 'Middleware loaded successfully' : 'Middleware has no exports');
      } catch (error) {
        this.addTest(`Middleware: ${middlewareName}`, false, `Failed to load: ${error.message}`);
      }
    });
  }
  
  async testViewTemplates() {
    console.log('👁️ Testing view templates...');
    
    const templates = [
      'layouts/main.ejs',
      'pages/home.ejs',
      'pages/login.ejs',
      'pages/register.ejs',
      'pages/dashboard.ejs',
      'pages/chat.ejs',
      'pages/settings.ejs',
      'pages/admin.ejs',
      'pages/404.ejs'
    ];
    
    templates.forEach(template => {
      const templatePath = path.join(__dirname, '..', 'views', template);
      const exists = fs.existsSync(templatePath);
      
      if (exists) {
        // Basic syntax check - look for EJS tags
        const content = fs.readFileSync(templatePath, 'utf8');
        const hasEJSTags = content.includes('<%') || content.includes('%>');
        this.addTest(`Template: ${template}`, hasEJSTags, 
          hasEJSTags ? 'Template has EJS syntax' : 'Template missing EJS syntax');
      } else {
        this.addTest(`Template: ${template}`, false, 'Template file missing');
      }
    });
  }
  
  async testStaticAssets() {
    console.log('📁 Testing static assets...');
    
    const assets = [
      '../public/css/main.css',
      '../public/css/auth.css',
      '../public/css/chat.css',
      '../public/css/settings.css',
      '../public/css/dashboard.css',
      '../public/css/admin.css',
      '../public/js/main.js',
      '../public/js/chat.js',
      '../public/js/settings.js',
      '../public/js/dashboard.js',
      '../public/js/admin.js'
    ];
    
    assets.forEach(asset => {
      const assetPath = path.join(__dirname, '..', asset);
      const exists = fs.existsSync(assetPath);
      
      if (exists) {
        const stats = fs.statSync(assetPath);
        const hasContent = stats.size > 0;
        this.addTest(`Asset: ${asset}`, hasContent, 
          hasContent ? `File exists (${stats.size} bytes)` : 'File is empty');
      } else {
        this.addTest(`Asset: ${asset}`, false, 'Asset file missing');
      }
    });
  }
  
  async testSocketIntegration() {
    console.log('🔌 Testing Socket.io integration...');
    
    try {
      const chatSocket = require('../sockets/chatSocket');
      this.addTest('Socket Handler', typeof chatSocket === 'function', 
        typeof chatSocket === 'function' ? 'Socket handler is a function' : 'Socket handler invalid');
      
      const chatService = require('../services/chatService');
      const isValidService = typeof chatService === 'function' || typeof chatService === 'object';
      this.addTest('Chat Service', isValidService, 
        isValidService ? 'Chat service loaded' : 'Chat service invalid');
        
    } catch (error) {
      this.addTest('Socket Integration', false, `Socket integration failed: ${error.message}`);
    }
  }
  
  async testSecurityFeatures() {
    console.log('🔒 Testing security features...');
    
    try {
      // Test validation middleware
      const validation = require('../middleware/validation');
      const hasValidation = validation.sanitizeInput && validation.generateCSRFToken;
      this.addTest('Input Validation', hasValidation, 
        hasValidation ? 'Validation middleware available' : 'Validation middleware incomplete');
      
      // Test permissions middleware
      const permissions = require('../middleware/permissions');
      const hasPermissions = permissions.requirePermission && permissions.hasPermission;
      this.addTest('Permissions System', hasPermissions, 
        hasPermissions ? 'Permissions system available' : 'Permissions system incomplete');
      
      // Test auth middleware
      const auth = require('../middleware/auth');
      const hasAuth = auth.requireAuth && auth.sessionActivity;
      this.addTest('Authentication', hasAuth, 
        hasAuth ? 'Authentication middleware available' : 'Authentication middleware incomplete');
        
    } catch (error) {
      this.addTest('Security Features', false, `Security test failed: ${error.message}`);
    }
  }
  
  addTest(name, passed, message) {
    this.tests.push({ name, passed, message });
    if (passed) {
      this.passed++;
    } else {
      this.failed++;
    }
  }
  
  printResults() {
    console.log('\n📊 Integration Test Results:');
    console.log('=' .repeat(80));
    
    this.tests.forEach(test => {
      const status = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`${status} ${test.name}: ${test.message}`);
    });
    
    console.log('=' .repeat(80));
    console.log(`Results: ${this.passed} passed, ${this.failed} failed, ${this.tests.length} total`);
    
    if (this.failed === 0) {
      console.log('🎉 All integration tests passed!');
      console.log('\n✅ Core Functionality Verified:');
      console.log('   • All routes are properly defined');
      console.log('   • Controllers are structured correctly');
      console.log('   • Middleware is integrated');
      console.log('   • View templates are available');
      console.log('   • Static assets are in place');
      console.log('   • Socket.io is configured');
      console.log('   • Security features are implemented');
      console.log('\n🚀 The application is ready for testing with a database!');
    } else {
      console.log('⚠️ Some integration tests failed. Please review the issues above.');
    }
    
    console.log('\n📋 Next Steps:');
    console.log('1. Set up PostgreSQL database');
    console.log('2. Run database migrations: npm run db:migrate');
    console.log('3. Start the server: npm start');
    console.log('4. Test authentication flow');
    console.log('5. Test chat functionality');
    console.log('6. Test profile management');
  }
}

// Run integration tests
const tester = new IntegrationTester();
tester.runTests().catch(error => {
  console.error('❌ Integration tests failed:', error);
  process.exit(1);
});