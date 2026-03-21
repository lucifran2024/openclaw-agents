'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge } from '@/components/ui/badge';
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
  useCreateWhatsAppAccount,
  useSyncWhatsAppTemplates,
  useUpdateWhatsAppAccount,
  useWhatsAppAccounts,
  useWhatsAppTemplates,
  type WhatsAppAccount,
} from '@/hooks/use-settings';

const emptyForm = {
  wabaId: '',
  phoneNumberId: '',
  phoneNumber: '',
  displayName: '',
  accessTokenEncrypted: '',
  webhookSecret: '',
  status: 'pending' as WhatsAppAccount['status'],
  messagingTier: '1000',
  qualityRating: 'GREEN' as WhatsAppAccount['qualityRating'],
  capabilitiesText: '{\n  "templates": true,\n  "broadcast": true\n}',
};

function parseJsonObject(value: string) {
  const parsed = JSON.parse(value);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('O JSON de capacidades precisa ser um objeto.');
  }
  return parsed as Record<string, unknown>;
}

function mapAccountToForm(account: WhatsAppAccount) {
  return {
    wabaId: account.wabaId,
    phoneNumberId: account.phoneNumberId,
    phoneNumber: account.phoneNumber,
    displayName: account.displayName,
    accessTokenEncrypted: '',
    webhookSecret: account.webhookSecret || '',
    status: account.status,
    messagingTier: account.messagingTier,
    qualityRating: account.qualityRating,
    capabilitiesText: JSON.stringify(account.capabilities || {}, null, 2),
  };
}

