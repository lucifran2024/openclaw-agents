'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export type OnboardingVertical =
  | 'clinic'
  | 'salon'
  | 'restaurant'
  | 'ecommerce'
  | 'services'
  | 'general';

export interface OnboardingTheme {
  primaryColor?: string;
  logo?: string;
  favicon?: string;
}

export interface OnboardingStatus {
  tenant: {
    id: string;
    name: string;
    slug: string;
    status: string;
    vertical: OnboardingVertical;
  };
  vertical: OnboardingVertical;
  completedSteps: string[];
  requiredSteps: string[];
  currentStep: string;
  isComplete: boolean;
  sampleDataLoaded: boolean;
  theme: Required<OnboardingTheme>;
  draftData: {
    whatsapp?: Record<string, unknown>;
    team?: Record<string, unknown>;
  };
}

export function useOnboardingStatus() {
  return useQuery({
    queryKey: ['onboarding', 'status'],
    queryFn: async () => {
      const res = await apiClient.get<OnboardingStatus>('/onboarding/status');
      return res.data;
    },
  });
}

export function useCompleteOnboardingStep() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      stepName,
      data,
    }: {
      stepName: string;
      data?: Record<string, unknown>;
    }) => {
      const res = await apiClient.post<OnboardingStatus>(
        `/onboarding/step/${stepName}/complete`,
        data || {},
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'tenant'] });
    },
  });
}

export function useLoadSampleData() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (vertical?: OnboardingVertical) => {
      const res = await apiClient.post<{
        vertical: OnboardingVertical;
        sampleDataLoaded: boolean;
        status: OnboardingStatus;
      }>('/onboarding/sample-data', vertical ? { vertical } : {});
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
    },
  });
}

export function useOnboardingTheme() {
  return useQuery({
    queryKey: ['onboarding', 'theme'],
    queryFn: async () => {
      const res = await apiClient.get<OnboardingTheme>('/onboarding/theme');
      return res.data;
    },
  });
}

export function useUpdateOnboardingTheme() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (theme: OnboardingTheme) => {
      const res = await apiClient.put<OnboardingTheme>('/onboarding/theme', theme);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['onboarding'] });
      queryClient.invalidateQueries({ queryKey: ['settings', 'tenant'] });
    },
  });
}
