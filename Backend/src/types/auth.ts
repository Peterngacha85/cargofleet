import { UserRole } from './index';

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface SuperAdminLoginRequest {
  email: string;
  password: string;
  secretCode: string;
}

export interface StandardLoginRequest {
  email: string;
  password: string;
}

export interface GoogleOAuthRequest {
  tokenId: string;
}

export interface AuthenticatedRequestUser extends TokenPayload {}
