import { registerAs } from '@nestjs/config';

export default registerAs('stripe', () => ({
  secretKey: process.env.STRIPE_SECRET_KEY || '',
  webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
  priceIds: {
    plan_starter: process.env.STRIPE_PRICE_STARTER || '',
    plan_professional: process.env.STRIPE_PRICE_PROFESSIONAL || '',
    plan_enterprise: process.env.STRIPE_PRICE_ENTERPRISE || '',
  },
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
}));
