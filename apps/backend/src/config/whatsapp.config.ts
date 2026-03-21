import { registerAs } from '@nestjs/config';

export default registerAs('whatsapp', () => ({
  apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
  appSecret: process.env.WHATSAPP_APP_SECRET || '',
  verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || '',
  baseUrl: 'https://graph.facebook.com',
}));
