'use client';

import {
  MessageSquare,
  Mail,
  Globe,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Conversation } from '@/hooks/use-conversations';

interface ConversationItemProps {
  conversation: Conversation;
  isSelected: boolean;
  onClick: () => void;
}

function getInitials(name?: string, phone?: string): string {
  if (name) {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
  if (phone) return phone.slice(-2);
  return '??';
}

function getDisplayName(conversation: Conversation): string {
  return (
    conversation.contact?.name ||
    conversation.contact?.phone ||
    conversation.contactId.slice(0, 8)
  );
}

function formatRelativeTime(dateStr?: string): string {
  if (!dateStr) return '';
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'agora';
  if (diffMin < 60) return `${diffMin}min`;
  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}h`;
  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}d`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function ChannelIcon({ channel }: { channel: Conversation['channel'] }) {
  const iconClass = 'h-3.5 w-3.5';
  switch (channel) {
    case 'whatsapp':
      return <MessageSquare className={`${iconClass} text-green-500`} />;
    case 'email':
      return <Mail className={`${iconClass} text-blue-500`} />;
    case 'webchat':
      return <Globe className={`${iconClass} text-purple-500`} />;
  }
}

function PriorityIndicator({ priority }: { priority: Conversation['priority'] }) {
  if (priority === 'low' || priority === 'medium') return null;
  if (priority === 'urgent') {
    return <AlertCircle className="h-3.5 w-3.5 text-red-500" />;
  }
  return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />;
}

const avatarColors = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-violet-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-cyan-500',
  'bg-pink-500',
  'bg-teal-500',
];

function getAvatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return avatarColors[Math.abs(hash) % avatarColors.length];
}

export function ConversationItem({
  conversation,
  isSelected,
  onClick,
}: ConversationItemProps) {
  const displayName = getDisplayName(conversation);
  const initials = getInitials(
    conversation.contact?.name,
    conversation.contact?.phone,
  );
  const lastMessageText =
    conversation.lastMessage?.content?.text || 'Sem mensagens';
  const hasUnread = conversation.unreadCount > 0;

  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[var(--color-accent)] ${
        isSelected
          ? 'bg-[var(--color-accent)] border-r-2 border-r-[var(--color-primary)]'
          : ''
      }`}
    >
      {/* Avatar */}
      <div
        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-semibold text-white ${getAvatarColor(
          conversation.id,
        )}`}
      >
        {initials}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-sm ${
              hasUnread ? 'font-semibold text-[var(--color-foreground)]' : 'font-medium text-[var(--color-foreground)]'
            }`}
          >
            {displayName}
          </span>
          <span className="flex-shrink-0 text-[11px] text-[var(--color-muted-foreground)]">
            {formatRelativeTime(conversation.lastMessageAt)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center justify-between gap-2">
          <p
            className={`truncate text-xs ${
              hasUnread
                ? 'font-medium text-[var(--color-foreground)]'
                : 'text-[var(--color-muted-foreground)]'
            }`}
          >
            {lastMessageText}
          </p>
          <div className="flex flex-shrink-0 items-center gap-1.5">
            <PriorityIndicator priority={conversation.priority} />
            <ChannelIcon channel={conversation.channel} />
            {hasUnread && (
              <Badge className="h-5 min-w-5 justify-center rounded-full px-1.5 text-[10px]">
                {conversation.unreadCount > 99
                  ? '99+'
                  : conversation.unreadCount}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
