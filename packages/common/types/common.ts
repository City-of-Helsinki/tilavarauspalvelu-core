import type { ReservationUnitByPkType, ReservationUnitType } from "./gql-types";

// backend / generation problem: there is separate types for list and singular queries
// these types have 100% overlap but are not compatible
export type ReservationUnitNode = ReservationUnitByPkType | ReservationUnitType;
export type CalendarBufferEvent = {
  state: "BUFFER";
};

export type CalendarEventBuffer = {
  start: Date;
  end: Date;
  event: CalendarBufferEvent;
};

export type SlotProps = {
  className?: string;
  style?: React.CSSProperties;
};

// @deprecated used by applications page for grouping
export type ReducedApplicationStatus = "draft" | "processing" | "sent";

export type DAY = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type ApplicationEventSchedulePriority = number;

// @deprecated required by ui/reservation
export type PendingReservation = {
  begin: string;
  end: string;
  pk?: number;
  price?: string;
  reservationUnitPk?: number | null;
  bufferTimeBefore?: string;
  bufferTimeAfter?: string;
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
