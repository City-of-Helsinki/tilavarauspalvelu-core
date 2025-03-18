import {
  addMinutes,
  addSeconds,
  isAfter,
  roundToNearestMinutes,
  differenceInMinutes,
  set,
} from "date-fns";
import {
  type ReservationNode,
  ReservationStartInterval,
  type Maybe,
  type ListReservationsQuery,
  type IsReservableFieldsFragment,
  ReservationStateChoice,
  type ReservationUnitNode,
  OrderStatus,
  type ReservationOrderStatusFragment,
  type CancellationRuleFieldsFragment,
  type BlockingReservationFieldsFragment,
  type CanUserCancelReservationFragment,
} from "@gql/gql-types";
import { getIntervalMinutes } from "common/src/conversion";
import { fromUIDate } from "./util";
import { type TFunction } from "i18next";
import { type PendingReservation } from "@/modules/types";
import {
  type ReservableMap,
  type RoundPeriod,
  isRangeReservable,
} from "./reservable";
import { type PendingReservationFormType } from "@/components/reservation-unit/schema";
import { isValidDate, toUIDate } from "common/src/common/util";
import { getTimeString } from "./reservationUnit";

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

function isReservationInThePast(
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
  reservationUnits?: Maybe<Array<CancellationRuleFieldsFragment>> | undefined;
};

function isTooCloseToCancel(
  reservation: IsWithinCancellationPeriodReservationT
): boolean {
  const reservationUnit = reservation.reservationUnits?.[0];
  const begin = new Date(reservation.begin);

  const { canBeCancelledTimeBefore } = reservationUnit?.cancellationRule ?? {};
  const cancelLatest = addSeconds(begin, -(canBeCancelledTimeBefore ?? 0));
  const now = new Date();

  return cancelLatest < now;
}

export function isReservationCancellable(
  reservation: CanUserCancelReservationFragment
): boolean {
  return isReservationCancellableReason(reservation) === "";
}

export type ReservationCancellableReason =
  | "RESERVATION_BEGIN_IN_PAST"
  | "CANCELLATION_TIME_PAST"
  | "ALREADY_CANCELLED"
  | "CANCELLATION_NOT_ALLOWED"
  | "";

