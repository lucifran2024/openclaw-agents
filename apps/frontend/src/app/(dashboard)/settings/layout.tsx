import { SettingsNav } from '@/components/settings/settings-nav';

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-[var(--color-foreground)]">
          Configuracoes
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-[var(--color-muted-foreground)]">
          Centralize os ajustes operacionais do tenant, equipe e canais em um unico lugar.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1fr)]">
        <div className="xl:sticky xl:top-0 xl:self-start">
          <SettingsNav />
        </div>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
