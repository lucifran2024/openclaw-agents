'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  planId?: string;
  status: 'active' | 'trial' | 'past_due' | 'suspended' | 'cancelled';
  vertical: 'clinic' | 'salon' | 'restaurant' | 'ecommerce' | 'services' | 'general';
  settings: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateTenantDto {
  name?: string;
  slug?: string;
  vertical?: Tenant['vertical'];
  settings?: Record<string, unknown>;
}

export interface SettingsUser {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'supervisor' | 'agent' | 'viewer';
  status: 'active' | 'inactive' | 'invited';
  teams: string[];
  units: string[];
  lastLogin?: string;
  createdAt: string;
}

export interface InviteUserDto {
  name: string;
  email: string;
  role?: SettingsUser['role'];
  teams?: string[];
  units?: string[];
}

export interface UpdateUserDto {
  name?: string;
  role?: SettingsUser['role'];
  status?: SettingsUser['status'];
  teams?: string[];
  units?: string[];
}

export interface WhatsAppAccount {
  id: string;
  provider?: 'meta' | 'evolution';
  evolutionInstanceName?: string;
  wabaId: string;
  phoneNumberId: string;
  phoneNumber: string;
  displayName: string;
  qualityRating: 'GREEN' | 'YELLOW' | 'RED';
  messagingTier: string;
  status: 'active' | 'inactive' | 'pending';
  webhookSecret?: string;
  capabilities: Record<string, unknown>;
  createdAt: string;
}

export interface EvolutionInstance {
  id: string;
  instanceName: string;
  displayName: string;
  phoneNumber: string;
  status: 'active' | 'inactive' | 'pending';
  provider: 'evolution';
  evolutionInstanceName: string;
  createdAt: string;
}

export interface EvolutionConnectionStatus {
  id: string;
  instanceName: string;
  displayName: string;
  phoneNumber: string;
  accountStatus: 'active' | 'inactive' | 'pending';
  connection: {
    connected: boolean;
    state: 'open' | 'close' | 'connecting' | 'unknown';
    phoneNumber?: string;
    name?: string;
  };
}

export interface EvolutionQrCode {
  instanceName: string;
  qrCode: string;
  pairingCode?: string;
}

export interface CreateWhatsAppAccountDto {
  wabaId: string;
  phoneNumberId: string;
  phoneNumber: string;
  displayName: string;
  accessTokenEncrypted: string;
  webhookSecret?: string;
  status?: WhatsAppAccount['status'];
  messagingTier?: string;
  qualityRating?: WhatsAppAccount['qualityRating'];
  capabilities?: Record<string, unknown>;
}

export interface UpdateWhatsAppAccountDto {
  displayName?: string;
  phoneNumber?: string;
  accessTokenEncrypted?: string;
  webhookSecret?: string;
  status?: WhatsAppAccount['status'];
  messagingTier?: string;
  qualityRating?: WhatsAppAccount['qualityRating'];
  capabilities?: Record<string, unknown>;
}

export interface WhatsAppTemplate {
  id: string;
  whatsappAccountId: string;
  name: string;
  language: string;
  category: 'marketing' | 'utility' | 'authentication' | 'service';
  status: 'pending' | 'approved' | 'rejected';
  components: Record<string, unknown>[];
  createdAt: string;
}

export interface SlaPolicy {
  id: string;
  name: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  priorityOverrides: Record<string, { firstResponse: number; resolution: number }>;
  businessHours: Record<string, unknown>;
  createdAt: string;
}

export interface SlaPolicyInput {
  name: string;
  firstResponseMinutes: number;
  resolutionMinutes: number;
  priorityOverrides?: Record<string, { firstResponse: number; resolution: number }>;
  businessHours?: Record<string, unknown>;
}

export interface QuickReply {
  id: string;
  shortcut: string;
  content: string;
  createdBy: string;
  createdAt: string;
}

export interface QuickReplyInput {
  shortcut: string;
  content: string;
}

export interface BillingPlanLimits {
  maxContacts: number;
  maxConversations: number;
  maxCampaignsPerMonth: number;
  maxAiQueries: number;
  maxStorageMb: number;
  features: string[];
}

export interface BillingPlan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: BillingPlanLimits;
}

export interface BillingSubscriptionEntity {
  id: string;
  planId: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  trialEndsAt?: string;
  cancelledAt?: string;
  stripeCustomerId?: string;
  stripePriceId?: string;
  externalId?: string;
  cancelAtPeriodEnd?: boolean;
  createdAt: string;
}

export interface BillingSubscriptionResponse {
  subscription: BillingSubscriptionEntity;
  plan: BillingPlan;
}

export interface BillingUsageMetric {
  metric: string;
  value: number;
  limit: number;
}

