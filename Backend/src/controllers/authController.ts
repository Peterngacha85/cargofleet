import { Request, Response } from 'express';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/User';
import Driver from '../models/Driver';
import Manager from '../models/Manager';
import { hashPassword, comparePassword, findSuperAdminByEmail } from '../services/authService';
import { generateAccessToken, generateRefreshToken, refreshAccessToken } from '../utils/tokenUtils';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { config } from '../config/environment';
import { logger } from '../utils/logger';
import { AuthenticatedRequest } from '../middleware/auth';
import { isValidPhone, isFutureDate } from '../utils/validators';
import { IDriver } from '../models/Driver';
import { emitToManagers, emitToAdmins } from '../websocket/emitters';

const googleClient = new OAuth2Client(config.google.clientId);

export const superAdminLogin = async (req: Request, res: Response) => {
  const { email, password, secretCode } = req.body;

  if (!email || !password || !secretCode) {
    return sendError(res, 400, 'Email, password, and secret code required', {
      message: 'Missing required fields',
    });
  }

  try {
    const admin = findSuperAdminByEmail(email);

    if (!admin) {
      return sendError(res, 401, 'Invalid super admin credentials', { email: 'Not authorized' });
    }

    const passwordMatch = await comparePassword(password, admin.password as string);
    if (!passwordMatch) {
      return sendError(res, 401, 'Invalid credentials', { password: 'Incorrect password' });
    }

    if (secretCode !== admin.secretCode) {
      return sendError(res, 401, 'Invalid secret code', { secretCode: 'Incorrect code' });
    }

    const accessToken = generateAccessToken({ id: admin.id, email, role: 'admin' });
    const refreshToken = generateRefreshToken({ id: admin.id, email, role: 'admin' });

    return sendSuccess(res, 200, 'Super admin authenticated successfully', {
      accessToken,
      refreshToken,
      user: { id: admin.id, email, role: 'admin', permissions: ['*'] },
    });
  } catch (error) {
    logger.error('Super admin login error', { error });
    return sendError(res, 500, 'Authentication error', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const standardLogin = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return sendError(res, 401, 'User not found', { email: 'No account with this email' });
    }

    const passwordMatch = await comparePassword(password, user.password);
    if (!passwordMatch) {
      return sendError(res, 401, 'Invalid credentials', { password: 'Incorrect password' });
    }

    if (user.role === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      if (driver?.status !== 'active') {
        return sendError(res, 403, 'Driver account not approved yet', {
          status:
            driver?.status === 'pending_approval'
              ? 'Awaiting manager approval'
              : `Account status: ${driver?.status}`,
        });
      }
    } else if (user.role === 'manager') {
      const manager = await Manager.findOne({ userId: user._id });
      if (manager?.status !== 'active') {
        return sendError(res, 403, 'Manager account not verified', {
          status:
            manager?.status === 'pending_verification'
              ? 'Awaiting super admin verification'
              : `Account status: ${manager?.status}`,
        });
      }
    }

    const accessToken = generateAccessToken({ id: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id.toString(), email: user.email, role: user.role });

    return sendSuccess(res, 200, 'Login successful', {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    logger.error('Login error', { error });
    return sendError(res, 500, 'Login failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const googleOAuthLogin = async (req: Request, res: Response) => {
  const { tokenId } = req.body;

  try {
    const ticket = await googleClient.verifyIdToken({
      idToken: tokenId,
      audience: config.google.clientId,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      throw new Error('Invalid token payload');
    }

    const { given_name, family_name, picture } = payload;
    const email = payload.email!.toLowerCase();

    let user = await User.findOne({ email });

    if (!user) {
      const role = (req.query.role as string) || req.body.role || 'driver';

      user = new User({
        email,
        firstName: given_name || '',
        lastName: family_name || '',
        phone: '',
        role,
        password: crypto.randomBytes(16).toString('hex'),
        profilePhoto: picture,
      });
      await user.save();

      if (role === 'driver') {
        const driver = await Driver.create({
          userId: user._id,
          drivingLicenseNumber: `PENDING-${user._id}`,
          licenseExpiry: new Date(),
          emergencyContactName: '',
          emergencyContactPhone: '',
          status: 'pending_approval',
        });
        emitToManagers('newDriverRegistration', {
          driverId: driver._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          createdAt: driver.createdAt,
        });
      } else if (role === 'manager') {
        const manager = await Manager.create({
          userId: user._id,
          status: 'pending_verification',
        });
        emitToAdmins('newManagerRegistration', {
          managerId: manager._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          createdAt: manager.createdAt,
        });
      }
    } else if (picture && user.profilePhoto !== picture) {
      // Keep the avatar in sync with Google in case it changed (or was missed on first sign-up)
      user.profilePhoto = picture;
      await user.save();
    }

    if (user.role === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      if (driver?.status !== 'active') {
        return sendError(res, 403, 'Driver account not approved', {
          status: driver?.status || 'Not yet registered',
        });
      }
    } else if (user.role === 'manager') {
      const manager = await Manager.findOne({ userId: user._id });
      if (manager?.status !== 'active') {
        return sendError(res, 403, 'Manager account not verified', {
          status: manager?.status || 'Not yet registered',
        });
      }
    }

    const accessToken = generateAccessToken({ id: user._id.toString(), email: user.email, role: user.role });
    const refreshToken = generateRefreshToken({ id: user._id.toString(), email: user.email, role: user.role });

    return sendSuccess(res, 200, 'Google OAuth login successful', {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profilePhoto: user.profilePhoto,
      },
    });
  } catch (error) {
    logger.error('Google OAuth error', { error });
    return sendError(res, 401, 'Google OAuth authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const registerDriver = async (req: Request, res: Response) => {
  const {
    email,
    password,
    firstName,
    lastName,
    phone,
    drivingLicenseNumber,
    licenseExpiry,
    emergencyContactName,
    emergencyContactPhone,
  } = req.body;

  try {
    if (!email || !password || !firstName || !lastName || !drivingLicenseNumber) {
      return sendError(res, 400, 'Missing required fields', {
        email: !email ? 'Required' : undefined,
        password: !password ? 'Required' : undefined,
        drivingLicenseNumber: !drivingLicenseNumber ? 'Required' : undefined,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'Email already registered', { email: 'Already in use' });
    }

    const existingLicense = await Driver.findOne({ drivingLicenseNumber });
    if (existingLicense) {
      return sendError(res, 409, 'License number already registered', {
        drivingLicenseNumber: 'Already registered',
      });
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({ email, password: hashedPassword, firstName, lastName, phone, role: 'driver' });
    await user.save();

    const driver = new Driver({
      userId: user._id,
      drivingLicenseNumber,
      licenseExpiry: new Date(licenseExpiry),
      emergencyContactName,
      emergencyContactPhone,
      status: 'pending_approval',
    });
    await driver.save();

    emitToManagers('newDriverRegistration', {
      driverId: driver._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: driver.createdAt,
    });

    return sendSuccess(res, 201, 'Driver registration submitted for approval', {
      driverId: driver._id,
      status: 'pending_approval',
      message: 'Your account is pending branch manager approval',
    });
  } catch (error) {
    logger.error('Driver registration error', { error });
    return sendError(res, 500, 'Registration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

export const registerManager = async (req: Request, res: Response) => {
  const { email, password, firstName, lastName, phone } = req.body;

  try {
    if (!email || !password || !firstName || !lastName) {
      return sendError(res, 400, 'Missing required fields', {
        email: !email ? 'Required' : undefined,
        password: !password ? 'Required' : undefined,
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return sendError(res, 409, 'Email already registered', { email: 'Already in use' });
    }

    const hashedPassword = await hashPassword(password);

    const user = new User({ email, password: hashedPassword, firstName, lastName, phone, role: 'manager' });
    await user.save();

    const manager = new Manager({ userId: user._id, status: 'pending_verification' });
    await manager.save();

    emitToAdmins('newManagerRegistration', {
      managerId: manager._id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      createdAt: manager.createdAt,
    });

    return sendSuccess(res, 201, 'Manager registration submitted for verification', {
      managerId: manager._id,
      status: 'pending_verification',
      message: 'Your account is pending super admin verification',
    });
  } catch (error) {
    logger.error('Manager registration error', { error });
    return sendError(res, 500, 'Registration failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
};

// A Google OAuth sign-up can only ever supply name + email, so those accounts start with
// placeholder/empty license, emergency contact, and phone fields that still need collecting.
const isDriverProfileComplete = (phone: string | undefined, driver: IDriver | null): boolean => {
  if (!driver) return false;
  return (
    !!phone &&
    !!driver.emergencyContactName &&
    !!driver.emergencyContactPhone &&
    !driver.drivingLicenseNumber.startsWith('PENDING-')
  );
};

export const completeProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.user!;

    if (authUser.role === 'admin') {
      return sendError(res, 400, 'Super admin profiles are managed via environment configuration');
    }

    const { phone, drivingLicenseNumber, licenseExpiry, emergencyContactName, emergencyContactPhone } = req.body;

    if (!phone || !isValidPhone(phone)) {
      return sendError(res, 400, 'A valid phone number is required', { phone: 'Required' });
    }

    const user = await User.findByIdAndUpdate(authUser.id, { phone }, { new: true });
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    if (user.role === 'driver') {
      if (!drivingLicenseNumber || !licenseExpiry || !emergencyContactName || !emergencyContactPhone) {
        return sendError(res, 400, 'License and emergency contact details are required');
      }
      if (!isValidPhone(emergencyContactPhone)) {
        return sendError(res, 400, 'Invalid emergency contact phone number', {
          emergencyContactPhone: 'Invalid format',
        });
      }
      if (!isFutureDate(licenseExpiry)) {
        return sendError(res, 400, 'License expiry must be a future date');
      }

      const existingLicense = await Driver.findOne({
        drivingLicenseNumber,
        userId: { $ne: user._id },
      });
      if (existingLicense) {
        return sendError(res, 409, 'License number already registered', {
          drivingLicenseNumber: 'Already in use',
        });
      }

      const driver = await Driver.findOneAndUpdate(
        { userId: user._id },
        {
          drivingLicenseNumber,
          licenseExpiry: new Date(licenseExpiry),
          emergencyContactName,
          emergencyContactPhone,
        },
        { new: true }
      );

      return sendSuccess(res, 200, 'Profile updated', { phone: user.phone, driver });
    }

    return sendSuccess(res, 200, 'Profile updated', { phone: user.phone });
  } catch (error) {
    logger.error('Complete profile error', { error });
    return sendError(res, 500, 'Failed to update profile');
  }
};

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const authUser = req.user!;

    if (authUser.role === 'admin') {
      return sendSuccess(res, 200, 'Current user retrieved', {
        id: authUser.id,
        email: authUser.email,
        role: 'admin',
        permissions: ['*'],
        profileComplete: true,
      });
    }

    const user = await User.findById(authUser.id);
    if (!user) {
      return sendError(res, 404, 'User not found');
    }

    const base = {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      profilePhoto: user.profilePhoto,
    };

    if (user.role === 'driver') {
      const driver = await Driver.findOne({ userId: user._id });
      return sendSuccess(res, 200, 'Current user retrieved', {
        ...base,
        driver,
        profileComplete: isDriverProfileComplete(user.phone, driver),
      });
    }

    if (user.role === 'manager') {
      const manager = await Manager.findOne({ userId: user._id });
      return sendSuccess(res, 200, 'Current user retrieved', {
        ...base,
        manager,
        profileComplete: !!user.phone,
      });
    }

    return sendSuccess(res, 200, 'Current user retrieved', { ...base, profileComplete: true });
  } catch (error) {
    logger.error('Get current user error', { error });
    return sendError(res, 500, 'Failed to retrieve current user');
  }
};

export const refreshTokenHandler = async (req: Request, res: Response) => {
  const { refreshToken: token } = req.body;

  try {
    if (!token) {
      return sendError(res, 400, 'Refresh token required', { token: 'Missing' });
    }

    const newAccessToken = refreshAccessToken(token);

    return sendSuccess(res, 200, 'Access token refreshed', { accessToken: newAccessToken });
  } catch (error) {
    return sendError(res, 401, 'Token refresh failed', {
      error: error instanceof Error ? error.message : 'Invalid token',
    });
  }
};
