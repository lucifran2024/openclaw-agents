'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface DashboardOverview {
  openConversations: number;
  openConversationsTrend: number;
  pendingConversations: number;
  avgFrt: number;
  avgFrtTrend: number;
  avgArt: number;
  avgArtTrend: number;
  avgResponseTime: string;
  avgResponseTimeTrend: number;
  slaCompliance: number;
  slaComplianceTrend: number;
  todayMessages: number;
  messagesToday: number;
  messagesTodayTrend: number;
}

export interface KpiDataPoint {
  metric: string;
  value: number;
  periodStart: string;
  periodEnd: string;
  periodType: string;
}

export interface DashboardCfdResponse {
  boardId: string;
  columns: Array<{ id: string; name: string; color?: string }>;
  data: Array<Record<string, string | number>>;
}

export interface DashboardCycleTimeResponse {
  boardId: string;
  buckets: Array<{ label: string; count: number }>;
  stats: {
    avgHours: number;
    p50Hours: number;
    p90Hours: number;
    totalCards: number;
  };
}

export interface DashboardAgentPerformance {
  agentId: string;
  agentName: string;
  agentEmail: string;
  resolvedCount: number;
  openCount: number;
  avgFrtSeconds: number;
  avgArtSeconds: number;
}

export interface DashboardChannelBreakdown {
  channel: string;
  conversations: number;
  messages: number;
}

export interface DashboardNpsResponse {
  score: number;
  trend: number;
  promoters: number;
  passives: number;
  detractors: number;
  totalResponses: number;
}

export interface DashboardLayoutWidget {
  widgetId: string;
  type: string;
  x: number;
  y: number;
  w: number;
  h: number;
  config?: Record<string, unknown>;
}

export interface DashboardLayoutResponse {
  id: string;
  layoutName: string;
  isDefault: boolean;
  widgets: DashboardLayoutWidget[];
}

function formatAverageResponse(seconds: number) {
  if (!seconds) {
    return '0 min';
  }

  return `${Math.round(seconds / 60)} min`;
}

export function useDashboardOverview() {
  return useQuery({
    queryKey: ['dashboard', 'overview'],
    queryFn: async () => {
      const res = await apiClient.get<{
        openConversations: number;
        pendingConversations: number;
        avgFrt: number;
        avgArt: number;
        slaCompliance: number;
        todayMessages: number;
      }>('/dashboard/overview');

      const overview = res.data;

      return {
        ...overview,
        openConversationsTrend: 0,
        avgFrtTrend: 0,
        avgArtTrend: 0,
        avgResponseTime: formatAverageResponse(overview.avgArt),
        avgResponseTimeTrend: 0,
        slaComplianceTrend: 0,
        messagesToday: overview.todayMessages,
        messagesTodayTrend: 0,
      } satisfies DashboardOverview;
    },
    refetchInterval: 30_000,
  });
}

export function useKpiHistory(
  metrics: string[],
  periodType: string,
  startDate: string,
  endDate: string,
) {
  return useQuery({
    queryKey: ['dashboard', 'kpis', metrics, periodType, startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get<KpiDataPoint[]>('/dashboard/kpis', {
        params: {
          metrics: metrics.join(','),
          periodType,
          startDate,
          endDate,
        },
      });
      return res.data;
    },
    enabled: metrics.length > 0 && !!startDate && !!endDate,
  });
}

export function useResponseTimeHistory(startDate: string, endDate: string) {
  const query = useKpiHistory(['frt', 'art'], 'hourly', startDate, endDate);
  const { data, isLoading, error, refetch } = query;

  const chartData = (() => {
    if (!data) return [];

    const grouped: Record<string, { time: string; frt?: number; art?: number }> = {};

    for (const point of data) {
      const hour = new Date(point.periodStart).toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
      });

      if (!grouped[point.periodStart]) {
        grouped[point.periodStart] = { time: hour };
      }

      if (point.metric === 'frt') {
        grouped[point.periodStart].frt = Math.round(point.value / 60);
      } else if (point.metric === 'art') {
        grouped[point.periodStart].art = Math.round(point.value / 60);
      }
    }

    return Object.values(grouped).sort((a, b) => a.time.localeCompare(b.time));
  })();

  return { data: chartData, isLoading, error, refetch };
}

export function useMessagesHistory(startDate: string, endDate: string) {
  const query = useKpiHistory(['throughput'], 'hourly', startDate, endDate);
  const { data, isLoading, error, refetch } = query;

  const chartData = (() => {
    if (!data) return [];

    return data
      .map((point) => ({
        time: new Date(point.periodStart).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        mensagens: point.value,
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  })();

  return { data: chartData, isLoading, error, refetch };
}

export function useDashboardCfd(boardId: string | null, startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['dashboard', 'cfd', boardId, startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get<DashboardCfdResponse>('/dashboard/cfd', {
        params: {
          boardId: boardId || '',
          startDate,
          endDate,
        },
      });
      return res.data;
    },
    enabled: !!boardId && !!startDate && !!endDate,
  });
}

export function useDashboardCycleTime(boardId: string | null) {
  return useQuery({
    queryKey: ['dashboard', 'cycle-time', boardId],
    queryFn: async () => {
      const res = await apiClient.get<DashboardCycleTimeResponse>('/dashboard/cycle-time', {
        params: { boardId: boardId || '' },
      });
      return res.data;
    },
    enabled: !!boardId,
  });
}

export function useDashboardAgents(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['dashboard', 'agents', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get<DashboardAgentPerformance[]>('/dashboard/agents', {
        params: { startDate, endDate },
      });
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useDashboardChannels(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['dashboard', 'channels', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get<DashboardChannelBreakdown[]>('/dashboard/channels', {
        params: { startDate, endDate },
      });
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useDashboardNps(startDate: string, endDate: string) {
  return useQuery({
    queryKey: ['dashboard', 'nps', startDate, endDate],
    queryFn: async () => {
      const res = await apiClient.get<DashboardNpsResponse>('/dashboard/nps', {
        params: { startDate, endDate },
      });
      return res.data;
    },
    enabled: !!startDate && !!endDate,
  });
}

export function useDashboardLayout() {
  return useQuery({
    queryKey: ['dashboard', 'layout'],
    queryFn: async () => {
      const res = await apiClient.get<DashboardLayoutResponse>('/dashboard/layout');
      return res.data;
    },
  });
}

export function useSaveDashboardLayout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      widgets,
      layoutName,
    }: {
      widgets: DashboardLayoutWidget[];
      layoutName?: string;
    }) => {
      const res = await apiClient.put<DashboardLayoutResponse>('/dashboard/layout', {
        widgets,
        layoutName,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard', 'layout'] });
    },
  });
}
