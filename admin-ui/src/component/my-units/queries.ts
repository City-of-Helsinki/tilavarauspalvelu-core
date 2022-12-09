import { gql } from "@apollo/client";

export const UNIT_QUERY = gql`
  query units($pk: [ID]) {
    units(pk: $pk) {
      edges {
        node {
          location {
            addressStreetFi
            addressZip
            addressCityFi
          }
          nameFi
          pk
          serviceSectors {
            nameFi
          }
          reservationUnits {
            pk
            spaces {
              pk
            }
          }
        }
      }
    }
  }
`;

export const RESERVATIONS_BY_RESERVATIONUNITS = gql`
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
      state: ["CONFIRMED", "REQUIRES_HANDLING"]
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
          reservationUnits {
            pk
          }
          pk
          begin
          end
          state
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;

export const RESERVATION_UNITS_BY_UNIT = gql`
  query reservationUnitsByUnit(
    $unit: [ID]
    $offset: Int
    $first: Int
    $from: Date
    $to: Date
    $includeWithSameComponents: Boolean
  ) {
    reservationUnits(
      first: $first
      offset: $offset
      unit: $unit
      orderBy: "nameFi"
    ) {
      edges {
        node {
          pk
          nameFi
          spaces {
            pk
          }
          reservationUnitType {
            pk
          }
          isDraft
          reservations(
            from: $from
            to: $to
            includeWithSameComponents: $includeWithSameComponents
          ) {
            pk
            name
            priority
            begin
            end
            state
            numPersons
            calendarUrl
            bufferTimeBefore
            bufferTimeAfter
            workingMemo
            reserveeFirstName
            reserveeLastName
            reserveeOrganisationName
            reservationUnits {
              pk
              nameFi
              bufferTimeBefore
              bufferTimeAfter
            }
            user {
              firstName
              lastName
              email
            }
          }
        }
      }
      pageInfo {
        hasNextPage
      }
    }
  }
`;