export function isReservationCancellableReason(
  reservation: CanUserCancelReservationFragment
): ReservationCancellableReason {
  const reservationUnit = reservation.reservationUnits.find(() => true);
  const isReservationCancelled =
    reservation.state === ReservationStateChoice.Cancelled;
  if (isReservationCancelled) {
    return "ALREADY_CANCELLED";
  }
  if (isReservationInThePast(reservation)) {
    return "RESERVATION_BEGIN_IN_PAST";
  }
  if (reservationUnit?.cancellationRule == null) {
    return "CANCELLATION_NOT_ALLOWED";
  }
  // TODO why isn't user allowed to cancel waiting for payment?
  // TODO why can't user cancel if the reservation is waiting for handling?
  if (reservation.state !== ReservationStateChoice.Confirmed) {
    return "CANCELLATION_NOT_ALLOWED";
  }
  if (isTooCloseToCancel(reservation)) {
    return "CANCELLATION_TIME_PAST";
  }

  return "";
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

function isReservationConfirmed(reservation: {
  state?: Maybe<ReservationStateChoice> | undefined;
}): boolean {
  return reservation.state === ReservationStateChoice.Confirmed;
}

function isReservationFreeOfCharge(
  reservation: Pick<ReservationNode, "price">
): boolean {
  return !(Number(reservation.price) > 0);
}

export type CanReservationBeChangedProps = {
  reservation: Pick<
    ReservationNode,
    "begin" | "end" | "isHandled" | "state" | "price"
  > &
    CanUserCancelReservationFragment;
  reservableTimes: ReservableMap;
  newReservation: PendingReservation;
  reservationUnit: IsReservableFieldsFragment;
  activeApplicationRounds: readonly RoundPeriod[];
  blockingReservations: readonly BlockingReservationFieldsFragment[];
};

export function getWhyReservationCantBeChanged(
  props: Pick<Required<CanReservationBeChangedProps>, "reservation">
): string | null {
  const { reservation } = props;
  // existing reservation state is not CONFIRMED
  if (!isReservationConfirmed(reservation)) {
    return "RESERVATION_MODIFICATION_NOT_ALLOWED";
  }

  // existing reservation has been handled
  if (reservation.isHandled) {
    return "RESERVATION_MODIFICATION_NOT_ALLOWED";
  }

  // existing reservation begin time is in the future
  if (isReservationInThePast(reservation)) {
    return "RESERVATION_BEGIN_IN_PAST";
  }

  const reservationUnit = reservation.reservationUnits?.[0];
  if (reservationUnit?.cancellationRule == null) {
    return "CANCELLATION_NOT_ALLOWED";
  }

  // existing reservation cancellation buffer is not exceeded
  if (!isReservationCancellable(reservation)) {
    return "CANCELLATION_TIME_PAST";
  }

  // can't move the reservation if it's not free but we can still cancel it
  if (!isReservationFreeOfCharge(reservation)) {
    return "RESERVATION_MODIFICATION_NOT_ALLOWED";
  }

  return null;
}

export function isReservationEditable(
  props: Pick<Required<CanReservationBeChangedProps>, "reservation">
): boolean {
  if (getWhyReservationCantBeChanged(props) != null) {
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
  activeApplicationRounds,
  blockingReservations,
}: CanReservationBeChangedProps): boolean {
  if (reservation == null) {
    return false;
  }
  // existing reservation state is not CONFIRMED
  if (!isReservationConfirmed(reservation)) {
    return false;
  }

  if (!isReservationEditable({ reservation })) {
    return false;
  }

  // New reservation would require payment
  if (!isReservationFreeOfCharge(newReservation)) {
    return false;
  }

  if (reservationUnit == null) {
    return false;
  }

  //  new reservation is valid
  return isRangeReservable({
    blockingReservations,
    range: {
      start: new Date(newReservation.begin),
      end: new Date(newReservation.end),
    },
    reservationUnit,
    reservableTimes,
    activeApplicationRounds,
  });
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

export type TimeRange = {
  start: Date;
  end: Date;
};

type Slot = TimeRange & {
  isReservable: boolean;
  durationMinutes: number;
};
export type FocusTimeSlot = { isReservable: false } | Slot;

export function convertFormToFocustimeSlot({
  data,
  reservationUnit,
  reservableTimes,
  activeApplicationRounds,
  blockingReservations,
}: {
  data: PendingReservationFormType;
  reservationUnit: Omit<IsReservableFieldsFragment, "reservableTimeSpans">;
  reservableTimes: ReservableMap;
  activeApplicationRounds: readonly RoundPeriod[];
  blockingReservations: readonly BlockingReservationFieldsFragment[];
}): FocusTimeSlot | { isReservable: false } {
  const [hours, minutes]: Array<number | undefined> = data.time
    .split(":")
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const maybeDate = fromUIDate(data.date);
  let start: Date | null = null;
  if (maybeDate != null && isValidDate(maybeDate)) {
    start = set(maybeDate, { hours, minutes });
  }
  if (hours == null || minutes == null || start == null) {
    return {
      isReservable: false,
    };
  }

  const end = addMinutes(start, data.duration);
  const isReservable = isRangeReservable({
    blockingReservations,
    range: {
      start,
      end,
    },
    reservationUnit,
    reservableTimes,
    activeApplicationRounds,
  });

  return {
    start,
    end,
    isReservable,
    durationMinutes: data.duration,
  };
}

export function createDateTime(date: string, time: string): Date {
  const [hours, minutes]: Array<number | undefined> = time
    .split(":")
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const maybeDate = fromUIDate(date);
  if (maybeDate != null && isValidDate(maybeDate)) {
    return set(maybeDate, { hours, minutes });
  }
  return new Date();
}

export function convertReservationFormToApi(
  formValues: PendingReservationFormType
): { begin: string; end: string } | null {
  const time = formValues.time;
  const date = fromUIDate(formValues.date ?? "");
  const duration = formValues.duration;
  if (date == null || time == null || duration == null) {
    return null;
  }
  const [hours, minutes] = time.split(":").map(Number);
  const begin: Date = set(date, { hours, minutes });
  const end: Date = set(begin, { hours, minutes: minutes + duration });
  return { begin: begin.toISOString(), end: end.toISOString() };
}

export function transformReservation(
  reservation?: Pick<ReservationNodeT, "begin" | "end">
): PendingReservationFormType {
  const originalBegin = new Date(reservation?.begin ?? "");
  const originalEnd = new Date(reservation?.end ?? "");
  return {
    date: toUIDate(originalBegin),
    duration: differenceInMinutes(originalEnd, originalBegin),
    time: getTimeString(originalBegin),
    isControlsVisible: false,
  };
}
