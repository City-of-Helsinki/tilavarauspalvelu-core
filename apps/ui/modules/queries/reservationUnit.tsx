import { gql } from "@apollo/client";
import {
  RESERVATION_UNIT_FRAGMENT,
  UNIT_NAME_FRAGMENT_I18N,
} from "./fragments";
import { IMAGE_FRAGMENT, PRICING_FRAGMENT } from "common/src/queries/fragments";

export { TERMS_OF_USE_QUERY as TERMS_OF_USE } from "common/src/queries/queries";

const RESERVATION_UNIT_TYPE_FRAGMENT = gql`
  fragment ReservationUnitTypeFields on ReservationUnitTypeNode {
    id
    pk
    nameFi
    nameEn
    nameSv
  }
`;

const RESERVATION_UNIT_NAME_FRAGMENT = gql`
  fragment ReservationUnitNameFields on ReservationUnitNode {
    id
    pk
    nameFi
    nameEn
    nameSv
  }
`;

const EQUIPMENT_FRAGMENT = gql`
  fragment EquipmentFields on EquipmentNode {
    id
    pk
    nameFi
    nameEn
    nameSv
    category {
      id
      nameFi
      nameEn
      nameSv
    }
  }
`;

// TODO remove extra fields that are in the IS_RESERVABLE_FRAGMENT
const RESERVATION_UNIT_PAGE_FRAGMENT = gql`
  ${IMAGE_FRAGMENT}
  ${RESERVATION_UNIT_FRAGMENT}
  ${RESERVATION_UNIT_TYPE_FRAGMENT}
  ${EQUIPMENT_FRAGMENT}
  fragment ReservationUnitPageFields on ReservationUnitNode {
    ...ReservationUnitFields
    isDraft
    images {
      ...Image
    }
    applicationRoundTimeSlots {
      id
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
    canApplyFreeOfCharge
    state
    reservationState
    reservationUnitType {
      ...ReservationUnitTypeFields
    }
    ...ReservationInfoContainer
    numActiveUserReservations
    requireReservationHandling
    equipments {
      id
      ...EquipmentFields
    }
  }
`;

const BLOCKING_RESERVATION_FRAGMENT = gql`
  fragment BlockingReservationFields on ReservationNode {
    pk
    id
    state
    isBlocked
    begin
    end
    numPersons
    calendarUrl
    bufferTimeBefore
    bufferTimeAfter
    affectedReservationUnits
  }
`;

export const RESERVATION_UNIT_PARAMS_PAGE_QUERY = gql`
  ${RESERVATION_UNIT_PAGE_FRAGMENT}
  query ReservationUnit($id: ID!) {
    reservationUnit(id: $id) {
      ...ReservationUnitPageFields
    }
  }
`;

const IS_RESERVABLE_FRAGMENT = gql`
  ${BLOCKING_RESERVATION_FRAGMENT}
  fragment IsReservableFields on ReservationUnitNode {
    reservationSet(state: $state) {
      ...BlockingReservationFields
    }
    bufferTimeBefore
    bufferTimeAfter
    reservableTimeSpans(startDate: $beginDate, endDate: $endDate) {
      startDatetime
      endDatetime
    }
    maxReservationDuration
    minReservationDuration
    reservationStartInterval
    reservationsMaxDaysBefore
    reservationsMinDaysBefore
    reservationBegins
    reservationEnds
  }
`;

// Combined version for the reservation-unit/[id] page so we can show the Calendar and check for collisions
export const RESERVATION_UNIT_PAGE_QUERY = gql`
  ${RESERVATION_UNIT_PAGE_FRAGMENT}
  ${BLOCKING_RESERVATION_FRAGMENT}
  ${IS_RESERVABLE_FRAGMENT}
  query ReservationUnitPage(
    $id: ID!
    $pk: Int!
    $beginDate: Date!
    $endDate: Date!
    $state: [ReservationStateChoice]
  ) {
    reservationUnit(id: $id) {
      ...ReservationUnitPageFields
      ...IsReservableFields
    }
    affectingReservations(
      forReservationUnits: [$pk]
      beginDate: $beginDate
      endDate: $endDate
      state: $state
    ) {
      ...BlockingReservationFields
    }
  }
`;

export const RESERVATION_UNIT_CARD_FRAGMENT = gql`
  ${IMAGE_FRAGMENT}
  ${UNIT_NAME_FRAGMENT_I18N}
  ${RESERVATION_UNIT_TYPE_FRAGMENT}
  ${RESERVATION_UNIT_NAME_FRAGMENT}
  fragment ReservationUnitCardFields on ReservationUnitNode {
    ...ReservationUnitNameFields
    unit {
      ...UnitNameFieldsI18N
    }
    reservationUnitType {
      ...ReservationUnitTypeFields
    }
    images {
      ...Image
    }
    maxPersons
  }
`;

// TODO why is ids remapped to pk here? that breaks all queries that use it
// TODO why isDraft and isVisible are options here?
export const SEARCH_RESERVATION_UNITS = gql`
  ${PRICING_FRAGMENT}
  ${RESERVATION_UNIT_CARD_FRAGMENT}
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
          ...ReservationUnitCardFields
          reservationBegins
          reservationEnds
          isClosed
          firstReservableDatetime
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

// Only needed on the reservation-unit/[id] page
// TODO should be made into a fragment and combined into the main query
export const RELATED_RESERVATION_UNITS = gql`
  ${UNIT_NAME_FRAGMENT_I18N}
  ${PRICING_FRAGMENT}
  ${IMAGE_FRAGMENT}
  ${RESERVATION_UNIT_TYPE_FRAGMENT}
  ${RESERVATION_UNIT_NAME_FRAGMENT}
  query RelatedReservationUnits(
    $unit: [Int]!
    $isDraft: Boolean
    $isVisible: Boolean
  ) {
    reservationUnits(unit: $unit, isDraft: $isDraft, isVisible: $isVisible) {
      edges {
        node {
          ...ReservationUnitNameFields
          images {
            ...Image
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
