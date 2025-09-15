import {
  ReserveeType,
  MunicipalityChoice,
  type ReservationFormFieldsFragment,
  ReservationFormType,
} from "../../gql/gql-types";
import { type TFunction } from "next-i18next";
import { type OptionsRecord } from "../../types/common";
import { ReservationFormValueT } from "../schemas";
import { FieldError } from "react-hook-form";
import { filterEmpty } from "../modules/helpers";

/* NOTE: backend returns validation errors if text fields are too long
 * remove maxlength after adding proper schema validation
 */
export const RESERVATION_FIELD_MAX_TEXT_LENGTH = 255;

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
}>): FormFieldArray {
  const fields = getReservationFormFields({
    formType,
    reserveeType,
  });

  const baseFields = fields.filter((key): key is FormField => key in reservation);
  return baseFields;
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

// TODO refactor so the fieldLabel is not already translated
export function translateReserveeFormError(
  t: TFunction,
  fieldLabel: string,
  error: FieldError | undefined
): string | undefined {
  if (error == null) {
    return undefined;
  }

  // custom error message can be set, but not type
  if (error.message === "Required" || error.type === "invalid_type") {
    return t("forms:Required", { fieldName: fieldLabel });
  } else if (error.message === "Invalid email") {
    return t("forms:invalidEmail");
  }

  /* TODO do we need this still? and how we manipulate it
  switch (error.type) {
    case "min":
      if (field === "numPersons") return t("forms:minNumPersons", { minValue });
      break;
    case "max":
      if (field === "numPersons") return t("forms:maxNumPersons", { maxValue });
      break;
  }
  */

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
  const label = t(`reservationApplication:label.${trKey}.${field}`);
  return label;
}
