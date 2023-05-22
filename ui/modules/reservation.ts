import { addMinutes, isAfter, isValid } from "date-fns";
import camelCase from "lodash/camelCase";
import { convertHMSToSeconds, secondsToHms } from "common/src/common/util";
import {
  ApplicationRound,
  OptionType,
  PendingReservation,
} from "common/types/common";
import {
  ApplicationRoundType,
  PaymentOrderType,
  ReservationsReservationReserveeTypeChoices,
  ReservationsReservationStateChoices,
  ReservationType,
  ReservationUnitByPkType,
} from "common/types/gql-types";
import {
  areSlotsReservable,
  doBuffersCollide,
  doReservationsCollide,
  isReservationLongEnough,
  isReservationShortEnough,
  isStartTimeWithinInterval,
} from "common/src/calendar/util";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { getTranslation } from "./util";

export const getDurationOptions = (
  minReservationDuration: number,
  maxReservationDuration: number,
  step = "00:15:00"
): OptionType[] => {
  // const minMinutes = convertHMSToSeconds(minReservationDuration);
  // const maxMinutes = convertHMSToSeconds(maxReservationDuration);
  const durationStep = convertHMSToSeconds(step);

  if (!minReservationDuration || !maxReservationDuration || !durationStep)
    return [];

  const durationSteps = [];
  for (
    let i = minReservationDuration;
    i <= maxReservationDuration;
    i += durationStep
  ) {
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

export const isReservationInThePast = (
  reservation: ReservationType
): boolean => {
  if (!reservation?.begin) return null;

  const now = new Date().setSeconds(0, 0);
  return !isAfter(new Date(reservation.begin).setSeconds(0, 0), now);
};

export const isReservationWithinCancellationPeriod = (
  reservation: ReservationType
): boolean => {
  const reservationUnit = reservation.reservationUnits?.[0];
  let now = new Date().getTime() / 1000;
  const begin = new Date(reservation.begin).getTime() / 1000;
  if (reservationUnit?.cancellationRule?.canBeCancelledTimeBefore)
    now += reservationUnit.cancellationRule.canBeCancelledTimeBefore;

  return now > begin;
};

export const canUserCancelReservation = (
  reservation: ReservationType,
  skipTimeCheck = false
): boolean => {
  const reservationUnit = reservation.reservationUnits?.[0];
  if (reservation.state !== ReservationsReservationStateChoices.Confirmed)
    return false;
  if (!reservationUnit?.cancellationRule) return false;
  if (reservationUnit?.cancellationRule?.needsHandling) return false;
  if (
    skipTimeCheck === false &&
    isReservationWithinCancellationPeriod(reservation)
  )
    return false;

  return true;
};

export const getReservationApplicationMutationValues = (
  payload: Record<string, string | number | boolean>,
  supportedFields: string[],
  reserveeType: ReservationsReservationReserveeTypeChoices
): Record<string, string | number | boolean> => {
  const result = { reserveeType };
  const intValues = ["numPersons"];
  const changes = [
    { field: "homeCity", mutationField: "homeCityPk" },
    { field: "ageGroup", mutationField: "ageGroupPk" },
    { field: "purpose", mutationField: "purposePk" },
  ];
  const fields = getReservationApplicationFields({
    supportedFields,
    reserveeType,
  }).map(camelCase);

  const commonFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: "common",
  }).map(camelCase);

  [...fields, ...commonFields].forEach((field: string) => {
    const key = changes.find((c) => c.field === field)?.mutationField || field;
    result[key as string] = intValues.includes(field)
      ? Number(payload[field])
      : payload[field];
  });

  result.reserveeType = reserveeType;

  return result;
};

export type ReservationCancellationReason =
  | "PAST"
  | "NO_CANCELLATION_RULE"
  | "REQUIRES_HANDLING"
  | "BUFFER";

export const getReservationCancellationReason = (
  reservation: ReservationType
): ReservationCancellationReason | null => {
  const reservationUnit = reservation.reservationUnits?.[0];

  if (!reservationUnit) return null;

  if (isReservationInThePast(reservation)) return "PAST";

  if (!reservationUnit.cancellationRule) {
    return "NO_CANCELLATION_RULE";
  }

  if (reservationUnit.cancellationRule?.needsHandling) {
    return "REQUIRES_HANDLING";
  }

  if (
    reservationUnit.cancellationRule?.canBeCancelledTimeBefore &&
    isReservationWithinCancellationPeriod(reservation)
  ) {
    return "BUFFER";
  }

  return null;
};

export const getNormalizedReservationOrderStatus = (
  reservation: ReservationType
): string | null => {
  if (!reservation) return null;

  const shouldShowOrderStatus = (state: ReservationsReservationStateChoices) =>
    !["CREATED", "WAITING_FOR_PAYMENT", "REQUIRES_HANDLING"].includes(state);

  if (shouldShowOrderStatus(reservation.state)) {
    return reservation.orderStatus || null;
  }

  return null;
};

export type IsReservationReservableProps = {
  reservationUnit: ReservationUnitByPkType;
  activeApplicationRounds: ApplicationRound[] | ApplicationRoundType[];
  start: Date;
  end: Date;
  skipLengthCheck;
};

