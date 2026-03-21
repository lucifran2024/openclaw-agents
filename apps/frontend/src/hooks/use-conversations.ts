'use client';

import {
  useQuery,
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface Conversation {
  id: string;
  contactId: string;
  channel: 'whatsapp' | 'email' | 'webchat';
  status: 'open' | 'pending' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  lastMessageAt?: string;
  messageCount: number;
  unreadCount: number;
  createdAt: string;
  contact?: {
    id: string;
    name?: string;
    phone?: string;
    email?: string;
  };
  lastMessage?: {
    content?: { text?: string };
    senderType?: string;
  };
}

export interface Message {
  id: string;
  senderType: 'contact' | 'agent' | 'bot' | 'system';
  contentType: 'text' | 'image' | 'audio' | 'document';
  content: { text?: string; mediaUrl?: string; caption?: string };
  status: 'pending' | 'sent' | 'delivered' | 'read';
  createdAt: string;
}

interface ConversationsResponse {
  data: Conversation[];
  meta: { total: number; page: number; limit: number };
}

interface MessagesResponse {
  data: Message[];
  meta: { cursor?: string; hasMore: boolean };
}

export interface ConversationFilters {
  status?: string;
  page?: number;
  limit?: number;
  search?: string;
}

export function useConversations(filters: ConversationFilters = {}) {
  const { status = 'open', page = 1, limit = 20, search } = filters;

  return useQuery({
    queryKey: ['conversations', { status, page, limit, search }],
    queryFn: async () => {
      const params: Record<string, string> = {
        page: String(page),
        limit: String(limit),
      };
      if (status && status !== 'all') params.status = status;
      if (search) params.search = search;

      const res = await apiClient.get<ConversationsResponse>('/conversations', {
        params,
      });
      return res.data;
    },
    refetchInterval: 15000,
  });
}

export function useConversation(id: string | null) {
  return useQuery({
    queryKey: ['conversation', id],
    queryFn: async () => {
      if (!id) throw new Error('No conversation ID');
      const res = await apiClient.get<Conversation>(`/conversations/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useMessages(conversationId: string | null) {
  return useInfiniteQuery({
    queryKey: ['messages', conversationId],
    queryFn: async ({ pageParam }: { pageParam?: string }) => {
      if (!conversationId) throw new Error('No conversation ID');
      const params: Record<string, string> = { limit: '50' };
      if (pageParam) params.cursor = pageParam;

      const res = await apiClient.get<MessagesResponse>(
        `/conversations/${conversationId}/messages`,
        { params },
      );
      return res.data;
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasMore ? lastPage.meta.cursor : undefined,
    enabled: !!conversationId,
    refetchInterval: 5000,
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      conversationId,
      text,
    }: {
      conversationId: string;
      text: string;
    }) => {
      const res = await apiClient.post<Message>(
        `/conversations/${conversationId}/messages`,
        {
          contentType: 'text',
          content: { text },
        },
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', variables.conversationId],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...data
    }: {
      id: string;
      status?: string;
      assignedTo?: string;
      priority?: string;
    }) => {
      const res = await apiClient.patch<Conversation>(
        `/conversations/${id}`,
        data,
      );
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['conversation', variables.id],
      });
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    },
  });
}
