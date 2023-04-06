import {
  formatters as getFormatters,
  getReservationPrice,
  getUnRoundedReservationVolume,
} from "common";

import {
  differenceInHours,
  differenceInMinutes,
  getDay,
  isSameDay,
  parse,
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
import { formatDate, formatTime, toMondayFirst } from "../../../common/util";

export const reservationDateTime = (
  start: string,
  end: string,
  t: TFunction
): string => {
  const startDate = new Date(start);
  const endDate = new Date(end);

  const startDay = t(`dayShort.${toMondayFirst(getDay(startDate))}`);

  if (isSameDay(startDate, endDate)) {
    return `${startDay} ${formatDate(start)} ${formatTime(
      start,
      "HH:mm"
    )}-${formatTime(end, "HH:mm")}`;
  }
  return `${formatDate(start)} ${formatTime(start, "HH:mm")}-${formatDate(
    end,
    "HH:mm"
  )} ${formatTime(end, "HH:mm")}`;
};

export const reservationDuration = (start: string, end: string): string => {
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

const parseDate = (date: string) => parse(date, "yyyy-MM-dd", new Date());

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
      ? parseDate(a.begins).getTime() - parseDate(b.begins).getTime()
      : 1
  );

  return (
    (reservationUnit.pricings || []) as ReservationUnitPricingType[]
  ).reduce((prev, current) => {
    if (parseDate(current?.begins) < reservationDate) {
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
  const volume = getUnRoundedReservationVolume(
    durationMinutes,
    priceUnit as string
  );

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

export const getTranslationKeyForType = (
  type: ReservationsReservationReserveeTypeChoices,
  isUnregisteredAssociation: boolean
): string => {
  switch (type) {
    case ReservationsReservationReserveeTypeChoices.Business:
    case ReservationsReservationReserveeTypeChoices.Individual: {
      return `ReserveeType.${type}`;
    }
    default:
      return `ReserveeType.${type}.${
        isUnregisteredAssociation ? "UNREGISTERED" : "REGISTERED"
      }`;
  }
};

export const getReserveeName = (
  reservation: ReservationType,
  length = 50
): string =>
  truncate(
    reservation.reserveeOrganisationName
      ? reservation.reserveeOrganisationName
      : trim(
          `${reservation.reserveeFirstName || ""} ${
            reservation.reserveeLastName || ""
          }`
        ) ||
          trim(
            `${reservation.user?.firstName || ""} ${
              reservation.user?.lastName || ""
            }`
          ),

    { length, omission: "…" }
  );
