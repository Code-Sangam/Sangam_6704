# Sangam - Alumni Network Setup Guide

A modern Next.js-based alumni networking platform that connects students and alumni for mentorship, career guidance, and community building.

## 🚀 Quick Start

### Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v18 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js) or **yarn**
- **Git** - [Download here](https://git-scm.com/)
- A code editor like **VS Code** - [Download here](https://code.visualstudio.com/)

### Step 1: Clone or Download the Project

**Option A: If you have the project as a ZIP file:**
1. Extract the ZIP file to your desired location
2. Open terminal/command prompt
3. Navigate to the project folder:
   ```bash
   cd "path/to/your/project/folder"
   ```

**Option B: If cloning from Git:**
```bash
git clone <repository-url>
cd sangam-alumni-network
```

### Step 2: Install Dependencies

Run the following command in your project directory:

```bash
npm install
```

This will install all the required packages listed in `package.json`.

### Step 3: Start Development Server

```bash
npm run dev
```

The application will start on `http://localhost:3000`

Open your browser and navigate to `http://localhost:3000` to see the application running.

## 🌐 Deployment Options

### Option 1: Vercel (Recommended - Free & Easy)

Vercel is the easiest way to deploy Next.js applications and offers a generous free tier.

#### Step-by-Step Vercel Deployment:

1. **Create a Vercel Account:**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub, GitLab, or Bitbucket

2. **Prepare Your Code:**
   - If not already done, push your code to a Git repository (GitHub, GitLab, or Bitbucket)
   - Make sure all your changes are committed and pushed

3. **Deploy via Vercel Dashboard:**
   - Login to your Vercel dashboard
   - Click "New Project"
   - Import your repository
   - Vercel will automatically detect it's a Next.js project
   - Click "Deploy"

4. **Deploy via Vercel CLI (Alternative):**
   ```bash
   # Install Vercel CLI globally
   npm install -g vercel
   
   # Login to Vercel
   vercel login
   
   # Deploy from your project directory
   vercel
   
   # Follow the prompts:
   # - Set up and deploy? Y
   # - Which scope? (select your account)
   # - Link to existing project? N
   # - What's your project's name? sangam-alumni-network
   # - In which directory is your code located? ./
   ```

5. **Production Deployment:**
   ```bash
   vercel --prod
   ```

#### Vercel Configuration:

Your `vercel.json` (optional, Vercel auto-detects Next.js):
```json
{
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ]
}
```

### Option 2: Netlify

1. **Create Netlify Account:**
   - Go to [netlify.com](https://netlify.com)
   - Sign up with GitHub, GitLab, or Bitbucket

2. **Build Settings:**
   - Build command: `npm run build`
   - Publish directory: `.next`

3. **Deploy:**
   - Connect your repository
   - Set build settings
   - Deploy

### Option 3: Traditional Web Hosting

For shared hosting providers that support Node.js:

1. **Build the application:**
   ```bash
   npm run build
   ```

2. **Upload files:**
   - Upload the entire project folder to your hosting provider
   - Make sure Node.js is enabled on your hosting account

3. **Install dependencies on server:**
   ```bash
   npm install --production
   ```

4. **Start the application:**
   ```bash
   npm start
   ```

### Option 4: Self-Hosted (VPS/Cloud Server)

#### Using PM2 (Process Manager):

1. **Install PM2:**
   ```bash
   npm install -g pm2
   ```

2. **Build the application:**
   ```bash
   npm run build
   ```

3. **Start with PM2:**
   ```bash
   pm2 start npm --name "sangam-app" -- start
   pm2 save
   pm2 startup
   ```

#### Using Docker:

1. **Create Dockerfile:**
   ```dockerfile
   FROM node:18-alpine

   WORKDIR /app

   COPY package*.json ./
   RUN npm ci --only=production

   COPY . .
   RUN npm run build

   EXPOSE 3000

   CMD ["npm", "start"]
   ```

2. **Build and run:**
   ```bash
   docker build -t sangam-app .
   docker run -p 3000:3000 sangam-app
   ```

## 🔧 Configuration

### Environment Variables (Optional)

Create a `.env.local` file in the root directory for environment-specific configurations:

```env
# Example environment variables
NEXT_PUBLIC_APP_NAME=Sangam
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Add any API keys or configuration here
# NEXT_PUBLIC_API_URL=your-api-url
# DATABASE_URL=your-database-url
```

### Customization

#### Update Branding:
1. **Logo:** Replace logo in `public/` folder
2. **Colors:** Modify colors in `src/app/globals.css` and Tailwind configuration
3. **Content:** Update text content in component files

#### Add Features:
1. **Database:** The app is ready for database integration with Drizzle ORM and better-auth
2. **Authentication:** Authentication system is already set up with better-auth
3. **API Routes:** Add API routes in `src/app/api/` directory

## 📂 Project Structure

```
sangam-alumni-network/
├── public/                 # Static assets
├── src/
│   ├── app/               # Next.js App Router pages
│   │   ├── page.tsx       # Home page
│   │   ├── chat/          # Chat functionality
│   │   ├── profile/       # User profiles
│   │   ├── settings/      # Settings page
│   │   ├── login/         # Authentication
│   │   └── register/      # User registration
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # Base UI components
│   │   └── auth/         # Authentication components
│   ├── hooks/            # Custom React hooks
│   └── lib/              # Utility functions
├── package.json          # Dependencies and scripts
├── next.config.ts        # Next.js configuration
├── tailwind.config.js    # Tailwind CSS configuration
└── tsconfig.json         # TypeScript configuration
```

## 🛠️ Available Scripts

```bash
# Development
npm run dev          # Start development server with Turbopack

# Production
npm run build        # Build for production
npm start           # Start production server

# Maintenance
npm run lint        # Run ESLint for code quality
```

## 🎯 Features

### Current Features:
- ✅ **Modern UI/UX** - Clean, professional design with dark theme
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile
- ✅ **User Profiles** - Detailed alumni and student profiles
- ✅ **Chat System** - Real-time messaging interface
- ✅ **Settings Management** - Comprehensive settings with multiple sections
- ✅ **Authentication UI** - Login and registration forms
- ✅ **Navigation** - Smooth navigation between pages
- ✅ **Mentorship Display** - Ratings and mentorship information

### Ready for Enhancement:
- 🔄 **Database Integration** - Drizzle ORM and LibSQL ready
- 🔄 **Real Authentication** - better-auth integration prepared
- 🔄 **Real-time Chat** - WebSocket integration ready
- 🔄 **File Uploads** - Image upload for profiles
- 🔄 **Search & Filtering** - Advanced user search
- 🔄 **Notifications** - Real-time notifications system

## 🔒 Security & Performance

### Built-in Security:
- CSRF protection with Next.js
- Environment variable protection
- Secure authentication setup with better-auth
- Input validation ready for implementation

### Performance Features:
- Next.js 15 with App Router for optimal performance
- Static generation for faster loading
- Optimized images and assets
- Minimal bundle size with tree shaking

## 🆘 Troubleshooting

### Common Issues:

1. **Port 3000 already in use:**
   ```bash
   # Use a different port
   npm run dev -- -p 3001
   ```

2. **Build errors:**
   ```bash
   # Clear cache and reinstall
   rm -rf .next node_modules package-lock.json
   npm install
   npm run build
   ```

3. **Module not found errors:**
   ```bash
   # Ensure all dependencies are installed
   npm install
   ```

4. **TypeScript errors:**
   ```bash
   # Check TypeScript configuration
   npx tsc --noEmit
   ```

### Getting Help:

1. **Check the browser console** for error messages
2. **Check the terminal** where you ran `npm run dev` for server errors
3. **Verify all dependencies** are installed with `npm install`
4. **Check Node.js version** with `node --version` (should be 18+)

## 📞 Support

For technical support or questions about the codebase:
1. Check this README first
2. Look for error messages in browser console and terminal
3. Verify all setup steps were followed correctly
4. Check that all dependencies installed properly

## 🎉 Success!

Once deployed, your Sangam Alumni Network platform will be live and ready for users to:
- Create profiles as alumni or students
- Connect with mentors and mentees
- Chat with community members
- Manage their account settings
- Build meaningful professional relationships

The application is designed to be scalable and can handle growing user bases with proper hosting infrastructure.