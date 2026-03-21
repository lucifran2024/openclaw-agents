'use client';

import { useAuthGuard } from '@/hooks/use-auth-guard';

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isLoading } = useAuthGuard();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-4 border-slate-700 border-t-white" />
          <p className="text-sm text-slate-300">Preparando onboarding...</p>
        </div>
      </div>
    );
  }

  return children;
}
