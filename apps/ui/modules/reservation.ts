import {
  addMinutes,
  addSeconds,
  isAfter,
  addDays,
  roundToNearestMinutes,
  differenceInMinutes,
} from "date-fns";
import {
  type ReservationNode,
  ReservationStartInterval,
  CustomerTypeChoice,
  type ReservationMetadataFieldNode,
  type Maybe,
  type ListReservationsQuery,
  type IsReservableFieldsFragment,
  ReservationStateChoice,
  type ReservationUnitNode,
  OrderStatus,
  type ReservationOrderStatusFragment,
  type CancellationRuleFieldsFragment,
} from "@gql/gql-types";
import { getReservationApplicationFields } from "common/src/reservation-form/util";
import { getIntervalMinutes } from "common/src/helpers";
import { getTranslation } from "./util";
import { type TFunction } from "i18next";
import { type PendingReservation } from "@/modules/types";
import {
  type ReservableMap,
  type RoundPeriod,
  isRangeReservable,
} from "./reservable";

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

type CanUserCancelReservationProps = Pick<
  NonNullable<ReservationNodeT>,
  "state" | "begin"
> & {
  reservationUnit?: Maybe<Array<CancellationRuleFieldsFragment>> | undefined;
};
export function canUserCancelReservation(
  reservation: CanUserCancelReservationProps,
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
  > &
    CanUserCancelReservationProps;
  reservableTimes: ReservableMap;
  newReservation: PendingReservation;
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
/// Only called from the reservation edit page
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
    const isReservable = isRangeReservable({
      range: {
        start: new Date(newReservation.begin),
        end: new Date(newReservation.end),
      },
      reservationUnit,
      reservableTimes,
      activeApplicationRounds,
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
