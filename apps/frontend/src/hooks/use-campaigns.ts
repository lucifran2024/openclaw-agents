'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface CampaignStats {
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  optedOut: number;
}

export type CampaignStatus =
  | 'draft'
  | 'scheduled'
  | 'running'
  | 'paused'
  | 'completed'
  | 'cancelled';

export type CampaignType = 'broadcast' | 'triggered';

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  type: CampaignType;
  templateId?: string;
  segmentId?: string;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  stats: CampaignStats;
  createdAt: string;
}

export interface CampaignsFilters {
  search?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface CampaignsMeta {
  total: number;
  page: number;
  limit: number;
}

export interface CampaignsResponse {
  data: Campaign[];
  meta: CampaignsMeta;
}

export interface CreateCampaignDto {
  name: string;
  description?: string;
  type: CampaignType;
  templateId?: string;
  segmentId?: string;
  scheduledAt?: string;
}

export function useCampaigns(filters: CampaignsFilters = {}) {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.status) params.status = filters.status;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);

  return useQuery<CampaignsResponse>({
    queryKey: ['campaigns', filters],
    queryFn: async () => {
      const res = await apiClient.get<CampaignsResponse>('/campaigns', { params });
      return res.data;
    },
  });
}

export function useCampaign(id: string | undefined) {
  return useQuery<Campaign>({
    queryKey: ['campaigns', id],
    queryFn: async () => {
      const res = await apiClient.get<Campaign>(`/campaigns/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateCampaignDto) => {
      const res = await apiClient.post<Campaign>('/campaigns', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
    },
  });
}

export function useStartCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<Campaign>(`/campaigns/${id}/start`);
      return res.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', id] });
    },
  });
}

export function usePauseCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<Campaign>(`/campaigns/${id}/pause`);
      return res.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', id] });
    },
  });
}

export function useCancelCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<Campaign>(`/campaigns/${id}/cancel`);
      return res.data;
    },
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', id] });
    },
  });
}
