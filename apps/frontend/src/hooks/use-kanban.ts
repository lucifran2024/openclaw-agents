'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Board {
  id: string;
  name: string;
  type: 'sales' | 'support' | 'custom';
}

export interface Column {
  id: string;
  name: string;
  position: number;
  wipLimit: number;
  color?: string;
  isTerminal: boolean;
}

export interface Swimlane {
  id: string;
  name: string;
  position: number;
}

export interface BoardDetail extends Board {
  columns: Column[];
  swimlanes: Swimlane[];
}

export interface Card {
  id: string;
  columnId: string;
  swimlaneId?: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo?: string;
  dueDate?: string;
  position: number;
}

export interface BoardMetrics {
  columns: {
    id: string;
    name: string;
    cardCount: number;
    avgDwellTime: number;
    wipExceeded: boolean;
  }[];
}

// ── Queries ────────────────────────────────────────────────────────────────────

export function useBoards() {
  return useQuery({
    queryKey: ['kanban', 'boards'],
    queryFn: async () => {
      const res = await apiClient.get<Board[]>('/kanban/boards');
      return res.data;
    },
  });
}

export function useBoard(id: string | null) {
  return useQuery({
    queryKey: ['kanban', 'boards', id],
    queryFn: async () => {
      const res = await apiClient.get<BoardDetail>(`/kanban/boards/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useBoardCards(boardId: string | null) {
  return useQuery({
    queryKey: ['kanban', 'cards', boardId],
    queryFn: async () => {
      const res = await apiClient.get<Card[]>(`/kanban/boards/${boardId}/cards`);
      return res.data;
    },
    enabled: !!boardId,
  });
}

export function useBoardMetrics(boardId: string | null) {
  return useQuery({
    queryKey: ['kanban', 'metrics', boardId],
    queryFn: async () => {
      const res = await apiClient.get<BoardMetrics>(`/kanban/boards/${boardId}/metrics`);
      return res.data;
    },
    enabled: !!boardId,
  });
}

// ── Mutations ──────────────────────────────────────────────────────────────────

export function useMoveCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      columnId,
      position,
    }: {
      cardId: string;
      columnId: string;
      position: number;
      boardId: string;
    }) => {
      const res = await apiClient.post(`/kanban/cards/${cardId}/move`, {
        columnId,
        position,
      });
      return res.data;
    },
    onMutate: async ({ cardId, columnId, position, boardId }) => {
      await queryClient.cancelQueries({
        queryKey: ['kanban', 'cards', boardId],
      });

      const previousCards = queryClient.getQueryData<Card[]>([
        'kanban',
        'cards',
        boardId,
      ]);

      queryClient.setQueryData<Card[]>(
        ['kanban', 'cards', boardId],
        (old) => {
          if (!old) return old;

          const card = old.find((c) => c.id === cardId);
          if (!card) return old;

          const oldColumnId = card.columnId;

          // Remove card from its current position
          const withoutCard = old.filter((c) => c.id !== cardId);

          // Recalculate positions in old column
          const oldColumnCards = withoutCard
            .filter((c) => c.columnId === oldColumnId)
            .sort((a, b) => a.position - b.position)
            .map((c, i) => ({ ...c, position: i }));

          // Get cards in the target column (excluding cards from the old column we already processed)
          const targetColumnCards = withoutCard
            .filter((c) => c.columnId === columnId && c.columnId !== oldColumnId)
            .sort((a, b) => a.position - b.position);

          // If moving within the same column, use oldColumnCards as base
          const baseCards =
            oldColumnId === columnId ? oldColumnCards : targetColumnCards;

          // Insert the card at the new position
          const updatedCard = { ...card, columnId, position };
          const newColumnCards = [...baseCards];
          newColumnCards.splice(position, 0, updatedCard);
          const reindexed = newColumnCards.map((c, i) => ({
            ...c,
            position: i,
          }));

          // Build the new full list
          const otherCards = withoutCard.filter(
            (c) =>
              c.columnId !== columnId &&
              (oldColumnId === columnId || c.columnId !== oldColumnId),
          );

          const finalOldColumn =
            oldColumnId !== columnId ? oldColumnCards : [];

          return [...otherCards, ...finalOldColumn, ...reindexed];
        },
      );

      return { previousCards };
    },
    onError: (_err, { boardId }, context) => {
      if (context?.previousCards) {
        queryClient.setQueryData(
          ['kanban', 'cards', boardId],
          context.previousCards,
        );
      }
    },
    onSettled: (_data, _error, { boardId }) => {
      queryClient.invalidateQueries({
        queryKey: ['kanban', 'cards', boardId],
      });
      queryClient.invalidateQueries({
        queryKey: ['kanban', 'metrics', boardId],
      });
    },
  });
}

export function useCreateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: {
        boardId: string;
        columnId: string;
        title: string;
        priority: Card['priority'];
        description?: string;
        assignedTo?: string;
        dueDate?: string;
      },
    ) => {
      const res = await apiClient.post<Card>('/kanban/cards', payload);
      return res.data;
    },
    onSuccess: (_data, { boardId }) => {
      queryClient.invalidateQueries({
        queryKey: ['kanban', 'cards', boardId],
      });
      queryClient.invalidateQueries({
        queryKey: ['kanban', 'metrics', boardId],
      });
    },
  });
}

export function useUpdateCard() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      cardId,
      ...payload
    }: {
      cardId: string;
      boardId: string;
      title?: string;
      description?: string;
      priority?: Card['priority'];
      assignedTo?: string;
      dueDate?: string;
    }) => {
      const res = await apiClient.patch<Card>(`/kanban/cards/${cardId}`, payload);
      return res.data;
    },
    onSuccess: (_data, { boardId }) => {
      queryClient.invalidateQueries({
        queryKey: ['kanban', 'cards', boardId],
      });
    },
  });
}
