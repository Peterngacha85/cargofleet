import bcrypt from 'bcryptjs';
import { config } from '../config/environment';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (password: string, hash: string): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const findSuperAdminByEmail = (email: string) => {
  return config.superAdmins.find((admin) => admin.email === email);
};
