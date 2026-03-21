'use client';

import {
  Stethoscope,
  Scissors,
  UtensilsCrossed,
  ShoppingBag,
  BriefcaseBusiness,
  Layers3,
} from 'lucide-react';
import type { OnboardingVertical } from '@/hooks/use-onboarding';

interface VerticalSelectorProps {
  value: OnboardingVertical;
  onChange: (value: OnboardingVertical) => void;
}

const verticals: Array<{
  value: OnboardingVertical;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  accent: string;
}> = [
  {
    value: 'clinic',
    label: 'Clinica',
    description: 'Atendimento, agenda medica e acompanhamento de pacientes.',
    icon: Stethoscope,
    accent: '#2563eb',
  },
  {
    value: 'salon',
    label: 'Salao',
    description: 'Servicos de beleza, recorrencia e agenda da equipe.',
    icon: Scissors,
    accent: '#ec4899',
  },
  {
    value: 'restaurant',
    label: 'Restaurante',
    description: 'Pedidos, reservas, WhatsApp e fluxo de atendimento da operacao.',
    icon: UtensilsCrossed,
    accent: '#dc2626',
  },
  {
    value: 'ecommerce',
    label: 'E-commerce',
    description: 'Conversao, recompra e campanhas para catalogo e suporte.',
    icon: ShoppingBag,
    accent: '#7c3aed',
  },
  {
    value: 'services',
    label: 'Servicos',
    description: 'Consultorias, time comercial e atendimento por projeto.',
    icon: BriefcaseBusiness,
    accent: '#0f766e',
  },
  {
    value: 'general',
    label: 'Geral',
    description: 'Estrutura neutra para operacoes multiuso ou em descoberta.',
    icon: Layers3,
    accent: '#475569',
  },
];

export function VerticalSelector({ value, onChange }: VerticalSelectorProps) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {verticals.map((vertical) => {
        const Icon = vertical.icon;
        const active = value === vertical.value;

        return (
          <button
            key={vertical.value}
            type="button"
            onClick={() => onChange(vertical.value)}
            className={`rounded-2xl border p-5 text-left transition-all ${
              active
                ? 'border-[var(--color-primary)] bg-white shadow-md'
                : 'border-[var(--color-border)] bg-white/80 hover:border-slate-300 hover:bg-white'
            }`}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                className="rounded-2xl p-3"
                style={{
                  backgroundColor: active ? vertical.accent : `${vertical.accent}1A`,
                  color: active ? '#ffffff' : vertical.accent,
                }}
              >
                <Icon className="h-5 w-5" />
              </div>
              {active ? (
                <span className="rounded-full bg-[var(--color-primary)] px-3 py-1 text-xs font-semibold text-[var(--color-primary-foreground)]">
                  Selecionado
                </span>
              ) : null}
            </div>
            <h3 className="mt-4 text-base font-semibold text-slate-900">{vertical.label}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-600">{vertical.description}</p>
          </button>
        );
      })}
    </div>
  );
}
