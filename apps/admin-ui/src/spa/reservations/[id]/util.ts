import { differenceInMinutes, format } from "date-fns";
import type { TFunction } from "i18next";
import { formatters as getFormatters, getReservationPrice, getUnRoundedReservationVolume } from "common";
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
} from "@gql/gql-types";
import { formatDuration, fromApiDate } from "common/src/common/util";
import { formatDate, formatDateTimeRange, getReserveeName } from "@/common/util";
import { fromAPIDateTime } from "@/helpers";
import { filterNonNullable, sort, toNumber } from "common/src/helpers";
import { gql } from "@apollo/client";
import { convertWeekday } from "common/src/conversion";

type ReservationType = NonNullable<ReservationPageQuery["reservation"]>;

function reservationUnitName(reservationUnit: Maybe<CreateTagStringFragment["reservationUnit"]>): string {
  return reservationUnit ? `${reservationUnit.nameFi}, ${reservationUnit.unit?.nameFi || ""}` : "-";
}

export function reservationPrice(reservation: ReservationType, t: TFunction): string {
  return getReservationPrice(reservation.price, t("RequestedReservation.noPrice"), true);
}

function getBeginTime(p: PricingFieldsFragment): number {
  return fromApiDate(p.begins)?.getTime() ?? 0;
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
    const begin = fromApiDate(current.begins);
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
    ? getReservationPrice(maxPrice, t("RequestedReservation.noPrice"), false)
    : t("RequestedReservation.ApproveDialog.priceBreakdown", {
        volume: formatters.strippedDecimal?.format(volume),
        units: t(`RequestedReservation.ApproveDialog.priceUnits.${priceUnit}`),
        vatPercent: formatters.oneDecimal?.format(taxPercentage),
        unit: t(`RequestedReservation.ApproveDialog.priceUnit.${priceUnit}`),
        unitPrice: getReservationPrice(maxPrice, "", false),
        price: getReservationPrice(
          String(volume * (toNumber(maxPrice) ?? 0)),
          t("RequestedReservation.noPrice"),
          false
        ),
      });
}

function reserveeTypeToTranslationKey(reserveeType: ReserveeType, isRegisteredAssociation: boolean) {
  switch (reserveeType) {
    case ReserveeType.Company:
    case ReserveeType.Individual:
      return `ReserveeType.${reserveeType}`;
    case ReserveeType.Nonprofit:
      return `ReserveeType.${reserveeType}.${isRegisteredAssociation ? "REGISTERED" : "UNREGISTERED"}`;
    default:
      return "";
  }
}

export function getTranslationKeyForCustomerTypeChoice(
  reservationType: Maybe<ReservationTypeChoice> | undefined,
  reserveeType: Maybe<ReserveeType> | undefined,
  reserveeIdentifier: Maybe<string> | undefined
): string[] {
  if (!reservationType) {
    return ["errors.missingReservationNode"];
  }
  if (reservationType === ReservationTypeChoice.Blocked) {
    return ["ReservationType.BLOCKED"];
  }

  const reserveeTypeTranslationKey = reserveeType
    ? reserveeTypeToTranslationKey(reserveeType, !!reserveeIdentifier)
    : "";
  return [`ReservationType.${reservationType}`, reserveeTypeTranslationKey];
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

  return `${reservation.pk}, ${getReserveeName(reservation, t) || t("RequestedReservation.noName")}`.trim();
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
  } catch (_) {
    return "";
  }
}

function createSingleTagString(reservation: CreateTagStringFragment, t: TFunction): string {
  const begin = new Date(reservation.beginsAt);
  const end = new Date(reservation.endsAt);
  const singleDateTimeTag = formatDateTimeRange(t, begin, end);

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

  const recurringTag = `${formatDate(beginDate)}–${formatDate(endDate)}`;
  const unitTag = reservationUnitName(reservation.reservationUnit);

  const begin = fromAPIDateTime(beginDate, beginTime);
  const end = fromAPIDateTime(endDate, endTime);
  if (begin == null || end == null) {
    return "";
  }

  const weekDayTag = sort(filterNonNullable(weekdays), (a, b) => convertWeekday(a) - convertWeekday(b))
    .map((x) => t(`dayShort.${x}`))
    .reduce((agv, x) => `${agv}${agv.length > 0 ? "," : ""} ${x}`, ""); // Why not just use ARRAY.join(", ")

  const durMinutes = differenceInMinutes(new Date(reservation.endsAt), new Date(reservation.beginsAt));
  const durationTag = formatDuration(t, { minutes: durMinutes });

  const recurringDateTag = `${weekDayTag} ${format(begin, "HH:mm")}–${format(end, "HH:mm")}`;

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
