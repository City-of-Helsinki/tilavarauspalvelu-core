import { gql } from "@apollo/client";
import type { TFunction } from "i18next";
import { formatters as getFormatters } from "@ui/index";
import { capitalize, getTranslation, stripHtml, toNumber } from "@ui/modules/helpers";
import type { LocalizationLanguages } from "@ui/modules/urlBuilder";
import { PriceUnit, ReservationStateChoice } from "@gql/gql-types";
import type {
  PriceSummaryFieldsFragment,
  ReservationPriceCalculationFieldsFragment,
  ReservationPriceLinesFieldsFragment,
} from "@gql/gql-types";

type PriceSummary = NonNullable<PriceSummaryFieldsFragment["priceSummary"]>;

export function formatPrice(price: number, isCurrency: boolean, lang: LocalizationLanguages = "fi"): string {
  const hasDecimals = price !== 0;
  const currencyFormatter = hasDecimals ? "currencyWithDecimals" : "currency";
  const floatFormatter = hasDecimals ? "twoDecimal" : "strippedDecimal";
  const formatter = getFormatters(lang)[isCurrency ? currencyFormatter : floatFormatter];
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

/// The price of one reservation, from the price calculation of the backend or from the price lines of a reservation.
export type ReservationPriceDisplay = Readonly<{
  total: number;
  lineList: ReadonlyArray<Readonly<{ description: string; amount: number }>>;
  /// Null if the lines have different tax percentages
  taxPercentage: number | null;
  hasMaterialPrice: boolean;
}>;

function getCommonTaxPercentage(taxPercentageList: ReadonlyArray<number>): number | null {
  const first = taxPercentageList[0];
  if (first == null || taxPercentageList.some((taxPercentage) => taxPercentage !== first)) {
    return null;
  }
  return first;
}

export function getReservationPriceDisplay(
  price: ReservationPriceCalculationFieldsFragment,
  lang: LocalizationLanguages
): ReservationPriceDisplay {
  return {
    total: toNumber(price.total) ?? 0,
    lineList: price.lines.map((line) => ({
      description: getTranslation(line, "description", lang),
      amount: toNumber(line.amount) ?? 0,
    })),
    taxPercentage: getCommonTaxPercentage(price.lines.map((line) => toNumber(line.taxPercentage) ?? 0)),
    hasMaterialPrice: price.lines.some(
      (line) => stripHtml(getTranslation(line, "materialPriceDescription", lang)) !== ""
    ),
  };
}

/// The price of a reservation from its price lines. The override of the handler replaces the amount of a line.
/// Reservations made before price lines have no lines. For these, use the price of the reservation.
export function getReservationPriceDisplayFromLines(
  reservation: ReservationPriceLinesFieldsFragment,
  lang: LocalizationLanguages,
  hasMaterialPrice: boolean
): ReservationPriceDisplay {
  const priceLineList = reservation.priceLines ?? [];
  if (priceLineList.length === 0) {
    const taxPercentage = toNumber(reservation.taxPercentageValue);
    return {
      total: toNumber(reservation.price) ?? 0,
      lineList: [],
      taxPercentage: taxPercentage != null && taxPercentage > 0 ? taxPercentage : null,
      hasMaterialPrice,
    };
  }
  const lineList = priceLineList.map((line) => ({
    description: getTranslation(line, "description", lang),
    amount: toNumber(line.overrideAmount ?? line.amount) ?? 0,
  }));
  return {
    total: lineList.reduce((sum, line) => sum + line.amount, 0),
    lineList,
    taxPercentage: getCommonTaxPercentage(priceLineList.map((line) => toNumber(line.taxPercentage) ?? 0)),
    hasMaterialPrice,
  };
}

/// Before the handler decides on the discount, the price of the reservation is the normal price
export function isDiscountPending(
  reservation: Readonly<{ applyingForFreeOfCharge?: boolean | null; state?: ReservationStateChoice | null }>
): boolean {
  return reservation.applyingForFreeOfCharge === true && reservation.state === ReservationStateChoice.RequiresHandling;
}

/// If the customer applies for a discount, the price is a range from 0 to the normal price.
export function getReservationPriceString(
  t: TFunction,
  price: ReservationPriceDisplay,
  isDiscountRange: boolean,
  lang: LocalizationLanguages
): string {
  if (price.total === 0) {
    return price.hasMaterialPrice ? capitalize(t("prices:materialPrice")) : t("prices:priceFree");
  }
  const totalString = isDiscountRange
    ? `${formatPrice(0, false, lang)} - ${formatPrice(price.total, true, lang)}`
    : formatPrice(price.total, true, lang);
  return price.hasMaterialPrice ? `${totalString} + ${t("prices:materialPrice")}` : totalString;
}

/// A reservation has one price line for now. List the lines only if there are more, so a new line is not hidden.
export function getPriceLineStringList(price: ReservationPriceDisplay, lang: LocalizationLanguages): string[] {
  if (price.lineList.length < 2) {
    return [];
  }
  return price.lineList.map((line) => `${line.description}: ${formatPrice(line.amount, true, lang)}`);
}

export const RESERVATION_PRICE_CALCULATION_FRAGMENT = gql`
  fragment ReservationPriceCalculationFields on ReservationPriceType {
    total
    canApplyForDiscount
    lines {
      descriptionFi
      descriptionEn
      descriptionSv
      amount
      taxPercentage
      materialPriceDescriptionFi
      materialPriceDescriptionEn
      materialPriceDescriptionSv
    }
  }
`;

export const RESERVATION_PRICE_LINES_FRAGMENT = gql`
  fragment ReservationPriceLinesFields on ReservationNode {
    id
    price
    taxPercentageValue
    priceLines {
      id
      descriptionFi
      descriptionEn
      descriptionSv
      amount
      overrideAmount
      taxPercentage
    }
  }
`;
