import type { CSSProperties } from "react";

export type CalendarEvent<T> = {
  title?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
  event?: T;
};

export type CalendarBufferEvent = {
  state: "BUFFER" | "CLOSED";
};

export type CalendarEventBuffer = {
  start: Date;
  end: Date;
  event: CalendarBufferEvent;
};

export type SlotProps = {
  className?: string;
  style?: CSSProperties;
};