export interface BillingUsageResponse {
  period: { from: string; to: string };
  metrics: BillingUsageMetric[];
}

export interface BillingInvoice {
  id: string;
  number?: string | null;
  amountPaid: number;
  amountDue: number;
  currency: string;
  status?: string | null;
  hostedInvoiceUrl?: string | null;
  invoicePdf?: string | null;
  created: number;
  periodStart: number;
  periodEnd: number;
}

export interface BillingCheckoutResponse {
  mode: 'checkout' | 'updated';
  url?: string | null;
  sessionId?: string;
}

export interface BillingPortalResponse {
  url: string;
}

export interface BillingCancelResponse {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: string;
}

export interface SsoConfig {
  enabled: boolean;
  entityId: string;
  ssoUrl: string;
  certificate: string;
  loginUrl: string;
  callbackUrl: string;
  updatedAt?: string | null;
}

export interface UpdateSsoConfigDto {
  enabled: boolean;
  entityId?: string;
  ssoUrl?: string;
  certificate?: string;
}

export interface ApiKeySummary {
  id: string;
  name: string;
  prefix: string;
  permissions: string[];
  lastUsedAt?: string;
  expiresAt?: string;
  createdBy?: string;
  createdAt: string;
}

export interface CreateApiKeyDto {
  name: string;
  permissions: string[];
  expiresAt?: string;
}

export interface CreateApiKeyResponse {
  secret: string;
  apiKey: ApiKeySummary;
}

export function useCurrentTenant() {
  return useQuery({
    queryKey: ['settings', 'tenant'],
    queryFn: async () => {
      const res = await apiClient.get<Tenant>('/tenants/current');
      return res.data;
    },
  });
}

export function useUpdateTenant() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateTenantDto) => {
      const res = await apiClient.patch<Tenant>('/tenants/current', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'tenant'] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['settings', 'users'],
    queryFn: async () => {
      const res = await apiClient.get<SettingsUser[]>('/users');
      return res.data;
    },
  });
}

export function useInviteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InviteUserDto) => {
      const res = await apiClient.post<SettingsUser>('/users/invite', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'users'] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateUserDto }) => {
      const res = await apiClient.patch<SettingsUser>(`/users/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'users'] });
    },
  });
}

export function useWhatsAppAccounts() {
  return useQuery({
    queryKey: ['settings', 'whatsapp', 'accounts'],
    queryFn: async () => {
      const res = await apiClient.get<WhatsAppAccount[]>('/whatsapp/accounts');
      return res.data;
    },
  });
}

export function useCreateWhatsAppAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWhatsAppAccountDto) => {
      const res = await apiClient.post<WhatsAppAccount>('/whatsapp/accounts', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'whatsapp', 'accounts'] });
    },
  });
}

export function useUpdateWhatsAppAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateWhatsAppAccountDto }) => {
      const res = await apiClient.patch<WhatsAppAccount>(`/whatsapp/accounts/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'whatsapp', 'accounts'] });
    },
  });
}

export function useWhatsAppTemplates(accountId?: string | null) {
  return useQuery({
    queryKey: ['settings', 'whatsapp', 'templates', accountId],
    queryFn: async () => {
      const res = await apiClient.get<WhatsAppTemplate[]>('/whatsapp/templates', {
        params: accountId ? { accountId } : undefined,
      });
      return res.data;
    },
    enabled: !!accountId,
  });
}

export function useSyncWhatsAppTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (accountId: string) => {
      const res = await apiClient.post<{ synced: number }>(
        `/whatsapp/accounts/${accountId}/sync-templates`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'whatsapp', 'templates'] });
    },
  });
}

// ─── Evolution API hooks ─────────────────────────────────────

export function useEvolutionInstances() {
  return useQuery({
    queryKey: ['settings', 'whatsapp', 'evolution', 'instances'],
    queryFn: async () => {
      const res = await apiClient.get<WhatsAppAccount[]>('/whatsapp/evolution/instances');
      return res.data;
    },
  });
}

export function useCreateEvolutionInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { displayName: string; phoneNumber?: string }) => {
      const res = await apiClient.post<{ id: string; instanceName: string; status: string; message: string }>(
        '/whatsapp/evolution/instances',
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'whatsapp', 'evolution'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'whatsapp', 'accounts'] });
    },
  });
}

export function useEvolutionQrCode(instanceId: string | null) {
  return useQuery({
    queryKey: ['settings', 'whatsapp', 'evolution', 'qr', instanceId],
    queryFn: async () => {
      const res = await apiClient.get<EvolutionQrCode>(
        `/whatsapp/evolution/instances/${instanceId}/qr`,
      );
      return res.data;
    },
    enabled: !!instanceId,
    refetchInterval: 15000, // Refresh QR every 15 seconds
  });
}

