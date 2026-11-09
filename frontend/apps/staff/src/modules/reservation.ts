import { gql } from "@apollo/client";
import { differenceInMinutes } from "date-fns";
import type { TFunction } from "i18next";
import { formatters as getFormatters, getReservationPrice } from "@ui/index";
import type { CalendarEvent } from "ui/src/components/calendar/Calendar";
import { convertWeekday } from "ui/src/modules/conversion";
import {
  dateToMinutes,
  formatDateRange,
  formatDateTimeRange,
  formatDuration,
  formatTimeRange,
  fromApiDateTime,
  parseValidDateObject,
  formatDateTime,
} from "ui/src/modules/date-utils";
import { filterNonNullable, sort, toNumber } from "ui/src/modules/helpers";
import { PriceUnit, ReservationTypeChoice } from "@gql/gql-types";
import type {
  CreateTagStringFragment,
  Maybe,
  ReservationNode,
  ReservationPageQuery,
  ReserveeType,
  ReservationPriceDetailsFieldsFragment,
  EventStyleReservationFieldsFragment,
} from "@gql/gql-types";
import { getReserveeName, getReserveeTypeTranslationKey } from "@/modules/helpers";

export type EventType = EventStyleReservationFieldsFragment;
export type CalendarEventType = CalendarEvent<EventType>;

type ReservationType = NonNullable<ReservationPageQuery["reservation"]>;

function reservationUnitName(reservationUnit: Maybe<CreateTagStringFragment["reservationUnit"]>): string {
  return reservationUnit ? `${reservationUnit.nameFi}, ${reservationUnit.unit?.nameFi || ""}` : "-";
}

export function formatReservationPrice(t: TFunction, reservation: ReservationType): string {
  return getReservationPrice(reservation.totalPrice, t("reservation:noPrice"), true);
}

export function formatReservationPriceLong(t: TFunction, reservation: ReservationType): string {
  const dueBy = reservation.paymentOrder?.handledPaymentDueBy;
  const dueByString = dueBy
    ? ` (${t("reservation:dueBy", {
        date: formatDateTime(new Date(dueBy), {
          includeTimeSeparator: true,
        }),
      })})`
    : "";
  const subventionString = reservation.applyingForFreeOfCharge ? `, ${t("reservation:appliesSubvention")}` : "";
  return `${formatReservationPrice(t, reservation)}${dueByString}${subventionString}`;
}

export const RESERVATION_PRICE_DETAILS_FRAGMENT = gql`
  fragment ReservationPriceDetailsFields on ReservationNode {
    id
    totalPrice
    totalPriceWithoutOverrides
    priceLines {
      id
      pk
      quantity
      priceUnit
      unitAmount
      amount
      overrideAmount
      taxPercentage
    }
  }
`;

/// The normal price of the reservation is free. A handler override of a line does not change it.
export function isReservationPriceFree(reservation: ReservationPriceDetailsFieldsFragment): boolean {
  return (toNumber(reservation.totalPriceWithoutOverrides) ?? 0) === 0;
}

/// The calculation of the normal price, for the handler.
/// The text supports one price line. Without exactly one line, it shows only the normal total price.
export function getReservationPriceDetails(reservation: ReservationPriceDetailsFieldsFragment, t: TFunction): string {
  const priceLineList = reservation.priceLines ?? [];
  const line = priceLineList.length === 1 ? priceLineList[0] : undefined;
  if (line == null) {
    return getReservationPrice(reservation.totalPriceWithoutOverrides, t("reservation:noPrice"), false);
  }
  if (line.priceUnit === PriceUnit.Fixed) {
    return getReservationPrice(line.amount, t("reservation:noPrice"), false);
  }

  const formatters = getFormatters("fi");
  return t("reservation:ApproveDialog.priceBreakdown", {
    volume: formatters.strippedDecimal?.format(toNumber(line.quantity) ?? 0),
    units: t(`reservation:ApproveDialog.priceUnits.${line.priceUnit}`),
    vatPercent: formatters.oneDecimal?.format(toNumber(line.taxPercentage) ?? 0),
    unit: t(`reservation:ApproveDialog.priceUnit.${line.priceUnit}`),
    unitPrice: getReservationPrice(line.unitAmount, "", false),
    price: getReservationPrice(line.amount, t("reservation:noPrice"), false),
  });
}

