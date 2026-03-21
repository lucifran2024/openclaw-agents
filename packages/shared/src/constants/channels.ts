export const CHANNELS = {
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  WEBCHAT: 'webchat',
  TELEGRAM: 'telegram',
  INSTAGRAM: 'instagram',
} as const;

export type Channel = (typeof CHANNELS)[keyof typeof CHANNELS];
