'use client';

import { useRouter } from 'next/navigation';
import {
  ArrowUpDown,
  MoreHorizontal,
  Pencil,
  Trash2,
  Eye,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import type { Contact } from '@/hooks/use-contacts';
import { useState, useRef, useEffect } from 'react';

interface ContactTableProps {
  contacts: Contact[];
  isLoading: boolean;
  onEdit: (contact: Contact) => void;
  onDelete: (contact: Contact) => void;
}

const statusLabels: Record<string, string> = {
  active: 'Ativo',
  inactive: 'Inativo',
  blocked: 'Bloqueado',
};

const statusVariants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  active: 'default',
  inactive: 'secondary',
  blocked: 'destructive',
};

const funnelLabels: Record<string, string> = {
  lead: 'Lead',
  prospect: 'Prospecto',
  customer: 'Cliente',
  churned: 'Perdido',
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date(dateStr));
}

function formatPhone(phone?: string) {
  if (!phone) return '—';
  return phone;
}

function ActionsMenu({
  contact,
  onEdit,
  onDelete,
  onView,
}: {
  contact: Contact;
  onEdit: () => void;
  onDelete: () => void;
  onView: () => void;
}) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(!open);
        }}
      >
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-40 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] py-1 shadow-lg">
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-accent)]"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onView();
            }}
          >
            <Eye className="h-4 w-4" />
            Ver detalhes
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-[var(--color-foreground)] hover:bg-[var(--color-accent)]"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onEdit();
            }}
          >
            <Pencil className="h-4 w-4" />
            Editar
          </button>
          <button
            className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-[var(--color-accent)]"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              onDelete();
            }}
          >
            <Trash2 className="h-4 w-4" />
            Excluir
          </button>
        </div>
      )}
    </div>
  );
}

export function ContactTable({ contacts, isLoading, onEdit, onDelete }: ContactTableProps) {
  const router = useRouter();

  const columns = [
    { key: 'name', label: 'Nome' },
    { key: 'phone', label: 'Telefone' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'funnelStage', label: 'Estágio' },
    { key: 'tags', label: 'Tags' },
    { key: 'lastContactedAt', label: 'Último Contato' },
    { key: 'actions', label: '' },
  ];

  if (isLoading) {
    return (
      <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-b border-[var(--color-border)]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <Skeleton className="h-4 w-24" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  if (contacts.length === 0) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
        <p className="text-sm text-[var(--color-muted-foreground)]">Nenhum contato encontrado.</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[var(--color-border)] bg-[var(--color-background)]">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]"
                >
                  {col.key !== 'actions' && col.key !== 'tags' ? (
                    <button className="inline-flex items-center gap-1 hover:text-[var(--color-foreground)]">
                      {col.label}
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {contacts.map((contact) => (
              <tr
                key={contact.id}
                className="cursor-pointer border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-accent)]/50"
                onClick={() => router.push(`/contacts/${contact.id}`)}
              >
                <td className="px-4 py-3 text-sm font-medium text-[var(--color-foreground)]">
                  {contact.name}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                  {formatPhone(contact.phone)}
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                  {contact.email || '—'}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={statusVariants[contact.status] || 'secondary'}>
                    {statusLabels[contact.status] || contact.status}
                  </Badge>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                  {funnelLabels[contact.funnelStage] || contact.funnelStage}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.slice(0, 3).map((tag) => (
                      <Badge
                        key={tag.id}
                        variant="outline"
                        className="text-xs"
                        style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                    {contact.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{contact.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-[var(--color-muted-foreground)]">
                  {formatDate(contact.lastContactedAt)}
                </td>
                <td className="px-4 py-3">
                  <ActionsMenu
                    contact={contact}
                    onEdit={() => onEdit(contact)}
                    onDelete={() => onDelete(contact)}
                    onView={() => router.push(`/contacts/${contact.id}`)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
