import { ReserveeType, type ReservationMetaFieldsFragment, ReservationNode } from "../../gql/gql-types";
import { type FieldName } from "../modules/metaFieldsHelpers";
import { getReservationApplicationFields } from "../reservation-form/util";

function extendApplicationFields(
  fields: Array<keyof ReservationNode>
): Array<keyof ReservationNode | "reserveeIsUnregisteredAssociation"> {
  const key = "reserveeIdentifier" as const;
  const identifierIndex = fields.findIndex((k) => k === key);
  if (identifierIndex > 0) {
    const afterIdentifier = identifierIndex + 1;
    const shouldInsertMiddle = afterIdentifier < fields.length;
    if (shouldInsertMiddle) {
      return [
        ...fields.slice(0, afterIdentifier),
        "reserveeIsUnregisteredAssociation",
        ...fields.slice(afterIdentifier),
      ];
    }
    return [...fields, "reserveeIsUnregisteredAssociation"];
  }
  return fields;
}

/// Helper function to type safely pick the application fields from the reservation
// TODO move to common (and reuse in the hooks)
export function getApplicationFields({
  supportedFields,
  reservation,
  reserveeType,
}: {
  supportedFields: FieldName[];
  reservation: ReservationMetaFieldsFragment;
  reserveeType: ReserveeType;
}) {
  const applicationFields = getReservationApplicationFields({
    supportedFields,
    reserveeType,
  });

  const baseFields = applicationFields.filter((key): key is keyof ReservationNode => key in reservation);
  return extendApplicationFields(baseFields);
}

/// Helper function to type safely pick the general fields from the reservation
// TODO move to common (and reuse in the hooks)
export function getGeneralFields({
  supportedFields,
  reservation,
}: {
  supportedFields: FieldName[];
  reservation: ReservationMetaFieldsFragment;
}) {
  const generalFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: "common",
  }).filter((n) => n !== "reserveeType");

  return generalFields.filter((key): key is keyof ReservationNode => key in reservation);
}
