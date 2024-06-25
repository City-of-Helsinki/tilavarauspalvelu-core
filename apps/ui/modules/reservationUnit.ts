import { formatters as getFormatters, getReservationVolume } from "common";
import { flatten, trim, uniq } from "lodash";
import {
  addMinutes,
  getHours,
  getMinutes,
  isAfter,
  isBefore,
  isSameDay,
  set,
} from "date-fns";
import { i18n } from "next-i18next";
import { toUIDate } from "common/src/common/util";
import {
  ReservationUnitState,
  type ReservationUnitNode,
  PricingType,
  PriceUnit,
  Status,
  type EquipmentFieldsFragment,
  type PriceReservationUnitFragment,
  type UnitNode,
  ReservationState,
  type MetadataSetsFragment,
  ReservationKind,
  ReservationStateChoice,
  type IsReservableFieldsFragment,
} from "@gql/gql-types";
import { capitalize, getTranslation } from "./util";
import {
  type ReservableMap,
  type RoundPeriod,
  isSlotWithinReservationTime,
  dateToKey,
  isRangeReservable,
  getDayIntervals,
} from "@/modules/reservable";
import { type PricingFieldsFragment } from "common/gql/gql-types";
import { gql } from "@apollo/client";

function formatTimeObject(time: { h: number; m: number }): string {
  return `${time.h.toString().padStart(2, "0")}:${time.m.toString().padStart(2, "0")}`;
}
function formatTime(date: Date): string {
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return formatTimeObject({ h: getHours(date), m: getMinutes(date) });
}

export { formatTime as getTimeString };

export function isReservationUnitPublished(
  reservationUnit?: Pick<ReservationUnitNode, "state"> | null
): boolean {
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
}

const equipmentCategoryOrder = [
  "Huonekalut",
  "Keittiö",
  "Liikunta- ja pelivälineet",
  "Tekniikka",
  "Pelikonsoli",
  "Liittimet",
  "Muu",
];

export function getEquipmentCategories(
  equipment: Pick<EquipmentFieldsFragment, "category">[]
): string[] {
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
}

// Why are we doing complex frontend sorting? and always in finnish?
export function getEquipmentList(
  equipment: EquipmentFieldsFragment[]
): string[] {
  if (!equipment || equipment.length === 0) {
    return [];
  }

  const categories = getEquipmentCategories(equipment);

  const sortedEquipment = flatten(
    categories.map((category) =>
      [...equipment]
        .filter(
          (n) =>
            n.category?.nameFi === category ||
            (category === "Muu" &&
              n.category?.nameFi &&
              !equipmentCategoryOrder.includes(n.category?.nameFi))
        )
        .sort((a, b) =>
          a.nameFi && b.nameFi ? a.nameFi.localeCompare(b.nameFi) : 0
        )
    )
  );

  return sortedEquipment.map((n) => getTranslation(n, "name"));
}

export function getReservationUnitName(
  // TODO use a fragment for ReservationUnitName
  reservationUnit?: Pick<
    ReservationUnitNode,
    "nameFi" | "nameSv" | "nameEn"
  > | null,
  language: string = i18n?.language ?? "fi"
): string | undefined {
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
}

export function getUnitName(
  unit?: Pick<UnitNode, "nameFi" | "nameSv" | "nameEn"> | null,
  language: string = i18n?.language ?? "fi"
): string | undefined {
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
}

