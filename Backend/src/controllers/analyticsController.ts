import { Request, Response } from 'express';
import { subDays, subMonths, subYears } from 'date-fns';
import Trip from '../models/Trip';
import Driver from '../models/Driver';
import Branch from '../models/Branch';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { logger } from '../utils/logger';

const periodToDate = (period: string): Date => {
  switch (period) {
    case 'week':
      return subDays(new Date(), 7);
    case 'year':
      return subYears(new Date(), 1);
    case 'month':
    default:
      return subMonths(new Date(), 1);
  }
};

export const getBranchAnalytics = async (req: Request, res: Response) => {
  try {
    const { branchId } = req.params;
    const period = (req.query.period as string) || 'month';
    const since = periodToDate(period);

    const trips = await Trip.find({ branchId, createdAt: { $gte: since }, isDeleted: { $ne: true } });
    const completedTrips = trips.filter((t) => t.status === 'completed');

    const totalEarnings = completedTrips.reduce((sum, t) => sum + t.totalEarnings, 0);
    const totalKilometers = trips.reduce((sum, t) => sum + t.distance, 0);

    const rankedDrivers = await Driver.find({ branchId }).sort({ avgRating: -1, totalTrips: -1 });
    const top = rankedDrivers[0];
    let topDriver = null;
    if (top) {
      const topUser = await top.populate<{ userId: { firstName: string; lastName: string } }>(
        'userId',
        'firstName lastName'
      );
      topDriver = {
        name: `${topUser.userId.firstName} ${topUser.userId.lastName}`.trim(),
        trips: top.totalTrips,
        rating: top.avgRating,
      };
    }

    const averageRating =
      rankedDrivers.length > 0
        ? rankedDrivers.reduce((sum, d) => sum + d.avgRating, 0) / rankedDrivers.length
        : 0;

    return sendSuccess(res, 200, 'Branch analytics retrieved', {
      analytics: {
        period,
        totalTrips: trips.length,
        completedTrips: completedTrips.length,
        completionRate: trips.length ? Math.round((completedTrips.length / trips.length) * 1000) / 10 : 0,
        totalEarnings,
        totalKilometers,
        averageRating: Math.round(averageRating * 10) / 10,
        topDriver,
      },
    });
  } catch (error) {
    logger.error('Get branch analytics error', { error });
    return sendError(res, 500, 'Failed to retrieve analytics');
  }
};

// Powers admin's System Analytics table - one batched pass over every branch instead of
// the frontend firing a separate /branch/:branchId request per branch (which would mean
// hundreds of parallel requests once there are hundreds of branches).
export const getSystemAnalytics = async (req: Request, res: Response) => {
  try {
    const period = (req.query.period as string) || 'month';
    const since = periodToDate(period);

    const branches = await Branch.find().sort({ name: 1 });

    const tripAgg = await Trip.aggregate([
      { $match: { createdAt: { $gte: since }, isDeleted: { $ne: true } } },
      {
        $group: {
          _id: '$branchId',
          totalTrips: { $sum: 1 },
          completedTrips: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] } },
          totalKilometers: { $sum: '$distance' },
          totalEarnings: { $sum: { $cond: [{ $eq: ['$status', 'completed'] }, '$totalEarnings', 0] } },
        },
      },
    ]);

    const driverAgg = await Driver.aggregate([{ $group: { _id: '$branchId', averageRating: { $avg: '$avgRating' } } }]);

    const tripMap = new Map(tripAgg.map((t) => [t._id?.toString(), t]));
    const driverMap = new Map(driverAgg.map((d) => [d._id?.toString(), d]));

    const branchAnalytics = branches.map((branch) => {
      const t = tripMap.get(branch._id.toString());
      const d = driverMap.get(branch._id.toString());
      const totalTrips = t?.totalTrips ?? 0;
      const completedTrips = t?.completedTrips ?? 0;

      return {
        branchId: branch._id,
        branchName: branch.name,
        totalTrips,
        completedTrips,
        completionRate: totalTrips ? Math.round((completedTrips / totalTrips) * 1000) / 10 : 0,
        totalEarnings: t?.totalEarnings ?? 0,
        totalKilometers: t?.totalKilometers ?? 0,
        averageRating: d ? Math.round(d.averageRating * 10) / 10 : 0,
      };
    });

    const systemTotalTrips = branchAnalytics.reduce((sum, b) => sum + b.totalTrips, 0);
    const systemCompletedTrips = branchAnalytics.reduce((sum, b) => sum + b.completedTrips, 0);

    const systemTotals = {
      totalTrips: systemTotalTrips,
      completedTrips: systemCompletedTrips,
      completionRate: systemTotalTrips ? Math.round((systemCompletedTrips / systemTotalTrips) * 1000) / 10 : 0,
      totalEarnings: branchAnalytics.reduce((sum, b) => sum + b.totalEarnings, 0),
      totalKilometers: branchAnalytics.reduce((sum, b) => sum + b.totalKilometers, 0),
      averageRating: branchAnalytics.length
        ? Math.round((branchAnalytics.reduce((sum, b) => sum + b.averageRating, 0) / branchAnalytics.length) * 10) / 10
        : 0,
    };

    return sendSuccess(res, 200, 'System analytics retrieved', { period, branches: branchAnalytics, systemTotals });
  } catch (error) {
    logger.error('Get system analytics error', { error });
    return sendError(res, 500, 'Failed to retrieve system analytics');
  }
};