export const isReservationReservable = (
  props: IsReservationReservableProps
): boolean => {
  const {
    reservationUnit,
    activeApplicationRounds,
    start,
    end,
    skipLengthCheck = false,
  } = props;

  const normalizedEnd = addMinutes(end, -1);

  const {
    reservations,
    bufferTimeBefore,
    bufferTimeAfter,
    openingHours,
    maxReservationDuration,
    minReservationDuration,
    reservationStartInterval,
    reservationsMinDaysBefore,
    reservationBegins,
    reservationEnds,
  } = reservationUnit;

  if (
    !isValid(start) ||
    !isValid(end) ||
    doBuffersCollide(
      {
        start,
        end,
        bufferTimeBefore,
        bufferTimeAfter,
      },
      reservations
    ) ||
    !isStartTimeWithinInterval(
      start,
      openingHours?.openingTimes,
      reservationStartInterval
    ) ||
    !areSlotsReservable(
      [new Date(start), normalizedEnd],
      openingHours?.openingTimes,
      reservationBegins ? new Date(reservationBegins) : undefined,
      reservationEnds ? new Date(reservationEnds) : undefined,
      reservationsMinDaysBefore,
      activeApplicationRounds,
      false
    ) ||
    (!skipLengthCheck &&
      !isReservationLongEnough(start, end, minReservationDuration)) ||
    !isReservationShortEnough(start, end, maxReservationDuration) ||
    doReservationsCollide({ start, end }, reservations)
    // || !isSlotWithinTimeframe(start, reservationsMinDaysBefore, start, end)
  ) {
    return false;
  }

  return true;
};

export const isReservationConfirmed = (reservation: ReservationType): boolean =>
  reservation.state === "CONFIRMED";

export const isReservationFreeOfCharge = (
  reservation: ReservationType | PendingReservation
): boolean => parseInt(String(reservation.price), 10) === 0;

export type CanReservationBeChangedProps = {
  reservation: ReservationType;
  newReservation?: ReservationType | PendingReservation;
  reservationUnit?: ReservationUnitByPkType;
  activeApplicationRounds?: ApplicationRoundType[];
};

export const canReservationTimeBeChanged = (
  props: CanReservationBeChangedProps
): [boolean, string?] => {
  const {
    reservation,
    newReservation,
    reservationUnit,
    activeApplicationRounds,
  } = props;

  if (!reservation) return [false];

  // existing reservation state is not CONFIRMED
  if (!isReservationConfirmed(reservation)) {
    return [false, "RESERVATION_MODIFICATION_NOT_ALLOWED"];
  }

  // existing reservation begin time is in the future
  if (isReservationInThePast(reservation)) {
    return [false, "RESERVATION_BEGIN_IN_PAST"];
  }

  // existing reservation is free
  if (!isReservationFreeOfCharge(reservation)) {
    return [false, "RESERVATION_MODIFICATION_NOT_ALLOWED"];
  }

  // existing reservation has valid cancellation rule that does not require handling
  if (!canUserCancelReservation(reservation, true)) {
    return [false, "RESERVATION_MODIFICATION_NOT_ALLOWED"];
  }

  // existing reservation cancellation buffer is not exceeded
  if (!canUserCancelReservation(reservation)) {
    return [false, "CANCELLATION_TIME_PAST"];
  }

  // existing reservation has been handled
  if (reservation.handledAt) {
    return [false, "RESERVATION_MODIFICATION_NOT_ALLOWED"];
  }

  if (reservation && newReservation) {
    //  new reservation is free
    if (!isReservationFreeOfCharge(newReservation)) {
      return [false, "RESERVATION_MODIFICATION_NOT_ALLOWED"];
    }

    //  new reservation is valid
    if (
      !isReservationReservable({
        reservationUnit,
        activeApplicationRounds,
        start: Boolean(newReservation.begin) && new Date(newReservation.begin),
        end: Boolean(newReservation.end) && new Date(newReservation.end),
        skipLengthCheck: false,
      })
    ) {
      return [false, "RESERVATION_TIME_INVALID"];
    }
  }

  return [true];
};

export const profileUserFields = [
  "reserveeFirstName",
  "reserveeLastName",
  "reserveePhone",
  "reserveeEmail",
  "reserveeAddressStreet",
  "reserveeAddressCity",
  "reserveeAddressZip",
  "homeCity",
] as const;

export const getReservationValue = (
  reservation: ReservationType,
  key: string
): string | number | null => {
  switch (key) {
    case "ageGroup": {
      const { minimum, maximum } = reservation.ageGroup || {};
      return minimum && maximum ? `${minimum} - ${maximum}` : null;
    }
    case "purpose":
      return getTranslation(reservation.purpose, "name");
    case "homeCity":
      return (
        getTranslation(reservation.homeCity, "name") ||
        reservation.homeCity.name
      );
    default:
      return reservation[key] ?? null;
  }
};

export const getCheckoutUrl = (
  order: PaymentOrderType,
  lang: string
): string | null => {
  const { checkoutUrl } = order ?? {};

  if (!checkoutUrl) return null;

  try {
    const { origin, pathname, searchParams } = new URL(checkoutUrl) || {};
    const userId = searchParams?.get("user");

    if (checkoutUrl && userId && origin && pathname && lang) {
      const baseUrl = `${origin}${pathname}`;
      return `${baseUrl}/paymentmethod?user=${userId}&lang=${lang}`;
    }

    return null;
  } catch (e) {
    return null;
  }
};
