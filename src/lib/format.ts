const opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };

export function formatDateRange(start: string, end: string) {
  const s = new Date(start + 'T00:00:00');
  const e = new Date(end + 'T00:00:00');
  return `${s.toLocaleDateString(undefined, opts)} – ${e.toLocaleDateString(undefined, { ...opts, year: 'numeric' })}`;
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { ...opts, year: 'numeric' });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
}
