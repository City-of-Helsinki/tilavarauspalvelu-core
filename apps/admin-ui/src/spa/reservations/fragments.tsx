import { gql } from "@apollo/client";

export const RESERVATION_UNIT_PRICING_FRAGMENT = gql`
  fragment ReservationUnitPricing on ReservationUnitNode {
    id
    pricings {
      id
      ...PricingFields
    }
  }
`;

export const RESERVATION_RECURRING_FRAGMENT = gql`
  fragment ReservationRecurring on ReservationNode {
    id
    recurringReservation {
      id
      pk
      beginDate
      beginTime
      endDate
      endTime
      weekdays
      name
      description
      usedAccessTypes
      isAccessCodeIsActiveCorrect
      pindoraInfo {
        accessCode
        accessCodeIsActive
        accessCodeValidity {
          accessCodeBeginsAt
          accessCodeEndsAt
        }
      }
    }
  }
`;
