import { gql } from "@apollo/client";
import { addMinutes, addSeconds, isAfter, roundToNearestMinutes, differenceInMinutes, set } from "date-fns";
import type { TFunction } from "i18next";
import { getIntervalMinutes } from "ui/src/modules/conversion";
import { formatTime, parseUIDate, isValidDate, timeToMinutes, formatDate } from "ui/src/modules/date-utils";
import type { LocalizationLanguages } from "ui/src/modules/urlBuilder";
import { logError } from "@ui/modules/errors";
import type { PendingReservationFormType } from "@/modules/schemas/reservationUnit";
import { ReservationStateChoice, OrderStatus, ReservationCancelReasonChoice } from "@gql/gql-types";
import type {
  ReservationNode,
  Maybe,
  ListReservationsQuery,
  IsReservableFieldsFragment,
  ReservationUnitNode,
  ReservationOrderStatusFragment,
  CancellationRuleFieldsFragment,
  BlockingReservationFieldsFragment,
  CanUserCancelReservationFragment,
  CanReservationBeChangedFragment,
  PaymentOrderNode,
  ReservationPaymentUrlFragment,
  ReservationStartInterval,
} from "@gql/gql-types";
import { isRangeReservable } from "./reservable";
import type { ReservableMap, RoundPeriod } from "./reservable";

// TimeSlots change the Calendar view. How many intervals are shown i.e. every half an hour, every hour
// we use every hour only => 2
export const SLOTS_EVERY_HOUR = 2;

/// @param opts subset of ReservationUnitNode
/// @param t translation function
/// opts should never include undefined values but our codegen doesn't properly type it
export function getDurationOptions(
  opts: Pick<ReservationUnitNode, "minReservationDuration" | "maxReservationDuration" | "reservationStartInterval">,
  t: TFunction
): Array<{ label: string; value: number }> {
  if (opts.minReservationDuration == null || opts.maxReservationDuration == null) {
    return [];
  }
  const intervalMinutes = getIntervalMinutes(opts.reservationStartInterval);
  if (!intervalMinutes) {
    return [];
  }

  const minuteString = (mins: number, hours: number) => {
    if (mins > 90) return t("common:abbreviations.minute", { count: mins % 60 });
    if (mins <= 90) return t("common:abbreviations.minute", { count: mins });
    if (mins !== 0)
      return t("common:abbreviations.minute", {
        count: mins - hours * 60,
      });
    return "";
  };

  const durationOptions: Array<{ label: string; value: number }> = [];
  const minReservationDurationMinutes = opts.minReservationDuration / 60;
  const maxReservationDurationMinutes = opts.maxReservationDuration / 60;
  const start = minReservationDurationMinutes > intervalMinutes ? minReservationDurationMinutes : intervalMinutes;

  for (let i = start; i <= maxReservationDurationMinutes; i += intervalMinutes) {
    const hours: number = Math.floor(i / 60);
    const hourString = i > 90 ? t("common:abbreviations.hour", { count: hours }) : "";

    const optionString = `${hourString} ${minuteString(i, hours)}`;
    durationOptions.push({
      label: optionString,
      value: i,
    });
  }

  return durationOptions;
}

function isReservationInThePast(reservation: Pick<ReservationNode, "beginsAt">): boolean {
  if (!reservation?.beginsAt) {
    return false;
  }

  const now = new Date().setSeconds(0, 0);
  return !isAfter(new Date(reservation.beginsAt).setSeconds(0, 0), now);
}

type ReservationQueryT = NonNullable<ListReservationsQuery["reservations"]>;
type ReservationEdgeT = NonNullable<ReservationQueryT["edges"]>[0];
type ReservationNodeT = NonNullable<NonNullable<ReservationEdgeT>["node"]>;

type IsWithinCancellationPeriodReservationT = Pick<ReservationNodeT, "beginsAt"> & {
  reservationUnit?: Readonly<CancellationRuleFieldsFragment>;
};

