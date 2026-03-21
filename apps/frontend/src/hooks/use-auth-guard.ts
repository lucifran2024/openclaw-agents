'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth.store';

export function useAuthGuard() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Small delay to allow Zustand persist rehydration
    const timeout = setTimeout(() => {
      if (!useAuthStore.getState().isAuthenticated) {
        router.replace('/login');
      }
      setIsLoading(false);
    }, 100);

    return () => clearTimeout(timeout);
  }, [isAuthenticated, router]);

  return { user, isLoading };
}
