# 3️⃣ AUTHENTICATION & AUTHORIZATION SYSTEM

**Complete auth implementation: JWT, Google OAuth, Super Admin 2FA, Email/Password**

---

## 🔐 Authentication Flow Overview

```
┌─────────────────────────────────────────────────────────┐
│                   USER LOGIN ROUTES                      │
├──────────────────┬──────────────────┬──────────────────┤
│                  │                  │                  │
├─ Super Admin ─┤  ├─ Manager/Driver │  └─ Mobile App  │
│  2FA Route     │  │  Standard Route │
└────────────────┘  └──────────────────┘
         │                  │
         ↓                  ↓
   Enter Email+Pass    Enter Email/Pass
   Enter Secret Code   OR Google OAuth
         │                  │
         ├──────────┬───────┘
                    ↓
           JWT Token Returned
                    │
         ┌──────────┴───────────┐
         ↓                      ↓
   Access Token         Refresh Token
   (15 min expiry)      (30 day expiry)
         │                      │
   Used for requests      Used to renew
   in Authorization       access token
   header
```

---

## 🔑 Authentication Methods

### 1. Super Admin Authentication (2FA)

**Requirements:**
- Email + Password + 4-Digit Secret Code (all required)
- From .env configuration only
- No way to change in UI

```typescript
// backend/src/controllers/authController.ts

interface SuperAdminLoginRequest {
  email: string;
  password: string;
  secretCode: string;  // 4 digits
}

export const superAdminLogin = async (req: Request, res: Response) => {
  const { email, password, secretCode } = req.body;

  // Validate input
  if (!email || !password || !secretCode) {
    return res.status(400).json({
      success: false,
      status: 'error',
      message: 'Email, password, and secret code required',
      data: null,
      errors: { message: 'Missing required fields' }
    });
  }

  try {
    // Load super admin config from .env
    const SUPER_ADMIN_1_EMAIL = process.env.SUPER_ADMIN_1_EMAIL;
    const SUPER_ADMIN_1_PASSWORD = process.env.SUPER_ADMIN_1_PASSWORD;
    const SUPER_ADMIN_1_SECRET_CODE = process.env.SUPER_ADMIN_1_SECRET_CODE;

    // Verify email matches
    if (email !== SUPER_ADMIN_1_EMAIL) {
      return res.status(401).json({
        success: false,
        status: 'error',
        message: 'Invalid super admin credentials',
        data: null,
        errors: { email: 'Not authorized' }
      });
    }

    // Verify password (hashed in .env)
    const passwordMatch = await bcrypt.compare(password, SUPER_ADMIN_1_PASSWORD);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        status: 'error',
        message: 'Invalid credentials',
        data: null,
        errors: { password: 'Incorrect password' }
      });
    }

    // Verify secret code
    if (secretCode !== SUPER_ADMIN_1_SECRET_CODE) {
      return res.status(401).json({
        success: false,
        status: 'error',
        message: 'Invalid secret code',
        data: null,
        errors: { secretCode: 'Incorrect code' }
      });
    }

    // Generate JWT tokens
    const accessToken = generateAccessToken({
      id: 'super_admin_1',
      email,
      role: 'admin'
    });

    const refreshToken = generateRefreshToken({
      id: 'super_admin_1',
      email,
      role: 'admin'
    });

    // Store refresh token (optional, for logout tracking)
    // await RefreshToken.create({ token: refreshToken, userId: 'super_admin_1' });

    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Super admin authenticated successfully',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: 'super_admin_1',
          email,
          role: 'admin',
          permissions: ['*'] // Full access
        }
      },
      errors: null
    });
  } catch (error) {
    console.error('Super admin login error:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Authentication error',
      data: null,
      errors: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
};
```

### 2. Manager & Driver Authentication (Email/Password + Google OAuth)

**Email/Password Route:**

```typescript
// backend/src/controllers/authController.ts

interface StandardLoginRequest {
  email: string;
  password: string;
}

export const standardLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    // Find user by email
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({
        success: false,
        status: 'error',
        message: 'User not found',
        data: null,
        errors: { email: 'No account with this email' }
      });
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        status: 'error',
        message: 'Invalid credentials',
        data: null,
        errors: { password: 'Incorrect password' }
      });
    }

    // Check if user is approved/verified
    if (user.role === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      if (driver?.status !== 'active') {
        return res.status(403).json({
          success: false,
          status: 'error',
          message: 'Driver account not approved yet',
          data: null,
          errors: { 
            status: driver?.status === 'pending_approval' 
              ? 'Awaiting manager approval' 
              : `Account status: ${driver?.status}` 
          }
        });
      }
    } else if (user.role === 'manager') {
      const manager = await Manager.findOne({ userId: user._id });
      if (manager?.status !== 'active') {
        return res.status(403).json({
          success: false,
          status: 'error',
          message: 'Manager account not verified',
          data: null,
          errors: { 
            status: manager?.status === 'pending_verification' 
              ? 'Awaiting super admin verification' 
              : `Account status: ${manager?.status}` 
          }
        });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          phone: user.phone
        }
      },
      errors: null
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Login failed',
      data: null,
      errors: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
};
```

