import { isAfter } from "date-fns";
import { ReservationType } from "./gql-types";
import { OptionType } from "./types";
import { convertHMSToSeconds, secondsToHms } from "./util";

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
