import { gql } from "@apollo/client";

// NOTE this is for allocation only (it includes the application name)
// for regular application queries we don't need to query the name through the application relation
export const APPLICATION_SECTION_ADMIN_FRAGMENT = gql`
  fragment ApplicationSection on ApplicationSectionNode {
    ...ApplicationSectionCommon
    purpose {
      id
      pk
      nameFi
    }
    application {
      id
      pk
      status
      ...ApplicationName
    }
    reservationUnitOptions {
      id
      reservationUnit {
        id
        pk
        nameFi
        unit {
          id
          pk
          nameFi
        }
      }
    }
  }
`;

export const RESERVATION_COMMON_FRAGMENT = gql`
  fragment ReservationCommon on ReservationNode {
    id
    pk
    begin
    end
    createdAt
    state
    type
    isBlocked
    workingMemo
    reserveeName
    paymentOrder {
      id
      status
    }
    user {
      id
      email
      firstName
      lastName
    }
    bufferTimeBefore
    bufferTimeAfter
  }
`;

// TODO ReservationCommon has extra fields: [order, createdAt]
// TODO do we still need the user here?
// TODO what is the reservation name vs. reserveeName?
export const RESERVATIONUNIT_RESERVATIONS_FRAGMENT = gql`
  ${RESERVATION_COMMON_FRAGMENT}
  fragment ReservationUnitReservations on ReservationNode {
    ...ReservationCommon
    ...VisibleIfPermissionFields
    name
    numPersons
    calendarUrl
    reservationUnits {
      id
      pk
      nameFi
      bufferTimeBefore
      bufferTimeAfter
      unit {
        id
        pk
      }
    }
    affectedReservationUnits
  }
`;

export const RESERVATION_UNIT_FRAGMENT = gql`
  fragment ReservationUnitFields on ReservationUnitNode {
    id
    pk
    nameFi
    maxPersons
    bufferTimeBefore
    bufferTimeAfter
    reservationStartInterval
    authentication
    unit {
      id
      pk
      nameFi
    }
    ...ReservationTypeFormFields
    termsOfUseFi
  }
`;
