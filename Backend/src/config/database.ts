import mongoose from 'mongoose';
import { config } from './environment';
import { logger } from '../utils/logger';

export const connectDatabase = async (): Promise<void> => {
  try {
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.mongodbUri);
    logger.info('✓ Connected to MongoDB');
  } catch (error) {
    logger.error('MongoDB connection error', { error });
    throw error;
  }

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });

  mongoose.connection.on('error', (error) => {
    logger.error('MongoDB error', { error });
  });
};

export const disconnectDatabase = async (): Promise<void> => {
  await mongoose.connection.close();
};
