import {
  addMinutes,
  isWithinInterval,
  isBefore,
  startOfDay,
  areIntervalsOverlapping,
  addSeconds,
  differenceInSeconds,
  isAfter,
  isValid,
  addDays,
  format,
  isSameDay,
  set,
  roundToNearestMinutes,
  differenceInMinutes,
} from "date-fns";
import type { PendingReservation } from "common/types/common";
import {
  type ReservationNode,
  ReservationStartInterval,
  CustomerTypeChoice,
  type ReservationMetadataFieldNode,
  type Maybe,
  type ListReservationsQuery,
  type IsReservableFieldsFragment,
  type ReservationUnitNode,
  ReservationStateChoice,
  OrderStatus,
  type ReservationOrderStatusFragment,
  ReservableTimeSpanType,
} from "@gql/gql-types";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { filterNonNullable } from "common/src/helpers";
import { getDayIntervals, getTranslation } from "./util";
import type { TFunction } from "i18next";
import { type SlotProps } from "common/src/calendar/Calendar";
import { toUIDate } from "common/src/common/util";

// TimeSlots change the Calendar view. How many intervals are shown i.e. every half an hour, every hour
// we use every hour only => 2
export const SLOTS_EVERY_HOUR = 2;

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

export function isReservationInThePast(
  reservation: Pick<ReservationNode, "begin">
): boolean {
  if (!reservation?.begin) {
    return false;
  }

  const now = new Date().setSeconds(0, 0);
  return !isAfter(new Date(reservation.begin).setSeconds(0, 0), now);
}

type ReservationQueryT = NonNullable<ListReservationsQuery["reservations"]>;
type ReservationEdgeT = NonNullable<ReservationQueryT["edges"]>[0];
type ReservationNodeT = NonNullable<NonNullable<ReservationEdgeT>["node"]>;

type IsWithinCancellationPeriodReservationT = Pick<
  ReservationNodeT,
  "begin"
> & {
  reservationUnit?: Array<{
    cancellationRule?: Pick<
      NonNullable<ReservationUnitNode["cancellationRule"]>,
      "canBeCancelledTimeBefore" | "needsHandling"
    > | null;
  }> | null;
};
type GetReservationCancellationReasonReservationT = Pick<
  ReservationNodeT,
  "begin"
> & {
  reservationUnit?: Array<{
    cancellationRule?: Pick<
      NonNullable<ReservationUnitNode["cancellationRule"]>,
      "canBeCancelledTimeBefore" | "needsHandling"
    > | null;
  }> | null;
};

function isReservationWithinCancellationPeriod(
  reservation: IsWithinCancellationPeriodReservationT
): boolean {
  const reservationUnit = reservation.reservationUnit?.[0];
  const begin = new Date(reservation.begin);

  const minutesBeforeCancel =
    reservationUnit?.cancellationRule?.canBeCancelledTimeBefore ?? 0;
  const cancelLatest = addSeconds(new Date(), minutesBeforeCancel);

  return cancelLatest > begin;
}

export function canUserCancelReservation(
  reservation: IsWithinCancellationPeriodReservationT &
    Pick<NonNullable<ReservationNodeT>, "state">,
  skipTimeCheck = false
): boolean {
  const reservationUnit = reservation.reservationUnit?.[0];
  if (reservation.state !== ReservationStateChoice.Confirmed) return false;
  if (!reservationUnit?.cancellationRule) return false;
  if (reservationUnit?.cancellationRule?.needsHandling) return false;
  if (!skipTimeCheck && !isReservationWithinCancellationPeriod(reservation)) {
    return false;
  }

  return true;
}

// TODO why is this named like this??? what does application have to do with this?
export function getReservationApplicationMutationValues(
  // TODO don't use Records to avoid proper typing
  payload: Record<string, string | number | boolean>,
  supportedFields: Pick<ReservationMetadataFieldNode, "fieldName">[],
  reserveeType: CustomerTypeChoice
): Record<string, string | number | boolean> {
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
}

type ReservationCancellationReason =
  | "PAST"
  | "NO_CANCELLATION_RULE"
  | "REQUIRES_HANDLING"
  | "BUFFER";

