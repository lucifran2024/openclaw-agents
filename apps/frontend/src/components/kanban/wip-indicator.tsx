'use client';

interface WipIndicatorProps {
  current: number;
  limit: number;
}

export function WipIndicator({ current, limit }: WipIndicatorProps) {
  const hasLimit = limit > 0;
  const ratio = hasLimit ? current / limit : 0;

  let colorClass = 'text-emerald-500';
  if (hasLimit) {
    if (current > limit) {
      colorClass = 'text-red-500 font-bold';
    } else if (current === limit) {
      colorClass = 'text-amber-500 font-semibold';
    }
  }

  return (
    <span className={`text-xs tabular-nums ${colorClass}`}>
      {hasLimit ? `${current}/${limit}` : `${current}/\u221E`}
    </span>
  );
}
