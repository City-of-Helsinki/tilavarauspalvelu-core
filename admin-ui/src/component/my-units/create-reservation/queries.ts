import { gql } from "@apollo/client";

export const RESERVATION_UNIT_QUERY = gql`
  query reservationUnits($pk: [ID]) {
    reservationUnits(onlyWithPermission: true, pk: $pk) {
      edges {
        node {
          nameFi
          maxPersons
          pk
          bufferTimeBefore
          bufferTimeAfter
          reservationStartInterval
          metadataSet {
            name
            supportedFields
            requiredFields
          }
        }
      }
    }
  }
`;

export const CREATE_STAFF_RESERVATION = gql`
  mutation createStaffReservation(
    $input: ReservationStaffCreateMutationInput!
  ) {
    createStaffReservation(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;

export const OPTIONS_QUERY = gql`
  query options {
    purposes {
      edges {
        node {
          pk
          nameFi
        }
      }
    }
    ageGroups {
      edges {
        node {
          pk
          minimum
          maximum
        }
      }
    }
    cities {
      edges {
        node {
          nameFi
          pk
        }
      }
    }
  }
`;
