import { gql } from "@apollo/client";
import type { TFunction } from "i18next";
import { formatters as getFormatters } from "@ui/index";
import { toNumber } from "@ui/modules/helpers";
import { PriceUnit } from "@gql/gql-types";
import type { PriceSummaryFieldsFragment } from "@gql/gql-types";

type PriceSummary = NonNullable<PriceSummaryFieldsFragment["priceSummary"]>;

export function formatPrice(price: number, isCurrency: boolean): string {
  const hasDecimals = price !== 0;
  const currencyFormatter = hasDecimals ? "currencyWithDecimals" : "currency";
  const floatFormatter = hasDecimals ? "twoDecimal" : "strippedDecimal";
  const formatter = getFormatters("fi")[isCurrency ? currencyFormatter : floatFormatter];
  return formatter?.format(price) ?? "";
}

function getPriceUnitString(t: TFunction, priceUnit: PriceUnit): string {
  if (priceUnit === PriceUnit.Fixed) {
    return "";
  }
  return ` / ${t(`prices:priceUnits.${priceUnit}`)}`;
}

/// The price of a reservation unit for search cards, lists and the reservation unit page.
/// If the customer can apply for a discount, the price is a range from 0 to the normal price.
export function getPriceSummaryString(t: TFunction, priceSummary: PriceSummary | null | undefined): string | null {
  if (priceSummary == null) {
    return null;
  }
  const amount = toNumber(priceSummary.lowestAmount) ?? 0;
  if (priceSummary.isFree || amount === 0) {
    return t("prices:priceFree");
  }
  const priceString = priceSummary.canApplyForDiscount
    ? `${formatPrice(0, false)} - ${formatPrice(amount, true)}`
    : formatPrice(amount, true);
  return `${priceString}${getPriceUnitString(t, priceSummary.priceUnit)}`;
}

export const PRICE_SUMMARY_FRAGMENT = gql`
  fragment PriceSummaryFields on ReservationUnitNode {
    id
    priceSummary {
      isFree
      lowestAmount
      priceUnit
      canApplyForDiscount
    }
  }
`;
