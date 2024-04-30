import { differenceInMinutes, format, getDay, isSameDay } from "date-fns";
import type { TFunction } from "i18next";
import { trim } from "lodash";
import {
  formatters as getFormatters,
  getReservationPrice,
  getUnRoundedReservationVolume,
} from "common";
import {
  type AgeGroupNode,
  type Maybe,
  CustomerTypeChoice,
  type ReservationNode,
  type ReservationUnitPricingNode,
  PriceUnit,
  PricingType,
  type ReservationUnitNode,
  ReservationTypeChoice,
} from "common/types/gql-types";
import { formatDuration, fromApiDate } from "common/src/common/util";
import { toMondayFirst } from "common/src/helpers";
import { truncate } from "@/helpers";
import { DATE_FORMAT, formatDate, formatTime } from "@/common/util";

export const reservationDateTime = (
  start: Date,
  end: Date,
  t: TFunction
): string => {
  const startDay = t(`dayShort.${toMondayFirst(getDay(start))}`);

  if (isSameDay(start, end)) {
    return `${startDay} ${format(start, DATE_FORMAT)} ${format(
      start,
      "HH:mm"
    )}-${format(end, "HH:mm")}`;
  }

  return `${format(start, DATE_FORMAT)} ${format(start, "HH:mm")}-${format(
    end,
    "HH:mm"
  )} ${format(end, "HH:mm")}`;
};

export const reservationDateTimeString = (
  start: string,
  end: string,
  t: TFunction
): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return reservationDateTime(startDate, endDate, t);
};

function reservationDurationString(
  start: string,
  end: string,
  t: TFunction
): string {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const durMinutes = differenceInMinutes(endDate, startDate);
  const abbreviated = true;
  return formatDuration(durMinutes, t, abbreviated);
}

export const reservationUnitName = (
  reservationUnit: Maybe<ReservationUnitNode>
): string =>
  reservationUnit
    ? `${reservationUnit.nameFi}, ${reservationUnit.unit?.nameFi || ""}`
    : "-";

export const reservationPrice = (
  reservation: ReservationNode,
  t: TFunction
): string => {
  return getReservationPrice(
    reservation.price,
    t("RequestedReservation.noPrice"),
    "fi",
    true
  );
};

/** returns reservation unit pricing at given date */
export const getReservatinUnitPricing = (
  reservationUnit: Maybe<ReservationUnitNode> | undefined,
  datetime: string
): ReservationUnitPricingNode | null => {
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

  return (
    (reservationUnit.pricings || []) as ReservationUnitPricingNode[]
  ).reduce((prev, current) => {
    if ((fromApiDate(current?.begins) ?? 0) < reservationDate) {
      return current;
    }
    return prev;
  }, reservationUnit.pricings[0]);
};

export const getReservationPriceDetails = (
  reservation: ReservationNode,
  t: TFunction
): string => {
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

  const taxP = parseFloat(pricing.taxPercentage?.value ?? "");
  const taxPercentage = Number.isNaN(taxP) ? 0 : taxP;
  return priceUnit === PriceUnit.Fixed
    ? getReservationPrice(maxPrice, t("RequestedReservation.noPrice"))
    : t("RequestedReservation.ApproveDialog.priceBreakdown", {
        volume: formatters.strippedDecimal.format(volume),
        units: t(`RequestedReservation.ApproveDialog.priceUnits.${priceUnit}`),
        vatPercent: formatters.whole.format(taxPercentage),
        unit: t(`RequestedReservation.ApproveDialog.priceUnit.${priceUnit}`),
        unitPrice: getReservationPrice(maxPrice, ""),
        price: getReservationPrice(
          String(volume * parseFloat(maxPrice)),
          t("RequestedReservation.noPrice"),
          "fi"
        ),
      });
};

export const ageGroup = (
  group: Maybe<AgeGroupNode> | undefined
): string | null => (group ? `${group.minimum}-${group.maximum || ""}` : null);

const reserveeTypeToTranslationKey = (
  reserveeType: CustomerTypeChoice,
  isUnregisteredAssociation: boolean
) => {
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
};

export const getTranslationKeyForCustomerTypeChoice = (
  reservationType?: ReservationTypeChoice,
  reserveeType?: CustomerTypeChoice,
  isUnregisteredAssociation?: boolean
): string[] => {
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
};

export const getReserveeName = (
  reservation: ReservationNode,
  t?: TFunction,
  length = 50
): string => {
  let prefix = "";
  if (reservation.type === ReservationTypeChoice.Behalf) {
    prefix = t ? t("Reservations.prefixes.behalf") : "";
  }
  if (
    // commented extra condition out for now, as the staff prefix was requested to be used for all staff reservations
    reservation.type === ReservationTypeChoice.Staff /* &&
    reservation.reserveeName ===
      `${reservation.user?.firstName} ${reservation.user?.lastName}` */
  ) {
    prefix = t ? t("Reservations.prefixes.staff") : "";
  }
  return truncate(prefix + reservation.reserveeName, length);
};

export const getName = (reservation: ReservationNode, t: TFunction) => {
  if (reservation.name) {
    return trim(`${reservation.pk}, ${reservation.name}`);
  }

  return trim(
    `${reservation.pk}, ${
      getReserveeName(reservation, t) || t("RequestedReservation.noName")
    }`.trim()
  );
};

// TODO rename: it's the time + duration
// recurring format: {weekday(s)} {time}, {duration} | {startDate}-{endDate} | {unit}
// single format   : {weekday} {date} {time}, {duration} | {unit}
export const createTagString = (reservation: ReservationNode, t: TFunction) => {
  const createRecurringTag = (begin?: string, end?: string) =>
    begin && end ? `${formatDate(begin)}-${formatDate(end)}` : "";

  const recurringTag = createRecurringTag(
    reservation.recurringReservation?.beginDate ?? undefined,
    reservation.recurringReservation?.endDate ?? undefined
  );

  const unitTag = reservation?.reservationUnit
    ?.map(reservationUnitName)
    .join(", ");

  const singleDateTimeTag = `${reservationDateTimeString(
    reservation.begin,
    reservation.end,
    t
  )}`;

  const weekDayTag = reservation.recurringReservation?.weekdays
    ?.sort()
    ?.map((x) => t(`dayShort.${x}`))
    ?.reduce((agv, x) => `${agv}${agv.length > 0 ? "," : ""} ${x}`, "");

  const recurringDateTag =
    reservation.begin && reservation.end
      ? `${weekDayTag} ${formatTime(reservation.begin, "HH:mm")}-${formatTime(
          reservation.end,
          "HH:mm"
        )}`
      : "";

  const durationTag = `${reservationDurationString(
    reservation.begin,
    reservation.end,
    t
  )}`;

  const reservationTagline = `${
    reservation.recurringReservation ? recurringDateTag : singleDateTimeTag
  }, ${durationTag} ${
    recurringTag.length > 0 ? " | " : ""
  } ${recurringTag} | ${unitTag}`;

  return reservationTagline;
};
