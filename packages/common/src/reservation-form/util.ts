import {
  type ReservationMetadataFieldNode,
  ReserveeType,
  MunicipalityChoice,
  type ReservationFormFieldsFragment,
  type ReservationNode,
} from "../../gql/gql-types";
import { containsField } from "../metaFieldsHelpers";
import { type TFunction } from "next-i18next";
import { type OptionsRecord } from "../../types/common";
import { type FieldName } from "../metaFieldsHelpers";

const fieldsCommon = [
  "reserveeFirstName",
  "reserveeLastName",
  "reserveeAddressStreet",
  "reserveeAddressZip",
  "reserveeAddressCity",
  "reserveeEmail",
  "reserveePhone",
  "municipality",
  "billingFirstName",
  "billingLastName",
  "billingPhone",
  "billingEmail",
  "billingAddressStreet",
  "billingAddressZip",
  "billingAddressCity",
] as const;

const reservationApplicationFields = {
  individual: fieldsCommon,
  nonprofit: ["reserveeOrganisationName", "municipality", "reserveeIdentifier", ...fieldsCommon],
  company: ["reserveeOrganisationName", "municipality", "reserveeIdentifier", ...fieldsCommon],
  common: [
    "reserveeType",
    "name",
    "purpose",
    "numPersons",
    "ageGroup",
    "description",
    "applyingForFreeOfCharge",
    "freeOfChargeReason",
  ] as const,
} as const;

function convertTypeToKey(t: ReserveeType | "common"): keyof typeof reservationApplicationFields {
  switch (t) {
    case ReserveeType.Company:
      return "company";
    case ReserveeType.Individual:
      return "individual";
    case ReserveeType.Nonprofit:
      return "nonprofit";
    case "common":
      return "common";
  }
}

export function getReservationApplicationFields({
  supportedFields,
  reserveeType,
}: {
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[];
  reserveeType: ReserveeType | "common";
}): string[] {
  if (supportedFields.length === 0) {
    return [];
  }
  const type = convertTypeToKey(reserveeType);

  const fields = reservationApplicationFields[type].filter((field) => containsField(supportedFields, field));

  return fields;
}

export function removeRefParam<Type>(params: Type & { ref: unknown }): Omit<Type, "ref"> {
  const { ref, ...rest } = params;
  return rest;
}

// Modify options to include static enums
// the options Record (and down stream components don't narrow types properly)
// so missing keys are not type errors but instead turn Select components -> TextFields
export function extendMetaFieldOptions(options: Omit<OptionsRecord, "municipalities">, t: TFunction): OptionsRecord {
  return {
    ...options,
    municipalities: Object.values(MunicipalityChoice).map((value) => ({
      label: t(`common:municipalities.${value.toUpperCase()}`),
      value: value,
    })),
  };
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
export function getApplicationFields({
  supportedFields,
  reservation,
  reserveeType,
}: {
  supportedFields: FieldName[];
  reservation: ReservationFormFieldsFragment;
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
export function getGeneralFields({
  supportedFields,
  reservation,
}: {
  supportedFields: FieldName[];
  reservation: ReservationFormFieldsFragment;
}) {
  const generalFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: "common",
  }).filter((n) => n !== "reserveeType");

  return generalFields.filter((key): key is keyof ReservationNode => key in reservation);
}
