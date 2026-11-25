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

/// A currency range with an en dash, such as "0–40 €". Both ends have decimals, unless both are whole numbers.
export function formatDecimalRange(min: number, max: number, lang: LocalizationLanguages = "fi"): string {
  const isWhole = Number.isInteger(min) && Number.isInteger(max);
  const formatter = getFormatters(lang)[isWhole ? "currency" : "currencyWithDecimals"];
  if (formatter == null) {
    return "";
  }
  // Firefox before 116 and Safari before 15.4 do not have formatRange
  if (typeof formatter.formatRange !== "function") {
    return `${formatter.format(min)}–${formatter.format(max)}`;
  }
  return formatter.formatRange(min, max);
}

function getPriceUnitString(t: TFunction, priceUnit: PriceUnit): string {
  if (priceUnit === PriceUnit.Fixed) {
    return "";
  }
  return `/${t(`prices:priceUnits.${priceUnit}`)}`;
}

/// The material price description of the price summary, or an empty string.
export function getMaterialPriceDescription(
  priceSummary: PriceSummary | null | undefined,
  lang: LocalizationLanguages
): string {
  if (priceSummary == null) {
    return "";
  }
  const description = getTranslation(priceSummary, "materialPriceDescription", lang);
  return stripHtml(description) !== "" ? description : "";
}

/// The price of a reservation unit for search cards, lists and the reservation unit page.
/// If the customer can apply for a discount, the price is a range from 0 to the normal price.
export function getPriceSummaryString(
  t: TFunction,
  priceSummary: PriceSummary | null | undefined,
  lang: LocalizationLanguages
): string | null {
  if (priceSummary == null) {
    return null;
  }
  const hasMaterialPrice = getMaterialPriceDescription(priceSummary, lang) !== "";
  const amountString = getPriceSummaryAmountString(t, priceSummary, lang);
  if (amountString == null) {
    return hasMaterialPrice ? capitalize(t("prices:materialPrice")) : t("prices:priceFree");
  }
  return hasMaterialPrice ? `${amountString}${getMaterialPriceSuffix(t)}` : amountString;
}

/// The price of a reservation unit without the material price, such as "0–40 €/tunti".
/// Returns null if the reservation unit is free of charge.
export function getPriceSummaryAmountString(
  t: TFunction,
  priceSummary: PriceSummary,
  lang: LocalizationLanguages
): string | null {
  const amount = toNumber(priceSummary.lowestAmount) ?? 0;
  if (priceSummary.isFree || amount === 0) {
    return null;
  }
  const priceString = priceSummary.canApplyForDiscount
    ? formatDecimalRange(0, amount, lang)
    : formatPrice(amount, true, lang);
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
      materialPriceDescriptionFi
      materialPriceDescriptionEn
      materialPriceDescriptionSv
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

type MaterialPriceLine = Pick<
  ReservationPriceCalculationFieldsFragment["lines"][number],
  "materialPriceDescriptionFi" | "materialPriceDescriptionEn" | "materialPriceDescriptionSv"
>;

function hasMaterialPriceLine(lineList: ReadonlyArray<MaterialPriceLine>, lang: LocalizationLanguages): boolean {
  return lineList.some((line) => stripHtml(getTranslation(line, "materialPriceDescription", lang)) !== "");
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
    hasMaterialPrice: hasMaterialPriceLine(price.lines, lang),
  };
}

/// The price of a reservation from its price lines. The override of the handler replaces the amount of a line.
export function getReservationPriceDisplayFromLines(
  reservation: ReservationPriceLinesFieldsFragment,
  lang: LocalizationLanguages
): ReservationPriceDisplay {
  const priceLineList = reservation.priceLines ?? [];
  const lineList = priceLineList.map((line) => ({
    description: getTranslation(line, "description", lang),
    amount: toNumber(line.overrideAmount ?? line.amount) ?? 0,
  }));
  return {
    total: toNumber(reservation.totalPrice) ?? 0,
    lineList,
    taxPercentage: getCommonTaxPercentage(priceLineList.map((line) => toNumber(line.taxPercentage) ?? 0)),
    hasMaterialPrice: hasMaterialPriceLine(priceLineList, lang),
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
  const totalString = getReservationTotalString(price, isDiscountRange, lang);
  return price.hasMaterialPrice ? `${totalString}${getMaterialPriceSuffix(t)}` : totalString;
}

/// The total of a paid reservation without the material price, such as "0–40 €" or "19,00 €".
export function getReservationTotalString(
  price: ReservationPriceDisplay,
  isDiscountRange: boolean,
  lang: LocalizationLanguages
): string {
  return isDiscountRange ? formatDecimalRange(0, price.total, lang) : formatPrice(price.total, true, lang);
}

export function getMaterialPriceSuffix(t: TFunction): string {
  return ` + ${t("prices:materialPrice")}`;
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
    totalPrice
    priceLines {
      id
      descriptionFi
      descriptionEn
      descriptionSv
      amount
      overrideAmount
      taxPercentage
      materialPriceDescriptionFi
      materialPriceDescriptionEn
      materialPriceDescriptionSv
    }
  }
`;
