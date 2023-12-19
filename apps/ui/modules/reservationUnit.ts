import {
  type ReservationUnitNode,
  formatters as getFormatters,
  getReservationVolume,
} from "common";
import { flatten, trim, uniq } from "lodash";
import { addDays } from "date-fns";
import { i18n } from "next-i18next";
import { toApiDate, toUIDate } from "common/src/common/util";
import {
  RoundPeriod,
  isSlotWithinReservationTime,
} from "common/src/calendar/util";
import {
  type EquipmentType,
  ReservationsReservationStateChoices,
  type ReservationUnitPricingType,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitsReservationUnitPricingStatusChoices,
  ReservationUnitState,
  type UnitType,
} from "common/types/gql-types";
import { capitalize, getTranslation } from "./util";

export const isReservationUnitPublished = (
  reservationUnit?: ReservationUnitNode
): boolean => {
  if (!reservationUnit) {
    return false;
  }
  const { state } = reservationUnit;

  switch (state) {
    case ReservationUnitState.Published:
    case ReservationUnitState.ScheduledHiding:
      return true;
    default:
      return false;
  }
};

const equipmentCategoryOrder = [
  "Huonekalut",
  "Keittiö",
  "Liikunta- ja pelivälineet",
  "Tekniikka",
  "Pelikonsoli",
  "Liittimet",
  "Muu",
];

export const getEquipmentCategories = (
  equipment: EquipmentType[]
): string[] => {
  if (!equipment || equipment.length === 0) {
    return [];
  }

  const categories: string[] = [...equipment].map((n) =>
    n.category?.nameFi && equipmentCategoryOrder.includes(n.category?.nameFi)
      ? n.category?.nameFi
      : "Muu"
  );

  categories.sort((a, b) => {
    const left = equipmentCategoryOrder.indexOf(a);
    const right = equipmentCategoryOrder.indexOf(b);
    return left - right;
  });

  return uniq(categories);
};

export const getEquipmentList = (equipment: EquipmentType[]): string[] => {
  if (!equipment || equipment.length === 0) {
    return [];
  }

  const categories = getEquipmentCategories(equipment);

  const sortedEquipment: EquipmentType[] = flatten(
    categories.map((category) => {
      const eq: EquipmentType[] = [...equipment].filter(
        (n) =>
          n.category?.nameFi === category ||
          (category === "Muu" &&
            n.category?.nameFi &&
            !equipmentCategoryOrder.includes(n.category?.nameFi))
      );
      eq.sort((a, b) =>
        a.nameFi && b.nameFi ? a.nameFi.localeCompare(b.nameFi) : 0
      );
      return eq;
    })
  );

  return sortedEquipment.map((n) => getTranslation(n, "name"));
};

export const getReservationUnitName = (
  reservationUnit?: ReservationUnitNode,
  language: string = i18n?.language ?? "fi"
): string | undefined => {
  if (!reservationUnit) {
    return undefined;
  }
  const key = `name${capitalize(language)}`;
  if (key in reservationUnit) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- silly magic to avoid implicit any type
    const val: unknown = (reservationUnit as any)[key];
    if (typeof val === "string" && val.length > 0) {
      return val;
    }
  }
  return reservationUnit.nameFi ?? "-";
};

export const getUnitName = (
  unit?: UnitType,
  language: string = i18n?.language ?? "fi"
): string | undefined => {
  if (unit == null) {
    return undefined;
  }
  const key = `name${capitalize(language)}`;
  if (key in unit) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- silly magic to avoid implicit any type
    const val: unknown = (unit as any)[key];
    if (typeof val === "string" && val.length > 0) {
      return val;
    }
  }
  return unit.nameFi ?? "-";
};

export const getReservationUnitInstructionsKey = (
  state: ReservationsReservationStateChoices
): string | null => {
  switch (state) {
    case ReservationsReservationStateChoices.Created:
    case ReservationsReservationStateChoices.RequiresHandling:
      return "reservationPendingInstructions";
    case ReservationsReservationStateChoices.Cancelled:
      return "reservationCancelledInstructions";
    case ReservationsReservationStateChoices.Confirmed:
      return "reservationConfirmedInstructions";
    case ReservationsReservationStateChoices.Denied:
    default:
      return null;
  }
};

export const getDurationRange = (
  reservationUnit: ReservationUnitNode
): string => {
  return `${reservationUnit.minReservationDuration} - ${reservationUnit.maxReservationDuration}`;
};

export const getActivePricing = (
  reservationUnit: ReservationUnitNode
): ReservationUnitPricingType | undefined => {
  const { pricings } = reservationUnit;

  if (!pricings || pricings.length === 0) {
    return undefined;
  }

  return pricings.find((pricing) => pricing?.status === "ACTIVE") ?? undefined;
};

