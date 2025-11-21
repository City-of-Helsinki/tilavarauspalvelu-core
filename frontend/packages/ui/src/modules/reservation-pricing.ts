import { PriceUnit } from "../../gql/gql-types";
import type { Maybe } from "../../gql/gql-types";
import { toNumber } from "./helpers";
import { formatters } from "./number-formatters";

/**
 * Converts a price unit to its duration in minutes
 * @param unit - Price unit enum value
 * @returns Number of minutes for the price unit (15, 30, 60, or 1 for day/week units)
 */
function getPriceUnitMinutes(unit: PriceUnit): number {
  switch (unit) {
    case PriceUnit.Per_15Mins:
      return 15;
    case PriceUnit.Per_30Mins:
      return 30;
    case PriceUnit.PerHour:
      return 60;
    case PriceUnit.Fixed:
    case PriceUnit.PerDay:
    case PriceUnit.PerHalfDay:
    case PriceUnit.PerWeek:
      return 1;
  }
}

/**
 * Gets the smallest billable fraction in minutes for a price unit
 * Used for rounding up partial reservation units
 * @param unit - Price unit enum value
 * @returns Fraction in minutes (15 for hourly units, 1 for day/week units)
 */
function getPriceFractionMinutes(unit: PriceUnit): number {
  switch (unit) {
    case PriceUnit.Per_15Mins:
    case PriceUnit.Per_30Mins:
    case PriceUnit.PerHour:
      return 15;
    case PriceUnit.Fixed:
    case PriceUnit.PerDay:
    case PriceUnit.PerHalfDay:
    case PriceUnit.PerWeek:
      return 1;
  }
}

/**
 * Calculates the reservation volume (number of billable units) from duration in minutes
 * Rounds up partial units to the nearest billable fraction
 * @param minutes - Reservation duration in minutes
 * @param unit - Price unit for billing
 * @returns Number of billable units (e.g., 2.5 hours for a 150-minute reservation with PerHour pricing)
 * @example
 * getUnRoundedReservationVolume(90, PriceUnit.PerHour) // Returns: 1.5
 * getUnRoundedReservationVolume(70, PriceUnit.PerHour) // Returns: 1.25 (rounded to nearest 15 min)
 */
export function getUnRoundedReservationVolume(minutes: number, unit: PriceUnit): number {
  const wholeMinutes = getPriceUnitMinutes(unit);

  if (!minutes || wholeMinutes === 1) {
    return 1;
  }

  const volume = minutes / wholeMinutes;
  const wholeUnits = Math.floor(volume);

  if (volume === wholeUnits) {
    return volume;
  }

  const fraction = volume - wholeUnits;
  const fractionMinutes = getPriceFractionMinutes(unit);

  const totalFractions = wholeMinutes / fractionMinutes;

  const slots = Math.ceil(totalFractions * fraction);

  return wholeUnits + slots / totalFractions;
}

/**
 * Formats a reservation price for display with proper currency formatting
 * Returns defaultText if price is null, undefined, or zero
 * @param price - Price value as string (from GraphQL API)
 * @param defaultText - Text to display when price is free or unavailable (e.g., "Free")
 * @param trailingZeros - Whether to always show decimal places (e.g., "10.00" vs "10")
 * @param language - Language code for locale-specific formatting (defaults to "fi")
 * @returns Formatted price string or defaultText
 * @example
 * getReservationPrice("25.50", "Free", false, "en") // Returns: "€25.50" or "$25.50"
 * getReservationPrice("0", "Free", false, "fi") // Returns: "Free"
 */
export function getReservationPrice(
  price: Maybe<string> | undefined,
  defaultText: string,
  trailingZeros: boolean,
  language = "fi"
): string {
  const p = toNumber(price);
  if (p == null || p === 0) {
    return defaultText;
  }
  const formatterName = trailingZeros ? "currencyWithDecimals" : "currency";
  const f = formatters(language)[formatterName];
  return f?.format(p) ?? defaultText;
}
