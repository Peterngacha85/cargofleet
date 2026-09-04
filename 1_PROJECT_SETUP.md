# 1️⃣ PROJECT SETUP & ENVIRONMENT CONFIGURATION

**Complete installation and environment setup for CargoFleet backend and frontend**

---

## 📋 Table of Contents
1. [Prerequisites](#prerequisites)
2. [Project Structure](#project-structure)
3. [Backend Setup](#backend-setup)
4. [Frontend Setup](#frontend-setup)
5. [Environment Variables](#environment-variables)
6. [Running Locally](#running-locally)
7. [Troubleshooting](#troubleshooting)

---

## 🔧 Prerequisites

### System Requirements
```bash
# Check Node.js version (must be latest stable)
node --version      # v20.x or v22.x
npm --version       # 10.x or higher

# Install if not present
# macOS: brew install node
# Windows: Download from nodejs.org
# Linux: sudo apt install nodejs npm
```

### Required Accounts & Services
- ✅ MongoDB Atlas account (free tier available)
- ✅ Cloudflare account with R2 bucket
- ✅ Google Cloud Console (for OAuth credentials)
- ✅ Render.com account (backend hosting)
- ✅ Vercel account (frontend hosting)
- ✅ GitHub account (for pushing code)

### Tools to Install Globally
```bash
npm install -g typescript
npm install -g ts-node
npm install -g nodemon
npm install -g @vercel/cli
```

---

## 📁 Project Structure

```
cargofleet/
│
├── backend/                          # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.ts          # MongoDB connection
│   │   │   ├── environment.ts       # Env validation
│   │   │   └── cloudflare.ts        # R2 configuration
│   │   ├── controllers/
│   │   │   ├── authController.ts
│   │   │   ├── driverController.ts
│   │   │   ├── managerController.ts
│   │   │   ├── adminController.ts
│   │   │   ├── vehicleController.ts
│   │   │   ├── tripController.ts
│   │   │   ├── deliveryController.ts
│   │   │   ├── ratingController.ts
│   │   │   ├── branchController.ts
│   │   │   └── locationController.ts
│   │   ├── models/
│   │   │   ├── User.ts
│   │   │   ├── Driver.ts
│   │   │   ├── Manager.ts
│   │   │   ├── Vehicle.ts
│   │   │   ├── Trip.ts
│   │   │   ├── Delivery.ts
│   │   │   ├── Branch.ts
│   │   │   ├── LocationHistory.ts
│   │   │   ├── DriverRating.ts
│   │   │   ├── Photo.ts
│   │   │   └── Approval.ts
│   │   ├── routes/
│   │   │   ├── auth.ts
│   │   │   ├── driver.ts
│   │   │   ├── manager.ts
│   │   │   ├── admin.ts
│   │   │   ├── vehicle.ts
│   │   │   ├── trip.ts
│   │   │   ├── delivery.ts
│   │   │   ├── rating.ts
│   │   │   ├── branch.ts
│   │   │   └── location.ts
│   │   ├── middleware/
│   │   │   ├── auth.ts              # JWT validation
│   │   │   ├── superAdminAuth.ts    # Super Admin 2FA
│   │   │   ├── errorHandler.ts
│   │   │   ├── validation.ts        # Input validation
│   │   │   ├── rateLimiter.ts       # Rate limiting
│   │   │   └── cors.ts              # CORS config
│   │   ├── websocket/
│   │   │   ├── handlers.ts          # Socket.io event handlers
│   │   │   ├── namespaces.ts        # Namespace setup
│   │   │   └── emitters.ts          # Event broadcasting
│   │   ├── services/
│   │   │   ├── authService.ts
│   │   │   ├── driverService.ts
│   │   │   ├── fileService.ts       # Cloudflare R2 uploads
│   │   │   ├── locationService.ts
│   │   │   ├── ratingService.ts
│   │   │   └── paymentService.ts    # Phase 2
│   │   ├── types/
│   │   │   ├── index.ts             # Global types
│   │   │   ├── auth.ts
│   │   │   ├── driver.ts
│   │   │   ├── manager.ts
│   │   │   ├── vehicle.ts
│   │   │   └── websocket.ts
│   │   ├── utils/
│   │   │   ├── logger.ts            # Logging utility
│   │   │   ├── validators.ts        # Validation helpers
│   │   │   ├── errorHandler.ts
│   │   │   └── constants.ts
│   │   └── server.ts                # Main entry point
│   ├── tests/
│   │   ├── auth.test.ts
│   │   ├── driver.test.ts
│   │   ├── manager.test.ts
│   │   ├── vehicle.test.ts
│   │   ├── trip.test.ts
│   │   └── rating.test.ts
│   ├── .env.example                 # Environment template
│   ├── .env.test                    # Test environment
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── jest.config.js
│   └── nodemon.json
│
├── frontend/                         # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   ├── RegisterForm.tsx
│   │   │   │   └── GoogleAuthButton.tsx
│   │   │   ├── map/
│   │   │   │   ├── MapComponent.tsx
│   │   │   │   ├── MarkerPopup.tsx
│   │   │   │   └── GeofenceOverlay.tsx
│   │   │   ├── shared/
│   │   │   │   ├── Navbar.tsx
│   │   │   │   ├── Sidebar.tsx
│   │   │   │   ├── LoadingSpinner.tsx
│   │   │   │   ├── ErrorBoundary.tsx
│   │   │   │   └── NotificationCenter.tsx
│   │   │   ├── driver/
│   │   │   │   ├── DriverDashboard.tsx
│   │   │   │   ├── ActiveTrips.tsx
│   │   │   │   ├── ProofOfDelivery.tsx
│   │   │   │   └── PerformanceCard.tsx
│   │   │   ├── manager/
│   │   │   │   ├── ManagerDashboard.tsx
│   │   │   │   ├── TeamMap.tsx
│   │   │   │   ├── DriverApprovalList.tsx
│   │   │   │   ├── DriverRatingForm.tsx
│   │   │   │   └── BranchAnalytics.tsx
│   │   │   └── admin/
│   │   │       ├── AdminPanel.tsx
│   │   │       ├── BranchManagement.tsx
│   │   │       ├── ManagerVerification.tsx
│   │   │       ├── SystemAnalytics.tsx
│   │   │       └── UserManagement.tsx
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── NotFoundPage.tsx
│   │   │   └── UnauthorizedPage.tsx
│   │   ├── services/
│   │   │   ├── api.ts               # Axios instance
│   │   │   ├── authService.ts
│   │   │   ├── driverService.ts
│   │   │   ├── socketService.ts     # Socket.io client
│   │   │   ├── fileService.ts       # File upload
│   │   │   └── locationService.ts
│   │   ├── stores/
│   │   │   ├── authStore.ts         # Zustand or Redux
│   │   │   ├── driverStore.ts
│   │   │   ├── mapStore.ts
│   │   │   └── notificationStore.ts
│   │   ├── types/
│   │   │   ├── index.ts
│   │   │   ├── auth.ts
│   │   │   ├── driver.ts
│   │   │   ├── map.ts
│   │   │   └── api.ts
│   │   ├── utils/
│   │   │   ├── formatters.ts
│   │   │   ├── validators.ts
│   │   │   ├── storage.ts           # localStorage helpers
│   │   │   └── constants.ts
│   │   ├── hooks/
│   │   │   ├── useAuth.ts
│   │   │   ├── useLocation.ts
│   │   │   ├── useSocket.ts
│   │   │   └── useMap.ts
│   │   ├── styles/
│   │   │   ├── globals.css          # Charcoal, Lime, Soft Gray
│   │   │   ├── components.css
│   │   │   └── variables.css        # Color variables
│   │   ├── App.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── public/
│   │   ├── images/
│   │   ├── icons/
│   │   └── favicon.ico
│   ├── .env.example
│   ├── .env.local                   # Local development
│   ├── .gitignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   └── index.html
│
└── docs/
    ├── CARGOFLEET_README.md
    ├── 1_PROJECT_SETUP.md            (you are here)
    ├── 2_DATABASE_SCHEMA.md
    ├── 3_AUTHENTICATION.md
    ├── 4_API_ROUTES.md
    ├── 5_WEBSOCKET_EVENTS.md
    ├── 6_FRONTEND_COMPONENTS.md
    ├── 7_WORKFLOWS.md
    ├── 8_TESTING.md
    ├── 9_DEPLOYMENT.md
    ├── 10_SECURITY.md
    └── 11_PHASE_ROADMAP.md
```

---

## 🔙 BACKEND SETUP

### Step 1: Create Backend Project

```bash
# Create project directory
mkdir cargofleet
cd cargofleet
mkdir backend
cd backend

# Initialize Node project
npm init -y

# Add TypeScript
npm install -D typescript ts-node nodemon @types/node

# Initialize TypeScript
npx tsc --init

# Create src directory
mkdir -p src/{config,controllers,models,routes,middleware,websocket,services,types,utils}
mkdir tests
```

### Step 2: Install Backend Dependencies

```bash
# Core dependencies
npm install express cors dotenv mongoose socket.io

# Authentication
npm install jsonwebtoken bcryptjs
npm install -D @types/jsonwebtoken @types/bcryptjs

# Validation
npm install express-validator joi

# Rate limiting & security
npm install express-rate-limit helmet

# File uploads to Cloudflare R2
npm install aws-sdk @aws-sdk/client-s3

# Google OAuth
npm install google-auth-library

# Testing
npm install -D jest ts-jest supertest @types/jest @types/supertest

# Utilities
npm install uuid
npm install -D @types/uuid

# Environment validation
npm install zod

# Logging
npm install winston

# Other utilities
npm install axios date-fns
```

### Step 3: Configure TypeScript (tsconfig.json)

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "tests", "dist"]
}
```

### Step 4: Configure nodemon.json

```json
{
  "watch": ["src"],
  "ext": "ts",
  "ignore": ["src/**/*.spec.ts"],
  "exec": "ts-node",
  "env": {
    "NODE_ENV": "development"
  },
  "delay": 1000
}
```

### Step 5: Update package.json (Backend)

```json
{
  "name": "cargofleet-backend",
  "version": "1.0.0",
  "description": "CargoFleet Backend - Real-time Logistics Platform",
  "main": "dist/server.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "test": "jest --forceExit --detectOpenHandles",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "lint": "tsc --noEmit",
    "seed": "ts-node src/scripts/seed.ts"
  },
  "keywords": ["logistics", "tracking", "mern", "typescript"],
  "author": "Peter Ngacha | Fastweb Technologies",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "mongoose": "^7.6.3",
    "socket.io": "^4.7.2",
    "jsonwebtoken": "^9.1.1",
    "bcryptjs": "^2.4.3",
    "express-validator": "^7.0.0",
    "joi": "^17.11.0",
    "express-rate-limit": "^7.1.5",
    "helmet": "^7.1.0",
    "aws-sdk": "^2.1500.0",
    "@aws-sdk/client-s3": "^3.490.0",
    "google-auth-library": "^9.2.0",
    "uuid": "^9.0.1",
    "zod": "^3.22.4",
    "winston": "^3.11.0",
    "axios": "^1.6.2",
    "date-fns": "^2.30.0"
  },
  "devDependencies": {
    "typescript": "^5.2.2",
    "ts-node": "^10.9.1",
    "nodemon": "^3.0.1",
    "@types/node": "^20.10.5",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/bcryptjs": "^2.4.6",
    "@types/uuid": "^9.0.7",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.1",
    "supertest": "^6.3.3",
    "@types/jest": "^29.5.10",
    "@types/supertest": "^2.0.16"
  }
}
```

---

## 🎨 FRONTEND SETUP

### Step 1: Create Frontend Project with Vite

```bash
cd ..
npm create vite@latest frontend -- --template react-ts

cd frontend

# Or if you prefer to install manually:
npm install react react-dom react-router-dom

# TypeScript support is built-in with Vite template
```

### Step 2: Install Frontend Dependencies

```bash
# Core UI & Routing
npm install react-router-dom axios zustand

# Maps & Location
npm install leaflet react-leaflet
npm install -D @types/leaflet

# Real-time communication
npm install socket.io-client

# State Management (choose one)
npm install zustand
# OR: npm install redux @reduxjs/toolkit react-redux

# Form handling
npm install react-hook-form zod @hookform/resolvers

# Notifications/Toast
npm install react-toastify

# UI Components (optional)
npm install clsx
npm install lucide-react

# Date formatting
npm install date-fns

# File upload/progress
npm install react-dropzone

# Authentication
npm install @react-oauth/google

# Tailwind CSS (for styling - we'll use utility classes, no gradients)
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Development
npm install -D typescript @types/react @types/react-dom

# Testing
npm install -D vitest @testing-library/react @testing-library/jest-dom
```

### Step 3: Vite Configuration (vite.config.ts)

```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
```

### Step 4: Tailwind CSS Configuration

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --charcoal: #1F2937;
  --lime: #A3E635;
  --soft-gray: #F3F4F6;
}

body {
  background-color: var(--soft-gray);
  color: var(--charcoal);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
}

/* Remove all gradient utilities - override Tailwind */
.bg-gradient-to-r,
.bg-gradient-to-b,
.bg-gradient-to-l,
.bg-gradient-to-t {
  @apply !bg-none !bg-charcoal;
}
```

### Step 5: Update package.json (Frontend)

```json
{
  "name": "cargofleet-frontend",
  "version": "1.0.0",
  "description": "CargoFleet Frontend - Real-time Logistics Platform",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "lint": "tsc --noEmit"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "axios": "^1.6.2",
    "zustand": "^4.4.6",
    "socket.io-client": "^4.7.2",
    "leaflet": "^1.9.4",
    "react-leaflet": "^4.2.3",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.4",
    "@hookform/resolvers": "^3.3.3",
    "react-toastify": "^10.0.3",
    "react-dropzone": "^14.2.3",
    "@react-oauth/google": "^0.12.1",
    "date-fns": "^2.30.0",
    "lucide-react": "^0.294.0",
    "clsx": "^2.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.37",
    "@types/react-dom": "^18.2.15",
    "@types/leaflet": "^1.9.8",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.0.7",
    "tailwindcss": "^3.3.6",
    "postcss": "^8.4.31",
    "autoprefixer": "^10.4.16",
    "vitest": "^1.0.4",
    "@testing-library/react": "^14.1.2",
    "@testing-library/jest-dom": "^6.1.5"
  }
}
```

---

## 🔐 ENVIRONMENT VARIABLES

### Backend .env.example

Create `backend/.env.example`:

```env
# Server Configuration
NODE_ENV=development
PORT=5000
HOST=localhost

# Database
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/CARGOFLEET?retryWrites=true&w=majority

# JWT
JWT_SECRET=your_jwt_secret_key_here_min_32_chars
JWT_EXPIRY=7d
JWT_REFRESH_SECRET=your_refresh_secret_here_min_32_chars
JWT_REFRESH_EXPIRY=30d

# Google OAuth
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_ACCESS_KEY_ID=your_access_key
CLOUDFLARE_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=cargofleet-files
R2_ENDPOINT=https://<account-id>.r2.cloudflareclient.com

# Super Admin Configuration (3 slots available)
SUPER_ADMIN_1_EMAIL=admin1@cargofleet.co.ke
SUPER_ADMIN_1_PASSWORD=hashed_password_here
SUPER_ADMIN_1_SECRET_CODE=1234

SUPER_ADMIN_2_EMAIL=admin2@cargofleet.co.ke
SUPER_ADMIN_2_PASSWORD=hashed_password_here
SUPER_ADMIN_2_SECRET_CODE=5678

SUPER_ADMIN_3_EMAIL=admin3@cargofleet.co.ke
SUPER_ADMIN_3_PASSWORD=hashed_password_here
SUPER_ADMIN_3_SECRET_CODE=9012

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173

# WebSocket
SOCKET_IO_PORT=5000
SOCKET_IO_CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/webp

# Logging
LOG_LEVEL=info

# Timezone
TZ=Africa/Nairobi
```

### Frontend .env.example

Create `frontend/.env.example`:

```env
# Backend API
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000

# Google OAuth
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here

# Map Configuration
VITE_MAP_DEFAULT_LAT=-1.2865
VITE_MAP_DEFAULT_LNG=36.8172
VITE_MAP_DEFAULT_ZOOM=13

# Environment
VITE_ENV=development

# App Configuration
VITE_APP_NAME=CargoFleet
VITE_APP_VERSION=1.0.0
```

### Step: Hash Super Admin Passwords

```bash
# Create a simple script to hash passwords
# backend/scripts/hashPassword.ts

import bcrypt from 'bcryptjs';

const password = process.argv[2];
if (!password) {
  console.error('Please provide a password');
  process.exit(1);
}

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);
console.log('Hashed password:', hash);
```

Run to generate hashes:
```bash
npx ts-node backend/scripts/hashPassword.ts "your_password_here"
# Copy the hash and paste into .env file
```

---

## 🚀 RUNNING LOCALLY

### Terminal 1: Backend

```bash
cd backend

# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Should show:
# ✓ Server running on http://localhost:5000
# ✓ Connected to MongoDB
# ✓ WebSocket server ready
```

### Terminal 2: Frontend

```bash
cd frontend

# Install dependencies (if not done)
npm install

# Start development server
npm run dev

# Should show:
# ✓ Local: http://localhost:5173/
# ✓ press h to show help
```

### Terminal 3: Optional - Database Seeding

```bash
cd backend

# Seed initial branches
npm run seed

# This will create:
# - 5 branches (Nairobi, Mombasa, Kisumu, Nyeri, Nakuru)
# - Super admin users (from .env)
```

---

## 🧪 TESTING SETUP

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run specific test file
npm test -- auth.test.ts

# Run with coverage
npm test:coverage

# Watch mode
npm test:watch
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npm test

# UI mode
npm test:ui

# Coverage
npm test -- --coverage
```

---

## 🐛 TROUBLESHOOTING

### Issue: MongoDB Connection Fails

```bash
# Check MongoDB URI format
# Should be: mongodb+srv://username:password@cluster.mongodb.net/CARGOFLEET

# Verify:
# 1. Username/password are URL-encoded
# 2. IP whitelist includes your machine
# 3. Database "CARGOFLEET" exists in Atlas
```

### Issue: Cloudflare R2 Upload Fails

```bash
# Check credentials:
# 1. CLOUDFLARE_ACCESS_KEY_ID is correct
# 2. CLOUDFLARE_SECRET_ACCESS_KEY is correct
# 3. R2_BUCKET_NAME exists and is accessible
# 4. R2_ENDPOINT is in correct format
```

### Issue: Google OAuth Not Working

```bash
# Verify:
# 1. Google Client ID and Secret are correct
# 2. Redirect URI in Google Console matches GOOGLE_REDIRECT_URI
# 3. Frontend can access backend (CORS configured)
```

### Issue: WebSocket Connection Fails

```bash
# Check:
# 1. Socket.io port matches (usually same as API port)
# 2. FRONTEND_URL in backend .env allows WebSocket
# 3. No firewall blocking WebSocket connections
```

### Issue: Port Already in Use

```bash
# Kill process on port
# macOS/Linux:
lsof -i :5000  # Find PID
kill -9 <PID>

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Both `backend/` and `frontend/` directories created
- [ ] All dependencies installed (`npm install`)
- [ ] TypeScript configured and compiling
- [ ] `.env` files created and populated with real values
- [ ] MongoDB connection working
- [ ] Backend server starts without errors (port 5000)
- [ ] Frontend dev server starts without errors (port 5173)
- [ ] Can access http://localhost:5173 in browser
- [ ] WebSocket connection shows in browser console
- [ ] Jest tests run without crashing

---

## 📖 Next Steps

✅ **Setup complete!** Now proceed to:

→ **[2_DATABASE_SCHEMA.md](./2_DATABASE_SCHEMA.md)** - Understand the MongoDB collections and data models

---

*Last Updated: September 2026*  
*Questions? Contact: info@fastweb.co.ke | Fastweb Technologies | fastweb.co.ke*
