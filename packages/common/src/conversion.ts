import {
  ReservationStartInterval,
  ReservationTypeChoice,
  Weekday,
} from "../gql/gql-types";

export type Day = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export function transformWeekday(d: Day): Weekday {
  switch (d) {
    case 0:
      return Weekday.Monday;
    case 1:
      return Weekday.Tuesday;
    case 2:
      return Weekday.Wednesday;
    case 3:
      return Weekday.Thursday;
    case 4:
      return Weekday.Friday;
    case 5:
      return Weekday.Saturday;
    case 6:
      return Weekday.Sunday;
  }
}

export function convertWeekday(d: Weekday): Day {
  switch (d) {
    case Weekday.Monday:
      return 0;
    case Weekday.Tuesday:
      return 1;
    case Weekday.Wednesday:
      return 2;
    case Weekday.Thursday:
      return 3;
    case Weekday.Friday:
      return 4;
    case Weekday.Saturday:
      return 5;
    case Weekday.Sunday:
      return 6;
  }
}

export function transformReservationTypeSafe(
  d: string
): ReservationTypeChoice | null {
  switch (d) {
    case ReservationTypeChoice.Staff:
      return ReservationTypeChoice.Staff;
    case ReservationTypeChoice.Behalf:
      return ReservationTypeChoice.Behalf;
    case ReservationTypeChoice.Blocked:
      return ReservationTypeChoice.Blocked;
    case ReservationTypeChoice.Normal:
      return ReservationTypeChoice.Normal;
    case ReservationTypeChoice.Seasonal:
      return ReservationTypeChoice.Seasonal;
    default:
      return null;
  }
}

export function convertReservationType(type: string): ReservationTypeChoice {
  const t = transformReservationTypeSafe(type);
  if (t == null) {
    throw new Error(`Unknown reservation type: ${type}`);
  }
  return t;
}

export function getIntervalMinutes(
  reservationStartInterval: ReservationStartInterval
): number {
  switch (reservationStartInterval) {
    case ReservationStartInterval.Interval_15Mins:
      return 15;
    case ReservationStartInterval.Interval_30Mins:
      return 30;
    case ReservationStartInterval.Interval_60Mins:
      return 60;
    case ReservationStartInterval.Interval_90Mins:
      return 90;
    case ReservationStartInterval.Interval_120Mins:
      return 120;
    case ReservationStartInterval.Interval_180Mins:
      return 180;
    case ReservationStartInterval.Interval_240Mins:
      return 240;
    case ReservationStartInterval.Interval_300Mins:
      return 300;
    case ReservationStartInterval.Interval_360Mins:
      return 360;
    case ReservationStartInterval.Interval_420Mins:
      return 420;
  }
}
