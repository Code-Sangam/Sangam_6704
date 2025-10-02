# 🚂 Railway Deployment Guide - Sangam Alumni Network

## 🎯 Why Railway is Perfect for Your App

Railway is specifically designed for full-stack applications like your alumni network:

✅ **Built-in PostgreSQL Database** - No separate setup needed
✅ **Socket.io Support** - Real-time chat works perfectly
✅ **Persistent Sessions** - Users stay logged in
✅ **File Upload Support** - Profile pictures and attachments work
✅ **Automatic Deployments** - Deploy from GitHub automatically
✅ **Environment Variables** - Secure configuration management
✅ **Custom Domains** - Professional URLs
✅ **SSL Certificates** - Automatic HTTPS

---

## 📋 Prerequisites

- ✅ GitHub account with your project
- ✅ 15 minutes of time
- ✅ Web browser

---

# 🚀 Step-by-Step Deployment

## Step 1: Create Railway Account

### 1.1 Sign Up for Railway
1. Go to [railway.app](https://railway.app)
2. Click **"Login"** in the top right
3. Click **"Login with GitHub"**
4. **Authorize Railway** to access your GitHub account
5. Complete your profile setup

### 1.2 Verify Your Account
1. Check your email for verification
2. Click the verification link
3. Return to Railway dashboard

---

## Step 2: Create New Project

### 2.1 Deploy from GitHub
1. In Railway dashboard, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your `sangam-alumni-network` repository
4. Click **"Deploy Now"**

### 2.2 Wait for Initial Deployment
1. Railway will automatically detect your Node.js app
2. It will start building and deploying
3. This takes about 2-3 minutes
4. You'll see logs in real-time

---

## Step 3: Add PostgreSQL Database

### 3.1 Add Database Service
1. In your project dashboard, click **"+ New"**
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Wait for database to be created (1-2 minutes)

### 3.2 Get Database Connection Details
1. Click on your **PostgreSQL service**
2. Go to **"Connect"** tab
3. Copy the **"DATABASE_URL"** (it looks like):
   ```
   postgresql://postgres:password@containers-us-west-xxx.railway.app:5432/railway
   ```
4. **Save this URL** - you'll need it in the next step

---

## Step 4: Configure Environment Variables

### 4.1 Access Your Web Service
1. Click on your **web service** (not the database)
2. Go to **"Variables"** tab
3. You'll add environment variables here

### 4.2 Add Required Variables
Click **"New Variable"** for each of these:

| Variable Name | Value | Description |
|---------------|-------|-------------|
| `NODE_ENV` | `production` | Environment mode |
| `PORT` | `3000` | Server port |
| `DATABASE_URL` | `[paste your database URL]` | Database connection |
| `SESSION_SECRET` | `your-super-secret-key-change-this-12345` | Session encryption |
| `BCRYPT_ROUNDS` | `12` | Password hashing strength |
| `UPLOAD_DIR` | `uploads` | File upload directory |
| `MAX_FILE_SIZE` | `10485760` | Max file size (10MB) |
| `ALLOWED_FILE_TYPES` | `jpg,jpeg,png,gif,pdf,doc,docx` | Allowed file types |

### 4.3 Optional Variables (Recommended)
| Variable Name | Value | Description |
|---------------|-------|-------------|
| `SITE_NAME` | `Your Alumni Network` | Site branding |
| `CONTACT_EMAIL` | `admin@yourdomain.com` | Contact email |
| `LOG_LEVEL` | `info` | Logging level |

---

## Step 5: Configure Build Settings

### 5.1 Update Build Configuration
1. In your web service, go to **"Settings"** tab
2. Scroll to **"Source"** section
3. Set **Root Directory**: `server`
4. Railway will automatically detect your Node.js app and configure build/start commands

### 5.2 Deploy with New Settings
1. Go to **"Deployments"** tab
2. Click **"Deploy"** to trigger a new deployment
3. Wait for deployment to complete (3-5 minutes)

---

## Step 6: Run Database Migrations

### 6.1 Access Railway CLI (Optional Method)
If you want to run migrations manually:
1. Install Railway CLI: `npm install -g @railway/cli`
2. Login: `railway login`
3. Link project: `railway link`
4. Run migrations: `railway run npm run db:migrate`

### 6.2 Automatic Migration (Recommended)
Your app is configured to run migrations automatically on startup, so this should happen automatically.

---

## Step 7: Test Your Deployment

### 7.1 Access Your Application
1. In Railway dashboard, go to your **web service**
2. Click **"Settings"** tab
3. Scroll to **"Domains"**
4. You'll see your Railway URL: `https://your-app-name.up.railway.app`
5. **Click the URL** to open your app

### 7.2 Test Core Functionality
1. ✅ **Homepage loads** correctly
2. ✅ **Register a new account**
3. ✅ **Login with your account**
4. ✅ **Upload a profile picture**
5. ✅ **Test real-time chat**
6. ✅ **Check all pages load**

---

## Step 8: Set Up Custom Domain (Optional)

### 8.1 Add Your Domain
1. In your web service **"Settings"**
2. Scroll to **"Domains"**
3. Click **"Custom Domain"**
4. Enter your domain: `yourdomain.com`

### 8.2 Configure DNS
1. Go to your domain registrar (GoDaddy, Namecheap, etc.)
2. Add a **CNAME record**:
   - **Name**: `@` (or `www`)
   - **Value**: `your-app-name.up.railway.app`
3. Wait 5-10 minutes for DNS propagation

---

# 🔧 Advanced Configuration

## Automatic Deployments

### Enable Auto-Deploy
1. Go to your web service **"Settings"**
2. Scroll to **"Source Repo"**
3. Enable **"Auto Deploy"**
4. Choose branch: `main` or `master`
5. Now every push to GitHub will auto-deploy!

## Environment-Specific Settings

### Production Optimizations
Add these variables for better production performance:

| Variable | Value | Purpose |
|----------|-------|---------|
| `NODE_OPTIONS` | `--max-old-space-size=1024` | Memory optimization |
| `NPM_CONFIG_PRODUCTION` | `true` | Skip dev dependencies |
| `COMPRESSION_ENABLED` | `true` | Enable gzip compression |

## Monitoring and Logs

### View Application Logs
1. Go to your web service
2. Click **"Deployments"** tab
3. Click on latest deployment
4. View real-time logs

### Set Up Alerts
1. Go to **"Settings"** → **"Alerts"**
2. Enable **"Deployment Failed"** alerts
3. Enable **"Service Down"** alerts
4. Add your email for notifications

---

# 🚨 Troubleshooting

## Common Issues and Solutions

### Issue 1: Repeated Error Log Files (logs.XXXXXXXXX.json)
**Symptoms**: Deployment keeps failing with error log files

**Step-by-Step Solution**:

**Step 1: Use Simplified Server**
The project now includes a simplified server (`app-simple.js`) that should work:
1. **Commit and push** the latest changes
2. **Wait for Railway to redeploy**
3. **Test**: `https://your-app.up.railway.app/`

**Step 2: Check Railway Settings**
1. Go to Railway service → **Settings** → **Source**
2. Set **Root Directory** to `server`
3. **Redeploy**

**Step 3: Verify Environment Variables**
1. Go to Railway service → **Variables**
2. **Add PostgreSQL database** if not already added:
   - Click **"+ New"** → **"Database"** → **"PostgreSQL"**
3. **Check required variables**:
   - `DATABASE_URL` (should be automatic)
   - `NODE_ENV` = `production`
   - `SESSION_SECRET` = `your-secret-key`

**Step 4: Test Endpoints**
After deployment, test these URLs:
- `https://your-app.up.railway.app/` (main page)
- `https://your-app.up.railway.app/health` (server status)
- `https://your-app.up.railway.app/debug` (detailed info)
- `https://your-app.up.railway.app/test-db` (database test)

**Step 5: Check Railway Logs**
1. Go to **Deployments** tab
2. Click on latest deployment
3. **Read the full error logs**
4. Look for specific error messages

### Issue 2: 404 Error After Successful Deployment
**Symptoms**: Deployment completes but website shows "page can't be found" or 404 error

**Solutions**:
1. **Use the simplified server** (should be automatic now)
2. **Check Railway Root Directory** setting
3. **Test the health endpoint** first

### Issue 2: Error Log Files During Deployment
**Symptoms**: Deployment shows error files like "logs.1759411337420.json"

**Solutions**:
1. **Check Railway logs** for the actual error details:
   - Go to your service in Railway
   - Click "Deployments" tab
   - Click on the failed deployment
   - Read the full error logs
2. **Common causes**:
   - Missing `DATABASE_URL` environment variable
   - Incorrect database connection settings
   - Missing required environment variables
3. **Quick fix**: Ensure `DATABASE_URL` is set correctly in Railway

### Issue 2: Docker Build Errors (webpack.config.js not found)
**Symptoms**: Build fails with "webpack.config.js not found" or similar Docker errors

**Solutions**:
1. **Remove Dockerfile** from your repository (Railway auto-detection is better)
2. **Set Root Directory** to `server` in Railway settings
3. **Let Railway auto-detect** your Node.js app
4. **Redeploy** after removing Docker files

### Issue 2: "Application Error" or Crash
**Symptoms**: App shows error page or won't start

**Solutions**:
1. **Check logs** in Railway dashboard
2. **Verify DATABASE_URL** is correct
3. **Ensure all environment variables** are set
4. **Check if database is running**

### Issue 2: Database Connection Failed
**Symptoms**: "Connection refused" or "Database not found"

**Solutions**:
1. **Verify DATABASE_URL** format
2. **Check PostgreSQL service** is running
3. **Regenerate database credentials**:
   - Go to PostgreSQL service
   - Settings → "Danger" → "Reset Credentials"

### Issue 3: File Uploads Not Working
**Symptoms**: Profile pictures or files won't upload

**Solutions**:
1. **Check file size limits** in environment variables
2. **Verify UPLOAD_DIR** is set correctly
3. **Check file type restrictions**

### Issue 4: Sessions Not Persisting
**Symptoms**: Users get logged out frequently

**Solutions**:
1. **Check SESSION_SECRET** is set
2. **Verify database connection** for session storage
3. **Check if cookies are enabled** in browser

### Issue 5: Real-time Chat Not Working
**Symptoms**: Messages don't appear in real-time

**Solutions**:
1. **Check browser console** for WebSocket errors
2. **Verify Socket.io configuration**
3. **Test with different browsers**
4. **Check firewall/proxy settings**

---

# 📊 Monitoring Your Railway Deployment

## Performance Metrics

### View Usage Statistics
1. Go to your project dashboard
2. Click **"Metrics"** tab
3. Monitor:
   - **CPU usage**
   - **Memory consumption**
   - **Network traffic**
   - **Response times**

### Resource Limits
Railway free tier includes:
- **512MB RAM**
- **1GB disk space**
- **100GB bandwidth/month**
- **500 hours execution time/month**

## Database Monitoring

### PostgreSQL Metrics
1. Click on your **PostgreSQL service**
2. Go to **"Metrics"** tab
3. Monitor:
   - **Connection count**
   - **Query performance**
   - **Storage usage**
   - **Backup status**

---

# 🎉 Congratulations!

## What You've Accomplished

✅ **Professional Hosting** - Your app is live on Railway's infrastructure
✅ **Automatic HTTPS** - SSL certificate included
✅ **Scalable Database** - PostgreSQL with automatic backups
✅ **Real-time Features** - Chat and notifications work perfectly
✅ **File Upload Support** - Profile pictures and attachments
✅ **Session Management** - Users stay logged in properly
✅ **Auto Deployments** - Updates deploy automatically from GitHub

## Your Live Application

🌐 **URL**: `https://your-app-name.up.railway.app`
📊 **Dashboard**: [railway.app/dashboard](https://railway.app/dashboard)
📚 **Documentation**: [docs.railway.app](https://docs.railway.app)

## Next Steps

1. **🎨 Customize** - Update branding, colors, and content
2. **👥 Invite Users** - Share your URL with alumni
3. **📈 Monitor** - Keep an eye on usage and performance
4. **🔄 Update** - Push changes to GitHub for auto-deployment
5. **💰 Scale** - Upgrade to paid plan as you grow

---

# 💡 Pro Tips for Railway

## Cost Optimization

### Stay Within Free Limits
- **Monitor usage** in Railway dashboard
- **Optimize images** before uploading
- **Use efficient database queries**
- **Enable compression** for better performance

### Upgrade When Ready
- **Hobby Plan**: $5/month for more resources
- **Pro Plan**: $20/month for production features
- **Team Plan**: $20/month per seat for collaboration

## Performance Tips

### Database Optimization
- **Add indexes** to frequently queried columns
- **Use connection pooling** (already configured)
- **Regular backups** (automatic on Railway)
- **Monitor slow queries**

### Application Performance
- **Enable caching** where appropriate
- **Optimize images** and static assets
- **Use CDN** for static files (Cloudflare free tier)
- **Monitor memory usage**

---

**🎊 Your Alumni Network is Now Live on Railway! 🚂**

**Railway provides the perfect environment for your full-featured alumni network with real-time chat, user management, and file sharing capabilities!**