function isTooCloseToCancel(reservation: Readonly<IsWithinCancellationPeriodReservationT>): boolean {
  const reservationUnit = reservation.reservationUnit;
  const begin = new Date(reservation.beginsAt);

  const { canBeCancelledTimeBefore } = reservationUnit?.cancellationRule ?? {};
  const cancelLatest = addSeconds(begin, -(canBeCancelledTimeBefore ?? 0));
  const now = new Date();

  return cancelLatest < now;
}

export const CAN_USER_CANCEL_RESERVATION_FRAGMENT = gql`
  fragment CanUserCancelReservation on ReservationNode {
    id
    state
    beginsAt
    reservationUnit {
      id
      ...CancellationRuleFields
    }
  }
`;

export function isReservationCancellable(reservation: CanUserCancelReservationFragment): boolean {
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
  const reservationUnit = reservation.reservationUnit;
  const isReservationCancelled = reservation.state === ReservationStateChoice.Cancelled;
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

function shouldShowOrderStatus(state: Maybe<ReservationStateChoice> | undefined) {
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

export const RESERVATION_ORDER_STATUS_FRAGMENT = gql`
  fragment ReservationOrderStatus on ReservationNode {
    id
    state
    paymentOrder {
      id
      status
      checkoutUrl
    }
  }
`;

export function getNormalizedReservationOrderStatus(reservation: ReservationOrderStatusFragment): OrderStatus | null {
  if (!reservation) {
    return null;
  }

  if (shouldShowOrderStatus(reservation.state)) {
    return reservation.paymentOrder?.status ?? null;
  }

  return null;
}

function isReservationConfirmed(reservation: { state?: Maybe<ReservationStateChoice> | undefined }): boolean {
  return reservation.state === ReservationStateChoice.Confirmed;
}

function isReservationFreeOfCharge(reservation: Pick<ReservationNode, "price">): boolean {
  return !(Number(reservation.price) > 0);
}

export const CAN_RESERVATION_BE_CHANGED_FRAGMENT = gql`
  fragment CanReservationBeChanged on ReservationNode {
    endsAt
    isHandled
    price
    ...CanUserCancelReservation
  }
`;

export type CanReservationBeChangedProps = {
  reservation: CanReservationBeChangedFragment;
  reservableTimes: ReservableMap;
  reservationUnit: IsReservableFieldsFragment;
  activeApplicationRounds: ReadonlyArray<RoundPeriod>;
  blockingReservations: ReadonlyArray<BlockingReservationFieldsFragment>;
};

export function getWhyReservationCantBeChanged(reservation: CanReservationBeChangedFragment): string | null {
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

  const reservationUnit = reservation.reservationUnit;
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

export function isReservationEditable(reservation: CanReservationBeChangedFragment): boolean {
  if (getWhyReservationCantBeChanged(reservation) != null) {
    return false;
  }
  return true;
}

export function getNewReservation({
  start,
  end,
  reservationUnit,
}: {
  reservationUnit: Pick<ReservationUnitNode, "minReservationDuration" | "reservationStartInterval">;
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

  const minutes = minDurationMinutes < intervalMinutes ? intervalMinutes : minDurationMinutes;
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
    const wholeIntervals = Math.abs(Math.floor(durationMinutes / intervalMinutes));

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
  activeApplicationRounds: ReadonlyArray<RoundPeriod>;
  blockingReservations: ReadonlyArray<BlockingReservationFieldsFragment>;
}): FocusTimeSlot | { isReservable: false } {
  const [hours, minutes]: Array<number | undefined> = data.time
    .split(":")
    .map(Number)
    .filter((n) => Number.isFinite(n));
  const maybeDate = parseUIDate(data.date);
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
  const minutes = timeToMinutes(time);
  const maybeDate = parseUIDate(date);
  if (maybeDate != null && isValidDate(maybeDate)) {
    return set(maybeDate, { minutes });
  }
  return new Date();
}

// NOTE backend throws errors in some cases if we accidentally send seconds or milliseconds that are not 0
export function convertReservationFormToApi(
  formValues: PendingReservationFormType
): { beginsAt: string; endsAt: string } | null {
  const time = formValues.time;
  const date = parseUIDate(formValues.date);
  const duration = formValues.duration;
  if (date == null || time === "" || duration === 0) {
    return null;
  }
  const minutes = timeToMinutes(time);
  const begin: Date = set(date, { minutes, seconds: 0, milliseconds: 0 });
  const end: Date = addMinutes(begin, duration);
  return { beginsAt: begin.toISOString(), endsAt: end.toISOString() };
}

export function transformReservation(
  reservation?: Pick<ReservationNodeT, "beginsAt" | "endsAt">
): PendingReservationFormType {
  const originalBegin = new Date(reservation?.beginsAt ?? "");
  const originalEnd = new Date(reservation?.endsAt ?? "");
  return {
    date: formatDate(originalBegin),
    duration: differenceInMinutes(originalEnd, originalBegin),
    time: formatTime(originalBegin),
    isControlsVisible: false,
  };
}

export const RESERVATION_PAYMENT_URL_FRAGMENT = gql`
  fragment ReservationPaymentUrl on ReservationNode {
    id
    state
    pk
    paymentOrder {
      id
      status
      handledPaymentDueBy
      checkoutUrl
    }
    cancelReason
  }
`;

/// Get the payment url for a reservation
/// unified interface for both handled and direct payments
/// @return the payment url or undefined if the reservation is not waiting for payment
/// undefined is safe to assign to html a link href and disables the link
export function getPaymentUrl(
  reservation: ReservationPaymentUrlFragment,
  lang: LocalizationLanguages,
  apiBaseUrl: string
): string | undefined {
  const isExpired =
    reservation.state === ReservationStateChoice.Cancelled &&
    reservation.cancelReason === ReservationCancelReasonChoice.NotPaid;
  if (isExpired) {
    return undefined;
  }
  if (reservation.paymentOrder == null || reservation.pk == null) {
    return undefined;
  }

  // backend redirect payment url for handled reservations
  if (
    reservation.state === ReservationStateChoice.Confirmed &&
    reservation.paymentOrder.status === OrderStatus.Pending &&
    reservation.paymentOrder.handledPaymentDueBy
  ) {
    return getCheckoutRedirectUrl(reservation.pk, lang, apiBaseUrl);
  }

  // webstore checkout url for direct payments
  if (
    reservation.state === ReservationStateChoice.WaitingForPayment &&
    reservation.paymentOrder.status === OrderStatus.Draft &&
    reservation.paymentOrder.checkoutUrl
  ) {
    return getCheckoutUrl(reservation.paymentOrder, lang);
  }

  return undefined;
}

/// Get the pending payment url for a reservation (handled reservations)
/// browser only
function getCheckoutRedirectUrl(pk: number, lang: LocalizationLanguages, apiBaseUrl: string): string {
  if (window?.location == null) {
    throw new Error("window.location is not available, cannot build redirect url");
  }
  const langPrefix = lang !== "fi" ? `/${lang}` : "";
  const errorUrl = new URL(`${langPrefix}/reservations/${pk}`, window.location.origin);
  try {
    const url = new URL(`/v1/pay_pending_reservation/${pk}/`, apiBaseUrl);
    const { searchParams } = url;
    searchParams.set("lang", lang);
    searchParams.set("redirect_on_error", errorUrl.toString());
    return url.toString();
  } catch (err) {
    logError(err);
  }
  return "";
}

/// Get the direct payment (webstore) url for a reservation
/// @deprecated use getPaymentUrl instead because it's more robust
/// left because requires refactoring old users to include more ReservationNode parameters
export function getCheckoutUrl(
  order: Pick<PaymentOrderNode, "checkoutUrl"> | undefined | null,
  lang: LocalizationLanguages
): string | undefined {
  const { checkoutUrl } = order ?? {};

  if (!checkoutUrl) {
    return undefined;
  }

  try {
    const { origin, pathname, searchParams } = new URL(checkoutUrl);
    const baseUrl = `${origin}${pathname}`;
    searchParams.set("lang", lang);
    return `${baseUrl}${baseUrl.endsWith("/") ? "" : "/"}paymentmethod?${searchParams.toString()}`;
  } catch (err) {
    logError(err);
  }
  return undefined;
}
