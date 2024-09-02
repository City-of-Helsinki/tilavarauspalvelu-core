import { gql } from "@apollo/client";
import { PRICING_FRAGMENT } from "common/src/queries/fragments";

export const RESERVATION_UNIT_PRICING_FRAGMENT = gql`
  ${PRICING_FRAGMENT}
  fragment ReservationUnitPricing on ReservationUnitNode {
    pricings {
      id
      ...PricingFields
    }
  }
`;

export const RESERVATION_RECURRING_FRAGMENT = gql`
  fragment ReservationRecurring on ReservationNode {
    recurringReservation {
      id
      pk
      beginDate
      endDate
      weekdays
      name
      description
    }
  }
`;
