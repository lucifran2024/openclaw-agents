import { Injectable } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/postgresql';
import { generateId } from '@repo/shared';
import { ContactService } from '../contacts/contact.service';
import { FunnelStage, ContactStatus, ConsentStatus } from '../contacts/contact.entity';
import { SchedulingService } from '../scheduling/scheduling.service';
import { ResourceType } from '../scheduling/entities/resource.entity';
import { KanbanService } from '../kanban/kanban.service';
import { BoardType } from '../kanban/entities/board.entity';
import { TenantService } from '../tenant/tenant.service';
import {
  OnboardingConfigEntity,
  OnboardingTheme,
  OnboardingVertical,
} from './onboarding-config.entity';

const REQUIRED_STEPS = ['vertical', 'whatsapp', 'theme', 'sample-data', 'team'];
const DEFAULT_THEME: Required<OnboardingTheme> = {
  primaryColor: '#2563eb',
  logo: '',
  favicon: '',
};

@Injectable()
export class OnboardingService {
  constructor(
    private readonly em: EntityManager,
    private readonly tenantService: TenantService,
    private readonly contactService: ContactService,
    private readonly schedulingService: SchedulingService,
    private readonly kanbanService: KanbanService,
  ) {}

  async getOnboardingStatus(tenantId: string) {
    const [tenant, config] = await Promise.all([
      this.tenantService.findById(tenantId),
      this.ensureConfig(tenantId),
    ]);

    const completedSteps = [...config.completedSteps];
    const currentStep =
      REQUIRED_STEPS.find((step) => !completedSteps.includes(step)) || 'completed';
    const theme = { ...DEFAULT_THEME, ...config.theme };
    const settings = tenant.settings || {};

    return {
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug,
        status: tenant.status,
        vertical: tenant.vertical,
      },
      vertical: config.vertical,
      completedSteps,
      requiredSteps: REQUIRED_STEPS,
      currentStep,
      isComplete: config.isComplete,
      sampleDataLoaded: config.sampleDataLoaded,
      theme,
      draftData: {
        whatsapp:
          (settings.onboardingWhatsApp as Record<string, unknown> | undefined) || {},
        team: (settings.onboardingTeam as Record<string, unknown> | undefined) || {},
      },
    };
  }

  async completeStep(
    tenantId: string,
    stepName: string,
    data: Record<string, unknown> = {},
  ) {
    const config = await this.ensureConfig(tenantId);
    const normalizedStep = stepName.trim().toLowerCase();
    const tenant = await this.tenantService.findById(tenantId);

    if (normalizedStep === 'vertical' && this.isValidVertical(data.vertical)) {
      const vertical = data.vertical as OnboardingVertical;
      config.vertical = vertical;
      await this.tenantService.update(tenantId, { vertical });
    }

    if (normalizedStep === 'whatsapp') {
      await this.tenantService.update(tenantId, {
        settings: {
          ...tenant.settings,
          onboardingWhatsApp: {
            ...(tenant.settings?.onboardingWhatsApp as Record<string, unknown> | undefined),
            ...data,
          },
        },
      });
    }

    if (normalizedStep === 'team') {
      await this.tenantService.update(tenantId, {
        settings: {
          ...tenant.settings,
          onboardingTeam: {
            ...(tenant.settings?.onboardingTeam as Record<string, unknown> | undefined),
            ...data,
          },
        },
      });
    }

    if (!config.completedSteps.includes(normalizedStep)) {
      config.completedSteps = [...config.completedSteps, normalizedStep];
    }

    config.isComplete = REQUIRED_STEPS.every((step) =>
      config.completedSteps.includes(step),
    );

    await this.em.flush();
    return this.getOnboardingStatus(tenantId);
  }

  async loadSampleData(
    tenantId: string,
    vertical?: OnboardingVertical,
  ): Promise<{
    vertical: OnboardingVertical;
    sampleDataLoaded: boolean;
    status: Awaited<ReturnType<OnboardingService['getOnboardingStatus']>>;
  }> {
    const config = await this.ensureConfig(tenantId);
    const resolvedVertical =
      vertical || config.vertical || OnboardingVertical.GENERAL;

    if (!config.sampleDataLoaded) {
      await this.createSampleDataset(tenantId, resolvedVertical);
      config.sampleDataLoaded = true;
    }

    config.vertical = resolvedVertical;

    if (!config.completedSteps.includes('sample-data')) {
      config.completedSteps = [...config.completedSteps, 'sample-data'];
    }

    config.isComplete = REQUIRED_STEPS.every((step) =>
      config.completedSteps.includes(step),
    );

    await this.em.flush();

    return {
      vertical: resolvedVertical,
      sampleDataLoaded: config.sampleDataLoaded,
      status: await this.getOnboardingStatus(tenantId),
    };
  }

  async applyTheme(tenantId: string, theme: OnboardingTheme) {
    const config = await this.ensureConfig(tenantId);
    const tenant = await this.tenantService.findById(tenantId);
    const nextTheme = { ...DEFAULT_THEME, ...config.theme, ...theme };

    config.theme = nextTheme;

    await this.tenantService.update(tenantId, {
      settings: {
        ...tenant.settings,
        theme: nextTheme,
      },
    });

    await this.em.flush();
    return nextTheme;
  }

  async ensureConfig(tenantId: string): Promise<OnboardingConfigEntity> {
    let config = await this.em.findOne(OnboardingConfigEntity, { tenantId });
    if (config) return config;

    const tenant = await this.tenantService.findById(tenantId);

    config = this.em.create(OnboardingConfigEntity, {
      tenantId,
      vertical: this.isValidVertical(tenant.vertical)
        ? (tenant.vertical as OnboardingVertical)
        : OnboardingVertical.GENERAL,
      theme: {
        ...DEFAULT_THEME,
        ...((tenant.settings?.theme as OnboardingTheme | undefined) || {}),
      },
      completedSteps: [],
      isComplete: false,
      sampleDataLoaded: false,
    } as any);

    await this.em.persistAndFlush(config);
    return config;
  }

  private async createSampleDataset(
    tenantId: string,
    vertical: OnboardingVertical,
  ): Promise<void> {
    switch (vertical) {
      case OnboardingVertical.CLINIC:
        await this.createClinicSampleData(tenantId);
        return;
      case OnboardingVertical.SALON:
        await this.createSalonSampleData(tenantId);
        return;
      case OnboardingVertical.RESTAURANT:
        await this.createRestaurantSampleData(tenantId);
        return;
      case OnboardingVertical.ECOMMERCE:
        await this.createEcommerceSampleData(tenantId);
        return;
      case OnboardingVertical.SERVICES:
        await this.createServicesSampleData(tenantId);
        return;
      case OnboardingVertical.GENERAL:
      default:
        await this.createGeneralSampleData(tenantId);
        return;
    }
  }

  private async createClinicSampleData(tenantId: string) {
    const consultation = await this.schedulingService.createServiceType(tenantId, {
      name: 'Consulta',
      description: 'Primeiro atendimento',
      durationMinutes: 45,
      color: '#2563eb',
    });
    const followUp = await this.schedulingService.createServiceType(tenantId, {
      name: 'Retorno',
      description: 'Revisao e acompanhamento',
      durationMinutes: 30,
      color: '#0f766e',
    });

    await this.schedulingService.createResource(tenantId, {
      name: 'Dr. Exemplo',
      type: ResourceType.PROFESSIONAL,
      serviceTypeIds: [consultation.id, followUp.id],
    });

    await this.createSampleContacts(tenantId, [
      {
        name: 'Maria Paciente',
        email: 'maria.paciente@demo.local',
        phone: '+5511999990101',
        source: 'onboarding',
      },
      {
        name: 'Joao Retorno',
        email: 'joao.retorno@demo.local',
        phone: '+5511999990102',
        source: 'onboarding',
      },
    ]);
  }

  private async createSalonSampleData(tenantId: string) {
    const haircut = await this.schedulingService.createServiceType(tenantId, {
      name: 'Corte',
      description: 'Servico de corte tradicional',
      durationMinutes: 50,
      color: '#ec4899',
    });
    const coloring = await this.schedulingService.createServiceType(tenantId, {
      name: 'Coloracao',
      description: 'Aplicacao de coloracao',
      durationMinutes: 120,
      color: '#f97316',
    });

    await this.schedulingService.createResource(tenantId, {
      name: 'Especialista Ana',
      type: ResourceType.PROFESSIONAL,
      serviceTypeIds: [haircut.id, coloring.id],
    });

    await this.createSampleContacts(tenantId, [
      {
        name: 'Camila Beleza',
        email: 'camila@demo.local',
        phone: '+5511999990201',
        source: 'instagram',
      },
      {
        name: 'Fernanda Cor',
        email: 'fernanda@demo.local',
        phone: '+5511999990202',
        source: 'referral',
      },
    ]);
  }

  private async createRestaurantSampleData(tenantId: string) {
    const board = await this.kanbanService.createBoard(tenantId, {
      name: 'Pedidos',
      description: 'Fluxo inicial de pedidos para operacao do restaurante',
      type: BoardType.CUSTOM,
      isDefault: true,
    });

    await this.kanbanService.createColumn(tenantId, board.id, {
      name: 'Novos',
      position: 0,
      color: '#2563eb',
    });
    await this.kanbanService.createColumn(tenantId, board.id, {
      name: 'Em Preparo',
      position: 1,
      color: '#f97316',
    });
    await this.kanbanService.createColumn(tenantId, board.id, {
      name: 'Pronto',
      position: 2,
      color: '#16a34a',
    });
    await this.kanbanService.createColumn(tenantId, board.id, {
      name: 'Entregue',
      position: 3,
      color: '#64748b',
      isTerminal: true,
    });

    const tableService = await this.schedulingService.createServiceType(tenantId, {
      name: 'Mesa',
      description: 'Reserva de mesa',
      durationMinutes: 90,
      color: '#dc2626',
    });

    await this.schedulingService.createResource(tenantId, {
      name: 'Mesa 01',
      type: ResourceType.TABLE,
      serviceTypeIds: [tableService.id],
    });

    await this.createSampleContacts(tenantId, [
      {
        name: 'Cliente Delivery',
        email: 'delivery@demo.local',
        phone: '+5511999990301',
        source: 'ifood',
      },
      {
        name: 'Reserva Jantar',
        email: 'reserva@demo.local',
        phone: '+5511999990302',
        source: 'google',
      },
    ]);
  }

  private async createEcommerceSampleData(tenantId: string) {
    await this.createSampleContacts(tenantId, [
      {
        name: 'Lead Loja',
        email: 'lead.loja@demo.local',
        phone: '+5511999990401',
        source: 'meta-ads',
      },
      {
        name: 'Cliente Recorrente',
        email: 'cliente.vip@demo.local',
        phone: '+5511999990402',
        source: 'email',
      },
    ]);
  }

  private async createServicesSampleData(tenantId: string) {
    const discovery = await this.schedulingService.createServiceType(tenantId, {
      name: 'Diagnostico',
      description: 'Reuniao inicial de descoberta',
      durationMinutes: 60,
      color: '#7c3aed',
    });

    await this.schedulingService.createResource(tenantId, {
      name: 'Consultor Exemplo',
      type: ResourceType.PROFESSIONAL,
      serviceTypeIds: [discovery.id],
    });

    await this.createSampleContacts(tenantId, [
      {
        name: 'Empresa Alpha',
        email: 'contato@alpha.demo',
        phone: '+5511999990501',
        source: 'linkedin',
      },
      {
        name: 'Projeto Beta',
        email: 'beta@demo.local',
        phone: '+5511999990502',
        source: 'networking',
      },
    ]);
  }

  private async createGeneralSampleData(tenantId: string) {
    await this.createSampleContacts(tenantId, [
      {
        name: 'Contato Demo 01',
        email: 'contato1@demo.local',
        phone: '+5511999990601',
        source: 'site',
      },
      {
        name: 'Contato Demo 02',
        email: 'contato2@demo.local',
        phone: '+5511999990602',
        source: 'whatsapp',
      },
    ]);
  }

  private async createSampleContacts(
    tenantId: string,
    contacts: Array<{
      name: string;
      email: string;
      phone: string;
      source: string;
    }>,
  ) {
    for (const contact of contacts) {
      await this.contactService.create(tenantId, {
        name: contact.name,
        email: contact.email,
        phone: contact.phone,
        source: contact.source,
        status: ContactStatus.ACTIVE,
        funnelStage: FunnelStage.LEAD,
        consentStatus: ConsentStatus.OPTED_IN,
        customFields: {
          seededBy: 'onboarding',
          externalSeedId: generateId(),
        },
      });
    }
  }

  private isValidVertical(value: unknown): value is OnboardingVertical {
    return Object.values(OnboardingVertical).includes(value as OnboardingVertical);
  }
}
