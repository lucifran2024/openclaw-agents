'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SettingsErrorState,
  SettingsPageHeader,
  SettingsSection,
} from '@/components/settings/settings-shell';
import { useSsoConfig, useUpdateSsoConfig } from '@/hooks/use-settings';

function formatDate(value?: string | null) {
  if (!value) return 'Nunca atualizado';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function SettingsSecurityPage() {
  const ssoQuery = useSsoConfig();
  const updateSso = useUpdateSsoConfig();
  const [form, setForm] = useState({
    enabled: false,
    entityId: '',
    ssoUrl: '',
    certificate: '',
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!ssoQuery.data) return;

    setForm({
      enabled: ssoQuery.data.enabled,
      entityId: ssoQuery.data.entityId,
      ssoUrl: ssoQuery.data.ssoUrl,
      certificate: ssoQuery.data.certificate,
    });
  }, [ssoQuery.data]);

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setError(null);

    updateSso.mutate(form, {
      onSuccess: () => {
        setFeedback(
          form.enabled
            ? 'Configuracao SSO salva com sucesso.'
            : 'SSO desativado para este tenant.',
        );
      },
      onError: (mutationError) => {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Nao foi possivel salvar a configuracao SSO.',
        );
      },
    });
  }

  if (ssoQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (ssoQuery.error || !ssoQuery.data) {
    return (
      <div className="space-y-6">
        <SettingsPageHeader
          title="Seguranca"
          description="Configure o login corporativo via SAML 2.0 e deixe o tenant pronto para SSO enterprise."
        />
        <SettingsErrorState
          title="Nao foi possivel carregar a configuracao SSO"
          description="A area de seguranca depende da configuracao atual do IdP para preencher o formulario, exibir callback e testar o fluxo."
          details={ssoQuery.error instanceof Error ? ssoQuery.error.message : undefined}
          action={
            <Button onClick={() => void ssoQuery.refetch()}>
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Seguranca"
        description="Configure o login corporativo via SAML 2.0 e deixe o tenant pronto para SSO enterprise."
        actions={
          <Button form="sso-config-form" type="submit" disabled={updateSso.isPending}>
            {updateSso.isPending ? 'Salvando...' : 'Salvar Configuracao'}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">SSO</p>
          <div className="mt-3 flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-[var(--color-primary)]" />
            <p className="text-xl font-semibold text-[var(--color-foreground)]">
              {form.enabled ? 'Ativo' : 'Desativado'}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Login URL</p>
          <p className="mt-3 break-all text-sm font-medium text-[var(--color-foreground)]">
            {ssoQuery.data?.loginUrl || 'Nao configurado'}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Ultima atualizacao</p>
          <div className="mt-3 flex items-center gap-3">
            <LockKeyhole className="h-5 w-5 text-[var(--color-primary)]" />
            <p className="text-sm font-medium text-[var(--color-foreground)]">
              {formatDate(ssoQuery.data?.updatedAt)}
            </p>
          </div>
        </div>
      </div>

      <form id="sso-config-form" className="space-y-6" onSubmit={handleSubmit}>
        <SettingsSection
          title="Configuracao SAML"
          description="Preencha os dados do provedor de identidade do tenant. Quando ativado, o backend passa a aceitar o fluxo SAML."
          actions={
            ssoQuery.data?.loginUrl ? (
              <a
                href={ssoQuery.data.loginUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
              >
                Testar SSO
                <ExternalLink className="h-4 w-4" />
              </a>
            ) : null
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <input
                type="checkbox"
                checked={form.enabled}
                onChange={(event) => updateField('enabled', event.target.checked)}
                className="mt-1 h-4 w-4 rounded border-[var(--color-border)]"
              />
              <div>
                <p className="text-sm font-semibold text-[var(--color-foreground)]">
                  Habilitar SSO
                </p>
                <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                  Quando ativo, o tenant pode iniciar login via `/sso/login`.
                </p>
              </div>
            </label>

            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">
                Callback ACS
              </p>
              <p className="mt-2 break-all text-sm text-[var(--color-muted-foreground)]">
                {ssoQuery.data?.callbackUrl || 'Nao configurado'}
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Entity ID do IdP
              </label>
              <input
                value={form.entityId}
                onChange={(event) => updateField('entityId', event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="https://login.microsoftonline.com/..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                SSO URL
              </label>
              <input
                value={form.ssoUrl}
                onChange={(event) => updateField('ssoUrl', event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="https://idp.exemplo.com/saml/login"
              />
            </div>
          </div>

          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium text-[var(--color-foreground)]">
              Certificado X.509
            </label>
            <textarea
              value={form.certificate}
              onChange={(event) => updateField('certificate', event.target.value)}
              rows={10}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              placeholder="-----BEGIN CERTIFICATE-----"
            />
          </div>

          {feedback ? (
            <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {feedback}
            </div>
          ) : null}

          {error ? (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}
        </SettingsSection>
      </form>
    </div>
  );
}
