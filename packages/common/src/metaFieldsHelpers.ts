import { type ReservationFormFieldsFragment, ReservationFormType } from "../gql/gql-types";

export function getFormFields(type: ReservationFormType): ReadonlyArray<keyof ReservationFormFieldsFragment> {
  const base = ["reserveeFirstName", "reserveeLastName", "reserveeEmail", "reserveePhone"] as const;
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

  /* free of charge is moved to reservationUnit toggle only */

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
