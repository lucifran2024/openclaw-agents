'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Send,
  ArrowLeft,
  MoreVertical,
  CheckCircle2,
  XCircle,
  UserPlus,
  Loader2,
  MessageSquare,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { MessageBubble } from './message-bubble';
import {
  useConversation,
  useMessages,
  useSendMessage,
  useUpdateConversation,
  type Message,
} from '@/hooks/use-conversations';

interface ChatPanelProps {
  conversationId: string | null;
  onBack?: () => void;
}

const statusLabels: Record<string, string> = {
  open: 'Aberta',
  pending: 'Pendente',
  resolved: 'Resolvida',
  closed: 'Fechada',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  open: 'default',
  pending: 'secondary',
  resolved: 'outline',
  closed: 'destructive',
};

const priorityLabels: Record<string, string> = {
  low: 'Baixa',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const priorityColors: Record<string, string> = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-amber-500',
  urgent: 'text-red-500',
};

function groupMessagesByDate(messages: Message[]) {
  const groups: { date: string; messages: Message[] }[] = [];

  for (const msg of messages) {
    const dateStr = new Date(msg.createdAt).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });

    const lastGroup = groups[groups.length - 1];
    if (lastGroup && lastGroup.date === dateStr) {
      lastGroup.messages.push(msg);
    } else {
      groups.push({ date: dateStr, messages: [msg] });
    }
  }

  return groups;
}

function ChatSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] p-4">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
      <div className="flex-1 space-y-3 p-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}
          >
            <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? 'w-52' : 'w-40'}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ChatPanel({ conversationId, onBack }: ChatPanelProps) {
  const [messageText, setMessageText] = useState('');
  const [showActions, setShowActions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const { data: conversation, isLoading: conversationLoading } =
    useConversation(conversationId);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMessages(conversationId);

  const sendMessage = useSendMessage();
  const updateConversation = useUpdateConversation();

  const allMessages = useMemo(() => {
    if (!messagesData?.pages) return [];
    const msgs = messagesData.pages.flatMap((page) => page.data);
    return msgs.sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [messagesData]);

  const messageGroups = useMemo(
    () => groupMessagesByDate(allMessages),
    [allMessages],
  );

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [allMessages.length, scrollToBottom]);

  const handleSend = () => {
    const text = messageText.trim();
    if (!text || !conversationId) return;
    sendMessage.mutate(
      { conversationId, text },
      {
        onSuccess: () => {
          setMessageText('');
          scrollToBottom();
        },
      },
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleResolve = () => {
    if (!conversationId) return;
    updateConversation.mutate({ id: conversationId, status: 'resolved' });
    setShowActions(false);
  };

  const handleClose = () => {
    if (!conversationId) return;
    updateConversation.mutate({ id: conversationId, status: 'closed' });
    setShowActions(false);
  };

  // Empty state
  if (!conversationId) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-[var(--color-surface)] text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--color-muted)]">
          <MessageSquare className="h-8 w-8 text-[var(--color-muted-foreground)]" />
        </div>
        <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
          Selecione uma conversa
        </h3>
        <p className="mt-1 max-w-sm text-sm text-[var(--color-muted-foreground)]">
          Escolha uma conversa na lista ao lado para visualizar as mensagens e
          responder.
        </p>
      </div>
    );
  }

  if (conversationLoading || messagesLoading) {
    return <ChatSkeleton />;
  }

  const displayName =
    conversation?.contact?.name ||
    conversation?.contact?.phone ||
    conversation?.contactId?.slice(0, 8) ||
    'Contato';

  const isClosed =
    conversation?.status === 'closed' || conversation?.status === 'resolved';

  return (
    <div className="flex h-full flex-col bg-[var(--color-surface)]">
      {/* Header */}
      <div className="flex flex-shrink-0 items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-background)] px-4 py-3">
        <div className="flex items-center gap-3">
          {onBack && (
            <Button variant="ghost" size="icon" onClick={onBack} className="lg:hidden">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          )}
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-primary)] text-sm font-semibold text-[var(--color-primary-foreground)]">
            {displayName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--color-foreground)]">
              {displayName}
            </h3>
            <div className="flex items-center gap-2">
              {conversation && (
                <>
                  <Badge
                    variant={statusVariants[conversation.status] || 'secondary'}
                    className="text-[10px] px-1.5 py-0"
                  >
                    {statusLabels[conversation.status] || conversation.status}
                  </Badge>
                  <span
                    className={`text-[10px] font-medium ${
                      priorityColors[conversation.priority] || ''
                    }`}
                  >
                    {priorityLabels[conversation.priority] || conversation.priority}
                  </span>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="relative">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowActions(!showActions)}
          >
            <MoreVertical className="h-5 w-5" />
          </Button>

          {showActions && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setShowActions(false)}
              />
              <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] py-1 shadow-lg">
                <button
                  onClick={handleResolve}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-accent)]"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Resolver conversa
                </button>
                <button
                  onClick={handleClose}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-accent)]"
                >
                  <XCircle className="h-4 w-4 text-red-500" />
                  Fechar conversa
                </button>
                <button
                  onClick={() => setShowActions(false)}
                  className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-accent)]"
                >
                  <UserPlus className="h-4 w-4" />
                  Atribuir a agente
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto py-3"
      >
        {/* Load more */}
        {hasNextPage && (
          <div className="flex justify-center pb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="text-xs"
            >
              {isFetchingNextPage ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : (
                <ChevronUp className="mr-1 h-3 w-3" />
              )}
              Carregar anteriores
            </Button>
          </div>
        )}

        {messageGroups.map((group) => (
          <div key={group.date}>
            {/* Date separator */}
            <div className="flex items-center justify-center py-3">
              <span className="rounded-full bg-[var(--color-muted)] px-3 py-1 text-[11px] font-medium text-[var(--color-muted-foreground)]">
                {group.date}
              </span>
            </div>
            {group.messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </div>
        ))}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="flex-shrink-0 border-t border-[var(--color-border)] bg-[var(--color-background)] p-3">
        {isClosed ? (
          <div className="flex items-center justify-center rounded-lg bg-[var(--color-muted)] py-3">
            <p className="text-sm text-[var(--color-muted-foreground)]">
              Esta conversa foi {conversation?.status === 'resolved' ? 'resolvida' : 'fechada'}.
            </p>
          </div>
        ) : (
          <div className="flex items-end gap-2">
            <Input
              placeholder="Digite sua mensagem..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1"
              disabled={sendMessage.isPending}
            />
            <Button
              size="icon"
              onClick={handleSend}
              disabled={!messageText.trim() || sendMessage.isPending}
            >
              {sendMessage.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
