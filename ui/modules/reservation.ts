import { isAfter } from "date-fns";
import { i18n } from "next-i18next";
import { ReservationType } from "./gql-types";
import { OptionType } from "./types";
import { convertHMSToSeconds, getFormatters, secondsToHms } from "./util";

export const getDurationOptions = (
  minReservationDuration: string,
  maxReservationDuration: string,
  step = "00:15:00"
): OptionType[] => {
  const minMinutes = convertHMSToSeconds(minReservationDuration);
  const maxMinutes = convertHMSToSeconds(maxReservationDuration);
  const durationStep = convertHMSToSeconds(step);

  if (!minMinutes || !maxMinutes || !durationStep) return [];

  const durationSteps = [];
  for (let i = minMinutes; i <= maxMinutes; i += durationStep) {
    durationSteps.push(i);
  }
  const timeOptions = durationSteps.map((n) => {
    const hms = secondsToHms(n);
    const minute = String(hms.m).padEnd(2, "0");
    return {
      label: `${hms.h}:${minute}`,
      value: `${hms.h}:${minute}`,
    };
  });

  return timeOptions;
};

export const isReservationWithinCancellationPeriod = (
  reservation: ReservationType
): boolean => {
  const reservationUnit = reservation.reservationUnits?.[0];
  let now = new Date().getTime() / 1000;
  const begin = new Date(reservation.begin).getTime() / 1000;
  if (reservationUnit?.cancellationRule?.canBeCancelledTimeBefore)
    now += reservationUnit.cancellationRule.canBeCancelledTimeBefore;

  return isAfter(now, begin);
};

export const canUserCancelReservation = (
  reservation: ReservationType
): boolean => {
  const reservationUnit = reservation.reservationUnits?.[0];
  if (!reservationUnit?.cancellationRule) return false;
  if (reservationUnit?.cancellationRule?.needsHandling) return false;
  if (isReservationWithinCancellationPeriod(reservation)) return false;

  return true;
};

export const getReservationPrice = (
  price: number,
  trailingZeros = false
): string => {
  const formatter = trailingZeros ? "currencyWithDecimals" : "currency";
  return price
    ? getFormatters()[formatter].format(price)
    : i18n.t("prices:priceFree");
};
