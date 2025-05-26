import { type Maybe, PriceUnit } from "../gql/gql-types";
import { toNumber } from "./helpers";
import formatters from "./number-formatters";

function getPriceUnitMinutes(unit: PriceUnit): number {
  switch (unit) {
    case PriceUnit.PriceUnitPer_15Mins:
      return 15;
    case PriceUnit.PriceUnitPer_30Mins:
      return 30;
    case PriceUnit.PriceUnitPerHour:
      return 60;
    case PriceUnit.PriceUnitPerHalfDay:
    case PriceUnit.PriceUnitPerDay:
    case PriceUnit.PriceUnitPerWeek:
    default:
      return 1;
  }
}

function getPriceFractionMinutes(unit: PriceUnit): number {
  switch (unit) {
    case PriceUnit.PriceUnitPer_15Mins:
    case PriceUnit.PriceUnitPer_30Mins:
    case PriceUnit.PriceUnitPerHour:
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
  const formatterName = trailingZeros ? "currencyWithDecimals" : "currency";
  const f = formatters(language)[formatterName];
  return f?.format(p) ?? defaultText;
}
