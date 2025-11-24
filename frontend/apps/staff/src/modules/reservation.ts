import { gql } from "@apollo/client";
import { differenceInMinutes } from "date-fns";
import type { TFunction } from "i18next";
import type { CalendarEvent } from "ui/src/components/calendar/Calendar";
import { convertWeekday } from "ui/src/modules/conversion";
import {
  dateToMinutes,
  formatDateRange,
  formatDateTimeRange,
  formatDuration,
  formatTimeRange,
  parseApiDate,
  fromApiDateTime,
  parseValidDateObject,
  formatDateTime,
} from "ui/src/modules/date-utils";
import { filterNonNullable, sort, toNumber } from "ui/src/modules/helpers";
import { formatters as getFormatters, getReservationPrice, getUnRoundedReservationVolume } from "@ui/index";
import { getReserveeName, getReserveeTypeTranslationKey } from "@/modules/helpers";
import {
  type CreateTagStringFragment,
  ReserveeType,
  type Maybe,
  PriceUnit,
  type PricingFieldsFragment,
  type ReservationNode,
  type ReservationPageQuery,
  ReservationPriceDetailsFieldsFragment,
  ReservationTypeChoice,
  ReservationUnitPricingFieldsFragment,
  EventStyleReservationFieldsFragment,
} from "@gql/gql-types";

export type EventType = EventStyleReservationFieldsFragment;
export type CalendarEventType = CalendarEvent<EventType>;

type ReservationType = NonNullable<ReservationPageQuery["reservation"]>;

function reservationUnitName(reservationUnit: Maybe<CreateTagStringFragment["reservationUnit"]>): string {
  return reservationUnit ? `${reservationUnit.nameFi}, ${reservationUnit.unit?.nameFi || ""}` : "-";
}

export function formatReservationPrice(t: TFunction, reservation: ReservationType): string {
  return getReservationPrice(reservation.price, t("reservation:noPrice"), true);
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

function getBeginTime(p: PricingFieldsFragment): number {
  return parseApiDate(p.begins)?.getTime() ?? 0;
}

/** returns reservation unit pricing at given date */
export function getReservationUnitPricing(
  reservationUnit: ReservationUnitPricingFieldsFragment,
  from: Date
): PricingFieldsFragment | null {
  if (reservationUnit.pricings.length === 0) {
    return null;
  }

  const pricings = sort(reservationUnit.pricings, (a, b) => getBeginTime(a) - getBeginTime(b));

  // Find the first pricing that is valid at the given date
  // requires using reduce because we have no end dates => the last begin should be used
  return pricings.reduce<(typeof pricings)[0] | null>((prev, current) => {
    const begin = parseApiDate(current.begins);
    if (begin != null && begin.getTime() <= from.getTime()) {
      return current;
    }
    return prev;
  }, null);
}

export const RESERVATION_UNIT_PRICING_FRAGMENT = gql`
  fragment ReservationUnitPricingFields on ReservationUnitNode {
    id
    pricings {
      id
      ...PricingFields
    }
  }
`;

export const RESERVATION_PRICE_DETAILS_FRAGMENT = gql`
  fragment ReservationPriceDetailsFields on ReservationNode {
    id
    beginsAt
    endsAt
    appliedPricing {
      taxPercentage
    }
    reservationUnit {
      ...ReservationUnitPricingFields
    }
  }
`;

/// TODO refactor this to use reasonable formatting (modern i18next)
export function getReservationPriceDetails(reservation: ReservationPriceDetailsFieldsFragment, t: TFunction): string {
  const begin = new Date(reservation.beginsAt);
  const end = new Date(reservation.endsAt);
  const resUnit = reservation.reservationUnit ?? null;
  const durationMinutes = differenceInMinutes(end, begin);
  const pricing = resUnit ? getReservationUnitPricing(resUnit, begin) : null;

  if (pricing == null) {
    return "???";
  }

  const { priceUnit } = pricing;
  const volume = getUnRoundedReservationVolume(durationMinutes, priceUnit);

  const maxPrice = pricing.highestPrice;
  const formatters = getFormatters("fi");

  const taxPercentage = toNumber(reservation.appliedPricing?.taxPercentage) ?? 0;
  return priceUnit === PriceUnit.Fixed
    ? getReservationPrice(maxPrice, t("reservation:noPrice"), false)
    : t("reservation:ApproveDialog.priceBreakdown", {
        volume: formatters.strippedDecimal?.format(volume),
        units: t(`reservation:ApproveDialog.priceUnits.${priceUnit}`),
        vatPercent: formatters.oneDecimal?.format(taxPercentage),
        unit: t(`reservation:ApproveDialog.priceUnit.${priceUnit}`),
        unitPrice: getReservationPrice(maxPrice, "", false),
        price: getReservationPrice(String(volume * (toNumber(maxPrice) ?? 0)), t("reservation:noPrice"), false),
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

// TODO rename: it's the time + duration
// recurring format: {weekday(s)} {time}, {duration} | {startDate}-{endDate} | {unit}
// single format   : {weekday} {date} {time}, {duration} | {unit}
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
    .reduce((agv, x) => `${agv}${agv.length > 0 ? "," : ""} ${x}`, ""); // Why not just use ARRAY.join(", ")

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
