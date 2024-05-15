import { camelCase, get, pick, zipObject } from "lodash";
import {
  type ReservationFormType,
  type RecurringReservationForm,
  type ReservationChangeFormType,
} from "@/schemas";
import { type ReservationMetadataFieldNode } from "@gql/gql-types";

export function flattenMetadata(
  values:
    | ReservationFormType
    | RecurringReservationForm
    | ReservationChangeFormType,
  metadataSetFields: ReservationMetadataFieldNode[]
) {
  const fieldNames = metadataSetFields.map((f) => f.fieldName).map(camelCase);
  // TODO don't use pick
  const metadataSetValues = pick(values, fieldNames);

  const renamePkFields = ["ageGroup", "homeCity", "purpose"];

  return zipObject(
    Object.keys(metadataSetValues).map((k) =>
      renamePkFields.includes(k) ? `${k}Pk` : k
    ),
    Object.values(metadataSetValues).map((v) => get(v, "value") || v)
  );
}
