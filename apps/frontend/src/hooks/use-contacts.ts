'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Contact {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  whatsappId?: string;
  status: 'active' | 'inactive' | 'blocked';
  funnelStage: 'lead' | 'prospect' | 'customer' | 'churned';
  tags: Array<{ id: string; name: string; color?: string }>;
  customFields: Record<string, any>;
  lastContactedAt?: string;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
}

export interface ContactsFilters {
  search?: string;
  page?: number;
  limit?: number;
  tags?: string[];
  status?: string;
  funnelStage?: string;
}

export interface ContactsMeta {
  total: number;
  page: number;
  limit: number;
}

export interface ContactsResponse {
  data: Contact[];
  meta: ContactsMeta;
}

export interface CreateContactDto {
  name: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'blocked';
  funnelStage?: 'lead' | 'prospect' | 'customer' | 'churned';
  customFields?: Record<string, any>;
}

export interface UpdateContactDto extends Partial<CreateContactDto> {}

export function useContacts(filters: ContactsFilters = {}) {
  const params: Record<string, string> = {};
  if (filters.search) params.search = filters.search;
  if (filters.page) params.page = String(filters.page);
  if (filters.limit) params.limit = String(filters.limit);
  if (filters.tags && filters.tags.length > 0) params.tags = filters.tags.join(',');
  if (filters.status) params.status = filters.status;
  if (filters.funnelStage) params.funnelStage = filters.funnelStage;

  return useQuery<ContactsResponse>({
    queryKey: ['contacts', filters],
    queryFn: async () => {
      const res = await apiClient.get<ContactsResponse>('/contacts', { params });
      return res.data;
    },
  });
}

export function useContact(id: string | undefined) {
  return useQuery<Contact>({
    queryKey: ['contacts', id],
    queryFn: async () => {
      const res = await apiClient.get<Contact>(`/contacts/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateContactDto) => {
      const res = await apiClient.post<Contact>('/contacts', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useUpdateContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateContactDto }) => {
      const res = await apiClient.patch<Contact>(`/contacts/${id}`, data);
      return res.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.id] });
    },
  });
}

export function useDeleteContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useTags() {
  return useQuery<Tag[]>({
    queryKey: ['tags'],
    queryFn: async () => {
      const res = await apiClient.get<Tag[]>('/tags');
      return res.data;
    },
  });
}

export function useAddTagToContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      await apiClient.post(`/contacts/${contactId}/tags`, { tagId });
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useRemoveTagFromContact() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ contactId, tagId }: { contactId: string; tagId: string }) => {
      await apiClient.delete(`/contacts/${contactId}/tags/${tagId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['contacts', variables.contactId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}
