import { camelCase, get, uniq } from "lodash";
import {
  CustomerTypeChoice,
  ReservationMetadataFieldNode,
} from "../../types/gql-types";
import { reservationApplicationFields } from "./types";
import { containsField } from "../helpers";

export function getReservationApplicationFields({
  supportedFields,
  reserveeType,
}: {
  supportedFields: ReservationMetadataFieldNode[];
  reserveeType: CustomerTypeChoice | "common";
}): string[] {
  if (!supportedFields || supportedFields?.length === 0 || !reserveeType) {
    return [];
  }

  // TODO this is weird, why?
  const fields = uniq<string>(
    get(reservationApplicationFields, reserveeType.toLocaleLowerCase()).filter(
      (field: string) => containsField(supportedFields, field)
    )
  );

  for (let i = 0; i < fields.length; i += 1) {
    if (fields[i].includes("billing_")) {
      fields.splice(i, 0, "show_billing_address");
      break;
    }
  }

  return fields.map(camelCase);
}

export function removeRefParam<Type>(
  params: Type & { ref: unknown }
): Omit<Type, "ref"> {
  const { ref, ...rest } = params;
  return rest;
}