export function useEvolutionStatus(instanceId: string | null) {
  return useQuery({
    queryKey: ['settings', 'whatsapp', 'evolution', 'status', instanceId],
    queryFn: async () => {
      const res = await apiClient.get<EvolutionConnectionStatus>(
        `/whatsapp/evolution/instances/${instanceId}/status`,
      );
      return res.data;
    },
    enabled: !!instanceId,
    refetchInterval: 5000, // Check status every 5 seconds
  });
}

export function useDeleteEvolutionInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/whatsapp/evolution/instances/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'whatsapp', 'evolution'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'whatsapp', 'accounts'] });
    },
  });
}

export function useReconnectEvolutionInstance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<EvolutionQrCode>(
        `/whatsapp/evolution/instances/${id}/reconnect`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'whatsapp', 'evolution'] });
    },
  });
}

export function useSlaPolicies() {
  return useQuery({
    queryKey: ['settings', 'sla'],
    queryFn: async () => {
      const res = await apiClient.get<SlaPolicy[]>('/sla-policies');
      return res.data;
    },
  });
}

export function useCreateSlaPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: SlaPolicyInput) => {
      const res = await apiClient.post<SlaPolicy>('/sla-policies', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'sla'] });
    },
  });
}

export function useUpdateSlaPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SlaPolicyInput> }) => {
      const res = await apiClient.patch<SlaPolicy>(`/sla-policies/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'sla'] });
    },
  });
}

export function useDeleteSlaPolicy() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/sla-policies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'sla'] });
    },
  });
}

export function useQuickReplies() {
  return useQuery({
    queryKey: ['settings', 'quick-replies'],
    queryFn: async () => {
      const res = await apiClient.get<QuickReply[]>('/quick-replies');
      return res.data;
    },
  });
}

export function useCreateQuickReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: QuickReplyInput) => {
      const res = await apiClient.post<QuickReply>('/quick-replies', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'quick-replies'] });
    },
  });
}

export function useUpdateQuickReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<QuickReplyInput> }) => {
      const res = await apiClient.patch<QuickReply>(`/quick-replies/${id}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'quick-replies'] });
    },
  });
}

export function useDeleteQuickReply() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/quick-replies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'quick-replies'] });
    },
  });
}

export function useBillingSubscription() {
  return useQuery({
    queryKey: ['settings', 'billing', 'subscription'],
    queryFn: async () => {
      const res = await apiClient.get<BillingSubscriptionResponse>('/billing/subscription');
      return res.data;
    },
  });
}

export function useBillingUsage() {
  return useQuery({
    queryKey: ['settings', 'billing', 'usage'],
    queryFn: async () => {
      const res = await apiClient.get<BillingUsageResponse>('/billing/usage');
      return res.data;
    },
  });
}

export function useBillingPlans() {
  return useQuery({
    queryKey: ['settings', 'billing', 'plans'],
    queryFn: async () => {
      const res = await apiClient.get<BillingPlan[]>('/billing/plans');
      return res.data;
    },
  });
}

export function useBillingInvoices() {
  return useQuery({
    queryKey: ['settings', 'billing', 'invoices'],
    queryFn: async () => {
      const res = await apiClient.get<BillingInvoice[]>('/billing/invoices');
      return res.data;
    },
  });
}

export function useBillingCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (planId: string) => {
      const res = await apiClient.post<BillingCheckoutResponse>('/billing/checkout', { planId });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'billing'] });
    },
  });
}

export function useBillingPortal() {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<BillingPortalResponse>('/billing/portal');
      return res.data;
    },
  });
}

export function useBillingCancel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<BillingCancelResponse>('/billing/cancel');
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'billing'] });
    },
  });
}

export function useSsoConfig() {
  return useQuery({
    queryKey: ['settings', 'security', 'sso'],
    queryFn: async () => {
      const res = await apiClient.get<SsoConfig>('/sso/config');
      return res.data;
    },
  });
}

export function useUpdateSsoConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSsoConfigDto) => {
      const res = await apiClient.put<SsoConfig>('/sso/config', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'security', 'sso'] });
    },
  });
}

export function useApiKeys() {
  return useQuery({
    queryKey: ['settings', 'api-keys'],
    queryFn: async () => {
      const res = await apiClient.get<ApiKeySummary[]>('/api-keys');
      return res.data;
    },
  });
}

export function useCreateApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApiKeyDto) => {
      const res = await apiClient.post<CreateApiKeyResponse>('/api-keys', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'api-keys'] });
    },
  });
}

export function useRevokeApiKey() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/api-keys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'api-keys'] });
    },
  });
}
