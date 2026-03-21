'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Clock3, Globe2, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SettingsErrorState,
  SettingsPageHeader,
  SettingsSection,
} from '@/components/settings/settings-shell';
import { useCurrentTenant, useUpdateTenant, type Tenant } from '@/hooks/use-settings';

const verticalOptions: Array<{ value: Tenant['vertical']; label: string }> = [
  { value: 'general', label: 'Geral' },
  { value: 'clinic', label: 'Clinica' },
  { value: 'salon', label: 'Salao' },
  { value: 'restaurant', label: 'Restaurante' },
  { value: 'ecommerce', label: 'E-commerce' },
  { value: 'services', label: 'Servicos' },
];

const timezoneOptions = [
  'America/Sao_Paulo',
  'America/Fortaleza',
  'America/Recife',
  'America/Manaus',
  'America/Rio_Branco',
  'UTC',
];

function normalizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function formatDate(date?: string) {
  if (!date) return 'Nao disponivel';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function SettingsGeneralPage() {
  const tenantQuery = useCurrentTenant();
  const { data: tenant, isLoading } = tenantQuery;
  const updateTenant = useUpdateTenant();
  const [form, setForm] = useState({
    name: '',
    slug: '',
    vertical: 'general' as Tenant['vertical'],
    timezone: 'America/Sao_Paulo',
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!tenant) return;

    setForm({
      name: tenant.name,
      slug: tenant.slug,
      vertical: tenant.vertical,
      timezone: String(tenant.settings?.timezone || 'America/Sao_Paulo'),
    });
  }, [tenant]);

  const statCards = useMemo(
    () => [
      {
        label: 'Status do Tenant',
        value:
          tenant?.status === 'trial'
            ? 'Trial'
            : tenant?.status === 'active'
              ? 'Ativo'
              : tenant?.status === 'past_due'
                ? 'Pagamento pendente'
                : tenant?.status === 'suspended'
                  ? 'Suspenso'
                  : 'Cancelado',
        icon: Landmark,
      },
      {
        label: 'Vertical',
        value:
          verticalOptions.find((option) => option.value === form.vertical)?.label || 'Geral',
        icon: Building2,
      },
      {
        label: 'Timezone',
        value: form.timezone,
        icon: Clock3,
      },
      {
        label: 'Ultima Atualizacao',
        value: formatDate(tenant?.updatedAt),
        icon: Globe2,
      },
    ],
    [form.timezone, form.vertical, tenant?.status, tenant?.updatedAt],
  );

  function updateForm<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!tenant) return;

    setFeedback(null);
    setError(null);

    updateTenant.mutate(
      {
        name: form.name.trim(),
        slug: normalizeSlug(form.slug),
        vertical: form.vertical,
        settings: {
          ...tenant.settings,
          timezone: form.timezone,
        },
      },
      {
        onSuccess: () => {
          setForm((current) => ({ ...current, slug: normalizeSlug(current.slug) }));
          setFeedback('Configuracoes gerais salvas com sucesso.');
        },
        onError: (mutationError) => {
          setError(
            mutationError instanceof Error
              ? mutationError.message
              : 'Nao foi possivel salvar as configuracoes.',
          );
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (tenantQuery.error || !tenant) {
    return (
      <div className="space-y-6">
        <SettingsPageHeader
          title="Geral"
          description="Edite os dados institucionais do tenant e as preferencias globais da operacao."
        />
        <SettingsErrorState
          title="Nao foi possivel carregar os dados do tenant"
          description="Esta area depende das configuracoes atuais do tenant para preencher o formulario e os indicadores de contexto."
          details={tenantQuery.error instanceof Error ? tenantQuery.error.message : undefined}
          action={
            <Button onClick={() => void tenantQuery.refetch()}>
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
        title="Geral"
        description="Edite os dados institucionais do tenant e as preferencias globais da operacao."
        actions={
          <Button form="general-settings-form" type="submit" disabled={updateTenant.isPending}>
            {updateTenant.isPending ? 'Salvando...' : 'Salvar Alteracoes'}
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-[var(--color-muted-foreground)]">{card.label}</p>
                  <p className="mt-2 text-base font-semibold text-[var(--color-foreground)]">
                    {card.value}
                  </p>
                </div>
                <div className="rounded-xl bg-[var(--color-muted)] p-2 text-[var(--color-primary)]">
                  <Icon className="h-4 w-4" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form id="general-settings-form" className="space-y-6" onSubmit={handleSubmit}>
        <SettingsSection
          title="Identidade do tenant"
          description="Esses dados alimentam a conta principal, URLs internas e classificacoes da operacao."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Nome da empresa
              </label>
              <Input
                value={form.name}
                onChange={(e) => updateForm('name', e.target.value)}
                placeholder="OmniChat Brasil"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">Slug</label>
              <Input
                value={form.slug}
                onChange={(e) => updateForm('slug', e.target.value)}
                onBlur={() => updateForm('slug', normalizeSlug(form.slug))}
                placeholder="omnichat-brasil"
                required
              />
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Usado em rotas publicas e branding compartilhado.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Vertical
              </label>
              <select
                value={form.vertical}
                onChange={(e) => updateForm('vertical', e.target.value as Tenant['vertical'])}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {verticalOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Timezone padrao
              </label>
              <select
                value={form.timezone}
                onChange={(e) => updateForm('timezone', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {timezoneOptions.map((timezone) => (
                  <option key={timezone} value={timezone}>
                    {timezone}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </SettingsSection>

        <SettingsSection
          title="Contexto operacional"
          description="Referencias rapidas para suporte, auditoria e integracoes internas."
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                Tenant ID
              </p>
              <p className="mt-2 font-mono text-sm text-[var(--color-foreground)]">{tenant?.id}</p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                Plano atual
              </p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-foreground)]">
                {tenant?.planId || 'Nao vinculado'}
              </p>
            </div>
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
