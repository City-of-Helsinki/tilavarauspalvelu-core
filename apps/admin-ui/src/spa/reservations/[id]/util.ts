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
  reservationUnit: ReservationUnitType | undefined,
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

  const taxP = parseFloat(pricing.taxPercentage?.value ?? "");
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
  reservationType?: ReservationTypeChoice,
  reserveeType?: CustomerTypeChoice,
  isUnregisteredAssociation?: boolean
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
  const createRecurringTag = (begin?: string, end?: string) =>
    begin && end ? `${formatDate(begin)}–${formatDate(end)}` : "";

  const recurringTag = createRecurringTag(
    reservation.recurringReservation?.beginDate ?? undefined,
    reservation.recurringReservation?.endDate ?? undefined
  );

  const unitTag = reservation?.reservationUnit
    ?.map(reservationUnitName)
    .join(", ");

  const begin = new Date(reservation.begin);
  const end = new Date(reservation.end);
  const singleDateTimeTag = formatDateTimeRange(t, begin, end);

  const weekDayTag = reservation.recurringReservation?.weekdays
    ?.sort()
    ?.map((x) => t(`dayShort.${x}`))
    ?.reduce((agv, x) => `${agv}${agv.length > 0 ? "," : ""} ${x}`, "");

  const recurringDateTag = `${weekDayTag} ${format(begin, "HH:mm")}–${format(end, "HH:mm")}`;

  const durMinutes = differenceInMinutes(end, begin);
  const abbreviated = true;
  const durationTag = formatDuration(durMinutes, t, abbreviated);

  const reservationTagline = `${
    reservation.recurringReservation ? recurringDateTag : singleDateTimeTag
  }, ${durationTag} ${
    recurringTag.length > 0 ? " | " : ""
  } ${recurringTag} | ${unitTag}`;

  return reservationTagline;
}
