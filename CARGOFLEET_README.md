# 🚚 CargoFleet.co.ke - Real-Time Logistics Platform

**Production-Ready MERN Stack Logistics Management System**

---

## 📋 Quick Navigation

| Document | Purpose |
|----------|---------|
| **README** (you are here) | Project overview & architecture |
| **[1_PROJECT_SETUP.md](./1_PROJECT_SETUP.md)** | Installation, dependencies, environment setup |
| **[2_DATABASE_SCHEMA.md](./2_DATABASE_SCHEMA.md)** | MongoDB collections, relationships, indexes |
| **[3_AUTHENTICATION.md](./3_AUTHENTICATION.md)** | Auth flows, Super Admin 2FA, Google OAuth, JWT |
| **[4_API_ROUTES.md](./4_API_ROUTES.md)** | All REST endpoints with request/response examples |
| **[5_WEBSOCKET_EVENTS.md](./5_WEBSOCKET_EVENTS.md)** | Socket.io namespaces and real-time event handlers |
| **[6_FRONTEND_COMPONENTS.md](./6_FRONTEND_COMPONENTS.md)** | React component structure and hierarchy |
| **[7_WORKFLOWS.md](./7_WORKFLOWS.md)** | Driver/Manager registration & approval flows |
| **[8_TESTING.md](./8_TESTING.md)** | Jest setup and test examples |
| **[9_DEPLOYMENT.md](./9_DEPLOYMENT.md)** | Vercel (frontend) + Render (backend) deployment |
| **[10_SECURITY.md](./10_SECURITY.md)** | Security implementation, rate limiting, CORS |
| **[11_PHASE_ROADMAP.md](./11_PHASE_ROADMAP.md)** | MVP Phase 1, Phase 2, Phase 3 roadmap |

---

## 🎯 Project Overview

### What is CargoFleet?
A **real-time logistics tracking platform** built for courier and delivery services in Kenya and East Africa. Track drivers, vehicles, deliveries, and performance metrics in real-time with a modern, responsive dashboard.

### Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React + TypeScript + Vite | Latest Stable |
| **Backend** | Node.js + Express + TypeScript | Latest Stable |
| **Real-Time** | Socket.io | Stable |
| **Database** | MongoDB Atlas (Cloud) | Latest |
| **File Storage** | Cloudflare R2 | S3-compatible |
| **Authentication** | JWT + Google OAuth + Email/Password | Custom |
| **Testing** | Jest + Supertest | Stable |
| **Deployment** | Vercel (Frontend) + Render (Backend) | Production |

### Color Scheme (No Gradients)
```
Primary: Charcoal #1F2937 (backgrounds, text)
Accent:  Lime     #A3E635 (CTAs, highlights, moving indicators)
Neutral: Soft Gray #F3F4F6 (cards, secondary elements)
```

---

## 👥 User Roles & Access Levels

### 1. **Super Admin** (Environment Variable Based)
- ✅ Manage all system functions
- ✅ Create/edit/delete branches
- ✅ Verify manager registrations
- ✅ Approve photo deletions
- ✅ View system-wide analytics
- ✅ Manage user accounts
- **Authentication:** Email + Password + 4-Digit Secret Code (2FA)
- **Max Users:** 3 (via .env)

### 2. **Branch Manager** (Role-Based)
- ✅ Manage drivers in assigned branch
- ✅ Approve driver registrations
- ✅ Assign vehicles to drivers
- ✅ Rate drivers (with optional customer review collection)
- ✅ View branch analytics
- ✅ Manage deliveries
- ❌ Cannot assign themselves (Super Admin does this)
- **Authentication:** Email + Password OR Google OAuth
- **Status Flow:** Registration → Pending Verification (Super Admin) → Active

