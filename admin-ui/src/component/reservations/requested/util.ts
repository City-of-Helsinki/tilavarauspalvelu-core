import {
  formatters as getFormatters,
  getReservationPrice,
  getUnRoundedReservationVolume,
} from "common";

import {
  differenceInHours,
  differenceInMinutes,
  format,
  getDay,
  isSameDay,
} from "date-fns";
import { TFunction } from "i18next";
import { trim, truncate } from "lodash";
import {
  AgeGroupType,
  Maybe,
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
  ReservationUnitType,
  ReservationUnitPricingType,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitsReservationUnitPricingPriceUnitChoices,
} from "common/types/gql-types";
import { fromApiDate } from "common/src/common/util";
import {
  DATE_FORMAT,
  formatDate,
  formatTime,
  toMondayFirst,
} from "../../../common/util";

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

export const reservationDuration = (start: Date, end: Date): string => {
  return `${differenceInHours(end, start)}`;
};

const reservationDurationString = (start: string, end: string): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  return `${differenceInHours(endDate, startDate)}`;
};

export const reservationUnitName = (
  reservationUnit: Maybe<ReservationUnitType>
): string =>
  reservationUnit
    ? `${reservationUnit.nameFi}, ${reservationUnit.unit?.nameFi || ""}`
    : "-";

export const reservationPrice = (
  reservation: ReservationType,
  t: TFunction
): string => {
  return getReservationPrice(
    reservation.price as number,
    t("RequestedReservation.noPrice"),
    "fi",
    true
  );
};

/** returns reservation unit pricing at given date */
export const getReservatinUnitPricing = (
  reservationUnit: ReservationUnitType,
  datetime: string
): ReservationUnitPricingType | null => {
  if (!reservationUnit.pricings || reservationUnit.pricings.length === 0) {
    return null;
  }

  const reservationDate = new Date(datetime);

  reservationUnit.pricings.sort((a, b) =>
    a?.begins && b?.begins
      ? fromApiDate(a.begins).getTime() - fromApiDate(b.begins).getTime()
      : 1
  );

  return (
    (reservationUnit.pricings || []) as ReservationUnitPricingType[]
  ).reduce((prev, current) => {
    if (fromApiDate(current?.begins) < reservationDate) {
      return current;
    }
    return prev;
  }, reservationUnit.pricings[0]);
};

export const getReservationPriceDetails = (
  reservation: ReservationType,
  t: TFunction
): string => {
  const durationMinutes = differenceInMinutes(
    new Date(reservation.end),
    new Date(reservation.begin)
  );

  const pricing = getReservatinUnitPricing(
    reservation.reservationUnits?.[0] as ReservationUnitType,
    reservation.begin
  );

  if (pricing === null) return "???";

  const { priceUnit } = pricing;
  const volume = getUnRoundedReservationVolume(durationMinutes, priceUnit);

  const maxPrice =
    pricing.pricingType ===
    ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid
      ? pricing.highestPrice
      : 0;
  const formatters = getFormatters("fi");

  return priceUnit ===
    ReservationUnitsReservationUnitPricingPriceUnitChoices.Fixed
    ? getReservationPrice(maxPrice, t("RequestedReservation.noPrice"))
    : t("RequestedReservation.ApproveDialog.priceBreakdown", {
        volume: formatters.strippedDecimal.format(volume),
        units: t(`RequestedReservation.ApproveDialog.priceUnits.${priceUnit}`),
        vatPercent: formatters.whole.format(pricing.taxPercentage.value),
        unit: t(`RequestedReservation.ApproveDialog.priceUnit.${priceUnit}`),
        unitPrice: getReservationPrice(maxPrice, ""),
        price: getReservationPrice(
          volume * maxPrice,
          t("RequestedReservation.noPrice"),
          "fi"
        ),
      });
};

export const ageGroup = (
  group: Maybe<AgeGroupType> | undefined
): string | null => (group ? `${group.minimum}-${group.maximum || ""}` : null);

const reserveeTypeToTranslationKey = (
  reserveeType: ReservationsReservationReserveeTypeChoices,
  isUnregisteredAssociation: boolean
) => {
  switch (reserveeType) {
    case ReservationsReservationReserveeTypeChoices.Business:
    case ReservationsReservationReserveeTypeChoices.Individual:
      return `ReserveeType.${reserveeType}`;
    case ReservationsReservationReserveeTypeChoices.Nonprofit:
      return `ReserveeType.${reserveeType}.${
        isUnregisteredAssociation ? "UNREGISTERED" : "REGISTERED"
      }`;
    default:
      return "";
  }
};

export const getTranslationKeyForReserveeType = (
  reservationType?: "NORMAL" | "BLOCKED" | "STAFF" | "BEHALF",
  reserveeType?: ReservationsReservationReserveeTypeChoices,
  isUnregisteredAssociation?: boolean
): string[] => {
  if (!reservationType) {
    return ["error.missingReservationType"];
  }
  if (reservationType === "BLOCKED") {
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
  reservation: ReservationType,
  length = 50
): string =>
  truncate(reservation.reserveeName?.trim() ?? "", { length, omission: "…" });

export const getName = (reservation: ReservationType, t: TFunction) => {
  if (reservation.name) {
    return trim(`${reservation.pk}, ${reservation.name}`);
  }

  return trim(
    `${reservation.pk}, ${
      getReserveeName(reservation) || t("RequestedReservation.noName")
    }`.trim()
  );
};

// recurring format: {weekday(s)} {time}, {duration} | {startDate}-{endDate} | {unit}
// single format   : {weekday} {date} {time}, {duration} | {unit}
export const createTagString = (reservation: ReservationType, t: TFunction) => {
  const createRecurringTag = (begin?: string, end?: string) =>
    begin && end ? `${formatDate(begin)}-${formatDate(end)}` : "";

  const recurringTag = createRecurringTag(
    reservation.recurringReservation?.beginDate ?? undefined,
    reservation.recurringReservation?.endDate ?? undefined
  );

  const unitTag = reservation?.reservationUnits
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
    reservation.end
  )}`;

  const reservationTagline = `${
    reservation.recurringReservation ? recurringDateTag : singleDateTimeTag
  }, ${durationTag}t ${
    recurringTag.length > 0 ? " | " : ""
  } ${recurringTag} | ${unitTag}`;

  return reservationTagline;
};
