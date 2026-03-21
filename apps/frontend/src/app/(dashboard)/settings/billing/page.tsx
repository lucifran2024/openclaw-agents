'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BarChart3,
  CreditCard,
  Database,
  ExternalLink,
  ReceiptText,
  Sparkles,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  SettingsEmptyState,
  SettingsErrorState,
  SettingsPageHeader,
  SettingsSection,
} from '@/components/settings/settings-shell';
import {
  useBillingCancel,
  useBillingCheckout,
  useBillingInvoices,
  useBillingPlans,
  useBillingPortal,
  useBillingSubscription,
  useBillingUsage,
  type BillingInvoice,
  type BillingPlanLimits,
} from '@/hooks/use-settings';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(value);
}

function formatMoneyFromCents(value: number, currency: string) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(value / 100);
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(date));
}

function formatUnixDate(value: number) {
  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'medium',
  }).format(new Date(value * 1000));
}

function getUsageValue(
  metrics: Array<{ metric: string; value: number }>,
  metric: string,
) {
  return metrics.find((item) => item.metric === metric)?.value || 0;
}

function usageItems(
  limits: BillingPlanLimits,
  metrics: Array<{ metric: string; value: number }>,
) {
  return [
    {
      label: 'Contatos',
      value: getUsageValue(metrics, 'contacts'),
      limit: limits.maxContacts,
      icon: CreditCard,
    },
    {
      label: 'Conversas',
      value: getUsageValue(metrics, 'conversations'),
      limit: limits.maxConversations,
      icon: BarChart3,
    },
    {
      label: 'Campanhas',
      value: getUsageValue(metrics, 'campaigns'),
      limit: limits.maxCampaignsPerMonth,
      icon: Sparkles,
    },
    {
      label: 'AI Queries',
      value: getUsageValue(metrics, 'ai_queries'),
      limit: limits.maxAiQueries,
      icon: Database,
    },
  ];
}

function getSubscriptionBadge(status: string) {
  switch (status) {
    case 'active':
      return { label: 'Ativa', variant: 'default' as const };
    case 'trialing':
      return { label: 'Trial', variant: 'secondary' as const };
    case 'past_due':
      return { label: 'Pagamento pendente', variant: 'destructive' as const };
    case 'cancelled':
      return { label: 'Cancelada', variant: 'outline' as const };
    default:
      return { label: status, variant: 'outline' as const };
  }
}

function getInvoiceBadge(status?: string | null) {
  switch (status) {
    case 'paid':
      return { label: 'Paga', variant: 'default' as const };
    case 'open':
      return { label: 'Em aberto', variant: 'secondary' as const };
    case 'uncollectible':
    case 'void':
      return { label: 'Falha', variant: 'destructive' as const };
    case 'draft':
      return { label: 'Rascunho', variant: 'outline' as const };
    default:
      return { label: status || 'Sem status', variant: 'outline' as const };
  }
}

function comparePlanPrice(
  currentMonthlyPrice: number,
  nextMonthlyPrice: number,
  isCurrentPlan: boolean,
) {
  if (isCurrentPlan) {
    return 'Plano atual';
  }

  if (nextMonthlyPrice > currentMonthlyPrice) {
    return 'Upgrade';
  }

  if (nextMonthlyPrice < currentMonthlyPrice) {
    return 'Downgrade';
  }

  return 'Alterar plano';
}

