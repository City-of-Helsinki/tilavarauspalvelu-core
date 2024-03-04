import { gql } from "@apollo/client";
import { IMAGE_FRAGMENT } from "common/src/queries/fragments";

export const RESERVATION_UNIT = gql`
  ${IMAGE_FRAGMENT}
  query ReservationUnit($pk: Int!) {
    reservationUnitByPk(pk: $pk) {
      id
      pk
      uuid
      nameFi
      nameEn
      nameSv
      isDraft
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
      termsOfUseFi
      termsOfUseEn
      termsOfUseSv
      reservationKind
      reservationPendingInstructionsFi
      reservationPendingInstructionsEn
      reservationPendingInstructionsSv
      reservationConfirmedInstructionsFi
      reservationConfirmedInstructionsEn
      reservationConfirmedInstructionsSv
      reservationCancelledInstructionsFi
      reservationCancelledInstructionsEn
      reservationCancelledInstructionsSv
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
      serviceSpecificTerms {
        textFi
        textEn
        textSv
      }
      cancellationTerms {
        textFi
        textEn
        textSv
      }
      paymentTerms {
        textFi
        textEn
        textSv
      }
      reservationUnitType {
        nameFi
        nameEn
        nameSv
      }
      pricingTerms {
        nameFi
        nameEn
        nameSv
        textFi
        textEn
        textSv
      }
      minPersons
      maxPersons
      minReservationDuration
      maxReservationDuration
      maxReservationsPerUser
      reservationsMinDaysBefore
      reservationsMaxDaysBefore
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
      allowReservationsWithoutOpeningHours
      pricings {
        begins
        priceUnit
        pricingType
        lowestPrice
        highestPrice
        taxPercentage {
          value
        }
        status
      }
    }
  }
`;

export const RESERVATION_UNITS = gql`
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
            ...ImageFragment
          }
          pricings {
            begins
            priceUnit
            pricingType
            lowestPrice
            highestPrice
            taxPercentage {
              value
            }
            status
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
            ...ImageFragment
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
          pricings {
            begins
            priceUnit
            pricingType
            lowestPrice
            highestPrice
            taxPercentage {
              value
            }
            status
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
