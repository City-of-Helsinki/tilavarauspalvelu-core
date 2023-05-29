import { gql } from "@apollo/client";

export const RESERVATIONS_BY_RESERVATIONUNIT = gql`
  query reservationsByReservationUnit(
    $reservationUnit: [ID]
    $offset: Int
    $first: Int
    $begin: DateTime
    $end: DateTime
  ) {
    reservations(
      begin: $begin
      end: $end
      first: $first
      offset: $offset
      reservationUnit: $reservationUnit
      state: ["DENIED", "CONFIRMED", "REQUIRES_HANDLING", "WAITING_FOR_PAYMENT"]
    ) {
      edges {
        node {
          user {
            email
          }
          name
          reserveeFirstName
          reserveeLastName
          reserveeOrganisationName
          pk
          begin
          end
          state
          type
          recurringReservation {
            pk
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const RECURRING_RESERVATION_QUERY = gql`
  query recurringReservation(
    $pk: ID!
    $offset: Int
    $count: Int
    $state: [String]
  ) {
    reservations(
      offset: $offset
      recurringReservation: $pk
      state: $state
      first: $count
      orderBy: "begin"
    ) {
      edges {
        node {
          pk
          begin
          end
          state
          recurringReservation {
            pk
          }
        }
      }
      totalCount
    }
  }
`;