function InvoiceRow({ invoice }: { invoice: BillingInvoice }) {
  const badge = getInvoiceBadge(invoice.status);

  return (
    <div className="grid gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4 md:grid-cols-[1.4fr_1fr_1fr_auto] md:items-center">
      <div>
        <p className="text-sm font-semibold text-[var(--color-foreground)]">
          {invoice.number || invoice.id}
        </p>
        <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
          {formatUnixDate(invoice.periodStart)} a {formatUnixDate(invoice.periodEnd)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
          Emitida
        </p>
        <p className="mt-1 text-sm font-medium text-[var(--color-foreground)]">
          {formatUnixDate(invoice.created)}
        </p>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.16em] text-[var(--color-muted-foreground)]">
          Valor
        </p>
        <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">
          {formatMoneyFromCents(
            invoice.amountPaid > 0 ? invoice.amountPaid : invoice.amountDue,
            invoice.currency,
          )}
        </p>
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <Badge variant={badge.variant}>{badge.label}</Badge>
        {invoice.hostedInvoiceUrl || invoice.invoicePdf ? (
          <a
            href={invoice.hostedInvoiceUrl || invoice.invoicePdf || '#'}
            target="_blank"
            rel="noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[var(--color-border)] px-3 text-sm font-medium text-[var(--color-foreground)] transition-colors hover:bg-[var(--color-muted)]"
          >
            Abrir
            <ExternalLink className="h-4 w-4" />
          </a>
        ) : null}
      </div>
    </div>
  );
}

