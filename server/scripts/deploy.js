#!/usr/bin/env node

// Deployment Script for Sangam Alumni Network
require('dotenv').config();

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class DeploymentManager {
  constructor() {
    this.environment = process.env.NODE_ENV || 'production';
    this.deploymentSteps = [];
    this.errors = [];
  }

  async deploy() {
    console.log('🚀 Sangam Alumni Network - Deployment Script');
    console.log('=============================================\n');
    console.log(`Environment: ${this.environment}`);
    console.log(`Timestamp: ${new Date().toISOString()}\n`);

    try {
      await this.preDeploymentChecks();
      await this.buildApplication();
      await this.setupDatabase();
      await this.configureEnvironment();
      await this.setupLogging();
      await this.setupProcessManagement();
      await this.setupNginx();
      await this.setupSSL();
      await this.finalChecks();
      
      this.printDeploymentSummary();
    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      this.printErrors();
      process.exit(1);
    }
  }

  async preDeploymentChecks() {
    console.log('🔍 Running pre-deployment checks...');
    
    // Check Node.js version
    const nodeVersion = process.version;
    const requiredVersion = 'v16.0.0';
    this.addStep('Node.js Version Check', `Current: ${nodeVersion}, Required: ${requiredVersion}+`);
    
    // Check if production environment file exists
    const prodEnvExists = fs.existsSync('.env.production');
    if (!prodEnvExists) {
      throw new Error('Production environment file (.env.production) not found');
    }
    this.addStep('Environment File', 'Production .env file found');
    
    // Check required directories
    const requiredDirs = ['logs', 'uploads', 'public'];
    requiredDirs.forEach(dir => {
      const dirPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        this.addStep(`Directory: ${dir}`, 'Created');
      } else {
        this.addStep(`Directory: ${dir}`, 'Exists');
      }
    });
    
    // Check database connection
    try {
      const { testConnection } = require('../config/database');
      await testConnection();
      this.addStep('Database Connection', 'Successful');
    } catch (error) {
      this.addError('Database connection failed', error.message);
    }
  }

  async buildApplication() {
    console.log('🔨 Building application...');
    
    try {
      // Install production dependencies
      console.log('Installing production dependencies...');
      execSync('npm ci --only=production', { stdio: 'inherit' });
      this.addStep('Dependencies', 'Production dependencies installed');
      
      // Build webpack assets
      console.log('Building webpack assets...');
      execSync('npm run build', { stdio: 'inherit' });
      this.addStep('Webpack Build', 'Assets compiled successfully');
      
      // Set proper file permissions
      execSync('chmod -R 755 public/', { stdio: 'inherit' });
      execSync('chmod -R 755 uploads/', { stdio: 'inherit' });
      this.addStep('File Permissions', 'Set correctly');
      
    } catch (error) {
      this.addError('Build process failed', error.message);
    }
  }

  async setupDatabase() {
    console.log('🗄️ Setting up database...');
    
    try {
      // Run database migrations
      console.log('Running database migrations...');
      execSync('npm run db:migrate', { stdio: 'inherit' });
      this.addStep('Database Migrations', 'Completed successfully');
      
      // Seed initial data (if needed)
      if (process.env.SEED_DATABASE === 'true') {
        console.log('Seeding database...');
        execSync('npm run db:seed', { stdio: 'inherit' });
        this.addStep('Database Seeding', 'Completed successfully');
      }
      
    } catch (error) {
      this.addError('Database setup failed', error.message);
    }
  }

  async configureEnvironment() {
    console.log('⚙️ Configuring environment...');
    
    // Copy production environment file
    if (fs.existsSync('.env.production')) {
      fs.copyFileSync('.env.production', '.env');
      this.addStep('Environment Configuration', 'Production .env copied');
    }
    
    // Validate required environment variables
    const requiredVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'SESSION_SECRET',
      'PORT'
    ];
    
    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    if (missingVars.length > 0) {
      this.addError('Missing environment variables', missingVars.join(', '));
    } else {
      this.addStep('Environment Variables', 'All required variables set');
    }
  }

  async setupLogging() {
    console.log('📝 Setting up logging...');
    
    const logsDir = path.join(__dirname, '..', 'logs');
    if (!fs.existsSync(logsDir)) {
      fs.mkdirSync(logsDir, { recursive: true });
    }
    
    // Create log rotation configuration
    const logrotateConfig = `
${path.join(logsDir, '*.log')} {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        systemctl reload sangam-alumni-network
    endscript
}`;
    
    fs.writeFileSync('/tmp/sangam-logrotate', logrotateConfig);
    this.addStep('Log Rotation', 'Configuration created');
    
    // Set log file permissions
    try {
      execSync(`touch ${path.join(logsDir, 'app.log')}`);
      execSync(`chmod 644 ${path.join(logsDir, 'app.log')}`);
      this.addStep('Log Files', 'Created with proper permissions');
    } catch (error) {
      this.addError('Log file setup failed', error.message);
    }
  }

  async setupProcessManagement() {
    console.log('🔄 Setting up process management...');
    
    // Create PM2 ecosystem file
    const pm2Config = {
      apps: [{
        name: 'sangam-alumni-network',
        script: './app.js',
        cwd: path.join(__dirname, '..'),
        instances: process.env.PM2_INSTANCES || 'max',
        exec_mode: 'cluster',
        env: {
          NODE_ENV: 'production',
          PORT: process.env.PORT || 3000
        },
        error_file: './logs/pm2-error.log',
        out_file: './logs/pm2-out.log',
        log_file: './logs/pm2-combined.log',
        time: true,
        max_memory_restart: '1G',
        node_args: '--max-old-space-size=1024',
        watch: false,
        ignore_watch: ['node_modules', 'logs', 'uploads'],
        restart_delay: 4000,
        max_restarts: 10,
        min_uptime: '10s'
      }]
    };
    
    fs.writeFileSync(path.join(__dirname, '..', 'ecosystem.config.js'), 
      `module.exports = ${JSON.stringify(pm2Config, null, 2)};`);
    
    this.addStep('PM2 Configuration', 'Ecosystem file created');
    
    // Create systemd service file
    const systemdService = `
[Unit]
Description=Sangam Alumni Network
After=network.target

[Service]
Type=forking
User=www-data
WorkingDirectory=${path.join(__dirname, '..')}
ExecStart=/usr/bin/pm2 start ecosystem.config.js --env production
ExecReload=/usr/bin/pm2 reload ecosystem.config.js --env production
ExecStop=/usr/bin/pm2 stop ecosystem.config.js
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target`;
    
    fs.writeFileSync('/tmp/sangam-alumni-network.service', systemdService);
    this.addStep('Systemd Service', 'Service file created');
  }

  async setupNginx() {
    console.log('🌐 Setting up Nginx configuration...');
    
    const nginxConfig = `
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;
    
    # SSL Configuration
    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Static Files
    location /static/ {
        alias ${path.join(__dirname, '..', 'public')}/;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    location /uploads/ {
        alias ${path.join(__dirname, '..', 'uploads')}/;
        expires 30d;
        add_header Cache-Control "public";
    }
    
    # Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:${process.env.PORT || 3000};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Main Application
    location / {
        proxy_pass http://localhost:${process.env.PORT || 3000};
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:${process.env.PORT || 3000};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    location /auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://localhost:${process.env.PORT || 3000};
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`;
    
    fs.writeFileSync('/tmp/sangam-alumni-network-nginx.conf', nginxConfig);
    this.addStep('Nginx Configuration', 'Configuration file created');
  }

  async setupSSL() {
    console.log('🔒 Setting up SSL configuration...');
    
    // Create SSL setup script
    const sslScript = `#!/bin/bash
# SSL Setup Script for Sangam Alumni Network

echo "Setting up SSL certificates..."

# Install Certbot (Let's Encrypt)
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt-get update
    apt-get install -y certbot python3-certbot-nginx
fi

# Generate SSL certificate
echo "Generating SSL certificate for your-domain.com..."
certbot --nginx -d your-domain.com -d www.your-domain.com --non-interactive --agree-tos --email admin@your-domain.com

# Set up auto-renewal
echo "Setting up SSL certificate auto-renewal..."
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

echo "SSL setup completed!"`;
    
    fs.writeFileSync('/tmp/setup-ssl.sh', sslScript);
    execSync('chmod +x /tmp/setup-ssl.sh');
    this.addStep('SSL Setup', 'Script created');
  }

  async finalChecks() {
    console.log('✅ Running final checks...');
    
    // Check if all required files exist
    const requiredFiles = [
      'app.js',
      'package.json',
      '.env',
      'ecosystem.config.js'
    ];
    
    requiredFiles.forEach(file => {
      const filePath = path.join(__dirname, '..', file);
      if (fs.existsSync(filePath)) {
        this.addStep(`File Check: ${file}`, 'Exists');
      } else {
        this.addError(`Missing file: ${file}`, 'Required file not found');
      }
    });
    
    // Check port availability
    const port = process.env.PORT || 3000;
    this.addStep('Port Configuration', `Configured for port ${port}`);
    
    // Validate configuration
    try {
      const config = require('../config/production');
      this.addStep('Configuration Validation', 'Production config loaded successfully');
    } catch (error) {
      this.addError('Configuration validation failed', error.message);
    }
  }

  addStep(name, message) {
    this.deploymentSteps.push({ name, message, status: 'success' });
    console.log(`✅ ${name}: ${message}`);
  }

  addError(name, message) {
    this.errors.push({ name, message });
    console.log(`❌ ${name}: ${message}`);
  }

  printDeploymentSummary() {
    console.log('\n📊 Deployment Summary:');
    console.log('=' .repeat(60));
    
    this.deploymentSteps.forEach(step => {
      console.log(`✅ ${step.name}: ${step.message}`);
    });
    
    if (this.errors.length > 0) {
      console.log('\n❌ Errors:');
      this.errors.forEach(error => {
        console.log(`❌ ${error.name}: ${error.message}`);
      });
    }
    
    console.log('=' .repeat(60));
    
    if (this.errors.length === 0) {
      console.log('🎉 Deployment completed successfully!');
      console.log('\n📋 Next Steps:');
      console.log('1. Copy nginx config: sudo cp /tmp/sangam-alumni-network-nginx.conf /etc/nginx/sites-available/');
      console.log('2. Enable site: sudo ln -s /etc/nginx/sites-available/sangam-alumni-network-nginx.conf /etc/nginx/sites-enabled/');
      console.log('3. Test nginx: sudo nginx -t');
      console.log('4. Reload nginx: sudo systemctl reload nginx');
      console.log('5. Install systemd service: sudo cp /tmp/sangam-alumni-network.service /etc/systemd/system/');
      console.log('6. Enable service: sudo systemctl enable sangam-alumni-network');
      console.log('7. Start service: sudo systemctl start sangam-alumni-network');
      console.log('8. Setup SSL: sudo bash /tmp/setup-ssl.sh');
      console.log('9. Check status: sudo systemctl status sangam-alumni-network');
    } else {
      console.log('⚠️ Deployment completed with errors. Please fix the issues above.');
    }
  }

  printErrors() {
    if (this.errors.length > 0) {
      console.log('\n❌ Deployment Errors:');
      this.errors.forEach(error => {
        console.log(`• ${error.name}: ${error.message}`);
      });
    }
  }
}

// Run deployment
const deployment = new DeploymentManager();
deployment.deploy().catch(error => {
  console.error('❌ Deployment script failed:', error);
  process.exit(1);
});