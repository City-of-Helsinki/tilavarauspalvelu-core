import { gql } from "@apollo/client";
import {
  RESERVATION_UNIT_FRAGMENT,
  UNIT_NAME_FRAGMENT_I18N,
} from "./fragments";
import { IMAGE_FRAGMENT, PRICING_FRAGMENT } from "common/src/queries/fragments";

export { TERMS_OF_USE_QUERY as TERMS_OF_USE } from "common/src/queries/queries";

const RESERVATION_UNIT_TYPE_FRAGMENT = gql`
  fragment ReservationUnitTypeFields on ReservationUnitTypeNode {
    pk
    nameFi
    nameEn
    nameSv
  }
`;

export const RESERVATION_UNIT_QUERY = gql`
  ${IMAGE_FRAGMENT}
  ${RESERVATION_UNIT_FRAGMENT}
  ${RESERVATION_UNIT_TYPE_FRAGMENT}
  query ReservationUnit($id: ID!) {
    reservationUnit(id: $id) {
      ...ReservationUnitFields
      id
      isDraft
      images {
        ...ImageFragment
      }
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
      reservationBegins
      reservationEnds
      canApplyFreeOfCharge
      state
      reservationState
      reservationUnitType {
        ...ReservationUnitTypeFields
      }
      minReservationDuration
      maxReservationDuration
      maxReservationsPerUser
      reservationsMinDaysBefore
      reservationsMaxDaysBefore
      requireReservationHandling
      equipments {
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

// TODO why is ids remapped to pk here? that breaks all queries that use it
// TODO why isDraft and isVisible are options here?
export const RESERVATION_UNITS = gql`
  ${PRICING_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${UNIT_NAME_FRAGMENT_I18N}
  ${RESERVATION_UNIT_TYPE_FRAGMENT}
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
    $reservableTimeStart: Time
    $reservableTimeEnd: Time
    $reservableMinimumDurationMinutes: Decimal
    $showOnlyReservable: Boolean
    $first: Int
    $before: String
    $after: String
    $orderBy: [ReservationUnitOrderingChoices]
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
      calculateFirstReservableTime: true
    ) {
      edges {
        node {
          id
          pk
          nameFi
          nameEn
          nameSv
          reservationBegins
          reservationEnds
          isClosed
          firstReservableDatetime
          reservationUnitType {
            ...ReservationUnitTypeFields
          }
          unit {
            ...UnitNameFieldsI18N
            id: pk
          }
          maxPersons
          images {
            ...ImageFragment
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
  ${UNIT_NAME_FRAGMENT_I18N}
  ${PRICING_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${RESERVATION_UNIT_TYPE_FRAGMENT}
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
            ...ImageFragment
          }
          unit {
            ...UnitNameFieldsI18N
          }
          reservationUnitType {
            ...ReservationUnitTypeFields
          }
          maxPersons
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
    $id: ID!
    $startDate: Date!
    $endDate: Date!
    $state: [String]
  ) {
    reservationUnit(id: $id) {
      reservableTimeSpans(startDate: $startDate, endDate: $endDate) {
        startDatetime
        endDatetime
      }
      reservationSet(state: $state, beginDate: $startDate, endDate: $endDate) {
        pk
        state
        isBlocked
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

export const RESERVATION_UNIT_TYPES = gql`
  ${RESERVATION_UNIT_TYPE_FRAGMENT}
  query ReservationUnitTypes {
    reservationUnitTypes {
      edges {
        node {
          ...ReservationUnitTypeFields
        }
      }
    }
  }
`;
