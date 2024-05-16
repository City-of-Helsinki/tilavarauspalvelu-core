import { addMinutes, addSeconds, isAfter, isValid } from "date-fns";
import type { PendingReservation } from "common/types/common";
import {
  State,
  type ReservationNode,
  type ReservationUnitNode,
  ReservationStartInterval,
  CustomerTypeChoice,
  type ReservationMetadataFieldNode,
  type Maybe,
} from "@gql/gql-types";
import {
  type RoundPeriod,
  doBuffersCollide,
  doReservationsCollide,
  getIntervalMinutes,
  isRangeReservable,
  isReservationLongEnough,
  isReservationShortEnough,
  isStartTimeWithinInterval,
} from "common/src/calendar/util";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { filterNonNullable } from "common/src/helpers";
import { getTranslation } from "./util";
import type { TFunction } from "i18next";

/// @param opts subset of ReservationUnitNode
/// @param t translation function
/// opts should never include undefined values but our codegen doesn't properly type it
export function getDurationOptions(
  opts: {
    minReservationDuration?: Maybe<number>;
    maxReservationDuration?: Maybe<number>;
    reservationStartInterval: Maybe<ReservationStartInterval> | undefined;
  },
  t: TFunction
): { label: string; value: number }[] {
  if (
    !opts.minReservationDuration ||
    !opts.maxReservationDuration ||
    !opts.reservationStartInterval
  ) {
    return [];
  }
  const intervalMinutes = getIntervalMinutes(opts.reservationStartInterval);
  if (!intervalMinutes) {
    return [];
  }

  const minuteString = (mins: number, hours: number) => {
    if (mins > 90)
      return t("common:abbreviations.minute", { count: mins % 60 });
    if (mins <= 90) return t("common:abbreviations.minute", { count: mins });
    if (mins !== 0)
      return t("common:abbreviations.minute", {
        count: mins - hours * 60,
      });
    return "";
  };

  const durationOptions: { label: string; value: number }[] = [];
  const minReservationDurationMinutes = opts.minReservationDuration / 60;
  const maxReservationDurationMinutes = opts.maxReservationDuration / 60;
  const start =
    minReservationDurationMinutes > intervalMinutes
      ? minReservationDurationMinutes
      : intervalMinutes;

  for (
    let i = start;
    i <= maxReservationDurationMinutes;
    i += intervalMinutes
  ) {
    const hours: number = Math.floor(i / 60);
    const hourString =
      i > 90 ? t("common:abbreviations.hour", { count: hours }) : "";

    const optionString = `${hourString} ${minuteString(i, hours)}`;
    durationOptions.push({
      label: optionString,
      value: i,
    });
  }

  return durationOptions;
}

export const isReservationInThePast = (
  reservation: ReservationNode
): boolean => {
  if (!reservation?.begin) {
    return false;
  }

  const now = new Date().setSeconds(0, 0);
  return !isAfter(new Date(reservation.begin).setSeconds(0, 0), now);
};

const isReservationWithinCancellationPeriod = (
  reservation: ReservationNode
): boolean => {
  const reservationUnit = reservation.reservationUnit?.[0];
  const begin = new Date(reservation.begin);

  const minutesBeforeCancel =
    reservationUnit?.cancellationRule?.canBeCancelledTimeBefore ?? 0;
  const cancelLatest = addSeconds(new Date(), minutesBeforeCancel);

  return cancelLatest > begin;
};

export const canUserCancelReservation = (
  reservation: ReservationNode,
  skipTimeCheck = false
): boolean => {
  const reservationUnit = reservation.reservationUnit?.[0];
  if (reservation.state !== State.Confirmed) return false;
  if (!reservationUnit?.cancellationRule) return false;
  if (reservationUnit?.cancellationRule?.needsHandling) return false;
  if (!skipTimeCheck && isReservationWithinCancellationPeriod(reservation))
    return false;

  return true;
};

export const getReservationApplicationMutationValues = (
  // TODO don't use Records to avoid proper typing
  payload: Record<string, string | number | boolean>,
  supportedFields: ReservationMetadataFieldNode[],
  reserveeType: CustomerTypeChoice
): Record<string, string | number | boolean> => {
  const result: typeof payload = { reserveeType };
  const intValues = ["numPersons"];
  const changes = [
    { field: "homeCity", mutationField: "homeCityPk" },
    { field: "ageGroup", mutationField: "ageGroupPk" },
    { field: "purpose", mutationField: "purposePk" },
  ];
  const fields = getReservationApplicationFields({
    supportedFields,
    reserveeType,
  });

  const commonFields = getReservationApplicationFields({
    supportedFields,
    reserveeType: "common",
  });

  [...fields, ...commonFields].forEach((field: string) => {
    const key = changes.find((c) => c.field === field)?.mutationField || field;
    result[key] = intValues.includes(field)
      ? Number(payload[field])
      : payload[field];
  });

  result.reserveeType = reserveeType;

  return result;
};

type ReservationCancellationReason =
  | "PAST"
  | "NO_CANCELLATION_RULE"
  | "REQUIRES_HANDLING"
  | "BUFFER";

