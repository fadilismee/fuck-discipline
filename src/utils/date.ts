// Tanggal acuan data seed (sesuai finance.json & calendar seed)
export const BASE_TODAY_ISO = '2026-09-25';

export function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDaysISO(iso: string, delta: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + delta);
  return toISO(d);
}

/** ISO tanggal yang sedang dilihat user dari dayOffset */
export function activeISO(dayOffset: number): string {
  return addDaysISO(BASE_TODAY_ISO, dayOffset);
}

const DAY_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTH_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export function labelDay(iso: string): string {
  const d = parseISO(iso);
  return `${DAY_ID[d.getDay()]}, ${d.getDate()} ${MONTH_ID[d.getMonth()]} ${d.getFullYear()}`;
}

export function shortDay(iso: string): string {
  const d = parseISO(iso);
  return `${d.getDate()} ${MONTH_ID[d.getMonth()]}`;
}

/** 7 ISO terakhir berakhir di `endISO` (untuk sparkline/matrix) */
export function last7(endISO: string): string[] {
  const out: string[] = [];
  for (let i = 6; i >= 0; i--) out.push(addDaysISO(endISO, -i));
  return out;
}
