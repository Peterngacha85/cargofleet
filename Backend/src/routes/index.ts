import { Router } from 'express';
import authRoutes from './auth';
import driverRoutes from './driver';
import managerRoutes from './manager';
import branchRoutes from './branch';
import vehicleRoutes from './vehicle';
import tripRoutes from './trip';
import deliveryRoutes from './delivery';
import ratingRoutes from './rating';
import photoRoutes from './photo';
import locationRoutes from './location';
import analyticsRoutes from './analytics';
import paymentRoutes from './payment';
import fuelLogRoutes from './fuelLog';
import publicRoutes from './public';

const router = Router();

router.use('/auth', authRoutes);
router.use('/drivers', driverRoutes);
router.use('/managers', managerRoutes);
router.use('/branches', branchRoutes);
router.use('/vehicles', vehicleRoutes);
router.use('/trips', tripRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/ratings', ratingRoutes);
router.use('/photos', photoRoutes);
router.use('/locations', locationRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/payments', paymentRoutes);
router.use('/fuel-logs', fuelLogRoutes);
router.use('/public', publicRoutes);

export default router;
