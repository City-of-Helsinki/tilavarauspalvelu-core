export type CalendarBufferEvent = {
  state: "BUFFER";
};

export type CalendarEventBuffer = {
  start: Date;
  end: Date;
  event: CalendarBufferEvent;
};

export type DAY = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ApplicationEventSchedulePriority = number;

// @deprecated required by ui/reservation
export type PendingReservation = {
  begin: string;
  end: string;
  pk?: number;
  price?: string;
  reservationUnitPk?: number | null;
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
  state?: string;
};

// for ui:

export type OptionType = {
  label: string;
  value?: number | string;
};

export interface HMS {
  h: number;
  m: number;
  s: number;
}
