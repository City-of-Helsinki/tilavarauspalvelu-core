import { gql } from "@apollo/client";
import { ReservationFormType } from "../../gql/gql-types";

export function ReservationForm(type: ReservationFormType): React.ReactElement {
  switch (type) {
    // this is always
    case ReservationFormType.ContactInfoForm:
    case ReservationFormType.ReserveeInfoForm:
    case ReservationFormType.PurposeForm:
    case ReservationFormType.AgeGroupForm:
    case ReservationFormType.AgeGroupSubventionForm:
    case ReservationFormType.PurposeSubventionForm:
      return <ReservationFormImpl />;
  }
}

function ReservationFormImpl(): React.ReactElement {
  return <>TODO</>;
}

export const RESERVATION_META_FIELDS_FRAGMENT = gql`
  fragment ReservationFormFields on ReservationNode {
    id
    reserveeFirstName
    reserveeLastName
    reserveeEmail
    reserveePhone
    reserveeType
    reserveeOrganisationName
    reserveeIdentifier
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
    numPersons
    name
    description
    freeOfChargeReason
    applyingForFreeOfCharge
    reservationUnit {
      reservationForm
    }
  }
`;
