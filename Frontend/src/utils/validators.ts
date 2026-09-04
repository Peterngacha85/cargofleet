import { z } from 'zod';
import { PHONE_REGEX } from './constants';

export const phoneSchema = z.string().regex(PHONE_REGEX, 'Enter a valid phone number (e.g. +254712345678)');

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const driverRegisterSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: phoneSchema,
  drivingLicenseNumber: z.string().min(1, 'License number is required'),
  licenseExpiry: z.string().min(1, 'License expiry date is required'),
  emergencyContactName: z.string().min(1, 'Emergency contact name is required'),
  emergencyContactPhone: phoneSchema,
});

export const managerRegisterSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: phoneSchema,
});

export type LoginFormValues = z.infer<typeof loginSchema>;
export type DriverRegisterFormValues = z.infer<typeof driverRegisterSchema>;
export type ManagerRegisterFormValues = z.infer<typeof managerRegisterSchema>;
