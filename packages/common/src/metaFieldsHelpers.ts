import { camelCase } from "lodash";
import type { ReservationMetadataFieldNode } from "../gql/gql-types";

type FieldName = Pick<ReservationMetadataFieldNode, "fieldName">;
/// Transitional helper when moving from string fields
/// backend field names are in snake_case so we convert them to camelCase
/// TODO should be enums or string literals instead of arbitary strings
export function containsField(
  formFields: FieldName[],
  fieldName: string
): boolean {
  if (!formFields || formFields?.length === 0 || !fieldName) {
    return false;
  }
  const found = formFields
    .map((x) => x.fieldName)
    .map(camelCase)
    .find((x) => x === fieldName);
  if (found != null) {
    return true;
  }
  return false;
}

/// backend fields are in snake_case, containsField handles the conversion
export function containsNameField(formFields: FieldName[]): boolean {
  return (
    containsField(formFields, "reserveeFirstName") ||
    containsField(formFields, "reserveeLastName")
  );
}

export function containsBillingField(formFields: FieldName[]): boolean {
  const formFieldsNames = formFields.map((x) => x.fieldName).map(camelCase);
  return formFieldsNames.some((x) => x.startsWith("billing"));
}
