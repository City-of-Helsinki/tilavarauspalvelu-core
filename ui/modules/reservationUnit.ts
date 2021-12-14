import { trim } from "lodash";
import { i18n } from "next-i18next";
import {
  ReservationUnitByPkType,
  ReservationUnitsReservationUnitPriceUnitChoices,
  ReservationUnitType,
} from "./gql-types";
import { getFormatters as formatters } from "./util";

export const getPriceUnitMinutes = (
  unit: ReservationUnitsReservationUnitPriceUnitChoices
): number => {
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

export const getVolume = (
  minutes: number,
  unit: ReservationUnitsReservationUnitPriceUnitChoices
): number => {
  if (!minutes) {
    return 1;
  }

  return Math.ceil(minutes / getPriceUnitMinutes(unit));
};

export const getPrice = (
  reservationUnit: ReservationUnitType | ReservationUnitByPkType,
  minutes?: number, // additional minutes for total price calculation
  trailingZeros = false
): string => {
  const unit: ReservationUnitsReservationUnitPriceUnitChoices =
    reservationUnit.priceUnit;
  const volume = getVolume(minutes, unit);
  const currencyFormatter = trailingZeros ? "currencyWithDecimals" : "currency";
  const floatFormatter = trailingZeros ? "twoDecimals" : "strippedDecimal";

  const unitStr =
    unit === "FIXED" || minutes ? "" : i18n.t(`prices:priceUnits.${unit}`);

  if (parseFloat(reservationUnit.highestPrice)) {
    if (unit === "FIXED") {
      return formatters()[currencyFormatter].format(
        reservationUnit.highestPrice
      );
    }

    const lowestPrice = parseFloat(reservationUnit.lowestPrice)
      ? formatters()[floatFormatter].format(
          reservationUnit.lowestPrice * volume
        )
      : 0;
    const highestPrice = formatters()[currencyFormatter].format(
      reservationUnit.highestPrice * volume
    );
    const price =
      reservationUnit.lowestPrice === reservationUnit.highestPrice
        ? formatters()[currencyFormatter].format(
            reservationUnit.lowestPrice * volume
          )
        : `${lowestPrice} - ${highestPrice}`;
    return trim(`${price} / ${unitStr}`, " / ");
  }

  return i18n.t("prices:priceFree");
};
