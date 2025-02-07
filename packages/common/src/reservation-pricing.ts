import { type Maybe, PriceUnit } from "../gql/gql-types";
import { toNumber } from "./helpers";
import formatters from "./number-formatters";

function getPriceUnitMinutes(unit: PriceUnit): number {
  switch (unit) {
    case PriceUnit.Per_15Mins:
      return 15;
    case PriceUnit.Per_30Mins:
      return 30;
    case PriceUnit.PerHour:
      return 60;
    case PriceUnit.PerHalfDay:
    case PriceUnit.PerDay:
    case PriceUnit.PerWeek:
    default:
      return 1;
  }
}

function getPriceFractionMinutes(unit: PriceUnit): number {
  switch (unit) {
    case PriceUnit.Per_15Mins:
    case PriceUnit.Per_30Mins:
    case PriceUnit.PerHour:
      return 15;
    default:
      return 1;
  }
}

export function getUnRoundedReservationVolume(
  minutes: number,
  unit: PriceUnit
): number {
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
  const formatter = trailingZeros ? "currencyWithDecimals" : "currency";
  return formatters(language)[formatter].format(p);
}
