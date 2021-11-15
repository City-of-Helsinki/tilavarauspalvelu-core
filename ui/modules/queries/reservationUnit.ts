import { gql } from "@apollo/client";

export const RESERVATION_UNIT = gql`
  query ReservationUnit($pk: Int!) {
    reservationUnitByPk(pk: $pk) {
      id
      pk
      nameFi
      nameEn
      nameSv
      images {
        imageUrl
        mediumUrl
        smallUrl
        imageType
      }
      descriptionFi
      descriptionEn
      descriptionSv
      termsOfUseFi
      termsOfUseEn
      termsOfUseSv
      reservationUnitType {
        nameFi
        nameEn
        nameSv
      }
      maxPersons
      minReservationDuration
      maxReservationDuration
      nextAvailableSlot
      unit {
        id
        pk
        nameFi
        nameEn
        nameSv
      }
      location {
        latitude
        longitude
        addressStreetFi
        addressStreetEn
        addressStreetSv
        addressZip
        addressCityFi
        addressCityEn
        addressCitySv
      }
      spaces {
        pk
        nameFi
        nameEn
        nameSv
        termsOfUseFi
        termsOfUseEn
        termsOfUseSv
      }
      openingHours(openingTimes: false, periods: true) {
        openingTimePeriods {
          periodId
          startDate
          endDate
          resourceState
          timeSpans {
            startTime
            endTime
            resourceState
            weekdays
          }
        }
      }
    }
  }
`;

export const RESERVATION_UNITS = gql`
  query SearchReservationUnits(
    $textSearch: String
    $minPersons: Float
    $maxPersons: Float
    $unit: ID
    $reservationUnitType: ID
    $purposes: ID
    $first: Int
    $after: String
    $orderBy: String
  ) {
    reservationUnits(
      textSearch: $textSearch
      maxPersonsGte: $minPersons
      maxPersonsLte: $maxPersons
      reservationUnitType: $reservationUnitType
      purposes: $purposes
      unit: $unit
      first: $first
      after: $after
      orderBy: $orderBy
    ) {
      edges {
        node {
          id: pk
          nameFi
          nameEn
          nameSv
          reservationUnitType {
            id: pk
            nameFi
            nameEn
            nameSv
          }
          unit {
            id: pk
            nameFi
            nameEn
            nameSv
          }
          maxPersons
          location {
            addressStreetFi
            addressStreetEn
            addressStreetSv
          }
          images {
            imageType
            mediumUrl
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

export const RELATED_RESERVATION_UNITS = gql`
  query RelatedReservationUnits($unit: ID!) {
    reservationUnits(unit: $unit) {
      edges {
        node {
          pk
          nameFi
          nameEn
          nameSv
          images {
            imageUrl
            smallUrl
            imageType
          }
          unit {
            pk
            nameFi
            nameEn
            nameSv
          }
          reservationUnitType {
            nameFi
            nameEn
            nameSv
          }
          maxPersons
          location {
            addressStreetFi
            addressStreetEn
            addressStreetSv
          }
        }
      }
    }
  }
`;

export const OPENING_HOURS = gql`
  query ReservationUnitOpeningHours(
    $pk: Int
    $startDate: Date
    $endDate: Date
    $from: Date
    $to: Date
    $state: [String]
  ) {
    reservationUnitByPk(pk: $pk) {
      openingHours(
        openingTimes: true
        periods: false
        startDate: $startDate
        endDate: $endDate
      ) {
        openingTimes {
          date
          startTime
          endTime
          state
          periods
        }
      }
      reservations(state: $state, from: $from, to: $to) {
        pk
        state
        priority
        begin
        end
        numPersons
        calendarUrl
      }
    }
  }
`;
