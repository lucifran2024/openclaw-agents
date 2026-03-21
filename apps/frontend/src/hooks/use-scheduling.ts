'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Appointment {
  id: string;
  contactId: string;
  resourceId: string;
  serviceTypeId: string;
  startAt: string;
  endAt: string;
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show';
  notes?: string;
  createdAt: string;
}

export interface TimeSlot {
  startAt: string;
  endAt: string;
  available: boolean;
}

export interface ServiceType {
  id: string;
  name: string;
  durationMinutes: number;
  price?: number;
  color?: string;
}

export interface Resource {
  id: string;
  name: string;
  type: 'professional' | 'room' | 'equipment' | 'table';
}

export interface CreateAppointmentDto {
  contactId: string;
  resourceId: string;
  serviceTypeId: string;
  startAt: string;
  notes?: string;
}

export function useAppointments(date: string, resourceId?: string) {
  const params: Record<string, string> = { date };
  if (resourceId) params.resourceId = resourceId;

  return useQuery<Appointment[]>({
    queryKey: ['appointments', date, resourceId],
    queryFn: async () => {
      const res = await apiClient.get<Appointment[]>('/scheduling/appointments', { params });
      return res.data;
    },
  });
}

export function useAvailability(resourceId: string, serviceTypeId: string, date: string) {
  return useQuery<{ slots: TimeSlot[] }>({
    queryKey: ['availability', resourceId, serviceTypeId, date],
    queryFn: async () => {
      const res = await apiClient.get<{ slots: TimeSlot[] }>('/scheduling/availability', {
        params: { resourceId, serviceTypeId, date },
      });
      return res.data;
    },
    enabled: !!resourceId && !!serviceTypeId && !!date,
  });
}

export function useServiceTypes() {
  return useQuery<ServiceType[]>({
    queryKey: ['service-types'],
    queryFn: async () => {
      const res = await apiClient.get<ServiceType[]>('/scheduling/service-types');
      return res.data;
    },
  });
}

export function useResources() {
  return useQuery<Resource[]>({
    queryKey: ['resources'],
    queryFn: async () => {
      const res = await apiClient.get<Resource[]>('/scheduling/resources');
      return res.data;
    },
  });
}

export function useCreateAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateAppointmentDto) => {
      const res = await apiClient.post<Appointment>('/scheduling/appointments', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<Appointment>(`/scheduling/appointments/${id}/cancel`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function useConfirmAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const res = await apiClient.post<Appointment>(`/scheduling/appointments/${id}/confirm`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}
