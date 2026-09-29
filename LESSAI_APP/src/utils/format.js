/** Utilidades de presentacion. Sin logica de negocio. */

export function formatConfidence(value) {
  if (typeof value !== 'number' || Number.isNaN(value)) return '--';
  return `${Math.round(value * 100)}%`;
}

export function formatClock(timestamp) {
  const d = new Date(timestamp);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function formatRelativeDay(timestamp) {
  const now = new Date();
  const d = new Date(timestamp);
  const sameDay = now.toDateString() === d.toDateString();
  if (sameDay) return 'Hoy';
  const yesterday = new Date(now.getTime() - 86400000);
  if (yesterday.toDateString() === d.toDateString()) return 'Ayer';
  return d.toLocaleDateString('es-SV', { day: '2-digit', month: 'short' });
}

/** "COMO ESTAS" -> "Como estas" para mostrar en burbujas de conversacion. */
export function humanizeLabel(label) {
  if (!label) return '';
  const lower = label.replace(/_/g, ' ').toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export default { formatConfidence, formatClock, formatRelativeDay, humanizeLabel, clamp };
