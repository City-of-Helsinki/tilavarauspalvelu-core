import { gql } from "@apollo/client";

export const CREATE_RESERVATION = gql`
  mutation createReservation($input: ReservationCreateMutationInput!) {
    createReservation(input: $input) {
      pk
      errors {
        field
        messages
      }
    }
  }
`;

export const UPDATE_RESERVATION = gql`
  mutation updateReservation($input: ReservationUpdateMutationInput!) {
    updateReservation(input: $input) {
      reservation {
        pk
        calendarUrl
        state
        user
      }
      errors {
        field
        messages
      }
    }
  }
`;

export const CANCEL_RESERVATION = gql`
  mutation cancelReservation($input: ReservationCancellationMutationInput!) {
    cancelReservation(input: $input) {
      pk
      cancelReasonPk
      cancelDetails
      state
      clientMutationId
      errors {
        field
        messages
      }
    }
  }
`;

export const CONFIRM_RESERVATION = gql`
  mutation confirmReservation($input: ReservationConfirmMutationInput!) {
    confirmReservation(input: $input) {
      pk
      state
      errors {
        field
        messages
      }
    }
  }
`;

export const LIST_RESERVATIONS = gql`
  query listReservations(
    $before: String
    $after: String
    $first: Int
    $last: Int
    $begin: DateTime
    $end: DateTime
  ) {
    reservations(
      before: $before
      after: $after
      first: $first
      last: $last
      begin: $begin
      end: $end
    ) {
      edges {
        node {
          pk
          name
          begin
          end
          state
          reservationUnits {
            pk
            nameFi
            nameEn
            nameSv
            unit {
              nameFi
              nameEn
              nameSv
            }
            cancellationRule {
              canBeCancelledTimeBefore
              needsHandling
            }
            location {
              addressStreetFi
              addressStreetEn
              addressStreetSv
            }
            images {
              imageType
              imageUrl
              mediumUrl
            }
          }
        }
      }
    }
  }
`;

export const GET_RESERVATION = gql`
  query reservationByPk($pk: Int!) {
    reservationByPk(pk: $pk) {
      pk
      name
      description
      reserveeFirstName
      reserveeLastName
      reserveePhone
      begin
      end
      calendarUrl
      user
      state
      reservationUnits {
        pk
        nameFi
        nameEn
        nameSv
        termsOfUseFi
        termsOfUseEn
        termsOfUseSv
        serviceSpecificTerms {
          textFi
          textEn
          textSv
        }
        unit {
          nameFi
          nameEn
          nameSv
        }
        cancellationRule {
          canBeCancelledTimeBefore
          needsHandling
        }
        location {
          addressStreetFi
          addressStreetEn
          addressStreetSv
        }
        spaces {
          pk
          nameFi
          nameEn
          nameSv
        }
      }
    }
  }
`;

export const GET_RESERVATION_CANCEL_REASONS = gql`
  query getReservationCancelReasons {
    reservationCancelReasons {
      edges {
        node {
          pk
          reasonFi
          reasonEn
          reasonSv
        }
      }
    }
  }
`;
