export type TenantStatus = 'active' | 'trial' | 'suspended' | 'cancelled';
export type TenantVertical = 'clinic' | 'salon' | 'restaurant' | 'ecommerce' | 'services' | 'general';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  planId?: string;
  status: TenantStatus;
  vertical: TenantVertical;
  settings: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}
