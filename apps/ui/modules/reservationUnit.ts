import { formatters as getFormatters, getReservationVolume } from "common";
import { flatten, trim, uniq } from "lodash";
import { addMinutes, isAfter, isBefore, isSameDay, set } from "date-fns";
import { i18n } from "next-i18next";
import { toUIDate } from "common/src/common/util";
import {
  type RoundPeriod,
  getDayIntervals,
  isSlotWithinReservationTime,
} from "common/src/calendar/util";
import {
  type EquipmentNode,
  ReservationUnitState,
  type ReservationUnitNode,
  State,
  PricingType,
  PriceUnit,
  Status,
  type ReservationUnitPricingNode,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { capitalize, getTranslation } from "./util";
import { isReservationReservable } from "@/modules/reservation";
import { type PricingFieldsFragment } from "common/gql/gql-types";

export const getTimeString = (date = new Date()): string => {
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return `${date.getHours().toString().padStart(2, "0")}:${date.getMinutes().toString().padStart(2, "0")}`;
};

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
  equipment: EquipmentNode[]
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

export const getEquipmentList = (equipment: EquipmentNode[]): string[] => {
  if (!equipment || equipment.length === 0) {
    return [];
  }

  const categories = getEquipmentCategories(equipment);

  const sortedEquipment: EquipmentNode[] = flatten(
    categories.map((category) => {
      const eq: EquipmentNode[] = [...equipment].filter(
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
  // TODO use a fragment for ReservationUnitName
  reservationUnit?: {
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
  } | null,
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
  unit?: {
    nameFi?: string | null;
    nameSv?: string | null;
    nameEn?: string | null;
  } | null,
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

export function getReservationUnitInstructionsKey(state: State): string | null {
  switch (state) {
    case State.Created:
    case State.RequiresHandling:
      return "reservationPendingInstructions";
    case State.Cancelled:
      return "reservationCancelledInstructions";
    case State.Confirmed:
      return "reservationConfirmedInstructions";
    case State.Denied:
    default:
      return null;
  }
}

export function getActivePricing(reservationUnit: {
  pricings: PricingFieldsFragment[];
}): PricingFieldsFragment | undefined {
  const { pricings } = reservationUnit;
  return pricings.find((pricing) => pricing?.status === "ACTIVE");
}

type GetPriceReservationUnitFragment = {
  pricings: PricingFieldsFragment[];
  reservationBegins?: string | null;
  reservationEnds?: string | null;
};
export const getFuturePricing = (
  reservationUnit: GetPriceReservationUnitFragment,
  applicationRounds: RoundPeriod[] = [],
  reservationDate?: Date
): PricingFieldsFragment | undefined => {
  const { pricings, reservationBegins, reservationEnds } = reservationUnit;

  if (!pricings || pricings.length === 0) {
    return undefined;
  }

  const now = toUIDate(new Date(), "yyyy-MM-dd");

  const futurePricings = pricings
    .filter((pricing) => pricing?.status === Status.Future)
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

function formatPrice(
  price: number,
  trailingZeros: boolean,
  toCurrency?: boolean
) {
  const currencyFormatter = trailingZeros ? "currencyWithDecimals" : "currency";
  const floatFormatter = trailingZeros ? "twoDecimal" : "strippedDecimal";
  const formatters = getFormatters("fi");
  const formatter = formatters[toCurrency ? currencyFormatter : floatFormatter];
  return parseFloat(price.toString()) ? formatter.format(price) : 0;
}

type GetPriceType = {
  pricing: PricingFieldsFragment;
  minutes?: number; // additional minutes for total price calculation
  trailingZeros?: boolean;
  asNumeral?: boolean; // return a string of numbers ("0" instead of e.g. "free" when the price is 0)
};

export const getPrice = (props: GetPriceType): string => {
  const { pricing, minutes, trailingZeros = false, asNumeral = false } = props;
  if (
    pricing.pricingType == null ||
    pricing.pricingType === PricingType.Free ||
    (pricing.pricingType === PricingType.Paid &&
      parseFloat(pricing.highestPrice) === 0)
  ) {
    return asNumeral ? "0" : i18n?.t("prices:priceFree") ?? "0";
  }

  const volume = getReservationVolume(minutes ?? 0, pricing.priceUnit);
  const highestPrice = parseFloat(pricing.highestPrice) * volume;
  const lowestPrice = parseFloat(pricing.lowestPrice) * volume;
  const priceString =
    lowestPrice === highestPrice
      ? formatPrice(lowestPrice, trailingZeros, true)
      : `${formatPrice(lowestPrice, trailingZeros)} - ${formatPrice(highestPrice, trailingZeros, true)}`;
  const unitString =
    pricing.priceUnit === PriceUnit.Fixed || minutes
      ? ""
      : i18n?.t(`prices:priceUnits.${pricing.priceUnit}`);
  return trim(`${priceString} / ${unitString}`, " / ");
};

type GetReservationUnitPriceProps = {
  reservationUnit?: GetPriceReservationUnitFragment | null;
  pricingDate?: Date;
  minutes?: number;
  trailingZeros?: boolean;
  asNumeral?: boolean;
};

export function getReservationUnitPrice(
  props: GetReservationUnitPriceProps
): string | undefined {
  const {
    reservationUnit: ru,
    pricingDate,
    minutes,
    trailingZeros = false,
    asNumeral = false,
  } = props;

  if (ru == null) {
    return undefined;
  }

  const pricing = pricingDate
    ? getFuturePricing(ru, [], pricingDate) || getActivePricing(ru)
    : getActivePricing(ru);

  if (pricing == null) {
    return undefined;
  }

  return getPrice({
    pricing,
    minutes,
    trailingZeros,
    asNumeral,
  });
}

export const isReservationUnitPaidInFuture = (
  pricings: ReservationUnitPricingNode[]
): boolean => {
  return pricings
    .filter(
      (pricing) =>
        [Status.Active, Status.Future].includes(pricing.status) &&
        pricing.pricingType === PricingType.Paid
    )
    .map((pricing) => getPrice({ pricing, asNumeral: true }))
    .some((n) => n !== "0");
};

/// Returns true if the given time is 'inside' the time span
/// inside in this case means it's either the same day or the time span is multiple days
/// TODO should rewrite this to work on dates since we want to do that conversion first anyway
export function isInTimeSpan(
  date: Date,
  timeSpan: NonNullable<ReservationUnitNode["reservableTimeSpans"]>[0]
) {
  const { startDatetime, endDatetime } = timeSpan ?? {};

  if (!startDatetime || !endDatetime) return false;
  const startDate = new Date(startDatetime);
  const endDate = new Date(endDatetime);
  // either we have per day open time, or we have a span of multiple days
  // another option would be to move the starting time to 00:00
  if (isSameDay(date, startDate)) return true;
  if (isBefore(date, startDate)) return false;
  if (isAfter(date, endDate)) return false;
  return true;
}

// Returns an timeslot array (in HH:mm format) with the time-slots that are
// available for reservation on the given date
// TODO should rewrite the timespans to be NonNullable and dates (and do the conversion early, not on each component render)
export function getPossibleTimesForDay(
  reservableTimeSpans: ReservationUnitNode["reservableTimeSpans"],
  reservationStartInterval: ReservationUnitNode["reservationStartInterval"],
  date: Date,
  reservationUnit: ReservationUnitNode,
  activeApplicationRounds: RoundPeriod[],
  durationValue: number
): { label: string; value: string }[] {
  const allTimes: string[] = [];
  filterNonNullable(reservableTimeSpans)
    .filter((x) => isInTimeSpan(date, x))
    .forEach((rts) => {
      if (!rts?.startDatetime || !rts?.endDatetime) return;
      const startDate = new Date(rts.startDatetime);
      const endDate = new Date(rts.endDatetime);
      const begin = isSameDay(startDate, date)
        ? startDate
        : set(date, { hours: 0, minutes: 0 });
      const end = isSameDay(endDate, date)
        ? endDate
        : set(date, { hours: 23, minutes: 59 });
      // TODO I hate this function, don't use strings for durations
      // wasteful because we do date -> string -> object -> number -> string
      // the numbers are what we compare but all the scaffolding to mess with memory alloc
      const intervals = getDayIntervals(
        getTimeString(begin),
        getTimeString(end),
        reservationStartInterval
      ).map((i) => i.substring(0, 5));
      allTimes.push(...intervals);
    });
  return allTimes
    .filter((span) => {
      const [slotH, slotM] = span.split(":").map(Number);
      const slotDate = new Date(date);
      slotDate.setHours(slotH, slotM, 0, 0);
      const isReservable = isReservationReservable({
        reservationUnit,
        activeApplicationRounds,
        start: slotDate,
        end: addMinutes(slotDate, durationValue),
        skipLengthCheck: false,
      });
      return slotDate >= new Date() && isReservable;
    })
    .map((time) => ({ label: time, value: time }));
}
