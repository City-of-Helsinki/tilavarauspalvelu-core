import { ReservationUnitsReservationUnitPricingPriceUnitChoices } from "../types/gql-types";
import formatters from "./number-formatters";

export const getPriceUnitMinutes = (
  unit: ReservationUnitsReservationUnitPricingPriceUnitChoices
): number => {
  switch (unit) {
    case "PER_15_MINS":
      return 15;
    case "PER_30_MINS":
      return 30;
    case "PER_HOUR":
      return 60;
    case "PER_HALF_DAY":
    case "PER_DAY":
    case "PER_WEEK":
    default:
      return 1;
  }
};

export const getPriceFractionMinutes = (
  unit: ReservationUnitsReservationUnitPricingPriceUnitChoices
): number => {
  switch (unit) {
    case "PER_15_MINS":
    case "PER_30_MINS":
    case "PER_HOUR":
      return 15;
    default:
      return 1;
  }
};

export const getUnRoundedReservationVolume = (
  minutes: number,
  unit: ReservationUnitsReservationUnitPricingPriceUnitChoices
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

export const getReservationVolume = (
  minutes: number,
  unit: ReservationUnitsReservationUnitPricingPriceUnitChoices
): number => {
  if (!minutes) {
    return 1;
  }

  return getUnRoundedReservationVolume(minutes, unit);
};

export const getReservationPrice = (
  price: number,
  defaultText: string,
  language = "fi",
  trailingZeros = false
): string => {
  const formatter = trailingZeros ? "currencyWithDecimals" : "currency";
  return price ? formatters(language)[formatter].format(price) : defaultText;
};
