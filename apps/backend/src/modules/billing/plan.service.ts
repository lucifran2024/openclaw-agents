import { Injectable, NotFoundException } from '@nestjs/common';

export interface PlanLimits {
  maxContacts: number;
  maxConversations: number;
  maxCampaignsPerMonth: number;
  maxAiQueries: number;
  maxStorageMb: number;
  features: string[];
}

export interface Plan {
  id: string;
  name: string;
  description: string;
  priceMonthly: number;
  priceYearly: number;
  limits: PlanLimits;
}

const PLANS: Plan[] = [
  {
    id: 'plan_free',
    name: 'Free',
    description: 'Get started with basic features',
    priceMonthly: 0,
    priceYearly: 0,
    limits: {
      maxContacts: 500,
      maxConversations: 100,
      maxCampaignsPerMonth: 2,
      maxAiQueries: 50,
      maxStorageMb: 100,
      features: ['whatsapp_messaging', 'basic_reports'],
    },
  },
  {
    id: 'plan_starter',
    name: 'Starter',
    description: 'For growing businesses',
    priceMonthly: 29,
    priceYearly: 290,
    limits: {
      maxContacts: 5000,
      maxConversations: 1000,
      maxCampaignsPerMonth: 10,
      maxAiQueries: 500,
      maxStorageMb: 1000,
      features: ['whatsapp_messaging', 'basic_reports', 'campaigns', 'scheduling'],
    },
  },
  {
    id: 'plan_professional',
    name: 'Professional',
    description: 'Advanced features for teams',
    priceMonthly: 79,
    priceYearly: 790,
    limits: {
      maxContacts: 25000,
      maxConversations: 5000,
      maxCampaignsPerMonth: 50,
      maxAiQueries: 2000,
      maxStorageMb: 5000,
      features: [
        'whatsapp_messaging',
        'advanced_reports',
        'campaigns',
        'scheduling',
        'ai_assistant',
        'kanban',
        'team_management',
      ],
    },
  },
  {
    id: 'plan_enterprise',
    name: 'Enterprise',
    description: 'Unlimited access for large organizations',
    priceMonthly: 199,
    priceYearly: 1990,
    limits: {
      maxContacts: -1, // unlimited
      maxConversations: -1,
      maxCampaignsPerMonth: -1,
      maxAiQueries: -1,
      maxStorageMb: -1,
      features: [
        'whatsapp_messaging',
        'advanced_reports',
        'campaigns',
        'scheduling',
        'ai_assistant',
        'kanban',
        'team_management',
        'api_access',
        'custom_integrations',
        'sla_support',
      ],
    },
  },
];

@Injectable()
export class PlanService {
  getPlans(): Plan[] {
    return PLANS;
  }

  getPlanById(id: string): Plan {
    const plan = PLANS.find((p) => p.id === id);
    if (!plan) throw new NotFoundException('Plan not found');
    return plan;
  }
}
