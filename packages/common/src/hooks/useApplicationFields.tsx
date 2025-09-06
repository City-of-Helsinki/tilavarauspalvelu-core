import { useMemo } from "react";
import {
  type MetadataSetsFragment,
  ReserveeType,
  type ReservationMetaFieldsFragment,
  ReservationNode,
} from "../../gql/gql-types";
import { filterNonNullable } from "../helpers";
import { containsField, FieldName } from "../metaFieldsHelpers";
import { getReservationApplicationFields } from "../reservation-form/util";
import { gql } from "@apollo/client";

// TODO is the hook necessary?
export function useApplicationFields(reservationUnit: MetadataSetsFragment, reserveeType?: ReserveeType) {
  return useMemo(() => {
    const fields = filterNonNullable(reservationUnit.metadataSet?.supportedFields);

    const type = reserveeType != null && containsField(fields, "reserveeType") ? reserveeType : ReserveeType.Individual;

    const baseFields = getReservationApplicationFields({ supportedFields: fields, reserveeType: type });
    return extendApplicationFields(baseFields as Array<keyof ReservationNode>);
  }, [reservationUnit.metadataSet?.supportedFields, reserveeType]);
}

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

export const RESERVATION_META_FRAGMENT = gql`
  fragment ReservationMetaFields on ReservationNode {
    ...ReserveeBillingFields
    municipality
    name
    description
    applyingForFreeOfCharge
    freeOfChargeReason
    description
    numPersons
    ageGroup {
      id
      pk
      maximum
      minimum
    }
    purpose {
      id
      pk
      nameFi
      nameEn
      nameSv
    }
    municipality
  }
`;
