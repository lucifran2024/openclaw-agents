'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { Contact, CreateContactDto } from '@/hooks/use-contacts';

interface ContactFormProps {
  contact?: Contact | null;
  onSubmit: (data: CreateContactDto) => void;
  onCancel: () => void;
  isSubmitting?: boolean;
}

const statusOptions = [
  { value: 'active', label: 'Ativo' },
  { value: 'inactive', label: 'Inativo' },
  { value: 'blocked', label: 'Bloqueado' },
];

const funnelOptions = [
  { value: 'lead', label: 'Lead' },
  { value: 'prospect', label: 'Prospecto' },
  { value: 'customer', label: 'Cliente' },
  { value: 'churned', label: 'Perdido' },
];

export function ContactForm({ contact, onSubmit, onCancel, isSubmitting }: ContactFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<string>('active');
  const [funnelStage, setFunnelStage] = useState<string>('lead');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (contact) {
      setName(contact.name || '');
      setPhone(contact.phone || '');
      setEmail(contact.email || '');
      setStatus(contact.status || 'active');
      setFunnelStage(contact.funnelStage || 'lead');
    }
  }, [contact]);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Email inválido';
    }

    if (phone && !/^[\d\s\-+()]+$/.test(phone)) {
      newErrors.phone = 'Telefone inválido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      name: name.trim(),
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      status: status as CreateContactDto['status'],
      funnelStage: funnelStage as CreateContactDto['funnelStage'],
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
          Nome *
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do contato"
        />
        {errors.name && (
          <p className="mt-1 text-xs text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
          Telefone
        </label>
        <Input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+55 (11) 99999-9999"
        />
        {errors.phone && (
          <p className="mt-1 text-xs text-red-500">{errors.phone}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
          Email
        </label>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemplo.com"
        />
        {errors.email && (
          <p className="mt-1 text-xs text-red-500">{errors.email}</p>
        )}
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
          Status
        </label>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
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
          value={funnelStage}
          onChange={(e) => setFunnelStage(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          {funnelOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex items-center justify-end gap-3 pt-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Salvando...' : contact ? 'Salvar Alterações' : 'Criar Contato'}
        </Button>
      </div>
    </form>
  );
}

interface ContactFormModalProps {
  open: boolean;
  contact?: Contact | null;
  onSubmit: (data: CreateContactDto) => void;
  onClose: () => void;
  isSubmitting?: boolean;
}

export function ContactFormModal({
  open,
  contact,
  onSubmit,
  onClose,
  isSubmitting,
}: ContactFormModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {contact ? 'Editar Contato' : 'Novo Contato'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <ContactForm
          contact={contact}
          onSubmit={onSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
}
