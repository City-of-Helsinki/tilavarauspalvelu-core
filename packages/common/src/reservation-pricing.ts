import { Maybe, PriceUnit } from "../gql/gql-types";
import formatters from "./number-formatters";

export const getPriceUnitMinutes = (unit: PriceUnit): number => {
  switch (unit) {
    case PriceUnit.Per_15Mins:
    case "PER_15_MINS":
      return 15;
    case PriceUnit.Per_30Mins:
    case "PER_30_MINS":
      return 30;
    case PriceUnit.PerHour:
    case "PER_HOUR":
      return 60;
    case PriceUnit.PerHalfDay:
    case PriceUnit.PerDay:
    case PriceUnit.PerWeek:
    default:
      return 1;
  }
};

export const getPriceFractionMinutes = (unit: PriceUnit): number => {
  switch (unit) {
    case PriceUnit.Per_15Mins:
    case PriceUnit.Per_30Mins:
    case PriceUnit.PerHour:
      return 15;
    default:
      return 1;
  }
};

export const getUnRoundedReservationVolume = (
  minutes: number,
  unit: PriceUnit
): number => {
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
};

export function getReservationVolume(minutes: number, unit: PriceUnit): number {
  if (!minutes) {
    return 1;
  }

  return getUnRoundedReservationVolume(minutes, unit);
}

export function getReservationPrice(
  price: Maybe<string> | undefined,
  defaultText: string,
  language = "fi",
  trailingZeros = false
): string {
  if (price == null) {
    return defaultText;
  }
  const p = Number(price);
  if (Number.isNaN(p) || p === 0) {
    return defaultText;
  }
  const formatter = trailingZeros ? "currencyWithDecimals" : "currency";
  return formatters(language)[formatter].format(p);
}
