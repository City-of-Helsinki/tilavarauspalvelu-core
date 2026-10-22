const pad = (value: number) => value.toString().padStart(2, "0");

export const formatClock = (minutes: number) => `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`;

export const formatRange = (beginMinutes: number, endMinutes: number) =>
  `${formatClock(beginMinutes)}–${formatClock(endMinutes)}`;
