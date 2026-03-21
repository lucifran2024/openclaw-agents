'use client';

import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SettingsEmptyState,
  SettingsErrorState,
  SettingsPageHeader,
  SettingsSection,
} from '@/components/settings/settings-shell';
import {
  useCreateSlaPolicy,
  useDeleteSlaPolicy,
  useSlaPolicies,
  useUpdateSlaPolicy,
  type SlaPolicy,
} from '@/hooks/use-settings';

const defaultBusinessHours = JSON.stringify(
  {
    timezone: 'America/Sao_Paulo',
    weekdays: {
      monday: ['09:00-18:00'],
      tuesday: ['09:00-18:00'],
      wednesday: ['09:00-18:00'],
      thursday: ['09:00-18:00'],
      friday: ['09:00-18:00'],
    },
  },
  null,
  2,
);

const defaultOverrides = JSON.stringify(
  {
    high: { firstResponse: 15, resolution: 120 },
    urgent: { firstResponse: 5, resolution: 60 },
  },
  null,
  2,
);

const emptyForm = {
  name: '',
  firstResponseMinutes: '30',
  resolutionMinutes: '240',
  businessHoursText: defaultBusinessHours,
  priorityOverridesText: defaultOverrides,
};

function parseObject(value: string, label: string) {
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`${label} precisa ser um objeto JSON.`);
  }
  return parsed as Record<string, unknown>;
}

function mapPolicyToForm(policy: SlaPolicy) {
  return {
    name: policy.name,
    firstResponseMinutes: String(policy.firstResponseMinutes),
    resolutionMinutes: String(policy.resolutionMinutes),
    businessHoursText: JSON.stringify(policy.businessHours || {}, null, 2),
    priorityOverridesText: JSON.stringify(policy.priorityOverrides || {}, null, 2),
  };
}

