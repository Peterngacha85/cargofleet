import { Types } from 'mongoose';
import Driver from '../models/Driver';
import DriverRating from '../models/DriverRating';
import { RATING_IMPACT } from '../utils/constants';

export const computeRatingImpact = (rating: number, tripEarnings: number) => {
  const impact = RATING_IMPACT[rating as keyof typeof RATING_IMPACT] ?? { deductionPercentage: 0, bonusPercentage: 0 };
  const adjustment = tripEarnings * ((impact.bonusPercentage - impact.deductionPercentage) / 100);
  return {
    deductionPercentage: impact.deductionPercentage,
    bonusPercentage: impact.bonusPercentage,
    tripEarnings,
    adjustedEarnings: tripEarnings + adjustment,
  };
};

export const recalculateDriverAverageRating = async (driverId: string) => {
  const ratings = await DriverRating.find({ driverId: new Types.ObjectId(driverId) });
  if (ratings.length === 0) return;

  const avg = ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length;
  await Driver.findByIdAndUpdate(driverId, { avgRating: Math.round(avg * 10) / 10 });
};
