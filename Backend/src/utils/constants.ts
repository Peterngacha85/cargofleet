export const PHONE_REGEX = /^\+?[0-9]{10,}$/;
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const PHOTO_RETENTION_DAYS = 30;
export const LOCATION_HISTORY_RETENTION_SECONDS = 30 * 24 * 60 * 60;

export const DEFAULT_PAGE_SIZE = 10;

export const RATING_IMPACT = {
  5: { deductionPercentage: 0, bonusPercentage: 10 },
  4: { deductionPercentage: 0, bonusPercentage: 5 },
  3: { deductionPercentage: 0, bonusPercentage: 0 },
  2: { deductionPercentage: 3, bonusPercentage: 0 },
  1: { deductionPercentage: 5, bonusPercentage: 0 },
} as const;
