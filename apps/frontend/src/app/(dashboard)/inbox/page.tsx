'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useCallback, Suspense } from 'react';
import { ConversationList } from '@/components/inbox/conversation-list';
import { ChatPanel } from '@/components/inbox/chat-panel';

function InboxContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedId = searchParams.get('id');

  const handleSelect = useCallback(
    (id: string) => {
      router.push(`/inbox?id=${id}`, { scroll: false });
    },
    [router],
  );

  const handleBack = useCallback(() => {
    router.push('/inbox', { scroll: false });
  }, [router]);

  return (
    <div className="-m-4 lg:-m-6 flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* Conversation List - hidden on mobile when a conversation is selected */}
      <div
        className={`w-full flex-shrink-0 lg:block lg:w-96 ${
          selectedId ? 'hidden' : 'block'
        }`}
      >
        <ConversationList selectedId={selectedId} onSelect={handleSelect} />
      </div>

      {/* Chat Panel - hidden on mobile when no conversation is selected */}
      <div
        className={`min-w-0 flex-1 ${
          selectedId ? 'block' : 'hidden lg:block'
        }`}
      >
        <ChatPanel conversationId={selectedId} onBack={handleBack} />
      </div>
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100vh-4rem)] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-muted)] border-t-[var(--color-primary)]" />
        </div>
      }
    >
      <InboxContent />
    </Suspense>
  );
}
