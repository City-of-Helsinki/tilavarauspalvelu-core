import { gql } from "@apollo/client";

export const RESERVATION_UNIT = gql`
  query ReservationUnit($pk: Int!) {
    reservationUnitByPk(pk: $pk) {
      id
      pk
      uuid
      nameFi
      nameEn
      nameSv
      isDraft
      images {
        imageUrl
        largeUrl
        mediumUrl
        smallUrl
        imageType
      }
      descriptionFi
      descriptionEn
      descriptionSv
      lowestPrice
      highestPrice
      priceUnit
      termsOfUseFi
      termsOfUseEn
      termsOfUseSv
      additionalInstructionsFi
      additionalInstructionsEn
      additionalInstructionsSv
      bufferTimeBefore
      bufferTimeAfter
      reservationStartInterval
      publishBegins
      publishEnds
      reservationBegins
      reservationEnds
      serviceSpecificTerms {
        nameFi
        nameEn
        nameSv
        textFi
        textEn
        textSv
      }
      reservationUnitType {
        nameFi
        nameEn
        nameSv
      }
      maxPersons
      minReservationDuration
      maxReservationDuration
      maxReservationsPerUser
      nextAvailableSlot
      unit {
        id
        pk
        tprekId
        nameFi
        nameEn
        nameSv
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
      }
      spaces {
        pk
        nameFi
        nameEn
        nameSv
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
      requireReservationHandling
      metadataSet {
        id
        name
        pk
        supportedFields
        requiredFields
      }
      equipment {
        pk
        nameFi
        nameEn
        nameSv
        category {
          nameFi
          nameEn
          nameSv
        }
      }
    }
  }
`;

export const RESERVATION_UNITS = gql`
  query SearchReservationUnits(
    $textSearch: String
    $pk: [ID]
    $applicationRound: [ID]
    $minPersons: Float
    $maxPersons: Float
    $unit: [ID]
    $reservationUnitType: [ID]
    $purposes: [ID]
    $first: Int
    $after: String
    $orderBy: String
    $isDraft: Boolean
    $isVisible: Boolean
  ) {
    reservationUnits(
      textSearch: $textSearch
      pk: $pk
      applicationRound: $applicationRound
      maxPersonsGte: $minPersons
      maxPersonsLte: $maxPersons
      reservationUnitType: $reservationUnitType
      purposes: $purposes
      unit: $unit
      first: $first
      after: $after
      orderBy: $orderBy
      isDraft: $isDraft
      isVisible: $isVisible
    ) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
          lowestPrice
          highestPrice
          priceUnit
          nameFi
          reservationBegins
          reservationEnds
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
            location {
              addressStreetFi
              addressStreetEn
              addressStreetSv
            }
          }
          maxPersons
          images {
            imageType
            smallUrl
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
  query RelatedReservationUnits(
    $unit: [ID]!
    $isDraft: Boolean
    $isVisible: Boolean
  ) {
    reservationUnits(unit: $unit, isDraft: $isDraft, isVisible: $isVisible) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
          images {
            mediumUrl
            smallUrl
            imageType
          }
          unit {
            pk
            nameFi
            nameEn
            nameSv
            location {
              addressStreetFi
              addressStreetEn
              addressStreetSv
            }
          }
          reservationUnitType {
            nameFi
            nameEn
            nameSv
          }
          maxPersons
          publishBegins
          publishEnds
          isDraft
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
        bufferTimeBefore
        bufferTimeAfter
      }
    }
  }
`;

export const TERMS_OF_USE = gql`
  query TermsOfUse($termsType: String) {
    termsOfUse(termsType: $termsType) {
      edges {
        node {
          pk
          nameFi
          nameEn
          nameSv
          textFi
          textEn
          textSv
          termsType
        }
      }
    }
  }
`;

export const RESERVATION_UNIT_TYPES = gql`
  query ReservationUnitTypes {
    reservationUnitTypes {
      edges {
        node {
          pk
          nameFi
          nameEn
          nameSv
        }
      }
    }
  }
`;
