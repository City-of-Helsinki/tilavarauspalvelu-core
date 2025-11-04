import type { FieldError } from "react-hook-form";
import { type TFunction } from "next-i18next";
import { ReserveeType, type ReservationFormFieldsFragment, ReservationFormType } from "../../gql/gql-types";
import { filterEmpty } from "../modules/helpers";
import { getReservationSchemaBase, type ReservationFormValueT } from "../schemas";

/* NOTE: backend returns validation errors if text fields are too long
 * remove maxlength after adding proper schema validation
 */
export const RESERVATION_FIELD_MAX_TEXT_LENGTH = 255;

/// These match the keys of both GraphQL fragment and the form schema
const COMMON_RESERVEE_FIELDS = [
  "reserveeType",
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
  individual: COMMON_RESERVEE_FIELDS,
  nonprofit: ORGANISATION_FIELDS,
  company: ORGANISATION_FIELDS,
  // reservation : Varauksen tiedot (aka generalFields)
  general: ["name", "purpose", "numPersons", "ageGroup", "description"] as const,
} as const;

function convertTypeToKey(t: ReserveeType | "general"): keyof typeof RESERVATION_FIELDS {
  switch (t) {
    case ReserveeType.Company:
      return "company";
    case ReserveeType.Individual:
      return "individual";
    case ReserveeType.Nonprofit:
      return "nonprofit";
    case "general":
      return "general";
  }
}

/// non filtered version of the Varauksen tiedot section
/// this is only applicable for Summaries / Errors
/// for rendering forms use a the filtered variation
/// this adds optional free of charge that is not included in the form enums (but directly controlled with reservation unit toggle).
export function getExtendedGeneralFormFields() {
  return [...RESERVATION_FIELDS["general"], "applyingForFreeOfCharge", "freeOfChargeReason"] as const;
}

export function getReservationFormFields({
  formType,
  reserveeType = ReserveeType.Individual,
}: Readonly<{
  formType: ReservationFormType;
  reserveeType: ReserveeType | undefined;
}>): FormFieldArray {
  const type = convertTypeToKey(reserveeType);
  return RESERVATION_FIELDS[type].filter((field) => formContainsField(formType, field));
}

// TODO rename these fields they are the ReservationNode fields that store form input data
// not form fields (they map to backend / query types, not frontend form)
export type FormField = keyof Omit<ReservationFormFieldsFragment, "id" | "reservationUnit">;
export type FormFieldArray = ReadonlyArray<FormField>;

export function getReservationFormReserveeFields({ reserveeType }: { reserveeType: ReserveeType | null }) {
  const baseFields = RESERVATION_FIELDS[convertTypeToKey(reserveeType ?? ReserveeType.Individual)];
  return baseFields.filter((n) => n !== "reserveeType");
}

/// Helper function to type safely pick the general fields from the reservation
export function getFilteredGeneralFields(formType: ReservationFormType): FormFieldArray {
  return RESERVATION_FIELDS["general"].filter((field) => formContainsField(formType, field));
}

/// Get stored reservation fields (graphql) based on form type.
function getFormFields(type: ReservationFormType): FormFieldArray {
  const schema = getReservationSchemaBase(type)({ minPersons: 1, maxPersons: Infinity });
  const keys = schema.keyof().options;
  // @ts-expect-error -- keyof returns incorrect type (picking the first option from discriminating union)
  return keys.filter((x) => x !== ("reserveeIsUnregisteredAssociation" as const)) satisfies FormFieldArray;
}

export function formContainsField(type: ReservationFormType, fieldName: keyof ReservationFormFieldsFragment): boolean {
  const fields = getFormFields(type);
  return fields.find((k) => k === fieldName) != null;
}

// TODO refactor so the fieldLabel is not already translated
export function translateReserveeFormError(
  t: TFunction,
  fieldLabel: string,
  error: FieldError | undefined,
  params: {
    minValue?: number | null;
    maxValue?: number | null;
  } = {}
): string | undefined {
  if (error == null) {
    return undefined;
  }

  const { maxValue, minValue } = params;
  // custom error message can be set, but not type / code
  if (error.message === "Required" || error.type === "invalid_type") {
    return t("forms:Required", { fieldName: t(fieldLabel) });
  } else if (error.message === "invalidEmail") {
    return t("forms:invalidEmail");
  } else if (error.message === "Too large") {
    if (maxValue != null) {
      return t("forms:maxNumPersons", { maxValue });
    }
    return t("forms:tooLarge", { fieldName: t(fieldLabel) });
  } else if (error.message === "Too small") {
    if (minValue != null) {
      return t("forms:minNumPersons", { minValue });
    }
    return t("forms:tooSmall", { fieldName: t(fieldLabel) });
  }

  return filterEmpty(error.message) ?? undefined;
}

export function constructReservationFieldId(field: keyof ReservationFormValueT) {
  return `reservation-form-field__${field}`;
}

export type ExtendedReserveeType = ReserveeType | "COMMON";

export function constructReservationFieldLabel(
  t: TFunction,
  type: ExtendedReserveeType | undefined,
  field: keyof ReservationFormValueT
): string {
  const trKey = type?.toLocaleLowerCase() || "individual";
  return t(`reservationApplication:label.${trKey}.${field}`);
}