export const getReservationCancellationReason = (
  reservation: ReservationNode
): ReservationCancellationReason | null => {
  const reservationUnit = reservation.reservationUnit?.[0];

  if (isReservationInThePast(reservation)) {
    return "PAST";
  }

  if (!reservationUnit?.cancellationRule) {
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
  reservation: ReservationNode
): string | null => {
  if (!reservation) {
    return null;
  }

  const shouldShowOrderStatus = (state: State) => {
    if (
      state === State.Created ||
      state === State.WaitingForPayment ||
      state === State.RequiresHandling
    ) {
      return false;
    }
    return true;
  };

  if (shouldShowOrderStatus(reservation.state)) {
    return reservation.order?.status ?? null;
  }

  return null;
};

/// NOTE don't return [boolean, string] causes issues in TS / JS
/// instead break this function into cleaner separate functions
export function isReservationReservable({
  reservationUnit,
  activeApplicationRounds,
  start,
  end,
  skipLengthCheck = false,
}: {
  reservationUnit: ReservationUnitNode | null;
  activeApplicationRounds: RoundPeriod[];
  start: Date;
  end: Date;
  skipLengthCheck: boolean;
}): boolean {
  if (!reservationUnit) {
    return false;
  }

  const normalizedEnd = addMinutes(end, -1);

  const {
    reservationSet,
    bufferTimeBefore,
    bufferTimeAfter,
    reservableTimeSpans: reservableTimes,
    maxReservationDuration,
    minReservationDuration,
    reservationStartInterval,
    reservationsMaxDaysBefore,
    reservationsMinDaysBefore,
    reservationBegins,
    reservationEnds,
  } = reservationUnit;

  if (!isValid(start) || !isValid(end)) {
    return false;
  }

  const reservationsArr = filterNonNullable(reservationSet);
  if (
    doBuffersCollide(
      {
        start,
        end,
        isBlocked: false,
        bufferTimeBefore: bufferTimeBefore ?? 0,
        bufferTimeAfter: bufferTimeAfter ?? 0,
      },
      reservationsArr
    )
  ) {
    return false;
  }

  const reservableTimeSpans = filterNonNullable(reservableTimes) ?? [];
  if (
    !isStartTimeWithinInterval(
      start,
      reservableTimeSpans,
      reservationStartInterval
    )
  ) {
    return false;
  }

  if (
    !isRangeReservable({
      range: [new Date(start), normalizedEnd],
      reservableTimeSpans,
      reservationBegins: reservationBegins
        ? new Date(reservationBegins)
        : undefined,
      reservationEnds: reservationEnds ? new Date(reservationEnds) : undefined,
      reservationsMaxDaysBefore: reservationsMaxDaysBefore ?? 0,
      reservationsMinDaysBefore: reservationsMinDaysBefore ?? 0,
      activeApplicationRounds,
    })
  ) {
    return false;
  }

  if (
    !skipLengthCheck &&
    !isReservationLongEnough(start, end, minReservationDuration ?? 0)
  ) {
    return false;
  }

  if (
    !skipLengthCheck &&
    !isReservationShortEnough(start, end, maxReservationDuration ?? 0)
  ) {
    return false;
  }

  if (doReservationsCollide({ start, end }, reservationsArr)) {
    return false;
  }

  return true;
}

const isReservationConfirmed = (reservation: ReservationNode): boolean =>
  reservation.state === State.Confirmed;

const isReservationFreeOfCharge = (
  reservation: ReservationNode | PendingReservation
): boolean => parseInt(String(reservation.price), 10) === 0;

export type CanReservationBeChangedProps = {
  reservation?: ReservationNode;
  newReservation?: ReservationNode | PendingReservation;
  reservationUnit?: ReservationUnitNode;
  activeApplicationRounds?: RoundPeriod[];
};

/// NOTE [boolean, string] causes issues in TS / JS
/// ![false] === ![true] === false, with no type errors
/// either refactor the return value or add lint rules to disable ! operator
/// TODO disable undefined from reservation and reservationUnit
export const canReservationTimeBeChanged = ({
  reservation,
  newReservation,
  reservationUnit,
  activeApplicationRounds = [],
}: CanReservationBeChangedProps): [boolean, string?] => {
  if (reservation == null) {
    return [false];
  }
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
  if (reservation.isHandled) {
    return [false, "RESERVATION_MODIFICATION_NOT_ALLOWED"];
  }

  if (newReservation) {
    //  new reservation is free
    if (!isReservationFreeOfCharge(newReservation)) {
      return [false, "RESERVATION_MODIFICATION_NOT_ALLOWED"];
    }

    if (reservationUnit == null) {
      return [false, "RESERVATION_UNIT_NOT_FOUND"];
    }

    //  new reservation is valid
    const isReservable = isReservationReservable({
      reservationUnit,
      activeApplicationRounds,
      start: new Date(newReservation.begin),
      end: new Date(newReservation.end),
      skipLengthCheck: false,
    });
    if (!isReservable) {
      return [false, "RESERVATION_TIME_INVALID"];
    }
  }

  return [true];
};

export const getReservationValue = (
  reservation: ReservationNode,
  key: string
): string | number | null => {
  switch (key) {
    case "ageGroup": {
      const { minimum, maximum } = reservation.ageGroup || {};
      return minimum && maximum ? `${minimum} - ${maximum}` : null;
    }
    case "purpose": {
      if (reservation.purpose != null) {
        return getTranslation(reservation.purpose, "name");
      }
      return null;
    }
    case "homeCity": {
      if (reservation.homeCity == null) {
        return null;
      }
      return (
        getTranslation(reservation.homeCity, "name") ||
        reservation.homeCity.name
      );
    }
    default: {
      if (key in reservation) {
        const val = reservation[key as keyof ReservationNode];
        if (typeof val === "string" || typeof val === "number") {
          return val;
        }
      }
      return null;
    }
  }
};

export function getCheckoutUrl(
  order?: Maybe<{ checkoutUrl?: Maybe<string> }>,
  lang = "fi"
): string | undefined {
  const { checkoutUrl } = order ?? {};

  if (!checkoutUrl) {
    return undefined;
  }

  try {
    const { origin, pathname, searchParams } = new URL(checkoutUrl);
    const baseUrl = `${origin}${pathname}`;
    searchParams.set("lang", lang);
    return `${baseUrl}/paymentmethod?${searchParams.toString()}`;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(e);
  }
  return undefined;
}