export function getReservationCancellationReason(
  reservation: GetReservationCancellationReasonReservationT
): ReservationCancellationReason | null {
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
}

function shouldShowOrderStatus(
  state: Maybe<ReservationStateChoice> | undefined
) {
  if (
    state == null ||
    state === ReservationStateChoice.Created ||
    state === ReservationStateChoice.WaitingForPayment ||
    state === ReservationStateChoice.RequiresHandling
  ) {
    return false;
  }
  return true;
}

export function getNormalizedReservationOrderStatus(
  reservation: ReservationOrderStatusFragment
): OrderStatus | null {
  if (!reservation) {
    return null;
  }

  if (shouldShowOrderStatus(reservation.state)) {
    return reservation.paymentOrder[0]?.status ?? null;
  }

  return null;
}

export type TimeFrameSlot = { start: Date; end: Date };
type ReservationUnitReservableProps = {
  reservationUnit: Omit<IsReservableFieldsFragment, "reservableTimeSpans">;
  // pregenerated open slots
  reservableTimes: ReservableMap;
  activeApplicationRounds: RoundPeriod[];
  start: Date;
  end: Date;
  skipLengthCheck: boolean;
};

/// NOTE don't return [boolean, string] causes issues in TS / JS
/// instead break this function into cleaner separate functions
/// FIXME this function is getting called 100s or 1000s times when dragging a calendar event
/// when moving with a click this is called 20+ times
/// time change using the form elements also 20+ times
export function isReservationReservable({
  reservationUnit,
  activeApplicationRounds,
  reservableTimes,
  start,
  end,
  skipLengthCheck = false,
}: ReservationUnitReservableProps): boolean {
  const {
    reservationSet,
    bufferTimeBefore,
    bufferTimeAfter,
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
  const normalizedEnd = addMinutes(end, -1);

  const reservationsArr = filterNonNullable(reservationSet);
  const reservation = {
    start,
    end,
    bufferTimeBefore,
    bufferTimeAfter,
  };
  const isBufferCollision = reservationsArr.some((r) =>
    doesBufferCollide(r, reservation)
  );

  if (isBufferCollision) {
    return false;
  }

  if (
    !isStartTimeWithinInterval(start, reservableTimes, reservationStartInterval)
  ) {
    return false;
  }

  if (
    !isRangeReservable({
      range: [new Date(start), normalizedEnd],
      reservableTimes,
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

  if (!skipLengthCheck) {
    if (minReservationDuration) {
      const dur = differenceInSeconds(new Date(end), new Date(start));
      if (!(dur >= minReservationDuration)) {
        return false;
      }
    }
    if (maxReservationDuration) {
      const dur = differenceInSeconds(new Date(end), new Date(start));
      if (!(dur <= maxReservationDuration)) {
        return false;
      }
    }
  }

  if (doReservationsCollide({ start, end }, reservationsArr)) {
    return false;
  }

  return true;
}

export function dateToKey(date: Date): ReservableMapKey {
  return format(date, "yyyy-MM-dd");
}

// TODO sub classing Map and overriding get would be a lot cleaner
// because of the way get compares (===) the keys we have to serialize keys to strings
// which removes all type information (and allows empty strings or malformed keys)
// we want the key to be { year, month, day } and not a string
// for now using "yyyy-mm-dd" as the key to test it, refactor later (using a subclass).
// TODO values should be { hour, minute } not Date objects
// TODO provide serialization and deserialization functions (that have format checkers)
export type ReservableMapKey = string; // format: "yyyy-mm-dd"
export type ReservableMap = Map<
  ReservableMapKey,
  Array<{ start: Date; end: Date }>
>;
/// This function converts a time span array into a map of days with the time spans
// Cases:
// - multiple time spans on the same day
// - single time span spanning multiple days
// - a time span that starts on the previous day and ends on the next day
// TODO (later) this should reduce the amount of memory we use by
// - storing only the times not date (and constructing the date from the key)
// - store a smaller interval (like a month at a time, not the whole 2 years)
// TODO splitting Date into actual Date and Time would make this a lot easier
// because the key should only care about the Date part and we don't want
// make stupid mistakes by using Map.get(new Date()) instead of Map.get(startOfDay(new Date()))
export function generateReservableMap(
  reservableTimeSpans: ReservableTimeSpanType[]
): ReservableMap {
  const converted = reservableTimeSpans
    .map((n) =>
      n.startDatetime != null && n.endDatetime != null
        ? { start: new Date(n.startDatetime), end: new Date(n.endDatetime) }
        : null
    )
    .filter((n): n is NonNullable<typeof n> => n != null);

  const map = new Map<string, Array<{ start: Date; end: Date }>>();
  for (const n of converted) {
    // the simplest case is when the start and end are on the same day
    const day = dateToKey(new Date(n.start));
    if (map.has(day)) {
      const arr = map.get(day) ?? [];
      arr.push(n);
      map.set(day, arr);
      continue;
    } else {
      map.set(day, [n]);
    }
    // TODO the more complex cases (spans multiple days)
  }

  return map;
}

/// TODO this function is still a performance problem (looking at the flame graph)
/// The filtering helps, but the real solution would be to refactor the TimeSpan construction
/// to the Page load: do 7 / 30 days at a time, not all intervals (2 years)
// Refactor to take in the array of pre created slots (not intervals)
function isStartTimeWithinInterval(
  start: Date,
  timeSlots: ReservableMap,
  interval: ReservationStartInterval
): boolean {
  if (timeSlots.size < 1) {
    return false;
  }

  const slotsForDay = timeSlots.get(dateToKey(start));
  if (slotsForDay == null) {
    return false;
  }

  const timeframe = slotsForDay.reduce<TimeFrameSlot | null>((acc, curr) => {
    const begin = isSameDay(new Date(curr.start), start)
      ? new Date(curr.start)
      : set(start, { hours: 0, minutes: 0 });
    const end = isSameDay(new Date(curr.end), start)
      ? new Date(curr.end)
      : set(start, { hours: 23, minutes: 59 });
    return {
      start: acc?.start && acc.start < begin ? acc.start : begin,
      end: acc?.end && acc.end > end ? acc.end : end,
    };
  }, null);

  if (timeframe?.start == null || timeframe.end == null) {
    return false;
  }

  // TODO refactor (don't string convert, use numbers or dates)
  const startHMS = `${toUIDate(start, "HH:mm")}:00`;
  return getDayIntervals(
    format(timeframe.start, "HH:mm"),
    format(timeframe.end, "HH:mm"),
    interval
  ).includes(startHMS);
}

function isReservationConfirmed(reservation: {
  state?: Maybe<ReservationStateChoice> | undefined;
}): boolean {
  return reservation.state === ReservationStateChoice.Confirmed;
}

function isReservationFreeOfCharge(
  reservation: Pick<ReservationNode, "price">
): boolean {
  return parseInt(String(reservation.price), 10) === 0;
}

export type CanReservationBeChangedProps = {
  reservation: Pick<
    ReservationNode,
    "begin" | "end" | "isHandled" | "state" | "price"
  >;
  reservableTimes: ReservableMap;
  newReservation: ReservationNode | PendingReservation;
  reservationUnit: IsReservableFieldsFragment;
  activeApplicationRounds?: RoundPeriod[];
};

export function isReservationEditable(
  props: Pick<Required<CanReservationBeChangedProps>, "reservation">
): boolean {
  const { reservation } = props;
  // existing reservation state is not CONFIRMED
  if (!isReservationConfirmed(reservation)) {
    return false;
  }

  // existing reservation begin time is in the future
  if (isReservationInThePast(reservation)) {
    return false;
  }

  // existing reservation is free
  if (!isReservationFreeOfCharge(reservation)) {
    return false;
  }

  // existing reservation has valid cancellation rule that does not require handling
  if (!canUserCancelReservation(reservation, true)) {
    return false;
  }

  // existing reservation cancellation buffer is not exceeded
  if (!canUserCancelReservation(reservation)) {
    return false;
  }

  // existing reservation has been handled
  if (reservation.isHandled) {
    return false;
  }

  return true;
}

/// Only used by reservation edit (both page and component)
/// NOTE [boolean, string] causes issues in TS / JS
/// ![false] === ![true] === false, with no type errors
/// either refactor the return value or add lint rules to disable ! operator
/// TODO disable undefined from reservation and reservationUnit
export function canReservationTimeBeChanged({
  reservation,
  newReservation,
  reservableTimes,
  reservationUnit,
  activeApplicationRounds = [],
}: CanReservationBeChangedProps): boolean {
  if (reservation == null) {
    return false;
  }
  // existing reservation state is not CONFIRMED
  if (!isReservationConfirmed(reservation)) {
    return false;
  }

  if (isReservationEditable({ reservation })) {
    return false;
  }
  if (newReservation) {
    //  new reservation is free
    if (!isReservationFreeOfCharge(newReservation)) {
      return false;
    }

    if (reservationUnit == null) {
      return false;
    }

    //  new reservation is valid
    const isReservable = isReservationReservable({
      reservationUnit,
      reservableTimes,
      activeApplicationRounds,
      start: new Date(newReservation.begin),
      end: new Date(newReservation.end),
      skipLengthCheck: false,
    });
    if (!isReservable) {
      return false;
    }
  }

  return true;
}

// FIXME this is awful: we don't use the Node type anymore, this is not type safe, it's not intuative what this does and why
export function getReservationValue(
  reservation: ReservationNode,
  key: string
): string | number | null {
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
}

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

function generateSlots(
  start: Date,
  end: Date,
  reservationStartInterval: ReservationStartInterval
): Date[] {
  if (!start || !end || !reservationStartInterval) return [];

  const slots = [];
  const intervalMinutes = getIntervalMinutes(reservationStartInterval);

  for (let i = new Date(start); i <= end; i = addMinutes(i, intervalMinutes)) {
    slots.push(i);
  }

  return slots;
}

function isRangeReservable({
  range,
  reservableTimes,
  reservationBegins,
  reservationEnds,
  reservationsMinDaysBefore = 0,
  reservationsMaxDaysBefore = 0,
  activeApplicationRounds = [],
}: {
  range: Date[];
  reservableTimes: ReservableMap;
  reservationsMinDaysBefore: number;
  reservationsMaxDaysBefore: number;
  reservationBegins?: Date;
  reservationEnds?: Date;
  activeApplicationRounds: RoundPeriod[];
}): boolean {
  // eslint-disable-next-line no-console
  console.assert(range.length === 2, "Invalid range", range);
  // FIXME this is not good
  // we should be able to check the range without generating all the slots
  const slots = generateSlots(
    range[0],
    range[1],
    ReservationStartInterval.Interval_15Mins
  );

  if (
    !slots.every((slot) =>
      areReservableTimesAvailable(reservableTimes, slot, true)
    )
  ) {
    return false;
  }

  const isSlotReservable = (slot: Date) => {
    const isInFrame = isSlotWithinTimeframe(
      slot,
      reservationsMinDaysBefore,
      reservationsMaxDaysBefore,
      reservationBegins,
      reservationEnds
    );
    const collides = doesSlotCollideWithApplicationRounds(
      slot,
      activeApplicationRounds
    );
    return isInFrame && !collides;
  };

  return range.every((slot) => isSlotReservable(slot));
}

export type RoundPeriod = {
  reservationPeriodBegin: string;
  reservationPeriodEnd: string;
};
function doesSlotCollideWithApplicationRounds(
  slot: Date,
  rounds: RoundPeriod[]
): boolean {
  if (rounds.length < 1) return false;

  return rounds.some((round) =>
    isWithinInterval(slot, {
      start: new Date(round.reservationPeriodBegin),
      end: new Date(round.reservationPeriodEnd).setHours(23, 59, 59),
    })
  );
}

export function areSlotsReservable(
  slots: Date[],
  reservableTimes: ReservableMap,
  // reservableTimeSpans: ReservableTimeSpanType[],
  reservationsMinDaysBefore: number,
  reservationsMaxDaysBefore: number,
  reservationBegins?: Date,
  reservationEnds?: Date,
  activeApplicationRounds: RoundPeriod[] = []
): boolean {
  return slots.every(
    (slotDate) =>
      // NOTE seems that the order of checks improves performance
      isSlotWithinTimeframe(
        slotDate,
        reservationsMinDaysBefore,
        reservationsMaxDaysBefore,
        reservationBegins,
        reservationEnds
      ) &&
      areReservableTimesAvailable(reservableTimes, slotDate, true) &&
      !doesSlotCollideWithApplicationRounds(slotDate, activeApplicationRounds)
  );
}

export function isSlotWithinReservationTime(
  start: Date,
  reservationBegins?: Date,
  reservationEnds?: Date
): boolean {
  return (
    (!reservationBegins || isAfter(start, new Date(reservationBegins))) &&
    (!reservationEnds || isBefore(start, new Date(reservationEnds)))
  );
}

function isSlotWithinTimeframe(
  start: Date,
  minDaysBefore: number,
  maxDaysBefore: number,
  reservationBegins?: Date,
  reservationEnds?: Date
) {
  const isLegalTimeframe =
    isAfter(start, new Date()) &&
    isSlotWithinReservationTime(start, reservationBegins, reservationEnds);
  const maxDay = addDays(new Date(), maxDaysBefore);
  // if max days === 0 => latest = today
  const isBeforeMaxDaysBefore = maxDaysBefore === 0 || !isAfter(start, maxDay);
  const minDay = addDays(new Date(), minDaysBefore);
  const isAfterMinDaysBefore = !isBefore(start, startOfDay(minDay));
  return isLegalTimeframe && isAfterMinDaysBefore && isBeforeMaxDaysBefore;
}

type PropGetterProps = {
  reservableTimes: ReservableMap;
  activeApplicationRounds: RoundPeriod[];
  reservationsMinDaysBefore: number;
  reservationsMaxDaysBefore: number;
  customValidation?: (arg: Date) => boolean;
  reservationBegins?: Date;
  reservationEnds?: Date;
};
export const getSlotPropGetter =
  ({
    reservableTimes,
    activeApplicationRounds,
    reservationBegins,
    reservationEnds,
    reservationsMinDaysBefore,
    reservationsMaxDaysBefore,
    customValidation,
  }: PropGetterProps) =>
  (date: Date): SlotProps => {
    if (
      areSlotsReservable(
        [date],
        reservableTimes,
        reservationsMinDaysBefore,
        reservationsMaxDaysBefore,
        reservationBegins,
        reservationEnds,
        activeApplicationRounds
      ) &&
      (customValidation ? customValidation(date) : true)
    ) {
      return {};
    }

    return {
      className: "rbc-timeslot-inactive",
    };
  };

type BufferCollideCheckReservation = Pick<
  ReservationNode,
  "begin" | "end" | "isBlocked" | "bufferTimeBefore" | "bufferTimeAfter"
>;

function doesBufferCollide(
  reservation: BufferCollideCheckReservation,
  newReservation: {
    start: Date;
    end: Date;
    bufferTimeBefore: number;
    bufferTimeAfter: number;
  }
): boolean {
  const newReservationStartBuffer =
    reservation.bufferTimeAfter > newReservation.bufferTimeBefore
      ? reservation.bufferTimeAfter
      : newReservation.bufferTimeBefore;
  const newReservationEndBuffer =
    reservation.bufferTimeBefore > newReservation.bufferTimeAfter
      ? reservation.bufferTimeBefore
      : newReservation.bufferTimeAfter;

  const bufferedNewReservation = getBufferedEventTimes(
    newReservation.start,
    newReservation.end,
    newReservationStartBuffer,
    newReservationEndBuffer
  );

  const reservationInterval = {
    start: new Date(reservation.begin),
    end: new Date(reservation.end),
  };

  const newReservationInterval = reservation.isBlocked
    ? { start: newReservation.start, end: newReservation.end }
    : {
        start: bufferedNewReservation.start,
        end: bufferedNewReservation.end,
      };

  return areIntervalsOverlapping(reservationInterval, newReservationInterval);
}

export function doReservationsCollide(
  newReservation: { start: Date; end: Date },
  reservations: Pick<ReservationNode, "begin" | "end">[] = []
): boolean {
  const { start, end } = newReservation;
  return reservations.some((reservation) =>
    areIntervalsOverlapping(
      {
        start: new Date(reservation.begin),
        end: new Date(reservation.end),
      },
      { start, end }
    )
  );
}

function areReservableTimesAvailable(
  reservableTimes: ReservableMap,
  slotDate: Date,
  validateEnding = false
): boolean {
  // TODO this should be done differently slots is kinda bad
  const day = startOfDay(slotDate);
  const reservableTimesForDay = reservableTimes.get(dateToKey(day));
  if (reservableTimesForDay == null) {
    return false;
  }
  return reservableTimesForDay.some((slot) => {
    const startDate = slot.start;
    const endDate = slot.end;

    if (validateEnding) {
      return startDate <= slotDate && endDate > slotDate;
    }
    return startDate <= slotDate;
  });
}

export function isReservationStartInFuture(
  reservationUnit: Pick<
    ReservationUnitNode,
    "reservationBegins" | "reservationsMaxDaysBefore"
  >,
  now = new Date()
): boolean {
  const { reservationBegins, reservationsMaxDaysBefore } = reservationUnit;
  const bufferDays = reservationsMaxDaysBefore ?? 0;
  const negativeBuffer = Math.abs(bufferDays) * -1;

  return (
    !!reservationBegins &&
    now < addDays(new Date(reservationBegins), negativeBuffer)
  );
}

// TODO this is only used for calendars (edit and new reservation)
// the end part is not used at all for some reason
export function getNewReservation({
  start,
  end,
  reservationUnit,
}: {
  reservationUnit: Pick<
    ReservationUnitNode,
    "minReservationDuration" | "reservationStartInterval"
  >;
  start: Date;
  end: Date;
}) {
  const { minReservationDuration, reservationStartInterval } = reservationUnit;

  const { end: minEnd } = getMinReservation({
    begin: start,
    minReservationDuration: minReservationDuration ?? 0,
    reservationStartInterval,
  });

  const validEnd = getValidEndingTime({
    start,
    end: roundToNearestMinutes(end),
    reservationStartInterval,
  });
  const normalizedEnd = Math.max(validEnd.getTime(), minEnd.getTime());

  return {
    begin: start,
    end: new Date(normalizedEnd),
  };
}

function getMinReservation({
  begin,
  reservationStartInterval,
  minReservationDuration = 0,
}: {
  begin: Date;
  reservationStartInterval: ReservationStartInterval;
  minReservationDuration?: number;
}): { begin: Date; end: Date } {
  const minDurationMinutes = minReservationDuration / 60;
  const intervalMinutes = getIntervalMinutes(reservationStartInterval);

  const minutes =
    minDurationMinutes < intervalMinutes ? intervalMinutes : minDurationMinutes;
  return { begin, end: addMinutes(begin, minutes) };
}

function getValidEndingTime({
  start,
  end,
  reservationStartInterval,
}: {
  start: Date;
  end: Date;
  reservationStartInterval: ReservationStartInterval;
}): Date {
  const intervalMinutes = getIntervalMinutes(reservationStartInterval);

  const durationMinutes = differenceInMinutes(end, start);
  const remainder = durationMinutes % intervalMinutes;

  if (remainder !== 0) {
    const wholeIntervals = Math.abs(
      Math.floor(durationMinutes / intervalMinutes)
    );

    return addMinutes(start, wholeIntervals * intervalMinutes);
  }

  return end;
}

function getIntervalMinutes(
  reservationStartInterval: ReservationStartInterval
): number {
  switch (reservationStartInterval) {
    case "INTERVAL_15_MINS":
      return 15;
    case "INTERVAL_30_MINS":
      return 30;
    case "INTERVAL_60_MINS":
      return 60;
    case "INTERVAL_90_MINS":
      return 90;
    case "INTERVAL_120_MINS":
      return 120;
    case "INTERVAL_180_MINS":
      return 180;
    case "INTERVAL_240_MINS":
      return 240;
    case "INTERVAL_300_MINS":
      return 300;
    case "INTERVAL_360_MINS":
      return 360;
    case "INTERVAL_420_MINS":
      return 420;
    default:
      throw new Error("Invalid reservation start interval");
  }
}

function getBufferedEventTimes(
  start: Date,
  end: Date,
  bufferTimeBefore?: number,
  bufferTimeAfter?: number
): { start: Date; end: Date } {
  const before = addSeconds(start, -1 * (bufferTimeBefore ?? 0));
  const after = addSeconds(end, bufferTimeAfter ?? 0);
  return { start: before, end: after };
}