export function getTranslationKeyForCustomerTypeChoice(
  reservationType: Maybe<ReservationTypeChoice> | undefined,
  reserveeType: Maybe<ReserveeType> | undefined,
  reserveeIdentifier: Maybe<string> | undefined
): string[] {
  if (!reservationType) {
    return ["errors:missingReservationNode"];
  }
  if (reservationType === ReservationTypeChoice.Blocked) {
    return ["translation:reservationType.BLOCKED"];
  }

  const reserveeTypeTranslationKey = reserveeType
    ? (getReserveeTypeTranslationKey(reserveeType, reserveeIdentifier) ?? "")
    : "";
  return [`translation:reservationType.${reservationType}`, reserveeTypeTranslationKey];
}

export function translateReservationCustomerType(
  res: Pick<ReservationType, "type" | "reserveeType" | "reserveeIdentifier">,
  t: TFunction
): string {
  const [part1, part2] = getTranslationKeyForCustomerTypeChoice(res.type, res.reserveeType, res.reserveeIdentifier);
  const part2WithSpace = part2 ? ` ${t(part2)}` : "";
  return `${t(part1 ?? "")}${part2WithSpace}`;
}

export function getName(
  reservation: Pick<ReservationNode, "name" | "pk" | "type" | "reserveeName">,
  t: TFunction
): string {
  if (reservation.name) {
    return `${reservation.pk}, ${reservation.name}`.trim();
  }

  return `${reservation.pk}, ${getReserveeName(reservation, t) || t("reservation:noName")}`.trim();
}

/// recurring format: {weekday(s)} {time}, {duration} | {startDate}-{endDate} | {unit}
/// single format   : {weekday} {date} {time}, {duration} | {unit}
export function createTagString(reservation: CreateTagStringFragment, t: TFunction): string {
  try {
    if (reservation.reservationSeries != null) {
      return createRecurringTagString(reservation, t);
    }
    return createSingleTagString(reservation, t);
  } catch {
    return "";
  }
}

function createSingleTagString(reservation: CreateTagStringFragment, t: TFunction): string {
  const begin = new Date(reservation.beginsAt);
  const end = new Date(reservation.endsAt);
  const singleDateTimeTag = formatDateTimeRange(begin, end, { t });

  const unitTag = reservationUnitName(reservation.reservationUnit);

  const durMinutes = differenceInMinutes(end, begin);
  const durationTag = formatDuration(t, { minutes: durMinutes });

  return `${singleDateTimeTag}, ${durationTag} | ${unitTag}`;
}

function createRecurringTagString(reservation: CreateTagStringFragment, t: TFunction): string {
  const { reservationSeries } = reservation;
  const { beginDate, beginTime, endDate, endTime, weekdays } = reservationSeries ?? {};
  if (
    endDate == null ||
    beginDate == null ||
    beginTime == null ||
    endTime == null ||
    filterNonNullable(weekdays).length === 0
  ) {
    return "";
  }

  const recurringTag = formatDateRange(parseValidDateObject(beginDate), parseValidDateObject(endDate), {
    includeWeekday: false,
  });
  const unitTag = reservationUnitName(reservation.reservationUnit);

  const begin = fromApiDateTime(beginDate, beginTime);
  const end = fromApiDateTime(endDate, endTime);
  if (begin == null || end == null) {
    return "";
  }

  const weekDayTag = sort(filterNonNullable(weekdays), (a, b) => convertWeekday(a) - convertWeekday(b))
    .map((x) => t(`translation:dayShort.${x}`))
    .reduce((agv, x) => `${agv}${agv.length > 0 ? "," : ""} ${x}`, "");

  const durMinutes = differenceInMinutes(new Date(reservation.endsAt), new Date(reservation.beginsAt));
  const durationTag = formatDuration(t, { minutes: durMinutes });

  const recurringDateTag = `${weekDayTag} ${formatTimeRange(dateToMinutes(begin), dateToMinutes(end))}`;

  return `${recurringDateTag}, ${durationTag} ${recurringTag.length > 0 ? " | " : ""} ${recurringTag} | ${unitTag}`;
}

export const CREATE_TAG_STRING_FRAGMENT = gql`
  fragment CreateTagString on ReservationNode {
    id
    beginsAt
    endsAt
    reservationUnit {
      id
      nameFi
      unit {
        id
        nameFi
      }
    }
    reservationSeries {
      id
      beginDate
      beginTime
      endDate
      endTime
      weekdays
    }
  }
`;
