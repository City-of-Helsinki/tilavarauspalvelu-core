import { get, pick, zipObject } from "lodash";
import { ReservationUnitsReservationUnitReservationStartIntervalChoices } from "common/types/gql-types";
import type { ReservationFormType } from "./validator";
import type { RecurringReservationForm } from "../MyUnitRecurringReservation/RecurringReservationSchema";

export function flattenMetadata(
  values: ReservationFormType | RecurringReservationForm,
  metadataSetFields: string[]
) {
  const metadataSetValues = pick(values, metadataSetFields);

  const renamePkFields = ["ageGroup", "homeCity", "purpose"];

  return zipObject(
    Object.keys(metadataSetValues).map((k) =>
      renamePkFields.includes(k) ? `${k}Pk` : k
    ),
    Object.values(metadataSetValues).map((v) => get(v, "value") || v)
  );
}

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
