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
  useInviteUser,
  useUpdateUser,
  useUsers,
  type SettingsUser,
} from '@/hooks/use-settings';

const roleOptions: Array<{ value: SettingsUser['role']; label: string }> = [
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'agent', label: 'Agent' },
  { value: 'viewer', label: 'Viewer' },
];

const statusOptions: Array<{ value: SettingsUser['status']; label: string }> = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'invited', label: 'Convidado' },
];

function parseList(value: string) {
  return value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function formatDate(date?: string) {
  if (!date) return 'Sem registro';
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
}

export default function SettingsTeamPage() {
  const usersQuery = useUsers();
  const { data: users, isLoading } = usersQuery;
  const inviteUser = useInviteUser();
  const updateUser = useUpdateUser();
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [inviteForm, setInviteForm] = useState({
    name: '',
    email: '',
    role: 'agent' as SettingsUser['role'],
    teams: '',
  });
  const [memberForm, setMemberForm] = useState({
    name: '',
    role: 'agent' as SettingsUser['role'],
    status: 'active' as SettingsUser['status'],
    teams: '',
  });
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!users?.length) {
      setSelectedUserId(null);
      return;
    }

    setSelectedUserId((current) => current || users[0].id);
  }, [users]);

  const selectedUser =
    users?.find((candidate) => candidate.id === selectedUserId) || null;

  useEffect(() => {
    if (!selectedUser) return;

    setMemberForm({
      name: selectedUser.name,
      role: selectedUser.role,
      status: selectedUser.status,
      teams: selectedUser.teams.join(', '),
    });
  }, [selectedUser]);

  const stats = useMemo(() => {
    const safeUsers = users || [];
    const activeUsers = safeUsers.filter((user) => user.status === 'active').length;
    const invitedUsers = safeUsers.filter((user) => user.status === 'invited').length;
    const uniqueTeams = new Set(safeUsers.flatMap((user) => user.teams)).size;

    return [
      { label: 'Membros', value: safeUsers.length },
      { label: 'Ativos', value: activeUsers },
      { label: 'Convites Pendentes', value: invitedUsers },
      { label: 'Times Mapeados', value: uniqueTeams },
    ];
  }, [users]);

  function handleInvite(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setFeedback(null);
    setError(null);

    inviteUser.mutate(
      {
        name: inviteForm.name.trim(),
        email: inviteForm.email.trim(),
        role: inviteForm.role,
        teams: parseList(inviteForm.teams),
      },
      {
        onSuccess: (createdUser) => {
          setInviteForm({ name: '', email: '', role: 'agent', teams: '' });
          setSelectedUserId(createdUser.id);
          setFeedback('Convite registrado com sucesso.');
        },
        onError: (mutationError) => {
          setError(
            mutationError instanceof Error
              ? mutationError.message
              : 'Nao foi possivel convidar este membro.',
          );
        },
      },
    );
  }

  function handleUpdateMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selectedUser) return;

    setFeedback(null);
    setError(null);

    updateUser.mutate(
      {
        id: selectedUser.id,
        data: {
          name: memberForm.name.trim(),
          role: memberForm.role,
          status: memberForm.status,
          teams: parseList(memberForm.teams),
        },
      },
      {
        onSuccess: () => {
          setFeedback('Membro atualizado com sucesso.');
        },
        onError: (mutationError) => {
          setError(
            mutationError instanceof Error
              ? mutationError.message
              : 'Nao foi possivel atualizar o membro.',
          );
        },
      },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  if (usersQuery.error || !users) {
    return (
      <div className="space-y-6">
        <SettingsPageHeader
          title="Equipe"
          description="Gerencie convidados, papeis e agrupamentos de times sem sair da area de Settings."
        />
        <SettingsErrorState
          title="Nao foi possivel carregar a equipe"
          description="A pagina de equipe depende da listagem atual de usuarios do tenant para montar estatisticas, selecao e formularios."
          details={usersQuery.error instanceof Error ? usersQuery.error.message : undefined}
          action={
            <Button onClick={() => void usersQuery.refetch()}>
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
        title="Equipe"
        description="Gerencie convidados, papeis e agrupamentos de times sem sair da area de Settings."
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

      <div className="grid gap-6 2xl:grid-cols-[1.15fr_0.85fr]">
        <SettingsSection
          title="Membros do tenant"
          description="Selecione um membro para revisar papel, status e os times em que ele atua."
        >
          {!users?.length ? (
            <SettingsEmptyState
              title="Nenhum membro encontrado"
              description="Assim que novos usuarios forem convidados eles aparecerao aqui para gestao de acesso."
            />
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <button
                  key={user.id}
                  type="button"
                  onClick={() => setSelectedUserId(user.id)}
                  className={`w-full rounded-2xl border p-4 text-left transition-colors ${
                    selectedUserId === user.id
                      ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]'
                      : 'border-[var(--color-border)] hover:bg-[var(--color-background)]'
                  }`}
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">
                        {user.name}
                      </p>
                      <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                        {user.email}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="outline">
                          {roleOptions.find((option) => option.value === user.role)?.label || user.role}
                        </Badge>
                        <Badge
                          variant={
                            user.status === 'active'
                              ? 'default'
                              : user.status === 'invited'
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {statusOptions.find((option) => option.value === user.status)?.label || user.status}
                        </Badge>
                        {user.teams.map((team) => (
                          <Badge key={team} variant="outline">
                            {team}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-right text-xs text-[var(--color-muted-foreground)]">
                      <p>Criado em {formatDate(user.createdAt)}</p>
                      <p className="mt-1">Ultimo login: {formatDate(user.lastLogin)}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </SettingsSection>

        <div className="space-y-6">
          <SettingsSection
            title="Convidar novo membro"
            description="Crie um convite rapido e ja defina o papel principal e os times padrao."
          >
            <form className="space-y-4" onSubmit={handleInvite}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">Nome</label>
                <Input
                  value={inviteForm.name}
                  onChange={(e) =>
                    setInviteForm((current) => ({ ...current, name: e.target.value }))
                  }
                  placeholder="Ana Costa"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">Email</label>
                <Input
                  type="email"
                  value={inviteForm.email}
                  onChange={(e) =>
                    setInviteForm((current) => ({ ...current, email: e.target.value }))
                  }
                  placeholder="ana@empresa.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">Papel</label>
                <select
                  value={inviteForm.role}
                  onChange={(e) =>
                    setInviteForm((current) => ({
                      ...current,
                      role: e.target.value as SettingsUser['role'],
                    }))
                  }
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  {roleOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-[var(--color-foreground)]">
                  Times
                </label>
                <Input
                  value={inviteForm.teams}
                  onChange={(e) =>
                    setInviteForm((current) => ({ ...current, teams: e.target.value }))
                  }
                  placeholder="Suporte, Comercial, Pos-venda"
                />
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  Separe varios times com virgula.
                </p>
              </div>
              <Button className="w-full" type="submit" disabled={inviteUser.isPending}>
                {inviteUser.isPending ? 'Enviando convite...' : 'Convidar Membro'}
              </Button>
            </form>
          </SettingsSection>

          <SettingsSection
            title="Membro selecionado"
            description="Ajuste o nivel de acesso e a distribuicao por time do usuario em destaque."
          >
            {selectedUser ? (
              <form className="space-y-4" onSubmit={handleUpdateMember}>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">Nome</label>
                  <Input
                    value={memberForm.name}
                    onChange={(e) =>
                      setMemberForm((current) => ({ ...current, name: e.target.value }))
                    }
                    required
                  />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-foreground)]">
                      Papel
                    </label>
                    <select
                      value={memberForm.role}
                      onChange={(e) =>
                        setMemberForm((current) => ({
                          ...current,
                          role: e.target.value as SettingsUser['role'],
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {roleOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-[var(--color-foreground)]">
                      Status
                    </label>
                    <select
                      value={memberForm.status}
                      onChange={(e) =>
                        setMemberForm((current) => ({
                          ...current,
                          status: e.target.value as SettingsUser['status'],
                        }))
                      }
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
                      {statusOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-[var(--color-foreground)]">
                    Times
                  </label>
                  <Input
                    value={memberForm.teams}
                    onChange={(e) =>
                      setMemberForm((current) => ({ ...current, teams: e.target.value }))
                    }
                    placeholder="Suporte, CS, Comercial"
                  />
                </div>
                <Button type="submit" disabled={updateUser.isPending}>
                  {updateUser.isPending ? 'Salvando...' : 'Salvar Membro'}
                </Button>
              </form>
            ) : (
              <SettingsEmptyState
                title="Selecione um membro"
                description="Escolha alguem na lista ao lado para editar papel, status e times."
              />
            )}

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
    </div>
  );
}
