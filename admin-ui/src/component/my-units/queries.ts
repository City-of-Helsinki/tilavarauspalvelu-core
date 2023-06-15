import { gql } from "@apollo/client";

export const RECURRING_RESERVATION_UNIT_QUERY = gql`
  query units($pk: [ID]) {
    units(pk: $pk) {
      edges {
        node {
          nameFi
          pk
          reservationUnits {
            pk
            nameFi
            reservationStartInterval
            bufferTimeBefore
            bufferTimeAfter
          }
        }
      }
    }
  }
`;

export const RESERVATIONS_BY_RESERVATIONUNITS = gql`
  query ReservationUnit($pk: Int, $from: Date, $to: Date) {
    reservationUnitByPk(pk: $pk) {
      pk
      reservations(from: $from, to: $to, includeWithSameComponents: true) {
        id
        user {
          firstName
          lastName
          email
        }
        name
        reserveeName
        type
        reservationUnits {
          pk
          nameFi
        }
        pk
        begin
        end
        state
      }
    }
  }
`;