export default function SettingsBillingPage() {
  const searchParams = useSearchParams();
  const subscriptionQuery = useBillingSubscription();
  const usageQuery = useBillingUsage();
  const plansQuery = useBillingPlans();
  const invoicesQuery = useBillingInvoices();
  const checkoutMutation = useBillingCheckout();
  const portalMutation = useBillingPortal();
  const cancelMutation = useBillingCancel();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkoutState = searchParams.get('checkout');
  const subscription = subscriptionQuery.data?.subscription;
  const currentPlan = subscriptionQuery.data?.plan;
  const usage = usageQuery.data?.metrics || [];
  const plans = plansQuery.data || [];
  const invoices = invoicesQuery.data || [];
  const cards = currentPlan ? usageItems(currentPlan.limits, usage) : [];

  const topMessage = useMemo(() => {
    if (checkoutState === 'success') {
      return {
        tone: 'success' as const,
        text: 'Checkout concluido com sucesso. Assim que a Stripe confirmar o pagamento, o plano sera sincronizado.',
      };
    }

    if (checkoutState === 'cancelled') {
      return {
        tone: 'neutral' as const,
        text: 'O checkout foi cancelado antes da confirmacao. Seu plano atual permanece o mesmo.',
      };
    }

    return null;
  }, [checkoutState]);

  if (
    subscriptionQuery.isLoading ||
    usageQuery.isLoading ||
    plansQuery.isLoading ||
    invoicesQuery.isLoading
  ) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-28 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (subscriptionQuery.error || !subscriptionQuery.data || !currentPlan || !subscription) {
    return (
      <div className="space-y-6">
        <SettingsPageHeader
          title="Billing"
          description="Gerencie plano, cobranca Stripe, invoices e consumo do tenant."
        />
        <SettingsErrorState
          title="Nao foi possivel carregar o billing"
          description="A pagina de cobranca depende da assinatura atual, dos planos e do historico de invoices do tenant."
          details={
            subscriptionQuery.error instanceof Error
              ? subscriptionQuery.error.message
              : plansQuery.error instanceof Error
                ? plansQuery.error.message
                : invoicesQuery.error instanceof Error
                  ? invoicesQuery.error.message
                  : usageQuery.error instanceof Error
                    ? usageQuery.error.message
                    : undefined
          }
          action={
            <Button
              onClick={() =>
                void Promise.all([
                  subscriptionQuery.refetch(),
                  usageQuery.refetch(),
                  plansQuery.refetch(),
                  invoicesQuery.refetch(),
                ])
              }
            >
              Tentar novamente
            </Button>
          }
        />
      </div>
    );
  }

  const subscriptionBadge = getSubscriptionBadge(subscription.status);

  async function handleCheckout(planId: string) {
    setFeedback(null);
    setError(null);

    try {
      const response = await checkoutMutation.mutateAsync(planId);

      if (response.url) {
        window.location.href = response.url;
        return;
      }

      setFeedback('Plano atualizado com sucesso. A assinatura foi sincronizada sem redirecionar para checkout.');
      await Promise.all([
        subscriptionQuery.refetch(),
        usageQuery.refetch(),
        invoicesQuery.refetch(),
      ]);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Nao foi possivel iniciar o checkout da Stripe.',
      );
    }
  }

  async function handlePortal() {
    setFeedback(null);
    setError(null);

    try {
      const response = await portalMutation.mutateAsync();
      window.location.href = response.url;
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Nao foi possivel abrir o portal da Stripe.',
      );
    }
  }

  async function handleCancel() {
    setFeedback(null);
    setError(null);

    try {
      const response = await cancelMutation.mutateAsync();
      setFeedback(
        `Assinatura configurada para cancelar no fim do ciclo atual (${formatDate(response.currentPeriodEnd)}).`,
      );
      await Promise.all([
        subscriptionQuery.refetch(),
        usageQuery.refetch(),
        invoicesQuery.refetch(),
      ]);
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Nao foi possivel cancelar a assinatura.',
      );
    }
  }

  return (
    <div className="space-y-6">
      <SettingsPageHeader
        title="Billing"
        description="Gerencie assinatura Stripe, acompanhe consumo e consulte o historico de faturas."
        actions={
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={handlePortal}
              disabled={portalMutation.isPending || !subscription.stripeCustomerId}
            >
              {portalMutation.isPending ? 'Abrindo...' : 'Gerenciar Assinatura'}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={
                cancelMutation.isPending ||
                !subscription.externalId ||
                Boolean(subscription.cancelAtPeriodEnd) ||
                subscription.status === 'cancelled'
              }
            >
              {cancelMutation.isPending ? 'Cancelando...' : 'Cancelar no fim do ciclo'}
            </Button>
          </div>
        }
      />

      {topMessage ? (
        <div
          className={
            topMessage.tone === 'success'
              ? 'rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700'
              : 'rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-sm text-[var(--color-muted-foreground)]'
          }
        >
          {topMessage.text}
        </div>
      ) : null}

      {feedback ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {feedback}
        </div>
      ) : null}

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Plano atual</p>
          <div className="mt-3 flex items-center gap-3">
            <p className="text-2xl font-semibold text-[var(--color-foreground)]">
              {currentPlan.name}
            </p>
            <Badge variant={subscriptionBadge.variant}>{subscriptionBadge.label}</Badge>
          </div>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {currentPlan.description}
          </p>
          {subscription.trialEndsAt ? (
            <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
              Trial ate {formatDate(subscription.trialEndsAt)}
            </p>
          ) : null}
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Ciclo atual</p>
          <p className="mt-3 text-base font-semibold text-[var(--color-foreground)]">
            {formatDate(subscription.currentPeriodStart)} a {formatDate(subscription.currentPeriodEnd)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            {subscription.cancelAtPeriodEnd
              ? 'Cancelamento agendado ao fim do ciclo.'
              : 'Cobranca e limites sincronizados com a Stripe.'}
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 shadow-sm">
          <p className="text-sm text-[var(--color-muted-foreground)]">Mensalidade</p>
          <p className="mt-3 text-2xl font-semibold text-[var(--color-foreground)]">
            {formatCurrency(currentPlan.priceMonthly)}
          </p>
          <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
            Anual: {formatCurrency(currentPlan.priceYearly)}
          </p>
        </div>
      </div>

      <SettingsSection
        title="Consumo por limite"
        description="Acompanhe os principais medidores operacionais usados pelo tenant no ciclo corrente."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {cards.map((item) => {
            const percent =
              item.limit <= 0 ? 0 : Math.min(100, Math.round((item.value / item.limit) * 100));
            const Icon = item.icon;

            return (
              <div
                key={item.label}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[var(--color-muted)] p-2 text-[var(--color-primary)]">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">
                        {item.label}
                      </p>
                      <p className="text-sm text-[var(--color-muted-foreground)]">
                        {item.value} / {item.limit === -1 ? 'Ilimitado' : item.limit}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-[var(--color-foreground)]">
                    {item.limit === -1 ? 'Sem limite' : `${percent}%`}
                  </p>
                </div>
                <div className="mt-4 h-2 rounded-full bg-[var(--color-muted)]">
                  <div
                    className="h-full rounded-full bg-[var(--color-primary)]"
                    style={{ width: item.limit === -1 ? '100%' : `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Planos disponiveis"
        description="Upgrade e downgrade sao enviados para a Stripe com prorate proporcional quando aplicavel."
      >
        <div className="grid gap-4 xl:grid-cols-3">
          {plans.map((plan) => {
            const isCurrentPlan = plan.id === currentPlan.id && subscription.status !== 'cancelled';
            const cta = comparePlanPrice(currentPlan.priceMonthly, plan.priceMonthly, isCurrentPlan);
            const isPending =
              checkoutMutation.isPending && checkoutMutation.variables === plan.id;

            return (
              <div
                key={plan.id}
                className="flex h-full flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-[var(--color-foreground)]">
                      {plan.name}
                    </p>
                    <p className="mt-2 text-sm text-[var(--color-muted-foreground)]">
                      {plan.description}
                    </p>
                  </div>
                  {plan.id === currentPlan.id ? (
                    <Badge variant="secondary">
                      {subscription.status === 'cancelled' ? 'Plano anterior' : 'Atual'}
                    </Badge>
                  ) : null}
                </div>

                <div className="mt-6">
                  <p className="text-3xl font-semibold text-[var(--color-foreground)]">
                    {formatCurrency(plan.priceMonthly)}
                  </p>
                  <p className="mt-1 text-sm text-[var(--color-muted-foreground)]">
                    ou {formatCurrency(plan.priceYearly)} por ano
                  </p>
                </div>

                <div className="mt-6 space-y-2">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                    Limites principais
                  </p>
                  <p className="text-sm text-[var(--color-foreground)]">
                    {plan.limits.maxContacts === -1 ? 'Contatos ilimitados' : `${plan.limits.maxContacts} contatos`}
                  </p>
                  <p className="text-sm text-[var(--color-foreground)]">
                    {plan.limits.maxConversations === -1
                      ? 'Conversas ilimitadas'
                      : `${plan.limits.maxConversations} conversas`}
                  </p>
                  <p className="text-sm text-[var(--color-foreground)]">
                    {plan.limits.maxAiQueries === -1
                      ? 'AI queries ilimitadas'
                      : `${plan.limits.maxAiQueries} AI queries`}
                  </p>
                </div>

                <div className="mt-6 flex-1">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--color-muted-foreground)]">
                    Features
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {plan.limits.features.map((feature) => (
                      <Badge key={feature} variant="outline">
                        {feature.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button
                  className="mt-6"
                  variant={isCurrentPlan ? 'outline' : 'default'}
                  disabled={isCurrentPlan || isPending}
                  onClick={() => handleCheckout(plan.id)}
                >
                  {isPending ? 'Abrindo checkout...' : cta}
                </Button>
              </div>
            );
          })}
        </div>
      </SettingsSection>

      <SettingsSection
        title="Historico de faturas"
        description="Invoices emitidas pela Stripe para este tenant."
      >
        {invoices.length ? (
          <div className="space-y-3">
            {invoices.map((invoice) => (
              <InvoiceRow key={invoice.id} invoice={invoice} />
            ))}
          </div>
        ) : (
          <SettingsEmptyState
            title="Nenhuma fatura encontrada"
            description="As invoices aparecerao aqui assim que o tenant concluir o primeiro checkout ou renovacao."
            icon={<ReceiptText className="h-5 w-5" />}
          />
        )}
      </SettingsSection>
    </div>
  );
}
