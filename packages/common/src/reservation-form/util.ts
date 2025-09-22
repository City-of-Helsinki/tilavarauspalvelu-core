import { camelCase, get, uniq } from "lodash-es";
import type { ReservationMetadataFieldNode, ReserveeType } from "../../gql/gql-types";
import { reservationApplicationFields } from "./types";
import { containsField } from "../metaFieldsHelpers";

export function getReservationApplicationFields({
  supportedFields,
  reserveeType,
}: {
  supportedFields: Array<Pick<ReservationMetadataFieldNode, "fieldName">>;
  reserveeType: ReserveeType | "common";
}): string[] {
  if (!supportedFields || supportedFields?.length === 0) {
    return [];
  }

  // TODO not good, refactor (remove get especially)
  const fields = uniq<string>(
    // TODO don't use get or string comparison, use a switch statement
    get(reservationApplicationFields, reserveeType.toLocaleLowerCase()).filter((field: string) =>
      containsField(supportedFields, camelCase(field))
    )
  );

  return fields.map(camelCase);
}

export function removeRefParam<Type>(params: Type & { ref: unknown }): Omit<Type, "ref"> {
  const { ref, ...rest } = params;
  return rest;
}