### 3. **Driver** (Role-Based)
- ✅ Register for approval
- ✅ Receive vehicle assignment (post-approval)
- ✅ Share real-time location
- ✅ View assigned trips/deliveries
- ✅ Upload proof of delivery (photos)
- ✅ View performance rating
- ❌ Cannot assign themselves vehicles
- **Authentication:** Email + Password OR Google OAuth
- **Status Flow:** Registration → Pending Approval (Manager) → Active → Assigned Vehicle

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (Vercel)                         │
│  React + TypeScript + Vite                                   │
│  ├── Driver App (Real-time tracking, trip management)        │
│  ├── Manager Dashboard (Team oversight, approval system)     │
│  └── Admin Panel (System management, analytics)              │
└──────────────┬──────────────────────────────────────────────┘
               │ HTTPS + WebSocket
               ├── REST API calls
               └── Socket.io real-time
               │
┌──────────────▼──────────────────────────────────────────────┐
│                   BACKEND (Render)                           │
│  Node.js + Express + TypeScript + Socket.io                 │
│  ├── Authentication & Authorization                          │
│  ├── REST API Endpoints                                      │
│  ├── WebSocket Event Handlers                                │
│  ├── Business Logic Layer                                    │
│  └── File Upload Management (Cloudflare R2)                  │
└──────────────┬──────────────────────────────────────────────┘
               │
       ┌───────┼──────────┐
       │       │          │
   ┌───▼──┐ ┌──▼──┐ ┌────▼────┐
   │MongoDB│ │ R2  │ │ Render  │
   │ Atlas │ │CDN  │ │ Storage │
   └───────┘ └─────┘ └─────────┘
```

---

## 🔄 Core Workflows

### Driver Registration & Approval
```
Driver Registration
    ↓
Status: pending_approval
    ↓
Branch Manager Notified (WebSocket)
    ↓
Manager Reviews & Approves/Rejects
    ↓
If Approved:
  → Status: active
  → Driver Can Login
  → Manager Assigns Vehicle
  → Driver Sees Vehicle in Dashboard
    ↓
If Rejected:
  → Status: rejected
  → Rejection Reason Stored
  → Driver Informed (Email - future implementation)
```

### Manager Registration & Verification
```
Manager Registration
    ↓
Status: pending_verification
    ↓
