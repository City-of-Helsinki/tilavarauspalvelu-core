import { ReservationUnitsReservationUnitReservationStartIntervalChoices } from "common/types/gql-types";

export const intervalToNumber = (
  i: ReservationUnitsReservationUnitReservationStartIntervalChoices
) => {
  switch (i) {
    case ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins:
      return 15;
    case ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_30Mins:
      return 30;
    case ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_60Mins:
      return 60;
    case ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_90Mins:
      return 90;
    default:
      return 0;
  }
};
