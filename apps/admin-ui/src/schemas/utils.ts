import { ReservationStartInterval } from "common/types/gql-types";

export const intervalToNumber = (i: ReservationStartInterval) => {
  switch (i) {
    case ReservationStartInterval.Interval_15Mins:
      return 15;
    case ReservationStartInterval.Interval_30Mins:
      return 30;
    case ReservationStartInterval.Interval_60Mins:
      return 60;
    case ReservationStartInterval.Interval_90Mins:
      return 90;
    default:
      return 0;
  }
};
