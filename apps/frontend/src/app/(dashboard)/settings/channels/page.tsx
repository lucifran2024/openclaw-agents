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
  useEvolutionInstances,
  useCreateEvolutionInstance,
  useEvolutionQrCode,
  useEvolutionStatus,
  useDeleteEvolutionInstance,
  useReconnectEvolutionInstance,
  type WhatsAppAccount,
} from '@/hooks/use-settings';

// ─── Meta Cloud API Tab ──────────────────────────────────────

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

// ─── Evolution API Tab ───────────────────────────────────────

function EvolutionTab() {
  const instancesQuery = useEvolutionInstances();
  const { data: instances, isLoading } = instancesQuery;
  const createInstance = useCreateEvolutionInstance();
  const deleteInstance = useDeleteEvolutionInstance();
  const reconnect = useReconnectEvolutionInstance();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState({ displayName: '', phoneNumber: '' });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Auto-select first instance
  useEffect(() => {
    if (instances?.length && !selectedId) {
      setSelectedId(instances[0].id);
    }
  }, [instances, selectedId]);

  const selectedInstance = instances?.find((i) => i.id === selectedId);

  // QR code and status polling
  const showQr = selectedInstance?.status === 'pending';
  const qrQuery = useEvolutionQrCode(showQr ? selectedId : null);
  const statusQuery = useEvolutionStatus(selectedId);

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setFeedback(null);
    setError(null);

    if (!createForm.displayName.trim()) {
      setError('Nome e obrigatorio.');
      return;
    }

    createInstance.mutate(
      { displayName: createForm.displayName.trim(), phoneNumber: createForm.phoneNumber.trim() || undefined },
      {
        onSuccess: (result) => {
          setFeedback(`Instancia "${result.instanceName}" criada. Escaneie o QR code para conectar.`);
          setSelectedId(result.id);
          setShowCreateForm(false);
          setCreateForm({ displayName: '', phoneNumber: '' });
        },
        onError: (err) => {
          setError(err instanceof Error ? err.message : 'Falha ao criar instancia.');
        },
      },
    );
  }

  function handleDelete(id: string) {
    setFeedback(null);
    setError(null);

    deleteInstance.mutate(id, {
      onSuccess: () => {
        setFeedback('Instancia removida.');
        setSelectedId(null);
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : 'Falha ao remover.');
      },
    });
  }

  function handleReconnect(id: string) {
    setFeedback(null);
    setError(null);

    reconnect.mutate(id, {
      onSuccess: () => {
        setFeedback('Reconectando... Escaneie o novo QR code.');
      },
      onError: (err) => {
        setError(err instanceof Error ? err.message : 'Falha ao reconectar.');
      },
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Instancias</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">{instances?.length || 0}</p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Conectadas</p>
          <p className="mt-3 text-2xl font-semibold text-emerald-600">
            {instances?.filter((i) => i.status === 'active').length || 0}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Pendentes</p>
          <p className="mt-3 text-2xl font-semibold text-amber-600">
            {instances?.filter((i) => i.status === 'pending').length || 0}
          </p>
        </div>
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
        {/* Left: Instance list */}
        <SettingsSection
          title="Instancias WhatsApp"
          description="Conecte seu WhatsApp pessoal ou comercial via QR code."
          actions={
            <Button variant="outline" onClick={() => setShowCreateForm(true)}>
              Nova Instancia
            </Button>
          }
        >
          {showCreateForm && (
            <form onSubmit={handleCreate} className="mb-4 space-y-3 rounded-2xl border border-dashed border-[var(--color-border)] p-4">
              <p className="text-sm font-semibold text-[var(--color-foreground)]">Criar nova instancia</p>
              <Input
                placeholder="Nome da instancia (ex: Atendimento)"
                value={createForm.displayName}
                onChange={(e) => setCreateForm((f) => ({ ...f, displayName: e.target.value }))}
                required
              />
              <Input
                placeholder="Numero (opcional, ex: +5511999990000)"
                value={createForm.phoneNumber}
                onChange={(e) => setCreateForm((f) => ({ ...f, phoneNumber: e.target.value }))}
              />
              <div className="flex gap-2">
                <Button type="submit" disabled={createInstance.isPending}>
                  {createInstance.isPending ? 'Criando...' : 'Criar'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancelar
                </Button>
              </div>
            </form>
          )}

          {!instances?.length && !showCreateForm ? (
            <SettingsEmptyState
              title="Nenhuma instancia"
              description="Crie uma instancia para conectar seu WhatsApp via QR code."
              action={
                <Button onClick={() => setShowCreateForm(true)} variant="outline">
                  Criar primeira instancia
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {(instances || []).map((instance) => (
                <button
                  key={instance.id}
                  type="button"
                  onClick={() => {
                    setSelectedId(instance.id);
                    setFeedback(null);
                    setError(null);
                  }}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedId === instance.id
                      ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-background)]'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">
                        {instance.displayName}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                        {instance.phoneNumber || 'Numero pendente'}
                      </p>
                    </div>
                    <Badge variant={instance.status === 'active' ? 'default' : 'secondary'}>
                      {instance.status === 'active' ? 'Conectado' : instance.status === 'pending' ? 'Pendente' : 'Desconectado'}
                    </Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SettingsSection>

        {/* Right: QR Code / Status */}
        <div className="space-y-6">
          {selectedInstance ? (
            <>
              <SettingsSection
                title="Status da Conexao"
                description={`Instancia: ${selectedInstance.evolutionInstanceName || selectedInstance.phoneNumberId}`}
              >
                {statusQuery.data ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-3 w-3 rounded-full ${
                          statusQuery.data.connection.connected
                            ? 'bg-emerald-500'
                            : 'bg-red-500'
                        }`}
                      />
                      <span className="text-sm font-medium text-[var(--color-foreground)]">
                        {statusQuery.data.connection.connected
                          ? 'Conectado'
                          : statusQuery.data.connection.state === 'connecting'
                            ? 'Conectando...'
                            : 'Desconectado'}
                      </span>
                    </div>

                    {statusQuery.data.connection.phoneNumber && (
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        Numero: {statusQuery.data.connection.phoneNumber}
                      </p>
                    )}
                    {statusQuery.data.connection.name && (
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        Nome: {statusQuery.data.connection.name}
                      </p>
                    )}

                    <div className="flex gap-2">
                      {!statusQuery.data.connection.connected && (
                        <Button
                          variant="outline"
                          onClick={() => handleReconnect(selectedInstance.id)}
                          disabled={reconnect.isPending}
                        >
                          {reconnect.isPending ? 'Reconectando...' : 'Reconectar'}
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        onClick={() => handleDelete(selectedInstance.id)}
                        disabled={deleteInstance.isPending}
                      >
                        {deleteInstance.isPending ? 'Removendo...' : 'Remover'}
                      </Button>
                    </div>
                  </div>
                ) : statusQuery.isLoading ? (
                  <Skeleton className="h-20 w-full" />
                ) : (
                  <p className="text-sm text-[var(--color-muted-foreground)]">
                    Nao foi possivel carregar o status.
                  </p>
                )}
              </SettingsSection>

              {/* QR Code Section - shown when pending */}
              {(showQr || !statusQuery.data?.connection.connected) && (
                <SettingsSection
                  title="QR Code"
                  description="Escaneie o QR code com o WhatsApp do celular para conectar."
                >
                  {qrQuery.data?.qrCode ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="rounded-2xl border border-[var(--color-border)] bg-white p-4">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={qrQuery.data.qrCode.startsWith('data:') ? qrQuery.data.qrCode : `data:image/png;base64,${qrQuery.data.qrCode}`}
                          alt="QR Code WhatsApp"
                          className="h-64 w-64"
                        />
                      </div>
                      {qrQuery.data.pairingCode && (
                        <div className="text-center">
                          <p className="text-xs text-[var(--color-muted-foreground)]">Codigo de pareamento:</p>
                          <p className="mt-1 text-lg font-mono font-bold text-[var(--color-foreground)]">
                            {qrQuery.data.pairingCode}
                          </p>
                        </div>
                      )}
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        O QR code atualiza automaticamente a cada 15 segundos.
                      </p>
                    </div>
                  ) : qrQuery.isLoading ? (
                    <div className="flex justify-center">
                      <Skeleton className="h-64 w-64 rounded-2xl" />
                    </div>
                  ) : qrQuery.error ? (
                    <div className="text-center">
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        Nao foi possivel carregar o QR code. A instancia pode ja estar conectada.
                      </p>
                      <Button variant="outline" className="mt-3" onClick={() => qrQuery.refetch()}>
                        Tentar novamente
                      </Button>
                    </div>
                  ) : null}
                </SettingsSection>
              )}
            </>
          ) : (
            <SettingsSection title="Detalhes" description="Selecione uma instancia para ver o status e QR code.">
              <SettingsEmptyState
                title="Nenhuma instancia selecionada"
                description="Escolha uma instancia na lista ao lado ou crie uma nova."
              />
            </SettingsSection>
          )}
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}
    </div>
  );
}

// ─── Meta Cloud API Tab (existing page) ──────────────────────

function MetaCloudTab() {
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

  // Filter only meta accounts
  const metaAccounts = useMemo(
    () => (accounts || []).filter((a) => !a.provider || a.provider === 'meta'),
    [accounts],
  );

  useEffect(() => {
    if (!metaAccounts?.length) {
      setMode('create');
      setSelectedAccountId(null);
      return;
    }

    if (!selectedAccountId) {
      setMode('edit');
      setSelectedAccountId(metaAccounts[0].id);
    }
  }, [metaAccounts, selectedAccountId]);

  const selectedAccount = metaAccounts?.find((a) => a.id === selectedAccountId) || null;

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
    return [
      { label: 'Contas Meta', value: metaAccounts.length },
      { label: 'Ativas', value: metaAccounts.filter((a) => a.status === 'active').length },
      { label: 'Templates', value: templates?.length || 0 },
    ];
  }, [metaAccounts, templates]);

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
      setError(jsonError instanceof Error ? jsonError.message : 'JSON invalido.');
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
        { id: selectedAccountId, data: { ...payload, accessTokenEncrypted: form.accessTokenEncrypted.trim() || undefined } },
        {
          onSuccess: () => { setForm((c) => ({ ...c, accessTokenEncrypted: '' })); setFeedback('Canal atualizado.'); },
          onError: (err) => { setError(err instanceof Error ? err.message : 'Falha ao atualizar.'); },
        },
      );
      return;
    }

    createAccount.mutate(
      { ...payload, accessTokenEncrypted: form.accessTokenEncrypted.trim() },
      {
        onSuccess: (created) => { setMode('edit'); setSelectedAccountId(created.id); setFeedback('Conta criada.'); },
        onError: (err) => { setError(err instanceof Error ? err.message : 'Falha ao criar.'); },
      },
    );
  }

  function handleSyncTemplates() {
    if (!selectedAccountId) return;
    setFeedback(null);
    setError(null);
    syncTemplates.mutate(selectedAccountId, {
      onSuccess: (r) => setFeedback(`${r.synced} template(s) sincronizado(s).`),
      onError: (err) => setError(err instanceof Error ? err.message : 'Falha ao sincronizar.'),
    });
  }

  if (isLoading) {
    return <div className="space-y-6"><Skeleton className="h-28 rounded-2xl" /><Skeleton className="h-96 rounded-2xl" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-sm">
            <p className="text-sm text-[var(--color-muted-foreground)]">{s.label}</p>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 2xl:grid-cols-[0.9fr_1.1fr]">
        <SettingsSection title="Contas Meta" description="Contas conectadas via Meta Cloud API." actions={<Button variant="outline" onClick={handleNewAccount}>Novo Canal</Button>}>
          {!metaAccounts.length ? (
            <SettingsEmptyState title="Nenhuma conta Meta" description="Cadastre via Meta Cloud API ou use a aba Evolution API." action={<Button onClick={handleNewAccount} variant="outline">Cadastrar</Button>} />
          ) : (
            <div className="space-y-3">
              {metaAccounts.map((account) => (
                <button key={account.id} type="button" onClick={() => { setMode('edit'); setSelectedAccountId(account.id); setFeedback(null); setError(null); }}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${selectedAccountId === account.id && mode === 'edit' ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]' : 'border-[var(--color-border)] hover:bg-[var(--color-background)]'}`}>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">{account.displayName}</p>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">{account.phoneNumber}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant={account.status === 'active' ? 'default' : 'secondary'}>{account.status}</Badge>
                    <Badge variant="outline">Tier {account.messagingTier}</Badge>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SettingsSection>

        <div className="space-y-6">
          <SettingsSection
            title={mode === 'create' ? 'Novo canal Meta' : 'Configuracao do canal'}
            description="Dados tecnicos da conta Meta Cloud API."
            actions={mode === 'edit' && selectedAccountId ? <Button variant="secondary" onClick={handleSyncTemplates} disabled={syncTemplates.isPending}>{syncTemplates.isPending ? 'Sincronizando...' : 'Sincronizar Templates'}</Button> : null}
          >
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Display Name</label>
                  <Input value={form.displayName} onChange={(e) => setForm((c) => ({ ...c, displayName: e.target.value }))} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Numero</label>
                  <Input value={form.phoneNumber} onChange={(e) => setForm((c) => ({ ...c, phoneNumber: e.target.value }))} placeholder="+55 11 99999-0000" required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">WABA ID</label>
                  <Input value={form.wabaId} onChange={(e) => setForm((c) => ({ ...c, wabaId: e.target.value }))} disabled={mode === 'edit'} required />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Phone Number ID</label>
                  <Input value={form.phoneNumberId} onChange={(e) => setForm((c) => ({ ...c, phoneNumberId: e.target.value }))} disabled={mode === 'edit'} required />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">Access Token</label>
                <Input value={form.accessTokenEncrypted} onChange={(e) => setForm((c) => ({ ...c, accessTokenEncrypted: e.target.value }))} placeholder={mode === 'edit' ? 'Preencha para substituir' : 'Token da Cloud API'} required={mode === 'create'} />
              </div>
              <Button type="submit" disabled={createAccount.isPending || updateAccount.isPending}>
                {createAccount.isPending || updateAccount.isPending ? 'Salvando...' : mode === 'create' ? 'Cadastrar' : 'Salvar'}
              </Button>
            </form>
            {feedback && <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{feedback}</div>}
            {error && <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
          </SettingsSection>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page with Tabs ─────────────────────────────────────

export default function SettingsChannelsPage() {
  const [activeTab, setActiveTab] = useState<'evolution' | 'meta'>('evolution');

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Canais WhatsApp"
        description="Conecte seu WhatsApp via QR code (Evolution API) ou configure a Meta Cloud API oficial."
      />

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)] p-1">
        <button
          type="button"
          onClick={() => setActiveTab('evolution')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'evolution'
              ? 'bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          WhatsApp QR Code
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('meta')}
          className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'meta'
              ? 'bg-[var(--color-surface)] text-[var(--color-foreground)] shadow-sm'
              : 'text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]'
          }`}
        >
          Meta Cloud API
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'evolution' ? <EvolutionTab /> : <MetaCloudTab />}
    </div>
  );
}
