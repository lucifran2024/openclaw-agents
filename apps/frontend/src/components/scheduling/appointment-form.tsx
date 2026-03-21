'use client';

import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Calendar, User, Briefcase, Clock, FileText, Check, Ban, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { SlotPicker } from './slot-picker';
import {
  useAvailability,
  useServiceTypes,
  useResources,
  useCreateAppointment,
  useCancelAppointment,
  useConfirmAppointment,
  type Appointment,
} from '@/hooks/use-scheduling';
import { useContacts, type Contact } from '@/hooks/use-contacts';

const statusLabels: Record<string, string> = {
  scheduled: 'Agendado',
  confirmed: 'Confirmado',
  in_progress: 'Em andamento',
  completed: 'Concluído',
  cancelled: 'Cancelado',
  no_show: 'Não compareceu',
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-green-100 text-green-800',
  in_progress: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-gray-100 text-gray-800',
  cancelled: 'bg-red-100 text-red-800',
  no_show: 'bg-orange-100 text-orange-800',
};

interface AppointmentFormProps {
  open: boolean;
  appointment?: Appointment | null;
  defaultDate?: string;
  defaultTime?: string;
  defaultResourceId?: string;
  onClose: () => void;
}

export function AppointmentForm({
  open,
  appointment,
  defaultDate,
  defaultTime,
  defaultResourceId,
  onClose,
}: AppointmentFormProps) {
  const { data: serviceTypes } = useServiceTypes();
  const { data: resources } = useResources();
  const createAppointment = useCreateAppointment();
  const cancelAppointment = useCancelAppointment();
  const confirmAppointment = useConfirmAppointment();

  const [contactSearch, setContactSearch] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [selectedContactName, setSelectedContactName] = useState('');
  const [resourceId, setResourceId] = useState(defaultResourceId || '');
  const [serviceTypeId, setServiceTypeId] = useState('');
  const [date, setDate] = useState(defaultDate || format(new Date(), 'yyyy-MM-dd'));
  const [selectedSlot, setSelectedSlot] = useState<string | null>(defaultTime || null);
  const [notes, setNotes] = useState('');
  const [showContactResults, setShowContactResults] = useState(false);

  const { data: contactsData, isLoading: contactsLoading } = useContacts({
    search: contactSearch || undefined,
    limit: 5,
  });

  const { data: availabilityData, isLoading: slotsLoading } = useAvailability(
    resourceId,
    serviceTypeId,
    date,
  );

  const isViewMode = !!appointment;
  const canConfirm = appointment?.status === 'scheduled';
  const canCancel = appointment?.status === 'scheduled' || appointment?.status === 'confirmed';

  useEffect(() => {
    if (!open) {
      setContactSearch('');
      setSelectedContactId('');
      setSelectedContactName('');
      setResourceId(defaultResourceId || '');
      setServiceTypeId('');
      setDate(defaultDate || format(new Date(), 'yyyy-MM-dd'));
      setSelectedSlot(defaultTime || null);
      setNotes('');
      setShowContactResults(false);
    }
  }, [open, defaultDate, defaultTime, defaultResourceId]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedContactId || !resourceId || !serviceTypeId || !selectedSlot) return;

    createAppointment.mutate(
      {
        contactId: selectedContactId,
        resourceId,
        serviceTypeId,
        startAt: selectedSlot,
        notes: notes || undefined,
      },
      { onSuccess: () => onClose() },
    );
  }

  function handleConfirm() {
    if (!appointment) return;
    confirmAppointment.mutate(appointment.id, { onSuccess: () => onClose() });
  }

  function handleCancel() {
    if (!appointment) return;
    cancelAppointment.mutate(appointment.id, { onSuccess: () => onClose() });
  }

  function selectContact(contact: Contact) {
    setSelectedContactId(contact.id);
    setSelectedContactName(contact.name);
    setContactSearch(contact.name);
    setShowContactResults(false);
  }

  const serviceType = serviceTypes?.find((s) => s.id === (appointment?.serviceTypeId || serviceTypeId));
  const resource = resources?.find((r) => r.id === (appointment?.resourceId || resourceId));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-xl">
        {/* Header */}
        <div className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            {isViewMode ? 'Detalhes do Agendamento' : 'Novo Agendamento'}
          </h2>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* View Mode */}
        {isViewMode && appointment ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge className={statusColors[appointment.status]}>
                {statusLabels[appointment.status]}
              </Badge>
            </div>

            <div className="space-y-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
              <div className="flex items-center gap-3 text-sm">
                <Calendar className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                <span className="text-[var(--color-foreground)]">
                  {format(parseISO(appointment.startAt), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                <span className="text-[var(--color-foreground)]">
                  {format(parseISO(appointment.startAt), 'HH:mm', { locale: ptBR })}
                  {' - '}
                  {format(parseISO(appointment.endAt), 'HH:mm', { locale: ptBR })}
                </span>
              </div>
              {resource && (
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <span className="text-[var(--color-foreground)]">{resource.name}</span>
                </div>
              )}
              {serviceType && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <span className="text-[var(--color-foreground)]">
                    {serviceType.name}
                    {serviceType.durationMinutes && ` (${serviceType.durationMinutes} min)`}
                    {serviceType.price != null && ` - R$ ${serviceType.price.toFixed(2)}`}
                  </span>
                </div>
              )}
              {appointment.notes && (
                <div className="flex items-start gap-3 text-sm">
                  <FileText className="mt-0.5 h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <span className="text-[var(--color-foreground)]">{appointment.notes}</span>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {canConfirm && (
                <Button
                  onClick={handleConfirm}
                  disabled={confirmAppointment.isPending}
                  className="gap-2"
                >
                  {confirmAppointment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  Confirmar
                </Button>
              )}
              {canCancel && (
                <Button
                  variant="destructive"
                  onClick={handleCancel}
                  disabled={cancelAppointment.isPending}
                  className="gap-2"
                >
                  {cancelAppointment.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Ban className="h-4 w-4" />
                  )}
                  Cancelar Agendamento
                </Button>
              )}
              <Button variant="outline" onClick={onClose}>
                Fechar
              </Button>
            </div>
          </div>
        ) : (
          /* Create Mode */
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contact Search */}
            <div className="relative">
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Contato
              </label>
              {selectedContactId ? (
                <div className="flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-background)] px-3 py-2">
                  <User className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                  <span className="flex-1 text-sm text-[var(--color-foreground)]">{selectedContactName}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedContactId('');
                      setSelectedContactName('');
                      setContactSearch('');
                    }}
                    className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <Input
                    value={contactSearch}
                    onChange={(e) => {
                      setContactSearch(e.target.value);
                      setShowContactResults(true);
                    }}
                    onFocus={() => setShowContactResults(true)}
                    placeholder="Buscar contato por nome..."
                  />
                  {showContactResults && contactSearch.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-40 overflow-y-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg">
                      {contactsLoading ? (
                        <div className="flex items-center gap-2 px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Buscando...
                        </div>
                      ) : contactsData?.data && contactsData.data.length > 0 ? (
                        contactsData.data.map((contact) => (
                          <button
                            key={contact.id}
                            type="button"
                            onClick={() => selectContact(contact)}
                            className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                          >
                            <User className="h-4 w-4 text-[var(--color-muted-foreground)]" />
                            <div>
                              <p className="font-medium">{contact.name}</p>
                              {contact.phone && (
                                <p className="text-xs text-[var(--color-muted-foreground)]">{contact.phone}</p>
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <p className="px-3 py-2 text-sm text-[var(--color-muted-foreground)]">
                          Nenhum contato encontrado
                        </p>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Resource */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Recurso / Profissional
              </label>
              <select
                value={resourceId}
                onChange={(e) => {
                  setResourceId(e.target.value);
                  setSelectedSlot(null);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecione...</option>
                {resources?.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Service Type */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Tipo de Serviço
              </label>
              <select
                value={serviceTypeId}
                onChange={(e) => {
                  setServiceTypeId(e.target.value);
                  setSelectedSlot(null);
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="">Selecione...</option>
                {serviceTypes?.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.name} ({st.durationMinutes} min)
                    {st.price != null ? ` - R$ ${st.price.toFixed(2)}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Data
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlot(null);
                }}
              />
            </div>

            {/* Slot Picker */}
            {resourceId && serviceTypeId && date && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  Horário
                </label>
                <SlotPicker
                  slots={availabilityData?.slots || []}
                  isLoading={slotsLoading}
                  selectedSlot={selectedSlot}
                  onSelectSlot={setSelectedSlot}
                />
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                Observações
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Observações opcionais..."
                className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  !selectedContactId || !resourceId || !serviceTypeId || !selectedSlot || createAppointment.isPending
                }
                className="gap-2"
              >
                {createAppointment.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Calendar className="h-4 w-4" />
                )}
                {createAppointment.isPending ? 'Agendando...' : 'Agendar'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
