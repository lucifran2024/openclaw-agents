'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Pencil,
  Phone,
  Mail,
  MessageCircle,
  TrendingUp,
  Calendar,
  Clock,
  MessageSquare,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ContactForm } from '@/components/contacts/contact-form';
import { TagManager } from '@/components/contacts/tag-manager';
import {
  useContact,
  useUpdateContact,
  useTags,
  useAddTagToContact,
  useRemoveTagFromContact,
  type CreateContactDto,
} from '@/hooks/use-contacts';

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

const funnelColors: Record<string, string> = {
  lead: 'bg-blue-500/10 text-blue-600',
  prospect: 'bg-amber-500/10 text-amber-600',
  customer: 'bg-green-500/10 text-green-600',
  churned: 'bg-red-500/10 text-red-600',
};

function formatDate(dateStr?: string) {
  if (!dateStr) return '—';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(dateStr));
}

export default function ContactDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contactId = params.contactId as string;

  const { data: contact, isLoading } = useContact(contactId);
  const { data: allTags } = useTags();
  const updateContact = useUpdateContact();
  const addTag = useAddTagToContact();
  const removeTag = useRemoveTagFromContact();

  const [isEditing, setIsEditing] = useState(false);

  function handleUpdate(formData: CreateContactDto) {
    updateContact.mutate(
      { id: contactId, data: formData },
      { onSuccess: () => setIsEditing(false) },
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" onClick={() => router.push('/contacts')} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <div className="flex h-48 items-center justify-center rounded-xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">Contato não encontrado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Back + Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/contacts')}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar aos contatos
        </Button>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg font-bold text-primary">
              {contact.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold tracking-tight text-[var(--color-foreground)]">
                  {contact.name}
                </h1>
                <Badge variant={statusVariants[contact.status] || 'secondary'}>
                  {statusLabels[contact.status] || contact.status}
                </Badge>
              </div>
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Criado em {formatDate(contact.createdAt)}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsEditing(!isEditing)}
            className="gap-2"
          >
            <Pencil className="h-4 w-4" />
            {isEditing ? 'Cancelar Edição' : 'Editar'}
          </Button>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
          <h2 className="mb-4 text-lg font-semibold text-[var(--color-foreground)]">
            Editar Contato
          </h2>
          <ContactForm
            contact={contact}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isSubmitting={updateContact.isPending}
          />
        </div>
      )}

      {/* Info Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={<Phone className="h-5 w-5 text-[var(--color-primary)]" />}
          label="Telefone"
          value={contact.phone || '—'}
        />
        <InfoCard
          icon={<Mail className="h-5 w-5 text-[var(--color-primary)]" />}
          label="Email"
          value={contact.email || '—'}
        />
        <InfoCard
          icon={<MessageCircle className="h-5 w-5 text-[var(--color-primary)]" />}
          label="WhatsApp ID"
          value={contact.whatsappId || '—'}
        />
        <InfoCard
          icon={<TrendingUp className="h-5 w-5 text-[var(--color-primary)]" />}
          label="Estágio do Funil"
          value={
            <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold ${funnelColors[contact.funnelStage] || ''}`}>
              {funnelLabels[contact.funnelStage] || contact.funnelStage}
            </span>
          }
        />
      </div>

      {/* Dates Row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <InfoCard
          icon={<Calendar className="h-5 w-5 text-[var(--color-primary)]" />}
          label="Data de Criação"
          value={formatDate(contact.createdAt)}
        />
        <InfoCard
          icon={<Clock className="h-5 w-5 text-[var(--color-primary)]" />}
          label="Último Contato"
          value={formatDate(contact.lastContactedAt)}
        />
      </div>

      {/* Tags Section */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-4 text-base font-semibold text-[var(--color-foreground)]">Tags</h2>
        <TagManager
          contactId={contactId}
          currentTags={contact.tags || []}
          allTags={allTags || []}
          onAddTag={(tagId) => addTag.mutate({ contactId, tagId })}
          onRemoveTag={(tagId) => removeTag.mutate({ contactId, tagId })}
          isAdding={addTag.isPending}
          isRemoving={removeTag.isPending}
        />
      </div>

      {/* Activity Timeline Placeholder */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <Activity className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-base font-semibold text-[var(--color-foreground)]">
            Histórico de Atividades
          </h2>
        </div>
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Timeline de atividades em breve...
          </p>
        </div>
      </div>

      {/* Conversations Placeholder */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="mb-4 flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-[var(--color-primary)]" />
          <h2 className="text-base font-semibold text-[var(--color-foreground)]">
            Conversas
          </h2>
        </div>
        <div className="flex h-32 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Conversas vinculadas a este contato em breve...
          </p>
        </div>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <div className="mb-2 flex items-center gap-2">
        {icon}
        <span className="text-xs font-medium uppercase tracking-wider text-[var(--color-muted-foreground)]">
          {label}
        </span>
      </div>
      <div className="text-sm font-medium text-[var(--color-foreground)]">{value}</div>
    </div>
  );
}
