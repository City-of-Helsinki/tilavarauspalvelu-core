import { ReservationStartInterval } from "common/types/gql-types";

export function intervalToNumber(i: ReservationStartInterval) {
  switch (i) {
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
    default:
      throw new Error(`Unknown interval: ${i}`);
  }
}
