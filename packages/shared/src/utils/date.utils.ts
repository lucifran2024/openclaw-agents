export function isWithin24Hours(date: Date): boolean {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  return diff < 24 * 60 * 60 * 1000;
}

export function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

export function diffInMinutes(start: Date, end: Date): number {
  return Math.floor((end.getTime() - start.getTime()) / (1000 * 60));
}
