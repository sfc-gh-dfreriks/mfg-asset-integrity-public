// Formatting and shared bits for the asset-integrity pages (volumes in BOE, rates in kg/h).
export const boe = (v: number | null | undefined): string => {
  if (v == null || Number.isNaN(Number(v))) return '–';
  const n = Number(v);
  if (Math.abs(n) >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (Math.abs(n) >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toFixed(0);
};
export const num1 = (v: any) => (v == null ? '–' : Number(v).toFixed(1));
export const num2 = (v: any) => (v == null ? '–' : Number(v).toFixed(2));
export const dt = (v: any) => (v ? String(v).slice(0, 10) : '–');
export const BAND_COLOR: Record<string, string> = { CRITICAL: '#dc2626', HIGH: '#f97316', MEDIUM: '#f59e0b', LOW: '#10b981' };
