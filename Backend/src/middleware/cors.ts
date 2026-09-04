import cors from 'cors';
import { config } from '../config/environment';

export const corsMiddleware = cors({
  origin: [config.frontendUrl],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
});
