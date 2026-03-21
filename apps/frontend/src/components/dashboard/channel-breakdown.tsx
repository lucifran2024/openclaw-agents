'use client';

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Skeleton } from '@/components/ui/skeleton';

interface ChannelItem {
  channel: string;
  conversations: number;
  messages: number;
}

interface ChannelBreakdownProps {
  data: ChannelItem[];
  isLoading: boolean;
}

const COLORS = ['#0f766e', '#2563eb', '#f59e0b', '#dc2626', '#7c3aed', '#0891b2'];

function labelForChannel(channel: string) {
  switch (channel) {
    case 'whatsapp':
      return 'WhatsApp';
    case 'webchat':
      return 'Webchat';
    case 'instagram':
      return 'Instagram';
    case 'telegram':
      return 'Telegram';
    case 'email':
      return 'Email';
    default:
      return channel;
  }
}

export function ChannelBreakdown({ data, isLoading }: ChannelBreakdownProps) {
  if (isLoading) {
    return (
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <Skeleton className="mb-4 h-5 w-40" />
        <Skeleton className="h-72 w-full rounded-lg" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 shadow-sm">
      <h3 className="mb-1 text-base font-semibold text-[var(--color-foreground)]">
        Breakdown por Canal
      </h3>
      <p className="mb-4 text-xs text-[var(--color-muted-foreground)]">
        Distribuicao de conversas e mensagens por canal no periodo selecionado.
      </p>

      {data.length === 0 ? (
        <div className="flex h-72 items-center justify-center rounded-lg border-2 border-dashed border-[var(--color-border)]">
          <p className="text-sm text-[var(--color-muted-foreground)]">
            Sem dados de canais para o recorte atual.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[1fr_1fr]">
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={data}
                dataKey="messages"
                nameKey="channel"
                innerRadius={55}
                outerRadius={88}
                paddingAngle={3}
              >
                {data.map((item, index) => (
                  <Cell key={item.channel} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--color-surface)',
                  border: '1px solid var(--color-border)',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, _name, payload) => [
                  `${value}`,
                  labelForChannel(String(payload?.payload?.channel || 'canal')),
                ]}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="space-y-3">
            {data.map((item, index) => (
              <div
                key={item.channel}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-background)] p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span
                      className="mt-1 h-3 w-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <div>
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">
                        {labelForChannel(item.channel)}
                      </p>
                      <p className="text-xs text-[var(--color-muted-foreground)]">
                        {item.conversations} conversas
                      </p>
                    </div>
                  </div>
                  <p className="text-sm font-semibold text-[var(--color-foreground)]">
                    {item.messages} msgs
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