**Google OAuth Route:**

```typescript
// backend/src/controllers/authController.ts

interface GoogleOAuthRequest {
  tokenId: string;  // From Google Sign-In
}

export const googleOAuthLogin = async (req: Request, res: Response) => {
  const { tokenId } = req.body;

  try {
    // Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: tokenId,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('Invalid token payload');
    }

    const { email, given_name, family_name, picture } = payload;

    // Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      // Check if role specified (from query or body)
      const role = req.query.role || req.body.role || 'driver';

      user = new User({
        email,
        firstName: given_name,
        lastName: family_name,
        phone: '', // Will be filled during registration
        role,
        password: crypto.randomBytes(16).toString('hex') // Random password
      });
      await user.save();

      // Create role-specific record
      if (role === 'driver') {
        await Driver.create({
          userId: user._id,
          drivingLicenseNumber: '', // To be filled
          licenseExpiry: new Date(),
          emergencyContactName: '',
          emergencyContactPhone: '',
          status: 'pending_approval'
        });
      } else if (role === 'manager') {
        await Manager.create({
          userId: user._id,
          status: 'pending_verification',
          assignedBranchId: null
        });
      }
    }

    // Check approval/verification status (same as email/password)
    if (user.role === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      if (driver?.status !== 'active') {
        return res.status(403).json({
          success: false,
          status: 'error',
          message: 'Driver account not approved',
          data: null,
          errors: { status: driver?.status || 'Not yet registered' }
        });
      }
    } else if (user.role === 'manager') {
      const manager = await Manager.findOne({ userId: user._id });
      if (manager?.status !== 'active') {
        return res.status(403).json({
          success: false,
          status: 'error',
          message: 'Manager account not verified',
          data: null,
          errors: { status: manager?.status || 'Not yet registered' }
        });
      }
    }

    // Generate tokens
    const accessToken = generateAccessToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    const refreshToken = generateRefreshToken({
      id: user._id.toString(),
      email: user.email,
      role: user.role
    });

    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Google OAuth login successful',
      data: {
        accessToken,
        refreshToken,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role
        }
      },
      errors: null
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return res.status(401).json({
      success: false,
      status: 'error',
      message: 'Google OAuth authentication failed',
      data: null,
      errors: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
};
```

---

## 🎫 JWT Token Generation & Validation

```typescript
// backend/src/utils/tokenUtils.ts

import jwt from 'jsonwebtoken';

interface TokenPayload {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'driver';
}

// Generate Access Token (short-lived)
export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRY || '15m',
    algorithm: 'HS256'
  });
};

// Generate Refresh Token (long-lived)
export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: process.env.JWT_REFRESH_EXPIRY || '30d',
    algorithm: 'HS256'
  });
};

// Verify Access Token
export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

// Verify Refresh Token
export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

// Refresh Access Token
export const refreshAccessToken = (refreshToken: string): string => {
  const payload = verifyRefreshToken(refreshToken);
  return generateAccessToken(payload);
};
```

---

## 🛡️ Middleware: JWT Authentication

```typescript
// backend/src/middleware/auth.ts

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        status: 'error',
        message: 'No authorization token',
        data: null,
        errors: { authorization: 'Missing Bearer token' }
      });
    }

    const token = authHeader.slice(7); // Remove "Bearer "
    const payload = verifyAccessToken(token);

    // Attach user to request
    (req as any).user = payload;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      status: 'error',
      message: 'Invalid or expired token',
      data: null,
      errors: { authorization: error instanceof Error ? error.message : 'Auth failed' }
    });
  }
};

// Super Admin Middleware
export const superAdminMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;

  if (!user || user.role !== 'admin' || user.id !== 'super_admin_1') {
    return res.status(403).json({
      success: false,
      status: 'error',
      message: 'Insufficient permissions',
      data: null,
      errors: { authorization: 'Super admin access required' }
    });
  }

  next();
};

// Manager/Driver Middleware
export const roleMiddleware = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user || !allowedRoles.includes(user.role)) {
      return res.status(403).json({
        success: false,
        status: 'error',
        message: 'Insufficient permissions',
        data: null,
        errors: { authorization: `Access denied for role: ${user?.role}` }
      });
    }

    next();
  };
};
```

---

## 📝 Registration Routes

### Driver Registration

