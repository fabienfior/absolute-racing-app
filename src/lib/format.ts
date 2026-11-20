import { locale, t } from '@/i18n';

const dm: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

export function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return `${s.toLocaleDateString(locale(), dm)} – ${e.toLocaleDateString(locale(), { ...dm, year: 'numeric' })}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(locale(), { ...dm, year: 'numeric' });
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString(locale(), { weekday: 'long', ...dm });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(locale(), { hour: '2-digit', minute: '2-digit', hour12: false });
}

export function isSameDay(iso: string, d = new Date()) {
  const x = new Date(iso);
  return x.getFullYear() === d.getFullYear() && x.getMonth() === d.getMonth() && x.getDate() === d.getDate();
}

/** "2d 4h", "3h 12m", "12m 05s" */
export function formatCountdown(ms: number) {
  if (ms <= 0) return t('today.now');
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}m`;
  return `${m}m ${String(s % 60).padStart(2, '0')}s`;
}

export function timeAgo(iso: string) {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return t('time.justNow');
  if (mins < 60) return t('time.minAgo', { n: mins });
  const h = Math.round(mins / 60);
  if (h < 24) return t('time.hourAgo', { n: h });
  return formatDate(iso);
}