export const getFuturePricing = (
  reservationUnit: ReservationUnitNode,
  applicationRounds: RoundPeriod[] = [],
  reservationDate?: Date
): ReservationUnitPricingType | undefined => {
  const { pricings, reservationBegins, reservationEnds } = reservationUnit;

  if (!pricings || pricings.length === 0) {
    return undefined;
  }

  const now = toUIDate(new Date(), "yyyy-MM-dd");

  const futurePricings = pricings
    .filter(
      (pricing) =>
        pricing?.status ===
        ReservationUnitsReservationUnitPricingStatusChoices.Future
    )
    .filter((x): x is NonNullable<typeof x> => x != null)
    .filter((futurePricing) => futurePricing.begins > now)
    .filter((futurePricing) => {
      const start = new Date(futurePricing.begins);
      return isSlotWithinReservationTime(
        start,
        reservationBegins ? new Date(reservationBegins) : undefined,
        reservationEnds ? new Date(reservationEnds) : undefined
      );
    })
    .filter((futurePricing) => {
      if (futurePricing.begins == null) {
        return false;
      }
      return !applicationRounds.some((applicationRound) => {
        const { reservationPeriodBegin, reservationPeriodEnd } =
          applicationRound;
        if (!reservationPeriodBegin || !reservationPeriodEnd) return false;
        const begins = new Date(futurePricing.begins);
        const periodStart = new Date(reservationPeriodBegin);
        const periodEnd = new Date(reservationPeriodEnd);
        return begins >= periodStart && begins <= periodEnd;
      });
    })
    .sort((a, b) => (a.begins > b.begins ? 1 : -1));

  if (futurePricings.length === 0) {
    return undefined;
  }

  return reservationDate
    ? futurePricings.reverse().find((n) => {
        return n.begins <= toUIDate(new Date(reservationDate), "yyyy-MM-dd");
      })
    : futurePricings[0];
};

export type GetPriceType = {
  pricing: ReservationUnitPricingType;
  minutes?: number; // additional minutes for total price calculation
  trailingZeros?: boolean;
  asInt?: boolean;
};

export const getPrice = (props: GetPriceType): string => {
  const { pricing, minutes, trailingZeros = false, asInt = false } = props;

  const currencyFormatter = trailingZeros ? "currencyWithDecimals" : "currency";
  const floatFormatter = trailingZeros ? "twoDecimal" : "strippedDecimal";

  const formatters = getFormatters("fi");

  if (pricing.pricingType === "PAID" && pricing.highestPrice) {
    const volume = getReservationVolume(minutes ?? 0, pricing.priceUnit);
    const unitStr =
      pricing.priceUnit === "FIXED" || minutes
        ? ""
        : i18n?.t(`prices:priceUnits.${pricing.priceUnit}`);

    if (pricing.priceUnit === "FIXED") {
      return formatters[currencyFormatter].format(pricing.highestPrice);
    }

    const lowestPrice = parseFloat(pricing.lowestPrice?.toString())
      ? formatters[floatFormatter].format(pricing.lowestPrice * volume)
      : 0;
    const highestPrice = formatters[currencyFormatter].format(
      pricing.highestPrice * volume
    );
    const price =
      pricing.lowestPrice === pricing.highestPrice
        ? formatters[currencyFormatter].format(pricing.lowestPrice * volume)
        : `${lowestPrice} - ${highestPrice}`;
    return trim(`${price} / ${unitStr}`, " / ");
  }

  return asInt ? "0" : i18n?.t("prices:priceFree") ?? "0";
};

export type GetReservationUnitPriceProps = {
  reservationUnit?: ReservationUnitNode;
  pricingDate?: Date;
  minutes?: number;
  trailingZeros?: boolean;
  asInt?: boolean;
};

export const getReservationUnitPrice = (
  props: GetReservationUnitPriceProps
): string | undefined => {
  const {
    reservationUnit: ru,
    pricingDate,
    minutes,
    trailingZeros = false,
    asInt = false,
  } = props;

  if (!ru) {
    return undefined;
  }

  const pricing: ReservationUnitPricingType | undefined = pricingDate
    ? getFuturePricing(ru, [], pricingDate) || getActivePricing(ru)
    : getActivePricing(ru);

  return pricing
    ? getPrice({ pricing, minutes, trailingZeros, asInt })
    : undefined;
};

// Create multiple mock opening times for reservation unit
// if pk is even, return one 4 year span (tests the case of 24 / 7 open)
// if pk is odd, return 100 days from 12:00 to 20:00
// assuming that the backend will add TZ info to the dates
export const createMockOpeningTimes = (pk: number) => {
  if (pk % 2 === 0) {
    return [
      {
        startDatetime: "2023-01-01T04:00:00+02:00",
        endDatetime: "2027-12-31T20:00:00+02:00",
      },
    ];
  }
  return Array.from(Array(100)).map((_, index) => {
    const start = toApiDate(addDays(new Date(), index));
    const end = toApiDate(addDays(new Date(), index));
    return {
      startDatetime: `${start}T12:00:00+02:00`,
      endDatetime: `${end}T20:00:00+02:00`,
    };
  });
};

export const isReservationUnitPaidInFuture = (
  pricings: ReservationUnitPricingType[]
): boolean => {
  return pricings
    .filter(
      (pricing) =>
        [
          ReservationUnitsReservationUnitPricingStatusChoices.Active,
          ReservationUnitsReservationUnitPricingStatusChoices.Future,
        ].includes(pricing.status) &&
        pricing.pricingType ===
          ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid
    )
    .map((pricing) => getPrice({ pricing, asInt: true }))
    .some((n) => n !== "0");
};
