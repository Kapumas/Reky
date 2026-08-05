export interface CalendarEventData {
  uid: string;
  title: string;
  startTime: Date;
  endTime: Date;
  description?: string;
  location?: string;
}

function escapeICalendarText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

function formatICalendarDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function sanitizeFileName(value: string): string {
  return value.replace(/[^a-z0-9-_]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'reserva';
}

export function createICalendarContent(event: CalendarEventData): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Reky//Reservas//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${escapeICalendarText(event.uid)}`,
    `DTSTAMP:${formatICalendarDate(new Date())}`,
    `DTSTART:${formatICalendarDate(event.startTime)}`,
    `DTEND:${formatICalendarDate(event.endTime)}`,
    `SUMMARY:${escapeICalendarText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeICalendarText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeICalendarText(event.location)}`);
  }

  lines.push('END:VEVENT', 'END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

export function downloadICalendarFile(event: CalendarEventData, fileName: string): void {
  const content = createICalendarContent(event);
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = `${sanitizeFileName(fileName)}.ics`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
