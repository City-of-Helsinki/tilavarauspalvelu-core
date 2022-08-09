import formatters from "./number-formatters";

export const getPriceUnitMinutes = (unit: string): number => {
  switch (unit) {
    case "PER_15_MINS":
      return 15;
    case "PER_30_MINS":
      return 30;
    case "PER_HOUR":
      return 60;
    case "PER_HALF_DAY":
      return 720;
    case "PER_DAY":
      return 1440;
    case "PER_WEEK":
      return 10080;
    default:
      return 1;
  }
};

export const getUnRoundedReservationVolume = (
  minutes: number,
  unit: string
): number => {
  if (!minutes) {
    return 1;
  }

  return minutes / getPriceUnitMinutes(unit);
};

export const getReservationVolume = (minutes: number, unit: string): number => {
  if (!minutes) {
    return 1;
  }

  return Math.ceil(getUnRoundedReservationVolume(minutes, unit));
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
