'use client';

import { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Check,
  FileText,
  Users,
  Clock,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { CreateCampaignDto, CampaignType } from '@/hooks/use-campaigns';

interface CampaignWizardProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: CreateCampaignDto) => void;
  isSubmitting: boolean;
}

const STEPS = [
  { label: 'Informações', icon: Info },
  { label: 'Template', icon: FileText },
  { label: 'Audiência', icon: Users },
  { label: 'Agendamento', icon: Clock },
];

// Placeholder templates
const TEMPLATES = [
  { id: 'tpl-1', name: 'Boas-vindas', description: 'Mensagem de boas-vindas para novos contatos' },
  { id: 'tpl-2', name: 'Promoção', description: 'Template para ofertas e promoções' },
  { id: 'tpl-3', name: 'Lembrete', description: 'Lembrete de agendamento ou evento' },
  { id: 'tpl-4', name: 'Follow-up', description: 'Acompanhamento pós-venda' },
];

// Placeholder segments
const SEGMENTS = [
  { id: 'seg-1', name: 'Todos os contatos', count: 1250 },
  { id: 'seg-2', name: 'Leads ativos', count: 430 },
  { id: 'seg-3', name: 'Clientes VIP', count: 85 },
  { id: 'seg-4', name: 'Inativos 30+ dias', count: 210 },
];

