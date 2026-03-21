'use client';

import { Check, CheckCheck, Clock, FileText, Image } from 'lucide-react';
import type { Message } from '@/hooks/use-conversations';

interface MessageBubbleProps {
  message: Message;
}

function formatTime(dateStr: string) {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusIcon({ status }: { status: Message['status'] }) {
  switch (status) {
    case 'pending':
      return <Clock className="h-3 w-3 text-[var(--color-muted-foreground)]" />;
    case 'sent':
      return <Check className="h-3 w-3 text-[var(--color-muted-foreground)]" />;
    case 'delivered':
      return <CheckCheck className="h-3 w-3 text-[var(--color-muted-foreground)]" />;
    case 'read':
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    default:
      return null;
  }
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const { senderType, contentType, content, status, createdAt } = message;

  if (senderType === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="rounded-lg bg-[var(--color-muted)] px-3 py-1.5 text-xs text-[var(--color-muted-foreground)]">
          {content.text}
        </span>
      </div>
    );
  }

  const isAgent = senderType === 'agent' || senderType === 'bot';
  const alignment = isAgent ? 'justify-end' : 'justify-start';
  const bubbleBg = isAgent
    ? 'bg-[var(--color-primary)] text-[var(--color-primary-foreground)]'
    : 'bg-[var(--color-surface)] text-[var(--color-foreground)] border border-[var(--color-border)]';
  const bubbleRadius = isAgent
    ? 'rounded-2xl rounded-br-md'
    : 'rounded-2xl rounded-bl-md';

  return (
    <div className={`flex ${alignment} px-4 py-0.5`}>
      <div
        className={`max-w-[75%] ${bubbleBg} ${bubbleRadius} px-3.5 py-2 shadow-sm`}
      >
        {contentType === 'text' && (
          <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
            {content.text}
          </p>
        )}

        {contentType === 'image' && (
          <div className="space-y-1.5">
            {content.mediaUrl ? (
              <img
                src={content.mediaUrl}
                alt={content.caption || 'Imagem'}
                className="max-h-64 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-40 w-56 items-center justify-center rounded-lg bg-[var(--color-muted)]">
                <Image className="h-8 w-8 text-[var(--color-muted-foreground)]" />
              </div>
            )}
            {content.caption && (
              <p className="text-sm">{content.caption}</p>
            )}
          </div>
        )}

        {(contentType === 'audio' || contentType === 'document') && (
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 flex-shrink-0" />
            <span className="truncate text-sm">
              {content.caption || (contentType === 'audio' ? 'Audio' : 'Documento')}
            </span>
          </div>
        )}

        <div
          className={`mt-1 flex items-center gap-1 ${
            isAgent ? 'justify-end' : 'justify-end'
          }`}
        >
          <span
            className={`text-[10px] ${
              isAgent
                ? 'text-[var(--color-primary-foreground)]/70'
                : 'text-[var(--color-muted-foreground)]'
            }`}
          >
            {formatTime(createdAt)}
          </span>
          {isAgent && <StatusIcon status={status} />}
        </div>
      </div>
    </div>
  );
}