export default function SettingsSlaPage() {
  const policiesQuery = useSlaPolicies();
  const { data: policies, isLoading } = policiesQuery;
  const createPolicy = useCreateSlaPolicy();
  const updatePolicy = useUpdateSlaPolicy();
  const deletePolicy = useDeleteSlaPolicy();
  const [selectedPolicyId, setSelectedPolicyId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!policies?.length) {
      setMode('create');
      setSelectedPolicyId(null);
      return;
    }

    if (!selectedPolicyId) {
      setMode('edit');
      setSelectedPolicyId(policies[0].id);
    }
  }, [policies, selectedPolicyId]);

  const selectedPolicy =
    policies?.find((policy) => policy.id === selectedPolicyId) || null;

  useEffect(() => {
    if (mode === 'create') {
      setForm(emptyForm);
      return;
    }

    if (selectedPolicy) {
      setForm(mapPolicyToForm(selectedPolicy));
    }
  }, [mode, selectedPolicy]);

  const stats = useMemo(() => {
    const safePolicies = policies || [];

    return [
      { label: 'Politicas ativas', value: safePolicies.length },
      {
        label: 'FRT medio alvo',
        value:
          safePolicies.length > 0
            ? `${Math.round(
                safePolicies.reduce((sum, policy) => sum + policy.firstResponseMinutes, 0) /
                  safePolicies.length,
              )} min`
            : '0 min',
      },
      {
        label: 'Resolucao media alvo',
        value:
          safePolicies.length > 0
            ? `${Math.round(
                safePolicies.reduce((sum, policy) => sum + policy.resolutionMinutes, 0) /
                  safePolicies.length,
              )} min`
            : '0 min',
      },
    ];
  }, [policies]);

  function handleNewPolicy() {
    setMode('create');
    setSelectedPolicyId(null);
    setForm(emptyForm);
    setFeedback(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setError(null);

    let businessHours: Record<string, unknown>;
    let priorityOverrides: Record<string, { firstResponse: number; resolution: number }>;

    try {
      businessHours = parseObject(form.businessHoursText, 'Business hours');
      priorityOverrides = parseObject(form.priorityOverridesText, 'Priority overrides') as Record<
        string,
        { firstResponse: number; resolution: number }
      >;
    } catch (jsonError) {
      setError(jsonError instanceof Error ? jsonError.message : 'JSON invalido.');
      return;
    }

    const payload = {
      name: form.name.trim(),
      firstResponseMinutes: Number(form.firstResponseMinutes),
      resolutionMinutes: Number(form.resolutionMinutes),
      businessHours,
      priorityOverrides,
    };

    if (mode === 'edit' && selectedPolicyId) {
      updatePolicy.mutate(
        { id: selectedPolicyId, data: payload },
        {
          onSuccess: () => setFeedback('Politica SLA atualizada com sucesso.'),
          onError: (mutationError) => {
            setError(
              mutationError instanceof Error
                ? mutationError.message
                : 'Nao foi possivel atualizar a politica.',
            );
          },
        },
      );
      return;
    }

    createPolicy.mutate(payload, {
      onSuccess: (createdPolicy) => {
        setMode('edit');
        setSelectedPolicyId(createdPolicy.id);
        setFeedback('Politica SLA criada com sucesso.');
      },
      onError: (mutationError) => {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Nao foi possivel criar a politica.',
        );
      },
    });
  }

  function handleDeletePolicy() {
    if (!selectedPolicyId) return;

    setFeedback(null);
    setError(null);

    deletePolicy.mutate(selectedPolicyId, {
      onSuccess: () => {
        setMode('create');
        setSelectedPolicyId(null);
        setForm(emptyForm);
        setFeedback('Politica removida com sucesso.');
      },
      onError: (mutationError) => {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Nao foi possivel remover a politica.',
        );
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (policiesQuery.error || !policies) {
    return (
      <div className="space-y-6">
        <SettingsPageHeader
          title="SLA"
          description="Crie politicas por contexto operacional e documente horarios de negocio para atendimento."
          actions={
            <Button variant="outline" onClick={handleNewPolicy}>
              Nova Politica
            </Button>
          }
        />
        <SettingsErrorState
          title="Nao foi possivel carregar as politicas SLA"
          description="Sem a lista atual de politicas o Settings nao consegue montar estatisticas, selecao e o formulario de edicao."
          details={policiesQuery.error instanceof Error ? policiesQuery.error.message : undefined}
          action={
            <Button onClick={() => void policiesQuery.refetch()}>
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
        title="SLA"
        description="Crie politicas por contexto operacional e documente horarios de negocio para atendimento."
        actions={
          <Button variant="outline" onClick={handleNewPolicy}>
            Nova Politica
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm"
          >
            <p className="text-sm text-[var(--color-muted-foreground)]">{stat.label}</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.85fr_1.15fr]">
        <SettingsSection
          title="Politicas cadastradas"
          description="Escolha uma politica para editar seus tempos ou abra uma nova estrutura."
        >
          {!policies?.length ? (
            <SettingsEmptyState
              title="Nenhuma politica criada"
              description="Defina as metas de primeiro atendimento e resolucao para acompanhar compliance do time."
              action={
                <Button variant="outline" onClick={handleNewPolicy}>
                  Criar primeira politica
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {policies.map((policy) => (
                <button
                  key={policy.id}
                  type="button"
                  onClick={() => {
                    setMode('edit');
                    setSelectedPolicyId(policy.id);
                    setFeedback(null);
                    setError(null);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedPolicyId === policy.id && mode === 'edit'
                      ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-background)]'
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {policy.name}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-muted-foreground)]">
                    <span className="rounded-full bg-[var(--color-muted)] px-3 py-1">
                      FRT {policy.firstResponseMinutes} min
                    </span>
                    <span className="rounded-full bg-[var(--color-muted)] px-3 py-1">
                      Resolucao {policy.resolutionMinutes} min
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SettingsSection>

        <SettingsSection
          title={mode === 'create' ? 'Nova politica SLA' : 'Editar politica SLA'}
          description="Mantenha a configuracao em JSON estruturado para refletir facilmente horarios e prioridades."
          actions={
            mode === 'edit' && selectedPolicyId ? (
              <Button
                variant="destructive"
                onClick={handleDeletePolicy}
                disabled={deletePolicy.isPending}
              >
                {deletePolicy.isPending ? 'Removendo...' : 'Excluir Politica'}
              </Button>
            ) : null
          }
        >
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2 md:col-span-3">
                <label className="text-sm font-medium text-[var(--color-foreground)]">
                  Nome da politica
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))}
                  placeholder="SLA Suporte Premium"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">
                  Primeiro atendimento (min)
                </label>
                <Input
                  type="number"
                  value={form.firstResponseMinutes}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      firstResponseMinutes: e.target.value,
                    }))
                  }
                  min={1}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">
                  Resolucao (min)
                </label>
                <Input
                  type="number"
                  value={form.resolutionMinutes}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      resolutionMinutes: e.target.value,
                    }))
                  }
                  min={1}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Business Hours (JSON)
              </label>
              <textarea
                value={form.businessHoursText}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    businessHoursText: e.target.value,
                  }))
                }
                className="min-h-44 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Priority Overrides (JSON)
              </label>
              <textarea
                value={form.priorityOverridesText}
                onChange={(e) =>
                  setForm((current) => ({
                    ...current,
                    priorityOverridesText: e.target.value,
                  }))
                }
                className="min-h-40 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            <Button
              type="submit"
              disabled={createPolicy.isPending || updatePolicy.isPending}
            >
              {createPolicy.isPending || updatePolicy.isPending
                ? 'Salvando...'
                : mode === 'create'
                  ? 'Criar Politica'
                  : 'Salvar Politica'}
            </Button>
          </form>

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
      </div>
    </div>
  );
}
