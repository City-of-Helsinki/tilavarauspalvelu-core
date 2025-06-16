import { differenceInMinutes, format } from "date-fns";
import type { TFunction } from "i18next";
import { formatters as getFormatters, getReservationPrice, getUnRoundedReservationVolume } from "common";
import {
  type Maybe,
  CustomerTypeChoice,
  PriceUnit,
  ReservationTypeChoice,
  type PricingFieldsFragment,
  type ReservationPageQuery,
  type CreateTagStringFragment,
  type ReservationNode,
  ReservationUnitPricingFieldsFragment,
  ReservationPriceDetailsFieldsFragment,
} from "@gql/gql-types";
import { formatDuration, fromApiDate } from "common/src/common/util";
import { formatDateTimeRange, formatDate, getReserveeName } from "@/common/util";
import { fromAPIDateTime } from "@/helpers";
import { filterNonNullable, sort, toNumber } from "common/src/helpers";
import { gql } from "@apollo/client";

type ReservationType = NonNullable<ReservationPageQuery["reservation"]>;

function reservationUnitName(reservationUnit: Maybe<CreateTagStringFragment["reservationUnits"][0]>): string {
  return reservationUnit ? `${reservationUnit.nameFi}, ${reservationUnit.unit?.nameFi || ""}` : "-";
}

export function reservationPrice(reservation: ReservationType, t: TFunction): string {
  return getReservationPrice(reservation.price, t("RequestedReservation.noPrice"), true);
}

function getBeginTime(p: PricingFieldsFragment): number {
  return fromApiDate(p.begins)?.getTime() ?? 0;
}

/** returns reservation unit pricing at given date */
export function getReservatinUnitPricing(
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
    begin
    end
    reservationUnits {
      ...ReservationUnitPricingFields
    }
  }
`;

/// TODO refactor this to use reasonable formatting (modern i18next)
export function getReservationPriceDetails(reservation: ReservationPriceDetailsFieldsFragment, t: TFunction): string {
  const begin = new Date(reservation.begin);
  const end = new Date(reservation.end);
  const resUnit = reservation.reservationUnits?.[0] ?? null;
  const durationMinutes = differenceInMinutes(end, begin);
  const pricing = resUnit ? getReservatinUnitPricing(resUnit, begin) : null;

  if (pricing == null) {
    return "???";
  }

  const { priceUnit } = pricing;
  const volume = getUnRoundedReservationVolume(durationMinutes, priceUnit);

  const maxPrice = pricing.highestPrice;
  const formatters = getFormatters("fi");

  const taxPercentage = toNumber(pricing.taxPercentage.value) ?? 0;
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

function reserveeTypeToTranslationKey(reserveeType: CustomerTypeChoice, isUnregisteredAssociation: boolean) {
  switch (reserveeType) {
    case CustomerTypeChoice.Business:
    case CustomerTypeChoice.Individual:
      return `CustomerTypeChoice.${reserveeType}`;
    case CustomerTypeChoice.Nonprofit:
      return `CustomerTypeChoice.${reserveeType}.${isUnregisteredAssociation ? "UNREGISTERED" : "REGISTERED"}`;
    default:
      return "";
  }
}

export function getTranslationKeyForCustomerTypeChoice(
  reservationType: Maybe<ReservationTypeChoice> | undefined,
  reserveeType: Maybe<CustomerTypeChoice> | undefined,
  isUnregisteredAssociation: Maybe<boolean> | undefined
): string[] {
  if (!reservationType) {
    return ["errors.missingReservationNode"];
  }
  if (reservationType === ReservationTypeChoice.Blocked) {
    return ["ReservationType.BLOCKED"];
  }

  const reserveeTypeTranslationKey = reserveeType
    ? reserveeTypeToTranslationKey(reserveeType, isUnregisteredAssociation ?? false)
    : "";
  return [`ReservationType.${reservationType}`, reserveeTypeTranslationKey];
}

export function translateReservationCustomerType(
  res: Pick<ReservationType, "type" | "reserveeType" | "reserveeIsUnregisteredAssociation">,
  t: TFunction
): string {
  const [part1, part2] = getTranslationKeyForCustomerTypeChoice(
    res.type,
    res.reserveeType,
    res.reserveeIsUnregisteredAssociation
  );
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
    if (reservation.recurringReservation != null) {
      return createRecurringTagString(reservation, t);
    }
    return createSingleTagString(reservation, t);
  } catch (_) {
    return "";
  }
}

function createSingleTagString(reservation: CreateTagStringFragment, t: TFunction): string {
  const begin = new Date(reservation.begin);
  const end = new Date(reservation.end);
  const singleDateTimeTag = formatDateTimeRange(t, begin, end);

  const unitTag = reservation?.reservationUnits?.map(reservationUnitName).join(", ");

  const durMinutes = differenceInMinutes(end, begin);
  const durationTag = formatDuration(t, { minutes: durMinutes });

  return `${singleDateTimeTag}, ${durationTag} | ${unitTag}`;
}

function createRecurringTagString(reservation: CreateTagStringFragment, t: TFunction): string {
  const { recurringReservation } = reservation;
  const { beginDate, beginTime, endDate, endTime, weekdays } = recurringReservation ?? {};
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
  const unitTag = reservation?.reservationUnits?.map(reservationUnitName).join(", ");

  const weekDayTag = sort(filterNonNullable(weekdays), (a, b) => a - b)
    .map((x) => t(`dayShort.${x}`))
    .reduce((agv, x) => `${agv}${agv.length > 0 ? "," : ""} ${x}`, "");

  const begin = fromAPIDateTime(beginDate, beginTime);
  const end = fromAPIDateTime(endDate, endTime);
  if (begin == null || end == null) {
    return "";
  }

  const durMinutes = differenceInMinutes(new Date(reservation.end), new Date(reservation.begin));
  const durationTag = formatDuration(t, { minutes: durMinutes });

  const recurringDateTag = `${weekDayTag} ${format(begin, "HH:mm")}–${format(end, "HH:mm")}`;

  return `${recurringDateTag}, ${durationTag} ${recurringTag.length > 0 ? " | " : ""} ${recurringTag} | ${unitTag}`;
}

export const CREATE_TAG_STRING_FRAGMENT = gql`
  fragment CreateTagString on ReservationNode {
    id
    begin
    end
    reservationUnits {
      id
      nameFi
      unit {
        id
        nameFi
      }
    }
    recurringReservation {
      id
      beginDate
      beginTime
      endDate
      endTime
      weekdays
    }
  }
`;
