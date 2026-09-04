import { EMAIL_REGEX, PHONE_REGEX } from './constants';

export const isValidEmail = (email: string): boolean => EMAIL_REGEX.test(email);
export const isValidPhone = (phone: string): boolean => PHONE_REGEX.test(phone);

export const isFutureDate = (date: Date | string): boolean => {
  return new Date(date).getTime() > Date.now();
};