```typescript
// backend/src/controllers/authController.ts

export const registerDriver = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone, drivingLicenseNumber, licenseExpiry, emergencyContactName, emergencyContactPhone } = req.body;

  try {
    // Validation
    if (!email || !password || !firstName || !lastName || !drivingLicenseNumber) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Missing required fields',
        data: null,
        errors: {
          email: !email ? 'Required' : undefined,
          password: !password ? 'Required' : undefined,
          drivingLicenseNumber: !drivingLicenseNumber ? 'Required' : undefined
        }
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        status: 'error',
        message: 'Email already registered',
        data: null,
        errors: { email: 'Already in use' }
      });
    }

    // Check if license number exists
    const existingLicense = await Driver.findOne({ drivingLicenseNumber });
    if (existingLicense) {
      return res.status(409).json({
        success: false,
        status: 'error',
        message: 'License number already registered',
        data: null,
        errors: { drivingLicenseNumber: 'Already registered' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: 'driver'
    });
    await user.save();

    // Create driver record
    const driver = new Driver({
      userId: user._id,
      drivingLicenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      emergencyContactName,
      emergencyContactPhone,
      status: 'pending_approval'
    });
    await driver.save();

    // Emit WebSocket notification to managers
    // (See 5_WEBSOCKET_EVENTS.md for implementation)

    return res.status(201).json({
      success: true,
      status: 'success',
      message: 'Driver registration submitted for approval',
      data: {
        driverId: driver._id,
        status: 'pending_approval',
        message: 'Your account is pending branch manager approval'
      },
      errors: null
    });
  } catch (error) {
    console.error('Driver registration error:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Registration failed',
      data: null,
      errors: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
};
```

### Manager Registration

```typescript
// backend/src/controllers/authController.ts

export const registerManager = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone } = req.body;

  try {
    // Validation
    if (!email || !password || !firstName || !lastName) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Missing required fields',
        data: null,
        errors: {
          email: !email ? 'Required' : undefined,
          password: !password ? 'Required' : undefined
        }
      });
    }

    // Check if email exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        status: 'error',
        message: 'Email already registered',
        data: null,
        errors: { email: 'Already in use' }
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = new User({
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      role: 'manager'
    });
    await user.save();

    // Create manager record
    const manager = new Manager({
      userId: user._id,
      status: 'pending_verification'
      // Note: branchId will be assigned by super admin
    });
    await manager.save();

    // Emit WebSocket notification to super admin
    // (See 5_WEBSOCKET_EVENTS.md for implementation)

    return res.status(201).json({
      success: true,
      status: 'success',
      message: 'Manager registration submitted for verification',
      data: {
        managerId: manager._id,
        status: 'pending_verification',
        message: 'Your account is pending super admin verification'
      },
      errors: null
    });
  } catch (error) {
    console.error('Manager registration error:', error);
    return res.status(500).json({
      success: false,
      status: 'error',
      message: 'Registration failed',
      data: null,
      errors: { error: error instanceof Error ? error.message : 'Unknown error' }
    });
  }
};
```

---

## 🔄 Token Refresh Endpoint

```typescript
// backend/src/controllers/authController.ts

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  try {
    if (!token) {
      return res.status(400).json({
        success: false,
        status: 'error',
        message: 'Refresh token required',
        data: null,
        errors: { token: 'Missing' }
      });
    }

    const newAccessToken = refreshAccessToken(token);

    return res.status(200).json({
      success: true,
      status: 'success',
      message: 'Access token refreshed',
      data: { accessToken: newAccessToken },
      errors: null
    });
  } catch (error) {
    return res.status(401).json({
      success: false,
      status: 'error',
      message: 'Token refresh failed',
      data: null,
      errors: { error: error instanceof Error ? error.message : 'Invalid token' }
    });
  }
};
```

---

## 🔐 Frontend Implementation (React + TypeScript)

```typescript
// frontend/src/services/authService.ts

export class AuthService {
  private static API_URL = import.meta.env.VITE_API_URL;

  static async superAdminLogin(email: string, password: string, secretCode: string) {
    const response = await fetch(`${this.API_URL}/auth/super-admin/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, secretCode })
    });
    return response.json();
  }

  static async login(email: string, password: string) {
    const response = await fetch(`${this.API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return response.json();
  }

  static async googleLogin(tokenId: string, role: 'driver' | 'manager') {
    const response = await fetch(`${this.API_URL}/auth/google/login?role=${role}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tokenId })
    });
    return response.json();
  }

  static async registerDriver(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
    drivingLicenseNumber: string;
    licenseExpiry: string;
    emergencyContactName: string;
    emergencyContactPhone: string;
  }) {
    const response = await fetch(`${this.API_URL}/auth/register/driver`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  static async registerManager(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone: string;
  }) {
    const response = await fetch(`${this.API_URL}/auth/register/manager`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }

  static async refreshToken(refreshToken: string) {
    const response = await fetch(`${this.API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken })
    });
    return response.json();
  }

  static setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  static getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  static logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
  }
}
```

---

## ✅ Next Steps

→ **[4_API_ROUTES.md](./4_API_ROUTES.md)** - All REST endpoints with examples

---

*Last Updated: September 2026*  
*Contact: info@fastweb.co.ke | Fastweb Technologies | fastweb.co.ke*
