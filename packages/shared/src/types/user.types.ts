export type UserRole = 'owner' | 'admin' | 'supervisor' | 'agent' | 'viewer';
export type UserStatus = 'active' | 'inactive' | 'invited';

export interface User {
  id: string;
  tenantId: string;
  email: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  teams: string[];
  units: string[];
  lastLogin?: Date;
  createdAt: Date;
}

export interface JwtClaims {
  sub: string;
  tid: string;
  email: string;
  role: UserRole;
  permissions: string[];
  teams: string[];
  units: string[];
  iat: number;
  exp: number;
}
