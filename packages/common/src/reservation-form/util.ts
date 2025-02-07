import { camelCase, get, uniq } from "lodash";
import {
  CustomerTypeChoice,
  type ReservationMetadataFieldNode,
} from "../../gql/gql-types";
import { reservationApplicationFields } from "./types";
import { containsField } from "../metaFieldsHelpers";

export function getReservationApplicationFields({
  supportedFields,
  reserveeType,
}: {
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
  reserveeType: CustomerTypeChoice | "common";
}): string[] {
  if (!supportedFields || supportedFields?.length === 0) {
    return [];
  }

  // TODO not good, refactor (remove get especially)
  const fields = uniq<string>(
    // TODO don't use get or string comparison, use a switch statement
    get(reservationApplicationFields, reserveeType.toLocaleLowerCase()).filter(
      (field: string) => containsField(supportedFields, camelCase(field))
    )
  );

  // DON'T remove this (unless refactoring the whole metafields form)
  // hack to add a form field (admin doesn't need this because the form is done correctly).
  // proper place would be to be either in the MetaFields or in the form creation (useForm).
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
