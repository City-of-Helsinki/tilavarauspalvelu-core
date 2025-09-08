import { containsField, type FieldName } from "../modules/metaFieldsHelpers";
import {
  type ReservationMetadataFieldNode,
  ReserveeType,
  MunicipalityChoice,
  type ReservationFormFieldsFragment,
} from "../../gql/gql-types";
import { type TFunction } from "next-i18next";
import { type OptionsRecord } from "../../types/common";

const COMMON_RESERVEE_FIELDS = [
  "reserveeFirstName",
  "reserveeLastName",
  "reserveeEmail",
  "reserveePhone",
  "municipality",
] as const;

const ORGANISATION_FIELDS = [...COMMON_RESERVEE_FIELDS, "reserveeOrganisationName", "reserveeIdentifier"] as const;

// reservation fields is always shown first
// reserver is shown after it
const RESERVATION_FIELDS = {
  // reserver : Varaajan tiedot
  // also known as applicationFields in the code
  individual: COMMON_RESERVEE_FIELDS,
  nonprofit: ORGANISATION_FIELDS,
  company: ORGANISATION_FIELDS,
  // reservation : Varauksen tiedot
  // also known as generalFields in the code
  general: [
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

function convertTypeToKey(t: ReserveeType | "common"): keyof typeof RESERVATION_FIELDS {
  switch (t) {
    case ReserveeType.Company:
      return "company";
    case ReserveeType.Individual:
      return "individual";
    case ReserveeType.Nonprofit:
      return "nonprofit";
    case "common":
      return "general";
  }
}

/// new non filtered version of the Varauksen tiedot section
/// non filtered (no reservationType / supportedFields) so this is only applicable for Summaries
/// for actual forms need to use either reservationType (new) or supportedFields (old)
export function getReservationFormGeneralFields() {
  return RESERVATION_FIELDS["general"];
}

export function getReservationFormFields({
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
  return RESERVATION_FIELDS[type].filter((field) => containsField(supportedFields, field));
}

export function removeRefParam<Type>(params: Type & { ref: unknown }): Omit<Type, "ref"> {
  const { ref, ...rest } = params;
  return rest;
}

// Modify options to include static enums
// the options Record (and down stream components don't narrow types properly)
// so missing keys are not type errors but instead turn Select components -> TextFields
export function extendMetaFieldOptions(options: Omit<OptionsRecord, "municipality">, t: TFunction): OptionsRecord {
  return {
    ...options,
    municipality: Object.values(MunicipalityChoice).map((value) => ({
      label: t(`common:municipalities.${value.toUpperCase()}`),
      value: value,
    })),
  };
}

// used to inject frontend only boolean toggle into the FormFields
type ExtendedFormField = keyof ReservationFormFieldsFragment | "reserveeIsUnregisteredAssociation";

function extendReserverFields(fields: Array<keyof ReservationFormFieldsFragment>): ExtendedFormField[] {
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

export function getReservationFormReserveeFields({ reserveeType }: { reserveeType: ReserveeType }) {
  return RESERVATION_FIELDS[convertTypeToKey(reserveeType)];
}

/// Helper function to type safely pick the application fields from the reservation
/// filters based on supportedFields so it's safe to use for form construction
/// TODO clean (if possible) so that we can just chain the base and a filter
export function getFilteredReserveeFields({
  supportedFields,
  reservation,
  reserveeType,
}: {
  supportedFields: FieldName[];
  reservation: ReservationFormFieldsFragment;
  reserveeType: ReserveeType;
}): ExtendedFormField[] {
  const applicationFields = getReservationFormFields({
    supportedFields,
    reserveeType,
  });

  const baseFields = applicationFields.filter((key): key is keyof ReservationFormFieldsFragment => key in reservation);
  return extendReserverFields(baseFields);
}

/// Helper function to type safely pick the general fields from the reservation
export function getFilteredGeneralFields({
  supportedFields,
  reservation,
}: {
  supportedFields: FieldName[];
  reservation: ReservationFormFieldsFragment;
}): Array<keyof ReservationFormFieldsFragment> {
  const generalFields = getReservationFormFields({
    supportedFields,
    reserveeType: "common",
  }).filter((n) => n !== "reserveeType");

  return generalFields.filter((key): key is keyof ReservationFormFieldsFragment => key in reservation);
}