Super Admin Assigns Branch Location (Not Manager's Choice)
    ↓
Super Admin Reviews & Verifies/Rejects
    ↓
If Verified:
  → Status: active
  → Manager Can Login
  → Manager Sees Assigned Branch
  → Can Approve Drivers in Branch
    ↓
If Rejected:
  → Status: rejected
  → Rejection Reason Stored
```

### Real-Time Tracking Flow
```
Driver Phone (Geolocation)
    ↓ (Sends every 1-2 seconds)
WebSocket: /driver → sendLocation
    ↓
Backend Receives (lat, lng, userId, timestamp)
    ↓
Validate & Store in Location History
    ↓
Broadcast via Socket.io to:
  - Branch Manager
  - Super Admin
  - Other Authorized Users
    ↓
Frontend Receives Update
    ↓
Animate Marker Smoothly on Map
    ↓
(Repeat every 1-2 seconds)
```

---

## 📊 Database Overview

### Collections (MongoDB)
1. **users** - All users (drivers, managers, admins)
2. **drivers** - Driver-specific data
3. **managers** - Manager-specific data
4. **branches** - Branch locations
5. **vehicles** - Truck/vehicle data
6. **trips** - Delivery trips
7. **deliveries** - Individual delivery items
8. **locations_history** - Real-time location tracking
9. **driver_ratings** - Performance ratings & comments
10. **photos** - Proof of delivery metadata
11. **approvals** - Approval/rejection records

---

## 🔐 Security Highlights

- ✅ Super Admin: 2FA with 4-digit secret code
- ✅ JWT tokens with refresh mechanism
- ✅ Password hashing (bcryptjs)
- ✅ Rate limiting (express-rate-limit)
- ✅ CORS configured for web + mobile
- ✅ Input validation (express-validator)
- ✅ Environment-based configuration
- ✅ Secure file uploads (Cloudflare R2)

---

## 🚀 Implementation Phases

### Phase 1: MVP (Immediate)
- ✅ Authentication (Email/Password + Google OAuth)
- ✅ Driver Registration & Manager Approval
- ✅ Manager Registration & Super Admin Verification
- ✅ Real-Time Tracking (Leaflet + Socket.io)
- ✅ Basic Trip Management
- ✅ Photo Proof of Delivery
- ✅ Driver Performance Rating System
- ✅ Manager Dashboard
- ✅ Admin Panel
- **Timeline:** 4-6 weeks

### Phase 2: Core Features (Weeks 7-10)
- 📌 Driver Payment System
- 📌 Automated Payroll Calculation
- 📌 Fuel Tracking
- 📌 Advanced Analytics
- 📌 Email Notifications (when added)
- 📌 Maintenance Scheduling

### Phase 3: Advanced (Weeks 11-14)
- 🎯 Mobile App (React Native)
- 🎯 Geo-Fencing & Alerts
- 🎯 Customer Tracking Link
- 🎯 Predictive Analytics
- 🎯 SMS Integration
- 🎯 Offline Mode

---

## 📁 Project Structure (Frontend + Backend)

```
cargofleet/
├── frontend/                    # React + TypeScript + Vite
│   ├── src/
│   │   ├── components/         # Reusable React components
│   │   ├── pages/              # Page components
│   │   ├── services/           # API & WebSocket services
│   │   ├── stores/             # State management (Zustand/Redux)
│   │   ├── types/              # TypeScript interfaces
│   │   ├── utils/              # Helper functions
│   │   └── App.tsx
│   ├── public/                 # Static assets
│   ├── .env.example            # Environment variables template
│   └── vite.config.ts
│
├── backend/                     # Node.js + Express + TypeScript
│   ├── src/
│   │   ├── routes/             # API endpoints
│   │   ├── controllers/        # Route handlers
│   │   ├── models/             # MongoDB schemas
│   │   ├── middleware/         # Auth, validation, error handling
│   │   ├── services/           # Business logic
│   │   ├── websocket/          # Socket.io handlers
│   │   ├── config/             # Configuration files
│   │   ├── types/              # TypeScript interfaces
│   │   └── server.ts           # Main entry point
│   ├── tests/                  # Jest test files
│   ├── .env.example            # Environment variables template
│   └── tsconfig.json
│
├── docs/                        # This documentation
└── README.md
```

---

## 🚦 Getting Started

### Quick Start (Full Setup)
1. **Read first:** `[1_PROJECT_SETUP.md](./1_PROJECT_SETUP.md)` - Complete environment setup
2. **Understand data:** `[2_DATABASE_SCHEMA.md](./2_DATABASE_SCHEMA.md)` - All collections & relationships
3. **Learn authentication:** `[3_AUTHENTICATION.md](./3_AUTHENTICATION.md)` - Auth implementation
4. **Build backend:** `[4_API_ROUTES.md](./4_API_ROUTES.md)` - API endpoints
5. **Add real-time:** `[5_WEBSOCKET_EVENTS.md](./5_WEBSOCKET_EVENTS.md)` - Socket.io setup
6. **Build frontend:** `[6_FRONTEND_COMPONENTS.md](./6_FRONTEND_COMPONENTS.md)` - React structure
7. **Understand flows:** `[7_WORKFLOWS.md](./7_WORKFLOWS.md)` - Approval workflows
8. **Test everything:** `[8_TESTING.md](./8_TESTING.md)` - Jest examples
9. **Deploy:** `[9_DEPLOYMENT.md](./9_DEPLOYMENT.md)` - Vercel + Render
10. **Secure it:** `[10_SECURITY.md](./10_SECURITY.md)` - Security implementation
11. **Future planning:** `[11_PHASE_ROADMAP.md](./11_PHASE_ROADMAP.md)` - What's next

---

## 💡 Key Features Summary

### For Drivers
- 📍 Real-time location sharing
- 🚗 View assigned vehicle details
- 📦 Manage assigned deliveries
- 📸 Upload proof of delivery photos
- ⭐ View performance rating & earnings
- 🚨 Emergency SOS button (Phase 2)

### For Branch Managers
- 👥 Approve driver registrations
- 🚙 Assign vehicles to drivers
- 📊 View team location in real-time
- ✔️ Rate driver performance
- 📈 Branch-level analytics
- 💰 Manage driver payments (Phase 2)

### For Super Admins
- 🌍 Manage all branches
- ✅ Verify manager registrations
- 🗑️ Approve photo deletions
- 📊 System-wide analytics
- 👤 User account management
- 🔒 Security & access control

---

## 🛠️ Tech Dependencies (Summary)

### Frontend
- React 18+
- TypeScript
- Vite
- Leaflet (Maps)
- Socket.io Client
- Tailwind CSS (styling - no gradients)
- Axios (HTTP)
- Zustand or Redux (State)
- React Router v6
- Google OAuth (firebase or google-auth-library)

### Backend
- Node.js (stable)
- Express
- TypeScript
- MongoDB (via mongoose)
- Socket.io
- bcryptjs (password hashing)
- jsonwebtoken (JWT)
- express-validator (validation)
- express-rate-limit (rate limiting)
- cloudflare/workers-sdk (R2 uploads)
- Jest & Supertest (testing)
- dotenv (env management)
- cors (CORS handling)

---

## 📝 Environment Variables (Quick Reference)

You'll need to configure:
- **MongoDB Atlas URL**
- **Cloudflare R2 credentials** (API token, bucket name)
- **Google OAuth credentials** (client ID, secret)
- **JWT secret key**
- **Super Admin credentials** (3 slots)
- **Frontend/Backend URLs**

See `[1_PROJECT_SETUP.md](./1_PROJECT_SETUP.md)` for complete `.env.example`

---

## 🤝 Development Workflow

### When Using VSCode Claude Extension:

1. **Paste relevant `.md` file** into Claude
2. **Ask for implementation** of a specific section
3. **Claude generates code** with explanations
4. **Copy → Paste into your project**
5. **Run tests** to verify
6. **Move to next section**

**Recommendation:** Work through sections in this order:
1. Authentication system first
2. Database schemas
3. API routes (CRUD operations)
4. WebSocket events
5. Frontend components
6. Test coverage
7. Deployment

---

## 📞 Support & Questions

Each document is self-contained but includes cross-references. If you need clarification:
- Check related `.md` file for context
- Review code examples in `[8_TESTING.md](./8_TESTING.md)` for patterns
- See `[10_SECURITY.md](./10_SECURITY.md)` for security questions
- Review `[11_PHASE_ROADMAP.md](./11_PHASE_ROADMAP.md)` for feature scope

---

## ✅ Pre-Implementation Checklist

Before starting, ensure you have:
- [ ] MongoDB Atlas account + CARGOFLEET database created
- [ ] Cloudflare R2 bucket set up with credentials
- [ ] Google OAuth credentials from Google Cloud Console
- [ ] Render account (for backend deployment)
- [ ] Vercel account (for frontend deployment)
- [ ] Node.js stable version installed locally
- [ ] VSCode + Claude extension installed
- [ ] Git repository initialized

---

## 📅 Next Steps

**👉 START HERE:** Open `[1_PROJECT_SETUP.md](./1_PROJECT_SETUP.md)` and follow the installation guide.

**Let's build CargoFleet! 🚀**

---

*Last Updated: September 2026*  
*Developed by: Peter Ngacha | Fastweb Technologies*  
*Contact: info@fastweb.co.ke | Website: fastweb.co.ke | Nairobi, Kenya*
