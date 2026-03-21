'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface FlowNode {
  id: string;
  type: string;
  data: Record<string, unknown>;
  position: { x: number; y: number };
}

export interface FlowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  label?: string;
}

export type FlowStatus = 'draft' | 'published' | 'archived';

export interface Flow {
  id: string;
  name: string;
  status: FlowStatus;
  version: number;
  triggerType: string;
  createdAt: string;
  updatedAt?: string;
  nodes?: FlowNode[];
  edges?: FlowEdge[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export function useFlows() {
  return useQuery<Flow[]>({
    queryKey: ['bot-builder', 'flows'],
    queryFn: async () => {
      const res = await apiClient.get<Flow[]>('/bot-builder/flows');
      return res.data;
    },
  });
}

export function useFlow(id: string | undefined) {
  return useQuery<Flow>({
    queryKey: ['bot-builder', 'flows', id],
    queryFn: async () => {
      const res = await apiClient.get<Flow>(`/bot-builder/flows/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateFlow() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { name: string; triggerType: string }) => {
      const res = await apiClient.post<Flow>('/bot-builder/flows', data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bot-builder', 'flows'] });
    },
  });
}

export function useSaveCanvas(flowId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: { nodes: FlowNode[]; edges: FlowEdge[] }) => {
      const res = await apiClient.put<Flow>(
        `/bot-builder/flows/${flowId}/canvas`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bot-builder', 'flows', flowId],
      });
      queryClient.invalidateQueries({ queryKey: ['bot-builder', 'flows'] });
    },
  });
}

export function useValidateFlow(flowId: string) {
  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<ValidationResult>(
        `/bot-builder/flows/${flowId}/validate`,
      );
      return res.data;
    },
  });
}

export function usePublishFlow(flowId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const res = await apiClient.post<Flow>(
        `/bot-builder/flows/${flowId}/publish`,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ['bot-builder', 'flows', flowId],
      });
      queryClient.invalidateQueries({ queryKey: ['bot-builder', 'flows'] });
    },
  });
}