export function CampaignWizard({
  open,
  onClose,
  onSubmit,
  isSubmitting,
}: CampaignWizardProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<CampaignType>('broadcast');
  const [templateId, setTemplateId] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'now' | 'later'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  if (!open) return null;

  function handleSubmit() {
    const data: CreateCampaignDto = {
      name,
      description: description || undefined,
      type,
      templateId: templateId || undefined,
      segmentId: segmentId || undefined,
      scheduledAt: scheduleMode === 'later' && scheduledAt ? scheduledAt : undefined,
    };
    onSubmit(data);
  }

  function reset() {
    setStep(0);
    setName('');
    setDescription('');
    setType('broadcast');
    setTemplateId('');
    setSegmentId('');
    setScheduleMode('now');
    setScheduledAt('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  const canProceed = () => {
    if (step === 0) return name.trim().length > 0;
    return true;
  };

  const isLastStep = step === STEPS.length - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/50" onClick={handleClose} />
      <div className="relative z-10 flex w-full max-w-2xl flex-col rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-lg font-semibold text-[var(--color-foreground)]">
            Nova Campanha
          </h2>
          <button
            onClick={handleClose}
            className="rounded-md p-1 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Step indicators */}
        <div className="flex items-center gap-1 border-b border-[var(--color-border)] px-6 py-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={i} className="flex flex-1 items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : isDone
                        ? 'bg-green-100 text-green-700'
                        : 'bg-[var(--color-border)] text-[var(--color-muted-foreground)]'
                  }`}
                >
                  {isDone ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span
                  className={`hidden text-xs font-medium sm:block ${
                    isActive
                      ? 'text-[var(--color-foreground)]'
                      : 'text-[var(--color-muted-foreground)]'
                  }`}
                >
                  {s.label}
                </span>
                {i < STEPS.length - 1 && (
                  <div className="mx-2 h-px flex-1 bg-[var(--color-border)]" />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="min-h-[320px] px-6 py-5">
          {step === 0 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  Nome da campanha *
                </label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Promoção de Natal 2026"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  Descrição
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Descreva o objetivo da campanha..."
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                  Tipo
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setType('broadcast')}
                    className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                      type === 'broadcast'
                        ? 'border-primary bg-primary/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-ring)]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">
                      Broadcast
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                      Envio em massa para um segmento
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('triggered')}
                    className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                      type === 'triggered'
                        ? 'border-primary bg-primary/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-ring)]'
                    }`}
                  >
                    <p className="text-sm font-semibold text-[var(--color-foreground)]">
                      Gatilho
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                      Enviada por um evento automatizado
                    </p>
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Selecione o template de mensagem para esta campanha:
              </p>
              <div className="space-y-2">
                {TEMPLATES.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => setTemplateId(tpl.id)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                      templateId === tpl.id
                        ? 'border-primary bg-primary/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-ring)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" />
                      <div>
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {tpl.name}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)]">
                          {tpl.description}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Selecione o segmento de audiência:
              </p>
              <div className="space-y-2">
                {SEGMENTS.map((seg) => (
                  <button
                    key={seg.id}
                    type="button"
                    onClick={() => setSegmentId(seg.id)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                      segmentId === seg.id
                        ? 'border-primary bg-primary/5'
                        : 'border-[var(--color-border)] hover:border-[var(--color-ring)]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Users className="h-5 w-5 shrink-0 text-[var(--color-muted-foreground)]" />
                        <p className="text-sm font-semibold text-[var(--color-foreground)]">
                          {seg.name}
                        </p>
                      </div>
                      <span className="text-xs text-[var(--color-muted-foreground)]">
                        {seg.count.toLocaleString('pt-BR')} contatos
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-5">
              <p className="text-sm text-[var(--color-muted-foreground)]">
                Quando deseja enviar esta campanha?
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setScheduleMode('now')}
                  className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                    scheduleMode === 'now'
                      ? 'border-primary bg-primary/5'
                      : 'border-[var(--color-border)] hover:border-[var(--color-ring)]'
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    Enviar agora
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                    Iniciar o envio imediatamente
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setScheduleMode('later')}
                  className={`flex-1 rounded-lg border-2 p-4 text-left transition-colors ${
                    scheduleMode === 'later'
                      ? 'border-primary bg-primary/5'
                      : 'border-[var(--color-border)] hover:border-[var(--color-ring)]'
                  }`}
                >
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    Agendar
                  </p>
                  <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
                    Definir data e hora para envio
                  </p>
                </button>
              </div>
              {scheduleMode === 'later' && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[var(--color-foreground)]">
                    Data e hora do envio
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              )}

              {/* Review summary */}
              <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-background)] p-4">
                <h4 className="mb-3 text-sm font-semibold text-[var(--color-foreground)]">
                  Resumo da campanha
                </h4>
                <dl className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-muted-foreground)]">Nome</dt>
                    <dd className="font-medium text-[var(--color-foreground)]">{name}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-muted-foreground)]">Tipo</dt>
                    <dd className="font-medium text-[var(--color-foreground)]">
                      {type === 'broadcast' ? 'Broadcast' : 'Gatilho'}
                    </dd>
                  </div>
                  {templateId && (
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-muted-foreground)]">Template</dt>
                      <dd className="font-medium text-[var(--color-foreground)]">
                        {TEMPLATES.find((t) => t.id === templateId)?.name || '-'}
                      </dd>
                    </div>
                  )}
                  {segmentId && (
                    <div className="flex justify-between">
                      <dt className="text-[var(--color-muted-foreground)]">Audiência</dt>
                      <dd className="font-medium text-[var(--color-foreground)]">
                        {SEGMENTS.find((s) => s.id === segmentId)?.name || '-'}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <dt className="text-[var(--color-muted-foreground)]">Envio</dt>
                    <dd className="font-medium text-[var(--color-foreground)]">
                      {scheduleMode === 'now' ? 'Imediato' : scheduledAt || 'Não definido'}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[var(--color-border)] px-6 py-4">
          <Button
            variant="outline"
            onClick={() => (step > 0 ? setStep(step - 1) : handleClose())}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            {step > 0 ? 'Anterior' : 'Cancelar'}
          </Button>

          {isLastStep ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="gap-1"
            >
              {isSubmitting ? 'Criando...' : 'Criar Campanha'}
              <Check className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={() => setStep(step + 1)}
              disabled={!canProceed()}
              className="gap-1"
            >
              Próximo
              <ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
