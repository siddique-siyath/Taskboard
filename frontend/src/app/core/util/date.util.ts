const pad = (n: number) => String(n).padStart(2, '0');

/** Date -> 'YYYY-MM-DD' using LOCAL parts (toISOString would shift the day across timezones). */
export const toIsoDate = (d: Date): string => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** 'YYYY-MM-DD' -> local Date at midnight. */
export const fromIsoDate = (s: string): Date => {
  const [y, m, d] = s.split('-').map(Number);
  return new Date(y, m - 1, d);
};

export const todayIso = (): string => toIsoDate(new Date());
