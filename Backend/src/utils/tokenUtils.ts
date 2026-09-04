import jwt from 'jsonwebtoken';
import { config } from '../config/environment';
import { TokenPayload } from '../types/auth';

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiry,
    algorithm: 'HS256',
  } as jwt.SignOptions);
};

export const generateRefreshToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.jwtRefreshExpiry,
    algorithm: 'HS256',
  } as jwt.SignOptions);
};

export const verifyAccessToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired access token');
  }
};

export const verifyRefreshToken = (token: string): TokenPayload => {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

export const refreshAccessToken = (refreshToken: string): string => {
  const payload = verifyRefreshToken(refreshToken);
  return generateAccessToken({ id: payload.id, email: payload.email, role: payload.role });
};
