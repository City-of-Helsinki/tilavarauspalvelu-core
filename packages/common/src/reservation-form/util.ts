import {
  ReserveeType,
  MunicipalityChoice,
  type ReservationFormFieldsFragment,
  ReservationFormType,
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
  formType,
  reserveeType,
}: Readonly<{
  formType: ReservationFormType;
  reserveeType: ReserveeType | "common";
}>): FormFieldArray {
  const type = convertTypeToKey(reserveeType);
  return RESERVATION_FIELDS[type].filter((field) => formContainsField(formType, field));
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
export type FormField = keyof Omit<ReservationFormFieldsFragment, "id" | "reservationUnit">;
export type FormFieldArray = ReadonlyArray<FormField>;
export type ExtendedFormField = FormField | "reserveeIsUnregisteredAssociation";
export type ExtendedFormFieldArray = ReadonlyArray<ExtendedFormField>;

function extendReserverFields(fields: FormFieldArray): ExtendedFormField[] {
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
  return [...fields];
}

export function getReservationFormReserveeFields({ reserveeType }: { reserveeType: ReserveeType }) {
  return RESERVATION_FIELDS[convertTypeToKey(reserveeType)];
}

/// Helper function to type safely pick the application fields from the reservation
/// filters based on supportedFields so it's safe to use for form construction
/// TODO clean (if possible) so that we can just chain the base and a filter
export function getFilteredReserveeFields({
  formType,
  reservation,
  reserveeType,
}: Readonly<{
  formType: ReservationFormType;
  reservation: ReservationFormFieldsFragment;
  reserveeType: ReserveeType;
}>): ExtendedFormFieldArray {
  const fields = getReservationFormFields({
    formType,
    reserveeType,
  });

  const baseFields = fields.filter((key): key is FormField => key in reservation);
  return extendReserverFields(baseFields);
}

/// Helper function to type safely pick the general fields from the reservation
export function getFilteredGeneralFields(formType: ReservationFormType): FormFieldArray {
  const generalFields = getReservationFormFields({
    formType,
    reserveeType: "common",
  }).filter((n) => n !== "reserveeType");

  return generalFields;
}

export function getFormFields(type: ReservationFormType): ReadonlyArray<keyof ReservationFormFieldsFragment> {
  const base = ["reserveeFirstName", "reserveeLastName", "reserveeEmail", "reserveePhone"] as const;
  // TODO order matters or no but we are getting the fields in wrong order in the Form
  const info = [
    ...base,
    "numPersons", // optional (but required in purposeForm?)
    "description",
    "reserveeType",
    "reserveeOrganisationName",
    "reserveeIdentifier",
  ] as const;

  const purposeForm = [
    ...info,
    "name", // name is optional currently
    "municipality",
    "purpose",
  ] as const;

  // subbention (free of charge) is moved to reservationUnit toggle only
  switch (type) {
    /** Contact information only */
    case ReservationFormType.ContactInfoForm:
      return base;
    /** Contact information and event description */
    case ReservationFormType.ReserveeInfoForm:
      return info;
    /** Purpose of use : Lomake 3 */
    case ReservationFormType.PurposeForm:
    case ReservationFormType.PurposeSubventionForm:
      return purposeForm;
    /** Age group : Lomake 4 */
    case ReservationFormType.AgeGroupForm:
    case ReservationFormType.AgeGroupSubventionForm:
      return [...purposeForm, "ageGroup"] as const;
  }
}

export function formContainsField(type: ReservationFormType, fieldName: keyof ReservationFormFieldsFragment): boolean {
  const fields = getFormFields(type);
  return fields.find((k) => k === fieldName) != null;
}
