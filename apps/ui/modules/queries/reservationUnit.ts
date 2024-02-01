import { gql } from "@apollo/client";
import {
  IMAGE_FRAGMENT,
  PRICING_FRAGMENT,
  RESERVATION_UNIT_FRAGMENT,
  UNIT_NAME_FRAGMENT,
} from "./fragments";

export const RESERVATION_UNIT = gql`
  ${RESERVATION_UNIT_FRAGMENT}
  query ReservationUnit($pk: Int!) {
    reservationUnitByPk(pk: $pk) {
      ...ReservationUnitFields
      id
      isDraft
      applicationRoundTimeSlots {
        closed
        weekday
        reservableTimes {
          begin
          end
        }
      }
      descriptionFi
      descriptionEn
      descriptionSv
      reservationKind
      bufferTimeBefore
      bufferTimeAfter
      reservationStartInterval
      publishBegins
      publishEnds
      reservationBegins
      reservationEnds
      canApplyFreeOfCharge
      state
      reservationState
      reservationUnitType {
        nameFi
        nameEn
        nameSv
      }
      minReservationDuration
      maxReservationDuration
      maxReservationsPerUser
      reservationsMinDaysBefore
      reservationsMaxDaysBefore
      requireReservationHandling
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
      allowReservationsWithoutOpeningHours
    }
  }
`;

// TODO why is ids remapped to pk here? that breaks all queries that use it
export const RESERVATION_UNITS = gql`
  ${PRICING_FRAGMENT}
  ${IMAGE_FRAGMENT}
  query SearchReservationUnits(
    $textSearch: String
    $pk: [Int]
    $applicationRound: [Int]
    $minPersons: Decimal
    $maxPersons: Decimal
    $unit: [Int]
    $reservationUnitType: [Int]
    $purposes: [Int]
    $equipments: [Int]
    $reservableDateStart: Date
    $reservableDateEnd: Date
    $reservableTimeStart: TimeString
    $reservableTimeEnd: TimeString
    $reservableMinimumDurationMinutes: Decimal
    $showOnlyReservable: Boolean
    $first: Int
    $before: String
    $after: String
    $orderBy: String
    $isDraft: Boolean
    $isVisible: Boolean
    $reservationKind: String
  ) {
    reservationUnits(
      textSearch: $textSearch
      pk: $pk
      applicationRound: $applicationRound
      maxPersonsGte: $minPersons
      minPersonsGte: $minPersons
      maxPersonsLte: $maxPersons
      minPersonsLte: $maxPersons
      unit: $unit
      reservationUnitType: $reservationUnitType
      purposes: $purposes
      equipments: $equipments
      reservableDateStart: $reservableDateStart
      reservableDateEnd: $reservableDateEnd
      reservableTimeStart: $reservableTimeStart
      reservableTimeEnd: $reservableTimeEnd
      reservableMinimumDurationMinutes: $reservableMinimumDurationMinutes
      showOnlyReservable: $showOnlyReservable
      first: $first
      after: $after
      before: $before
      orderBy: $orderBy
      isDraft: $isDraft
      isVisible: $isVisible
      reservationKind: $reservationKind
    ) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
          nameFi
          reservationBegins
          reservationEnds
          isClosed
          firstReservableDatetime
          reservationUnitType {
            id: pk
            nameFi
            nameEn
            nameSv
          }
          unit {
            ...UnitNameFields
            id: pk
          }
          maxPersons
          images {
            ...ImageFields
          }
          pricings {
            ...PricingFields
          }
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

export const RELATED_RESERVATION_UNITS = gql`
  ${UNIT_NAME_FRAGMENT}
  ${PRICING_FRAGMENT}
  ${IMAGE_FRAGMENT}
  query RelatedReservationUnits(
    $unit: [Int]!
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
            ...ImageFields
          }
          unit {
            ...UnitNameFields
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
          pricings {
            ...PricingFields
          }
        }
      }
    }
  }
`;

export const OPENING_HOURS = gql`
  query ReservationUnitOpeningHours(
    $pk: Int
    $startDate: Date!
    $endDate: Date!
    $from: Date
    $to: Date
    $state: [String]
    $includeWithSameComponents: Boolean
  ) {
    reservationUnitByPk(pk: $pk) {
      reservableTimeSpans(startDate: $startDate, endDate: $endDate) {
        startDatetime
        endDatetime
      }
      reservations(
        state: $state
        from: $from
        to: $to
        includeWithSameComponents: $includeWithSameComponents
      ) {
        pk
        state
        isBlocked
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
  query TermsOfUse($termsType: TermsOfUseTermsOfUseTermsTypeChoices) {
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
