import { get, pick, zipObject } from "lodash";
import {
  type ReservationFormType,
  type RecurringReservationForm,
  type ReservationChangeFormType,
} from "app/schemas";
import { type ReservationMetadataFieldNode } from "common/types/gql-types";

export function flattenMetadata(
  values:
    | ReservationFormType
    | RecurringReservationForm
    | ReservationChangeFormType,
  metadataSetFields: ReservationMetadataFieldNode[]
) {
  // TODO don't use pick
  const metadataSetValues = pick(
    values,
    metadataSetFields.map((f) => f.fieldName)
  );

  const renamePkFields = ["ageGroup", "homeCity", "purpose"];

  return zipObject(
    Object.keys(metadataSetValues).map((k) =>
      renamePkFields.includes(k) ? `${k}Pk` : k
    ),
    Object.values(metadataSetValues).map((v) => get(v, "value") || v)
  );
}