export default function SettingsChannelsPage() {
  const accountsQuery = useWhatsAppAccounts();
  const { data: accounts, isLoading } = accountsQuery;
  const createAccount = useCreateWhatsAppAccount();
  const updateAccount = useUpdateWhatsAppAccount();
  const syncTemplates = useSyncWhatsAppTemplates();
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [mode, setMode] = useState<'create' | 'edit'>('create');
  const [form, setForm] = useState(emptyForm);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accounts?.length) {
      setMode('create');
      setSelectedAccountId(null);
      return;
    }

    if (!selectedAccountId) {
      setMode('edit');
      setSelectedAccountId(accounts[0].id);
    }
  }, [accounts, selectedAccountId]);

  const selectedAccount =
    accounts?.find((account) => account.id === selectedAccountId) || null;

  useEffect(() => {
    if (mode === 'create') {
      setForm(emptyForm);
      return;
    }

    if (selectedAccount) {
      setForm(mapAccountToForm(selectedAccount));
    }
  }, [mode, selectedAccount]);

  const templatesQuery = useWhatsAppTemplates(selectedAccountId);
  const { data: templates } = templatesQuery;

  const stats = useMemo(() => {
    const safeAccounts = accounts || [];

    return [
      { label: 'Contas conectadas', value: safeAccounts.length },
      {
        label: 'Ativas',
        value: safeAccounts.filter((account) => account.status === 'active').length,
      },
      {
        label: 'Pendentes',
        value: safeAccounts.filter((account) => account.status === 'pending').length,
      },
      {
        label: 'Templates sincronizados',
        value: templates?.length || 0,
      },
    ];
  }, [accounts, templates]);

  function handleNewAccount() {
    setMode('create');
    setSelectedAccountId(null);
    setForm(emptyForm);
    setFeedback(null);
    setError(null);
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setError(null);

    let capabilities: Record<string, unknown>;

    try {
      capabilities = parseJsonObject(form.capabilitiesText);
    } catch (jsonError) {
      setError(jsonError instanceof Error ? jsonError.message : 'JSON de capacidades invalido.');
      return;
    }

    const payload = {
      wabaId: form.wabaId.trim(),
      phoneNumberId: form.phoneNumberId.trim(),
      phoneNumber: form.phoneNumber.trim(),
      displayName: form.displayName.trim(),
      webhookSecret: form.webhookSecret.trim() || undefined,
      status: form.status,
      messagingTier: form.messagingTier.trim(),
      qualityRating: form.qualityRating,
      capabilities,
    };

    if (mode === 'edit' && selectedAccountId) {
      updateAccount.mutate(
        {
          id: selectedAccountId,
          data: {
            displayName: payload.displayName,
            phoneNumber: payload.phoneNumber,
            webhookSecret: payload.webhookSecret,
            accessTokenEncrypted: form.accessTokenEncrypted.trim() || undefined,
            status: payload.status,
            messagingTier: payload.messagingTier,
            qualityRating: payload.qualityRating,
            capabilities,
          },
        },
        {
          onSuccess: () => {
            setForm((current) => ({ ...current, accessTokenEncrypted: '' }));
            setFeedback('Canal atualizado com sucesso.');
          },
          onError: (mutationError) => {
            setError(
              mutationError instanceof Error
                ? mutationError.message
                : 'Nao foi possivel atualizar o canal.',
            );
          },
        },
      );
      return;
    }

    createAccount.mutate(
      {
        ...payload,
        accessTokenEncrypted: form.accessTokenEncrypted.trim(),
      },
      {
        onSuccess: (createdAccount) => {
          setMode('edit');
          setSelectedAccountId(createdAccount.id);
          setFeedback('Conta WhatsApp criada com sucesso.');
        },
        onError: (mutationError) => {
          setError(
            mutationError instanceof Error
              ? mutationError.message
              : 'Nao foi possivel cadastrar o canal.',
          );
        },
      },
    );
  }

  function handleSyncTemplates() {
    if (!selectedAccountId) return;

    setFeedback(null);
    setError(null);

    syncTemplates.mutate(selectedAccountId, {
      onSuccess: (result) => {
        setFeedback(`${result.synced} template(s) sincronizado(s) com sucesso.`);
      },
      onError: (mutationError) => {
        setError(
          mutationError instanceof Error
            ? mutationError.message
            : 'Nao foi possivel sincronizar os templates.',
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

  if (accountsQuery.error || !accounts) {
    return (
      <div className="space-y-6">
        <SettingsPageHeader
          title="Canais"
          description="Cadastre contas WhatsApp, acompanhe saude do numero e sincronize templates aprovados."
          actions={
            <Button variant="outline" onClick={handleNewAccount}>
              Novo Canal
            </Button>
          }
        />
        <SettingsErrorState
          title="Nao foi possivel carregar os canais"
          description="Sem a lista atual de contas WhatsApp o Settings nao consegue montar os cards, os formularios de edicao nem a sincronizacao de templates."
          details={accountsQuery.error instanceof Error ? accountsQuery.error.message : undefined}
          action={
            <Button onClick={() => void accountsQuery.refetch()}>
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
        title="Canais"
        description="Cadastre contas WhatsApp, acompanhe saude do numero e sincronize templates aprovados."
        actions={
          <Button variant="outline" onClick={handleNewAccount}>
            Novo Canal
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
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

      <div className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
        <SettingsSection
          title="Contas WhatsApp"
          description="Selecione uma conta para editar configuracoes ou abra um novo cadastro."
        >
          {!accounts?.length ? (
            <SettingsEmptyState
              title="Nenhuma conta conectada"
              description="Cadastre seu primeiro numero WhatsApp Business para liberar a operacao omnichannel."
              action={
                <Button onClick={handleNewAccount} variant="outline">
                  Cadastrar primeira conta
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <button
                  key={account.id}
                  type="button"
                  onClick={() => {
                    setMode('edit');
                    setSelectedAccountId(account.id);
                    setFeedback(null);
                    setError(null);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedAccountId === account.id && mode === 'edit'
                      ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-background)]'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">
                        {account.displayName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                        {account.phoneNumber}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>
                          {account.status}
                        </Badge>
                        <Badge variant="outline">Tier {account.messagingTier}</Badge>
                        <Badge variant="outline">Qualidade {account.qualityRating}</Badge>
                      </div>
                    </div>
                    <div className="text-xs text-[var(--color-muted-foreground)]">
                      <p>WABA {account.wabaId}</p>
                      <p className="mt-1">Phone ID {account.phoneNumberId}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SettingsSection>

        <div className="space-y-6">
          <SettingsSection
            title={mode === 'create' ? 'Novo canal' : 'Configuracao do canal'}
            description="Guarde aqui os dados tecnicos da conta e ajuste o nivel operacional do numero."
            actions={
              mode === 'edit' && selectedAccountId ? (
                <Button
                  variant="secondary"
                  onClick={handleSyncTemplates}
                  disabled={syncTemplates.isPending}
                >
                  {syncTemplates.isPending ? 'Sincronizando...' : 'Sincronizar Templates'}
                </Button>
              ) : null
            }
          >
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    Display Name
                  </label>
                  <Input
                    value={form.displayName}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, displayName: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    Numero exibido
                  </label>
                  <Input
                    value={form.phoneNumber}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, phoneNumber: e.target.value }))
                    }
                    placeholder="+55 11 99999-0000"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    WABA ID
                  </label>
                  <Input
                    value={form.wabaId}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, wabaId: e.target.value }))
                    }
                    disabled={mode === 'edit'}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    Phone Number ID
                  </label>
                  <Input
                    value={form.phoneNumberId}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, phoneNumberId: e.target.value }))
                    }
                    disabled={mode === 'edit'}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        status: e.target.value as WhatsAppAccount['status'],
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="pending">pending</option>
                    <option value="active">active</option>
                    <option value="inactive">inactive</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    Quality Rating
                  </label>
                  <select
                    value={form.qualityRating}
                    onChange={(e) =>
                      setForm((current) => ({
                        ...current,
                        qualityRating: e.target.value as WhatsAppAccount['qualityRating'],
                      }))
                    }
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="GREEN">GREEN</option>
                    <option value="YELLOW">YELLOW</option>
                    <option value="RED">RED</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    Messaging Tier
                  </label>
                  <Input
                    value={form.messagingTier}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, messagingTier: e.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    Webhook Secret
                  </label>
                  <Input
                    value={form.webhookSecret}
                    onChange={(e) =>
                      setForm((current) => ({ ...current, webhookSecret: e.target.value }))
                    }
                    placeholder="opcional"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">
                  Access Token
                </label>
                <Input
                  value={form.accessTokenEncrypted}
                  onChange={(e) =>
                    setForm((current) => ({
                      ...current,
                      accessTokenEncrypted: e.target.value,
                    }))
                  }
                  placeholder={
                    mode === 'edit'
                      ? 'Preencha apenas se quiser substituir o token atual'
                      : 'Cole o token da Cloud API'
                  }
                  required={mode === 'create'}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">
                  Capacidades (JSON)
                </label>
                <textarea
                  value={form.capabilitiesText}
                  onChange={(e) =>
                    setForm((current) => ({ ...current, capabilitiesText: e.target.value }))
                  }
                  className="min-h-36 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>

              <Button
                type="submit"
                disabled={createAccount.isPending || updateAccount.isPending}
              >
                {createAccount.isPending || updateAccount.isPending
                  ? 'Salvando...'
                  : mode === 'create'
                    ? 'Cadastrar Canal'
                    : 'Salvar Canal'}
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

          <SettingsSection
            title="Templates sincronizados"
            description="Use a sincronizacao sempre que novos templates forem aprovados na Meta."
          >
            {!selectedAccountId ? (
              <SettingsEmptyState
                title="Selecione uma conta"
                description="Os templates ficam disponiveis por conta WhatsApp. Escolha um canal para carregar a lista."
              />
            ) : templatesQuery.error ? (
              <SettingsErrorState
                title="Nao foi possivel carregar os templates"
                description="A conta foi carregada, mas a consulta de templates sincronizados falhou neste momento."
                details={templatesQuery.error instanceof Error ? templatesQuery.error.message : undefined}
                action={
                  <Button variant="outline" onClick={() => void templatesQuery.refetch()}>
                    Tentar novamente
                  </Button>
                }
              />
            ) : !templates?.length ? (
              <SettingsEmptyState
                title="Sem templates sincronizados"
                description="A conta selecionada ainda nao trouxe templates locais. Rode a sincronizacao para popular a base."
              />
            ) : (
              <div className="space-y-3">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"
                  >
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {template.name}
                        </p>
                        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                          {template.language} · {template.category}
                        </p>
                      </div>
                      <Badge
                        variant={
                          template.status === 'approved'
                            ? 'default'
                            : template.status === 'rejected'
                              ? 'destructive'
                              : 'secondary'
                        }
                      >
                        {template.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}