export function getReservationUnitInstructionsKey(
  state?: ReservationStateChoice | null | undefined
): string | null {
  switch (state) {
    case ReservationStateChoice.Created:
    case ReservationStateChoice.RequiresHandling:
      return "reservationPendingInstructions";
    case ReservationStateChoice.Cancelled:
      return "reservationCancelledInstructions";
    case ReservationStateChoice.Confirmed:
      return "reservationConfirmedInstructions";
    case ReservationStateChoice.Denied:
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

export const RESERVATION_INFO_CARD_FRAGMENT = gql`
  fragment PriceReservationUnit on ReservationUnitNode {
    pricings {
      ...PricingFields
    }
    reservationBegins
    reservationEnds
  }
`;

export function getFuturePricing(
  reservationUnit: PriceReservationUnitFragment,
  applicationRounds: RoundPeriod[] = [],
  reservationDate?: Date
): PricingFieldsFragment | undefined {
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
}

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
  reservationUnit?: PriceReservationUnitFragment | null;
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
  pricings: PricingFieldsFragment[]
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
export function getPossibleTimesForDay({
  reservableTimes,
  interval,
  date,
  reservationUnit,
  activeApplicationRounds,
  durationValue,
}: {
  reservableTimes: ReservableMap;
  interval: ReservationUnitNode["reservationStartInterval"];
  date: Date;
  reservationUnit: Omit<IsReservableFieldsFragment, "reservableTimeSpans">;
  activeApplicationRounds: readonly RoundPeriod[];
  durationValue: number;
}): { label: string; value: string }[] {
  const allTimes: Array<{ h: number; m: number }> = [];
  const slotsForDay = reservableTimes.get(dateToKey(date)) ?? [];
  for (const slot of slotsForDay) {
    const startDate = slot.start;
    const endDate = slot.end;
    const begin = isSameDay(startDate, date)
      ? startDate
      : set(date, { hours: 0, minutes: 0 });
    const end = isSameDay(endDate, date)
      ? endDate
      : set(date, { hours: 23, minutes: 59 });

    const s: { h: number; m: number } = {
      h: getHours(begin),
      m: getMinutes(begin),
    };
    const e: { h: number; m: number } = {
      h: getHours(end),
      m: getMinutes(end),
    };
    const intervals = getDayIntervals(s, e, interval);
    allTimes.push(...intervals);
  }

  const times = allTimes
    .filter((span) => {
      const { h: slotH, m: slotM } = span;
      const slotDate = new Date(date);
      slotDate.setHours(slotH, slotM, 0, 0);
      if (slotDate < new Date()) {
        return false;
      }
      const isReservable = isRangeReservable({
        range: {
          start: slotDate,
          end: addMinutes(slotDate, durationValue),
        },
        reservationUnit,
        reservableTimes,
        activeApplicationRounds,
      });
      return isReservable;
    })
    // TODO the conversion should be done in a separate function so we can reuse the logic without string conversion
    .map((time) => formatTimeObject(time))
    .map((time) => ({ label: time, value: time }));

  return times;
}

// TODO use a fragment
type IsReservableReservationUnitType = Pick<
  ReservationUnitNode,
  | "reservationState"
  | "reservableTimeSpans"
  | "reservationBegins"
  | "minReservationDuration"
  | "maxReservationDuration"
  | "reservationKind"
  | "reservationsMaxDaysBefore"
  | "reservationsMinDaysBefore"
> &
  MetadataSetsFragment;

export function isReservationUnitReservable(
  reservationUnit?: IsReservableReservationUnitType | null
): [false, string] | [true] {
  if (!reservationUnit) {
    return [false, "reservationUnit is null"];
  }
  const {
    reservationState,
    minReservationDuration,
    maxReservationDuration,
    reservationKind,
  } = reservationUnit;

  switch (reservationState) {
    case ReservationState.Reservable:
    case ReservationState.ScheduledClosing: {
      const resBegins = reservationUnit.reservationBegins
        ? new Date(reservationUnit.reservationBegins)
        : null;
      const hasSupportedFields =
        (reservationUnit.metadataSet?.supportedFields?.length ?? 0) > 0;
      const hasReservableTimes =
        (reservationUnit.reservableTimeSpans?.length ?? 0) > 0;
      if (!hasSupportedFields) {
        return [false, "reservationUnit has no supported fields"];
      }
      if (!hasReservableTimes) {
        return [false, "reservationUnit has no reservable times"];
      }
      if (resBegins && resBegins > new Date()) {
        return [false, "reservationUnit reservation begins in future"];
      }
      if (!minReservationDuration || !maxReservationDuration) {
        return [false, "reservationUnit has no min/max reservation duration"];
      }
      if (reservationKind === ReservationKind.Season) {
        return [
          false,
          "reservationUnit is only available for seasonal booking",
        ];
      }
      return [true];
    }
    default:
      return [false, "reservationUnit is not reservable"];
  }
}
