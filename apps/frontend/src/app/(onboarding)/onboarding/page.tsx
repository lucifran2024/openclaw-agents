'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Check, MailPlus, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { VerticalSelector } from '@/components/onboarding/vertical-selector';
import { ThemeCustomizer } from '@/components/onboarding/theme-customizer';
import {
  useCompleteOnboardingStep,
  useLoadSampleData,
  useOnboardingStatus,
  useUpdateOnboardingTheme,
  type OnboardingVertical,
} from '@/hooks/use-onboarding';
import { useInviteUser } from '@/hooks/use-settings';

const stepLabels = [
  'Vertical',
  'WhatsApp',
  'Tema',
  'Dados de exemplo',
  'Equipe',
];

const defaultTheme = {
  primaryColor: '#2563eb',
  logo: '',
  favicon: '',
};

function titleFromEmail(email: string) {
  return email
    .split('@')[0]
    .split(/[._-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export default function OnboardingPage() {
  const router = useRouter();
  const statusQuery = useOnboardingStatus();
  const completeStep = useCompleteOnboardingStep();
  const loadSampleData = useLoadSampleData();
  const updateTheme = useUpdateOnboardingTheme();
  const inviteUser = useInviteUser();

  const [step, setStep] = useState(0);
  const [vertical, setVertical] = useState<OnboardingVertical>('general');
  const [whatsapp, setWhatsapp] = useState({
    displayName: '',
    phoneNumber: '',
    verified: false,
  });
  const [theme, setTheme] = useState(defaultTheme);
  const [sampleMode, setSampleMode] = useState<'load' | 'skip'>('load');
  const [teamEmails, setTeamEmails] = useState<string[]>(['']);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const status = statusQuery.data;
    if (!status) return;

    setVertical(status.vertical);
    setTheme({
      primaryColor: status.theme.primaryColor || defaultTheme.primaryColor,
      logo: status.theme.logo || '',
      favicon: status.theme.favicon || '',
    });
    setWhatsapp({
      displayName: String(status.draftData.whatsapp?.displayName || status.tenant.name || ''),
      phoneNumber: String(status.draftData.whatsapp?.phoneNumber || ''),
      verified: Boolean(status.draftData.whatsapp?.verified),
    });

    const savedEmails = Array.isArray(status.draftData.team?.emails)
      ? (status.draftData.team?.emails as string[])
      : [''];
    setTeamEmails(savedEmails.length > 0 ? savedEmails : ['']);
    setSampleMode(status.sampleDataLoaded ? 'load' : 'skip');

    if (status.isComplete) {
      router.replace('/');
      return;
    }

    const nextIndex = Math.max(0, status.requiredSteps.indexOf(status.currentStep));
    setStep(nextIndex >= 0 ? nextIndex : 0);
  }, [router, statusQuery.data]);

  const isSubmitting =
    completeStep.isPending ||
    loadSampleData.isPending ||
    updateTheme.isPending ||
    inviteUser.isPending;

  const progress = useMemo(() => ((step + 1) / stepLabels.length) * 100, [step]);

  function updateWhatsapp<K extends keyof typeof whatsapp>(
    key: K,
    value: (typeof whatsapp)[K],
  ) {
    setWhatsapp((current) => ({ ...current, [key]: value }));
  }

  function updateEmail(index: number, value: string) {
    setTeamEmails((current) =>
      current.map((email, currentIndex) => (currentIndex === index ? value : email)),
    );
  }

  function addEmailField() {
    setTeamEmails((current) => [...current, '']);
  }

  function removeEmailField(index: number) {
    setTeamEmails((current) => {
      const next = current.filter((_, currentIndex) => currentIndex !== index);
      return next.length > 0 ? next : [''];
    });
  }

  async function handleNext() {
    setError(null);
    setMessage(null);

    try {
      if (step === 0) {
        await completeStep.mutateAsync({
          stepName: 'vertical',
          data: { vertical },
        });
        setStep(1);
        return;
      }

      if (step === 1) {
        await completeStep.mutateAsync({
          stepName: 'whatsapp',
          data: whatsapp,
        });
        setStep(2);
        return;
      }

      if (step === 2) {
        await updateTheme.mutateAsync(theme);
        await completeStep.mutateAsync({ stepName: 'theme' });
        setStep(3);
        return;
      }

      if (step === 3) {
        if (sampleMode === 'load') {
          await loadSampleData.mutateAsync(vertical);
          setMessage('Dados de exemplo carregados com sucesso.');
        } else {
          await completeStep.mutateAsync({
            stepName: 'sample-data',
            data: { skipped: true },
          });
        }
        setStep(4);
        return;
      }

      const normalizedEmails = Array.from(
        new Set(teamEmails.map((email) => email.trim()).filter(Boolean)),
      );

      const inviteResults = await Promise.allSettled(
        normalizedEmails.map((email) =>
          inviteUser.mutateAsync({
            email,
            name: titleFromEmail(email) || 'Novo Membro',
            role: 'agent',
          }),
        ),
      );

      const failedInvites = inviteResults
        .map((result, index) => ({ result, email: normalizedEmails[index] }))
        .filter((item) => item.result.status === 'rejected')
        .map((item) => item.email);

      await completeStep.mutateAsync({
        stepName: 'team',
        data: { emails: normalizedEmails, failedInvites },
      });

      if (failedInvites.length > 0) {
        setMessage(
          `Setup concluido. Alguns convites precisarao de revisao: ${failedInvites.join(', ')}.`,
        );
      }

      router.push('/');
    } catch (mutationError) {
      setError(
        mutationError instanceof Error
          ? mutationError.message
          : 'Nao foi possivel concluir esta etapa.',
      );
    }
  }

  function handleBack() {
    setError(null);
    setMessage(null);
    setStep((current) => Math.max(0, current - 1));
  }

  if (statusQuery.isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 px-4 py-10">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-40 rounded-[2rem]" />
          <Skeleton className="h-[32rem] rounded-[2rem]" />
        </div>
      </div>
    );
  }

  if (!statusQuery.data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-white">
        <div className="w-full max-w-2xl rounded-[2rem] border border-white/10 bg-white/6 p-8 shadow-2xl backdrop-blur">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
            Onboarding Indisponivel
          </p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">
            Nao foi possivel carregar o setup inicial
          </h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Verifique a conexao com o backend e tente novamente. O onboarding depende do status
            atual do tenant para recuperar a etapa ativa e os dados em rascunho.
          </p>
          {statusQuery.error instanceof Error ? (
            <p className="mt-4 rounded-2xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-100">
              {statusQuery.error.message}
            </p>
          ) : null}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Button onClick={() => void statusQuery.refetch()}>
              Tentar novamente
            </Button>
            <Button variant="outline" onClick={() => router.push('/')}>
              Ir para o dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const tenantName = statusQuery.data.tenant.name;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.22),_transparent_38%),radial-gradient(circle_at_bottom_right,_rgba(251,191,36,0.18),_transparent_32%),#020617] px-4 py-8 text-white">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/6 p-6 shadow-2xl backdrop-blur">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/80">
                Onboarding Guiado
              </p>
              <h1 className="mt-3 text-4xl font-semibold tracking-tight">
                Configure {tenantName} em poucos passos
              </h1>
              <p className="mt-3 text-sm leading-7 text-slate-300">
                Escolha a vertical, alinhe sua identidade visual, salve dados base e deixe a
                operacao pronta para entrar em producao com mais contexto.
              </p>
            </div>

            <div className="w-full max-w-sm rounded-[1.6rem] border border-white/10 bg-black/20 p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-300">Progresso</span>
                <span className="font-semibold text-white">
                  {step + 1}/{stepLabels.length}
                </span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[var(--color-primary)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="mt-3 text-sm text-slate-300">
                Etapa atual: <span className="font-medium text-white">{stepLabels[step]}</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[260px_minmax(0,1fr)]">
          <aside className="rounded-[2rem] border border-white/10 bg-white/6 p-4 backdrop-blur">
            <div className="space-y-2">
              {stepLabels.map((label, index) => {
                const active = index === step;
                const done = index < step;

                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      if (index <= step) setStep(index);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition-colors ${
                      active
                        ? 'bg-white text-slate-950'
                        : done
                          ? 'bg-emerald-400/15 text-emerald-100'
                          : 'text-slate-300 hover:bg-white/6'
                    }`}
                  >
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${
                        active
                          ? 'bg-slate-950 text-white'
                          : done
                            ? 'bg-emerald-500 text-white'
                            : 'bg-white/10 text-slate-300'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : index + 1}
                    </div>
                    <span className="text-sm font-medium">{label}</span>
                  </button>
                );
              })}
            </div>
          </aside>

          <main className="rounded-[2rem] border border-white/10 bg-white p-6 text-slate-900 shadow-2xl">
            <div className="min-h-[34rem]">
              {step === 0 ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Etapa 1
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      Escolha a vertical da operacao
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Isso ajuda a plataforma a sugerir estruturas iniciais mais alinhadas com
                      seu contexto de negocio.
                    </p>
                  </div>
                  <VerticalSelector value={vertical} onChange={setVertical} />
                </div>
              ) : null}

              {step === 1 ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Etapa 2
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      Registre o contexto do WhatsApp
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Guarde aqui o numero principal e o status de verificacao para que o setup
                      fique documentado e retome sem perda de contexto.
                    </p>
                  </div>

                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-900">Nome exibido</label>
                      <Input
                        value={whatsapp.displayName}
                        onChange={(e) => updateWhatsapp('displayName', e.target.value)}
                        placeholder={tenantName}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-900">
                        Numero principal
                      </label>
                      <Input
                        value={whatsapp.phoneNumber}
                        onChange={(e) => updateWhatsapp('phoneNumber', e.target.value)}
                        placeholder="+55 11 99999-9999"
                      />
                    </div>
                  </div>

                  <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <label className="inline-flex cursor-pointer items-center gap-3">
                      <input
                        type="checkbox"
                        checked={whatsapp.verified}
                        onChange={(e) => updateWhatsapp('verified', e.target.checked)}
                        className="h-4 w-4 rounded border-slate-300"
                      />
                      <span className="text-sm font-medium text-slate-900">
                        Numero ja verificado
                      </span>
                    </label>
                    <p className="mt-3 text-sm leading-6 text-slate-600">
                      Se ainda nao estiver verificado, voce pode concluir o onboarding agora e
                      finalizar a conexao na pagina de Canais depois.
                    </p>
                  </div>
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Etapa 3
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      Personalize o tema da sua marca
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Escolha a cor principal e envie logo/favicon para deixar a experiencia mais
                      alinhada com a identidade do tenant desde o primeiro acesso.
                    </p>
                  </div>
                  <ThemeCustomizer value={theme} onChange={setTheme} previewName={tenantName} />
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Etapa 4
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      Carregar dados de exemplo
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Opcional. Isso cria registros iniciais para explorar agenda, contatos e fluxo
                      sem comecar em branco.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <button
                      type="button"
                      onClick={() => setSampleMode('load')}
                      className={`rounded-3xl border p-5 text-left transition-colors ${
                        sampleMode === 'load'
                          ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
                      <h3 className="mt-4 text-lg font-semibold">Carregar exemplos</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Cria servicos, recursos, board e contatos basicos conforme a vertical.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSampleMode('skip')}
                      className={`rounded-3xl border p-5 text-left transition-colors ${
                        sampleMode === 'skip'
                          ? 'border-[var(--color-primary)] bg-[color-mix(in_srgb,var(--color-primary)_8%,white)]'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Check className="h-5 w-5 text-slate-500" />
                      <h3 className="mt-4 text-lg font-semibold">Pular por enquanto</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        Avance com a estrutura vazia e cadastre os dados manualmente depois.
                      </p>
                    </button>
                  </div>
                </div>
              ) : null}

              {step === 4 ? (
                <div className="space-y-6">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Etapa 5
                    </p>
                    <h2 className="mt-2 text-3xl font-semibold tracking-tight">
                      Convide sua equipe
                    </h2>
                    <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600">
                      Convites sao opcionais. Se quiser, voce pode concluir agora e fazer isso mais
                      tarde em Configuracoes.
                    </p>
                  </div>

                  <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    {teamEmails.map((email, index) => (
                      <div key={`${index}-${email}`} className="flex gap-3">
                        <div className="relative flex-1">
                          <MailPlus className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => updateEmail(index, e.target.value)}
                            placeholder="pessoa@empresa.com"
                            className="pl-9"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => removeEmailField(index)}
                        >
                          Remover
                        </Button>
                      </div>
                    ))}

                    <Button type="button" variant="secondary" onClick={addEmailField}>
                      Adicionar Email
                    </Button>
                  </div>
                </div>
              ) : null}
            </div>

            {message ? (
              <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {message}
              </div>
            ) : null}

            {error ? (
              <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <Button variant="outline" onClick={handleBack} disabled={step === 0 || isSubmitting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar
              </Button>

              {step === 4 ? (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  {isSubmitting ? 'Finalizando...' : 'Concluir Setup'}
                  <Check className="ml-2 h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleNext} disabled={isSubmitting}>
                  {isSubmitting ? 'Salvando...' : 'Salvar e continuar'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
