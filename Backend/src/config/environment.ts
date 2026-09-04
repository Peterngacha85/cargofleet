import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { z } from 'zod';

dotenv.config();

// Super admin passwords are stored as plaintext in .env (for operator convenience) and
// hashed once here at startup, so the rest of the app only ever handles/compares hashes.
const hashIfPresent = (plaintext?: string): string | undefined =>
  plaintext ? bcrypt.hashSync(plaintext, 10) : undefined;

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().default('5000'),
  HOST: z.string().default('localhost'),

  MONGODB_URI: z.string().min(1, 'MONGODB_URI is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be set'),
  JWT_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_SECRET: z.string().min(16, 'JWT_REFRESH_SECRET must be set'),
  JWT_REFRESH_EXPIRY: z.string().default('30d'),

  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
  GOOGLE_REDIRECT_URI: z.string().optional(),

  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  CLOUDINARY_FOLDER: z.string().default('cargofleet'),

  SUPER_ADMIN_1_EMAIL: z.string().optional(),
  SUPER_ADMIN_1_PASSWORD: z.string().optional(),
  SUPER_ADMIN_1_SECRET_CODE: z.string().optional(),
  SUPER_ADMIN_2_EMAIL: z.string().optional(),
  SUPER_ADMIN_2_PASSWORD: z.string().optional(),
  SUPER_ADMIN_2_SECRET_CODE: z.string().optional(),
  SUPER_ADMIN_3_EMAIL: z.string().optional(),
  SUPER_ADMIN_3_PASSWORD: z.string().optional(),
  SUPER_ADMIN_3_SECRET_CODE: z.string().optional(),

  FRONTEND_URL: z.string().default('http://localhost:5173'),
  SOCKET_IO_CORS_ORIGIN: z.string().default('http://localhost:5173'),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000'),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100'),

  MAX_FILE_SIZE: z.string().default('10485760'),
  ALLOWED_FILE_TYPES: z.string().default('image/jpeg,image/png,image/webp'),

  LOG_LEVEL: z.string().default('info'),
  TZ: z.string().default('Africa/Nairobi'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment configuration:', parsed.error.flatten().fieldErrors);
  throw new Error('Invalid environment configuration');
}

const env = parsed.data;

export const config = {
  nodeEnv: env.NODE_ENV,
  port: parseInt(env.PORT, 10),
  host: env.HOST,

  mongodbUri: env.MONGODB_URI,

  jwtSecret: env.JWT_SECRET,
  jwtExpiry: env.JWT_EXPIRY,
  jwtRefreshSecret: env.JWT_REFRESH_SECRET,
  jwtRefreshExpiry: env.JWT_REFRESH_EXPIRY,

  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
    redirectUri: env.GOOGLE_REDIRECT_URI,
  },

  cloudinary: {
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    apiSecret: env.CLOUDINARY_API_SECRET,
    folder: env.CLOUDINARY_FOLDER,
  },

  superAdmins: [
    {
      email: env.SUPER_ADMIN_1_EMAIL,
      password: hashIfPresent(env.SUPER_ADMIN_1_PASSWORD),
      secretCode: env.SUPER_ADMIN_1_SECRET_CODE,
      id: 'super_admin_1',
    },
    {
      email: env.SUPER_ADMIN_2_EMAIL,
      password: hashIfPresent(env.SUPER_ADMIN_2_PASSWORD),
      secretCode: env.SUPER_ADMIN_2_SECRET_CODE,
      id: 'super_admin_2',
    },
    {
      email: env.SUPER_ADMIN_3_EMAIL,
      password: hashIfPresent(env.SUPER_ADMIN_3_PASSWORD),
      secretCode: env.SUPER_ADMIN_3_SECRET_CODE,
      id: 'super_admin_3',
    },
  ].filter((admin) => admin.email && admin.password && admin.secretCode),

  frontendUrl: env.FRONTEND_URL,
  socketIoCorsOrigin: env.SOCKET_IO_CORS_ORIGIN,

  rateLimit: {
    windowMs: parseInt(env.RATE_LIMIT_WINDOW_MS, 10),
    maxRequests: parseInt(env.RATE_LIMIT_MAX_REQUESTS, 10),
  },

  upload: {
    maxFileSize: parseInt(env.MAX_FILE_SIZE, 10),
    allowedFileTypes: env.ALLOWED_FILE_TYPES.split(','),
  },

  logLevel: env.LOG_LEVEL,
  timezone: env.TZ,
};

export type SuperAdminConfig = (typeof config.superAdmins)[number];
