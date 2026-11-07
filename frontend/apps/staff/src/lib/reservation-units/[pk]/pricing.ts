import { gql } from "@apollo/client";
import { formatApiDate } from "ui/src/modules/date-utils";
import { PriceComponentKind } from "@gql/gql-types";
import type { OwnPricingFieldsFragment } from "@gql/gql-types";

type PricingGroupRow = OwnPricingFieldsFragment["reservationUnitPricingGroups"][number];
export type OwnPriceComponent = PricingGroupRow["pricingGroup"]["components"][number];

export type OwnPricings = Readonly<{
  /// The reservation unit uses a pricing group that other reservation units share. Its prices are not edited here.
  isShared: boolean;
  /// The price in effect today. It cannot change, only end when a future price begins.
  current: OwnPriceComponent | null;
  futureList: OwnPriceComponent[];
}>;

/// The prices of a reservation unit are the base components of its own pricing group.
/// The own pricing group is the group of the row in effect today, or of the first future row.
/// API dates are "yyyy-MM-dd", so they compare as strings.
export function getOwnPricings(reservationUnit: OwnPricingFieldsFragment, today: Date): OwnPricings {
  const todayString = formatApiDate(today) ?? "";
  const rowList = [...reservationUnit.reservationUnitPricingGroups].sort((a, b) => a.begins.localeCompare(b.begins));
  const pastRowList = rowList.filter((row) => row.begins <= todayString);
  const futureRowList = rowList.filter((row) => row.begins > todayString);
  const currentAndFutureRowList = [...pastRowList.slice(-1), ...futureRowList];

  const isShared = currentAndFutureRowList.some((row) => row.pricingGroup.unitGroup != null);
  const pricingGroup = currentAndFutureRowList[0]?.pricingGroup;
  if (isShared || pricingGroup == null) {
    return { isShared, current: null, futureList: [] };
  }

  const baseComponentList = pricingGroup.components
    .filter((component) => component.kind === PriceComponentKind.Base && component.priceOption == null)
    .sort((a, b) => a.validFrom.localeCompare(b.validFrom));
  const current =
    baseComponentList.find(
      (component) =>
        component.validFrom <= todayString && (component.validUntil == null || component.validUntil > todayString)
    ) ?? null;
  const futureList = baseComponentList.filter((component) => component.validFrom > todayString);
  return { isShared, current, futureList };
}

export const OWN_PRICING_FRAGMENT = gql`
  fragment OwnPricingFields on ReservationUnitNode {
    id
    reservationUnitPricingGroups {
      id
      begins
      pricingGroup {
        id
        unitGroup {
          id
        }
        components {
          id
          pk
          kind
          validFrom
          validUntil
          priceOption {
            id
          }
          amount
          priceUnit
          canApplyForDiscount
          materialPriceDescriptionFi
          materialPriceDescriptionEn
          materialPriceDescriptionSv
          taxLevel {
            id
            pk
          }
          salesItem {
            id
            pk
          }
        }
      }
    }
  }
`;
