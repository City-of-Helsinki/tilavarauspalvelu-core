const pad = (value: number) => value.toString().padStart(2, "0");

/** 24 hour clock text from minutes since midnight, e.g. 540 -> "09:00". The end of the day reads as 24:00. */
export function formatClock(minutes: number): string {
  return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;
}

/** A clock time range joined with an en dash, e.g. "09:00–10:30". */
export function formatClockRange(beginMinutes: number, endMinutes: number): string {
  return `${formatClock(beginMinutes)}–${formatClock(endMinutes)}`;
}
