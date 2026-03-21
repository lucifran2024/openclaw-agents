'use client';

import { useMemo, useState } from 'react';
import { KeyRound, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SettingsEmptyState,
  SettingsErrorState,
  SettingsPageHeader,
  SettingsSection,
} from '@/components/settings/settings-shell';
import {
  useApiKeys,
  useCreateApiKey,
  useRevokeApiKey,
} from '@/hooks/use-settings';

const PERMISSION_OPTIONS = [
  'team:read',
  'team:write',
  'contacts:read',
  'contacts:write',
  'inbox:read',
  'inbox:write',
  'kanban:read',
  'kanban:write',
  'reports:read',
  'reports:export',
  'settings:read',
  'settings:write',
  'billing:read',
];

function formatDate(value?: string) {
  if (!value) return 'Nunca';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

export default function SettingsApiKeysPage() {
  const apiKeysQuery = useApiKeys();
  const createApiKey = useCreateApiKey();
  const revokeApiKey = useRevokeApiKey();
  const [name, setName] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([
    'team:read',
    'team:write',
  ]);
  const [secret, setSecret] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const keys = apiKeysQuery.data || [];
  const selectedCount = useMemo(() => selectedPermissions.length, [selectedPermissions]);

  function togglePermission(permission: string) {
    setSelectedPermissions((current) =>
      current.includes(permission)
        ? current.filter((item) => item !== permission)
        : [...current, permission],
    );
  }

  function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSecret(null);
    setFeedback(null);
    setError(null);

    createApiKey.mutate(
      {
        name,
        permissions: selectedPermissions,
        expiresAt: expiresAt || undefined,
      },
      {
        onSuccess: (response) => {
          setSecret(response.secret);
          setFeedback('API key criada com sucesso. Guarde o segredo agora, ele so aparece uma vez.');
          setName('');
          setExpiresAt('');
        },
        onError: (mutationError) => {
          setError(
            mutationError instanceof Error
              ? mutationError.message
              : 'Nao foi possivel criar a API key.',
          );
        },
      },
    );
  }

  async function handleRevoke(id: string) {
    setFeedback(null);
    setError(null);

    try {
      await revokeApiKey.mutateAsync(id);
      setFeedback('API key revogada com sucesso.');
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Nao foi possivel revogar a API key.',
      );
    }
  }

  if (apiKeysQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (apiKeysQuery.error || !apiKeysQuery.data) {
    return (
      <div className="space-y-6">
        <SettingsPageHeader
          title="API Keys"
          description="Crie credenciais de integracao com escopos granulares e revogacao imediata."
        />
        <SettingsErrorState
          title="Nao foi possivel carregar as API keys"
          description="Sem a listagem atual o Settings nao consegue mostrar segredos emitidos, metadados de uso nem oferecer revogacao segura."
          details={apiKeysQuery.error instanceof Error ? apiKeysQuery.error.message : undefined}
          action={
            <Button onClick={() => void apiKeysQuery.refetch()}>
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
        title="API Keys"
        description="Crie credenciais de integracao com escopos granulares e revogacao imediata."
      />

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Chaves ativas</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
            {keys.length}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Permissoes no formulario</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
            {selectedCount}
          </p>
        </div>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Ultima criacao</p>
          <p className="mt-3 text-sm font-medium text-[var(--color-foreground)]">
            {keys[0]?.createdAt ? formatDate(keys[0].createdAt) : 'Nenhuma chave ainda'}
          </p>
        </div>
      </div>

      <form className="space-y-6" onSubmit={handleCreate}>
        <SettingsSection
          title="Nova API key"
          description="Escolha um nome descritivo e marque apenas os escopos que a integracao realmente precisa."
          actions={
            <Button type="submit" disabled={createApiKey.isPending || !name.trim()}>
              {createApiKey.isPending ? 'Criando...' : 'Criar API key'}
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Nome da chave
              </label>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                placeholder="SCIM Provisioning"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-[var(--color-foreground)]">
                Expira em
              </label>
              <input
                type="datetime-local"
                value={expiresAt}
                onChange={(event) => setExpiresAt(event.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm font-medium text-[var(--color-foreground)]">Escopos</p>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {PERMISSION_OPTIONS.map((permission) => (
                <label
                  key={permission}
                  className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"
                >
                  <input
                    type="checkbox"
                    checked={selectedPermissions.includes(permission)}
                    onChange={() => togglePermission(permission)}
                    className="h-4 w-4 rounded border-[var(--color-border)]"
                  />
                  <span className="text-sm text-[var(--color-foreground)]">{permission}</span>
                </label>
              ))}
            </div>
          </div>

          {secret ? (
            <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <p className="font-semibold">Segredo gerado</p>
              <p className="mt-2 break-all font-mono">{secret}</p>
            </div>
          ) : null}

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

      <SettingsSection
        title="Chaves emitidas"
        description="A lista mostra apenas prefixo, escopos e metadados. O segredo completo nao pode ser recuperado depois."
      >
        {keys.length ? (
          <div className="space-y-3">
            {keys.map((key) => (
              <div
                key={key.id}
                className="grid gap-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 lg:grid-cols-[1.2fr_1fr_1fr_auto]"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[var(--color-primary)]/10 p-2 text-[var(--color-primary)]">
                      <KeyRound className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">
                        {key.name}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        Prefixo: {key.prefix}
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {key.permissions.map((permission) => (
                      <Badge key={permission} variant="outline">
                        {permission}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                    Ultimo uso
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                    {formatDate(key.lastUsedAt)}
                  </p>
                </div>

                <div>
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
                    Expiracao
                  </p>
                  <p className="mt-2 text-sm font-medium text-[var(--color-foreground)]">
                    {key.expiresAt ? formatDate(key.expiresAt) : 'Sem expiracao'}
                  </p>
                </div>

                <div className="flex items-start justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleRevoke(key.id)}
                    disabled={revokeApiKey.isPending}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Revogar
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <SettingsEmptyState
            title="Nenhuma API key criada"
            description="Crie a primeira chave para habilitar SCIM, automacoes server-to-server ou APIs publicas autenticadas por X-API-Key."
            icon={<KeyRound className="h-5 w-5" />}
          />
        )}
      </SettingsSection>
    </div>
  );
}
