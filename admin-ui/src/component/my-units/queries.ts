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
        reserveeFirstName
        reserveeLastName
        reserveeOrganisationName
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
