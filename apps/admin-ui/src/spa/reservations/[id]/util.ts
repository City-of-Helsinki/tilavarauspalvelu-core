import { differenceInMinutes, format } from "date-fns";
import type { TFunction } from "i18next";
import {
  formatters as getFormatters,
  getReservationPrice,
  getUnRoundedReservationVolume,
} from "common";
import {
  type Maybe,
  CustomerTypeChoice,
  PriceUnit,
  PricingType,
  ReservationTypeChoice,
  type ReservationCommonFragment,
  type PricingFieldsFragment,
  type ReservationQuery,
} from "@gql/gql-types";
import { formatDuration, fromApiDate } from "common/src/common/util";
import {
  formatDateTimeRange,
  formatDate,
  getReserveeName,
} from "@/common/util";
import { fromAPIDateTime } from "@/helpers";
import { filterNonNullable } from "common/src/helpers";

type ReservationType = NonNullable<ReservationQuery["reservation"]>;
type ReservationUnitType = NonNullable<ReservationType["reservationUnit"]>[0];

function reservationUnitName(
  reservationUnit: Maybe<ReservationUnitType>
): string {
  return reservationUnit
    ? `${reservationUnit.nameFi}, ${reservationUnit.unit?.nameFi || ""}`
    : "-";
}

export function reservationPrice(
  reservation: ReservationType,
  t: TFunction
): string {
  return getReservationPrice(
    reservation.price,
    t("RequestedReservation.noPrice"),
    true
  );
}

/** returns reservation unit pricing at given date */
export function getReservatinUnitPricing(
  reservationUnit: Maybe<Pick<ReservationUnitType, "pricings">> | undefined,
  datetime: string
): PricingFieldsFragment | null {
  if (!reservationUnit?.pricings || reservationUnit.pricings.length === 0) {
    return null;
  }

  const reservationDate = new Date(datetime);

  reservationUnit.pricings.sort((a, b) =>
    a?.begins && b?.begins
      ? (fromApiDate(a.begins)?.getTime() ?? 0) -
        (fromApiDate(b.begins)?.getTime() ?? 0)
      : 1
  );

  return reservationUnit.pricings.reduce((prev, current) => {
    if ((fromApiDate(current?.begins) ?? 0) < reservationDate) {
      return current;
    }
    return prev;
  }, reservationUnit.pricings[0]);
}

/// TODO refactor this to use reasonable formatting (modern i18next)
export function getReservationPriceDetails(
  reservation: ReservationType,
  t: TFunction
): string {
  const durationMinutes = differenceInMinutes(
    new Date(reservation.end),
    new Date(reservation.begin)
  );

  const pricing = getReservatinUnitPricing(
    reservation.reservationUnit?.[0],
    reservation.begin
  );

  if (pricing == null) return "???";

  const { priceUnit } = pricing;
  const volume = getUnRoundedReservationVolume(durationMinutes, priceUnit);

  const maxPrice =
    pricing.pricingType === PricingType.Paid ? pricing.highestPrice : "0";
  const formatters = getFormatters("fi");

  const taxP = Number(pricing.taxPercentage?.value ?? "");
  const taxPercentage = Number.isNaN(taxP) ? 0 : taxP;
  return priceUnit === PriceUnit.Fixed
    ? getReservationPrice(maxPrice, t("RequestedReservation.noPrice"), false)
    : t("RequestedReservation.ApproveDialog.priceBreakdown", {
        volume: formatters.strippedDecimal.format(volume),
        units: t(`RequestedReservation.ApproveDialog.priceUnits.${priceUnit}`),
        vatPercent: formatters.oneDecimal.format(taxPercentage),
        unit: t(`RequestedReservation.ApproveDialog.priceUnit.${priceUnit}`),
        unitPrice: getReservationPrice(maxPrice, "", false),
        price: getReservationPrice(
          String(volume * parseFloat(maxPrice)),
          t("RequestedReservation.noPrice"),
          false
        ),
      });
}

function reserveeTypeToTranslationKey(
  reserveeType: CustomerTypeChoice,
  isUnregisteredAssociation: boolean
) {
  switch (reserveeType) {
    case CustomerTypeChoice.Business:
    case CustomerTypeChoice.Individual:
      return `CustomerTypeChoice.${reserveeType}`;
    case CustomerTypeChoice.Nonprofit:
      return `CustomerTypeChoice.${reserveeType}.${
        isUnregisteredAssociation ? "UNREGISTERED" : "REGISTERED"
      }`;
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
    ? reserveeTypeToTranslationKey(
        reserveeType,
        isUnregisteredAssociation ?? false
      )
    : "";
  return [`ReservationType.${reservationType}`, reserveeTypeTranslationKey];
}

export function getName(
  reservation: ReservationCommonFragment & {
    name?: string | null;
  },
  t: TFunction
): string {
  if (reservation.name) {
    return `${reservation.pk}, ${reservation.name}`.trim();
  }

  return `${reservation.pk}, ${
    getReserveeName(reservation, t) || t("RequestedReservation.noName")
  }`.trim();
}

// TODO rename: it's the time + duration
// recurring format: {weekday(s)} {time}, {duration} | {startDate}-{endDate} | {unit}
// single format   : {weekday} {date} {time}, {duration} | {unit}
export function createTagString(
  reservation: ReservationType,
  t: TFunction
): string {
  try {
    if (reservation.recurringReservation != null) {
      return createRecurringTagString(reservation, t);
    }
    return createSingleTagString(reservation, t);
  } catch (e) {
    return "";
  }
}

function createSingleTagString(
  reservation: ReservationType,
  t: TFunction
): string {
  const begin = new Date(reservation.begin);
  const end = new Date(reservation.end);
  const singleDateTimeTag = formatDateTimeRange(t, begin, end);

  const unitTag = reservation?.reservationUnit
    ?.map(reservationUnitName)
    .join(", ");

  const durMinutes = differenceInMinutes(end, begin);
  const abbreviated = true;
  const durationTag = formatDuration(durMinutes, t, abbreviated);

  return `${singleDateTimeTag}, ${durationTag} | ${unitTag}`;
}

function createRecurringTagString(
  reservation: ReservationType,
  t: TFunction
): string {
  const { recurringReservation } = reservation;
  const { beginDate, beginTime, endDate, endTime, weekdays } =
    recurringReservation ?? {};
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
  const unitTag = reservation?.reservationUnit
    ?.map(reservationUnitName)
    .join(", ");

  const weekDayTag = reservation.recurringReservation?.weekdays
    ?.sort()
    ?.map((x) => t(`dayShort.${x}`))
    ?.reduce((agv, x) => `${agv}${agv.length > 0 ? "," : ""} ${x}`, "");

  const begin = fromAPIDateTime(beginDate, beginTime);
  const end = fromAPIDateTime(endDate, endTime);
  if (begin == null || end == null) {
    return "";
  }

  const durMinutes = differenceInMinutes(
    new Date(reservation.end),
    new Date(reservation.begin)
  );
  const abbreviated = true;
  const durationTag = formatDuration(durMinutes, t, abbreviated);

  const recurringDateTag = `${weekDayTag} ${format(begin, "HH:mm")}–${format(end, "HH:mm")}`;

  return `${recurringDateTag}, ${durationTag} ${
    recurringTag.length > 0 ? " | " : ""
  } ${recurringTag} | ${unitTag}`;
}
