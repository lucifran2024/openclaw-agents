'use client';

import { useState, useCallback } from 'react';
import {
  Search,
  Plus,
  Filter,
  ChevronLeft,
  ChevronRight,
  Users,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ContactTable } from '@/components/contacts/contact-table';
import { ContactFormModal } from '@/components/contacts/contact-form';
import {
  useContacts,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useTags,
  type Contact,
  type ContactsFilters,
  type CreateContactDto,
} from '@/hooks/use-contacts';

const statusOptions = [
  { value: '', label: 'Todos os Status' },
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'blocked', label: 'Bloqueado' },
];

const funnelOptions = [
  { value: '', label: 'Todos os Estágios' },
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospecto' },
  { value: 'customer', label: 'Cliente' },
  { value: 'churned', label: 'Perdido' },
];

const PAGE_SIZE = 20;

export default function ContactsPage() {
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [funnelFilter, setFunnelFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Contact | null>(null);

  // Debounce search
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearch(value);
      if (searchTimer) clearTimeout(searchTimer);
      const timer = setTimeout(() => {
        setDebouncedSearch(value);
        setPage(1);
      }, 400);
      setSearchTimer(timer);
    },
    [searchTimer],
  );

  const filters: ContactsFilters = {
    search: debouncedSearch || undefined,
    page,
    limit: PAGE_SIZE,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    status: statusFilter || undefined,
    funnelStage: funnelFilter || undefined,
  };

  const { data, isLoading } = useContacts(filters);
  const { data: allTags } = useTags();
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  const contacts = data?.data || [];
  const meta = data?.meta || { total: 0, page: 1, limit: PAGE_SIZE };
  const totalPages = Math.ceil(meta.total / meta.limit) || 1;

  const hasActiveFilters = statusFilter || funnelFilter || selectedTags.length > 0;

  function handleCreate(formData: CreateContactDto) {
    createContact.mutate(formData, {
      onSuccess: () => setModalOpen(false),
    });
  }

  function handleEdit(formData: CreateContactDto) {
    if (!editingContact) return;
    updateContact.mutate(
      { id: editingContact.id, data: formData },
      { onSuccess: () => setEditingContact(null) },
    );
  }

  function handleDelete() {
    if (!deleteConfirm) return;
    deleteContact.mutate(deleteConfirm.id, {
      onSuccess: () => setDeleteConfirm(null),
    });
  }

  function clearFilters() {
    setStatusFilter('');
    setFunnelFilter('');
    setSelectedTags([]);
    setPage(1);
  }

  function toggleTagFilter(tagId: string) {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((t) => t !== tagId)
        : [...prev, tagId],
    );
    setPage(1);
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
            Contatos
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Gerencie seus contatos e leads
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Novo Contato
        </Button>
      </div>

      {/* Search & Filters Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <Input
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar contatos por nome, telefone ou email..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFilters ? 'secondary' : 'outline'}
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtros
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {(statusFilter ? 1 : 0) + (funnelFilter ? 1 : 0) + selectedTags.length}
              </span>
            )}
          </Button>
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-xs">
              <X className="h-3 w-3" />
              Limpar
            </Button>
          )}
        </div>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Estágio do Funil
              </label>
              <select
                value={funnelFilter}
                onChange={(e) => {
                  setFunnelFilter(e.target.value);
                  setPage(1);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                {funnelOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Tags
              </label>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {allTags && allTags.length > 0 ? (
                  allTags.map((tag) => (
                    <Badge
                      key={tag.id}
                      variant={selectedTags.includes(tag.id) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      style={
                        tag.color && !selectedTags.includes(tag.id)
                          ? { borderColor: tag.color, color: tag.color }
                          : tag.color && selectedTags.includes(tag.id)
                            ? { backgroundColor: tag.color, borderColor: tag.color }
                            : undefined
                      }
                      onClick={() => toggleTagFilter(tag.id)}
                    >
                      {tag.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs text-[var(--color-muted-foreground)]">Nenhuma tag disponível</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex items-center gap-2 text-sm text-[var(--color-muted-foreground)]">
        <Users className="h-4 w-4" />
        <span>
          {meta.total} {meta.total === 1 ? 'contato' : 'contatos'} encontrado{meta.total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <ContactTable
        contacts={contacts}
        isLoading={isLoading}
        onEdit={(contact) => setEditingContact(contact)}
        onDelete={(contact) => setDeleteConfirm(contact)}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Página {page} de {totalPages}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Próxima
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Create / Edit Modal */}
      <ContactFormModal
        open={modalOpen || !!editingContact}
        contact={editingContact}
        onSubmit={editingContact ? handleEdit : handleCreate}
        onClose={() => {
          setModalOpen(false);
          setEditingContact(null);
        }}
        isSubmitting={createContact.isPending || updateContact.isPending}
      />

      {/* Delete Confirmation */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/50" onClick={() => setDeleteConfirm(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--color-foreground)]">
              Excluir Contato
            </h3>
            <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
              Tem certeza que deseja excluir <strong>{deleteConfirm.name}</strong>? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-5 flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Cancelar
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleteContact.isPending}
              >
                {deleteContact.isPending ? 'Excluindo...' : 'Excluir'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
