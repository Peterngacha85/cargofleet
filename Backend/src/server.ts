import express from 'express';
import http from 'http';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { config } from './config/environment';
import { connectDatabase } from './config/database';
import { corsMiddleware } from './middleware/cors';
import { apiRateLimiter } from './middleware/rateLimiter';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { initializeWebSocket } from './websocket/namespaces';
import routes from './routes';
import { logger } from './utils/logger';

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: config.socketIoCorsOrigins,
    credentials: true,
  },
});

app.use(helmet());
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(apiRateLimiter);

app.get('/health', (_req, res) => {
  res.json({ success: true, status: 'success', message: 'CargoFleet API is running', data: null, errors: null });
});

app.use('/api', routes);

app.use(notFoundHandler);
app.use(errorHandler);

initializeWebSocket(io);

const start = async () => {
  await connectDatabase();

  server.listen(config.port, () => {
    logger.info(`✓ Server running on http://${config.host}:${config.port}`);
    logger.info('✓ WebSocket server ready');
  });
};

start().catch((error) => {
  logger.error('Failed to start server', { error });
  process.exit(1);
});

export { app, server, io };
