import cors from 'cors';
import { config } from '../config/environment';

export const corsMiddleware = cors({
  origin: config.frontendUrls,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
