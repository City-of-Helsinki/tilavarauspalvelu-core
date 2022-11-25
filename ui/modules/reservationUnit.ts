import { formatters as getFormatters, getReservationVolume } from "common";
import { flatten, trim, uniq } from "lodash";
import { i18n } from "next-i18next";
import {
  ApplicationRound,
  ReservationState,
  ReservationUnit,
} from "common/types/common";
import { toUIDate } from "common/src/common/util";
import { isSlotWithinReservationTime } from "common/src/calendar/util";
import {
  EquipmentType,
  ReservationsReservationStateChoices,
  ReservationUnitByPkType,
  ReservationUnitPricingType,
  ReservationUnitsReservationUnitPricingStatusChoices,
  ReservationUnitType,
  UnitType,
} from "common/types/gql-types";
import { capitalize, getTranslation, localizedValue } from "./util";

export const isReservationUnitPublished = (
  reservationUnit: ReservationUnitType | ReservationUnitByPkType
): boolean => {
  const now = new Date();
  let beginOK = true;
  let endOK = true;

  if (reservationUnit?.publishBegins) {
    beginOK = new Date(reservationUnit.publishBegins) <= now;
  }

  if (reservationUnit?.publishEnds) {
    endOK = new Date(reservationUnit.publishEnds) >= now;
  }

  return beginOK && endOK;
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
    equipmentCategoryOrder.includes(n.category.nameFi)
      ? n.category.nameFi
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
          n.category.nameFi === category ||
          (category === "Muu" &&
            !equipmentCategoryOrder.includes(n.category.nameFi))
      );
      eq.sort((a, b) => a.nameFi.localeCompare(b.nameFi));
      return eq;
    })
  );

  return sortedEquipment.map((n) => getTranslation(n, "name"));
};

export const getReservationUnitName = (
  reservationUnit: ReservationUnitType | ReservationUnitByPkType,
  language: string = i18n.language
): string => {
  if (!reservationUnit) return null;

  const key = `name${capitalize(language)}`;
  return reservationUnit[key] || reservationUnit.nameFi;
};

export const getOldReservationUnitName = (
  reservationUnit: ReservationUnit,
  language: string = i18n.language
): string => {
  return (
    localizedValue(reservationUnit.name, language) ||
    localizedValue(reservationUnit.name, "fi")
  );
};

export const getUnitName = (
  unit: UnitType,
  language: string = i18n.language
): string => {
  if (!unit) return null;
  const key = `name${capitalize(language)}`;
  return unit[key] || unit.nameFi;
};

export const getReservationUnitInstructionsKey = (
  state: ReservationsReservationStateChoices | ReservationState
): string | null => {
  switch (state) {
    case "initial":
    case "created":
    case "requested":
    case "waiting for payment":
    case ReservationsReservationStateChoices.Created:
    case ReservationsReservationStateChoices.RequiresHandling:
      return "reservationPendingInstructions";
    case "cancelled":
    case ReservationsReservationStateChoices.Cancelled:
      return "reservationCancelledInstructions";
    case "confirmed":
    case ReservationsReservationStateChoices.Confirmed:
      return "reservationConfirmedInstructions";
    case "denied":
    case ReservationsReservationStateChoices.Denied:
    default:
      return null;
  }
};

export const getDurationRange = (
  reservationUnit: ReservationUnitType | ReservationUnitByPkType
): string => {
  return `${reservationUnit.minReservationDuration} - ${reservationUnit.maxReservationDuration}`;
};

export const getActivePricing = (
  reservationUnit: ReservationUnitType | ReservationUnitByPkType
): ReservationUnitPricingType => {
  const { pricings } = reservationUnit;

  if (!pricings || pricings.length === 0) {
    return null;
  }

  return pricings.find((pricing) => pricing.status === "ACTIVE");
};

export const getFuturePricing = (
  reservationUnit: ReservationUnitByPkType,
  applicationRounds: ApplicationRound[] = [],
  reservationDate?: Date
): ReservationUnitPricingType => {
  const { pricings, reservationBegins, reservationEnds } = reservationUnit;

  if (!pricings || pricings.length === 0) {
    return null;
  }

  const now = toUIDate(new Date(), "yyyy-MM-dd");

  const futurePricings = pricings
    .filter(
      (pricing) =>
        pricing.status ===
        ReservationUnitsReservationUnitPricingStatusChoices.Future
    )
    .filter((futurePricing) => futurePricing.begins > now)
    .filter((futurePricing) => {
      const start = new Date(futurePricing.begins);
      return isSlotWithinReservationTime(
        start,
        reservationBegins,
        reservationEnds
      );
    })
    // TODO: find out should opening hours be checked here
    // .filter((futurePricing) => {
    //   const begins = new Date(futurePricing.begins);
    //   return openingHours.openingTimePeriods.some((period) => {
    //     const { startDate, endDate } = period;
    //     if (!startDate || !endDate) return false;
    //     const periodStart = new Date(startDate);
    //     const periodEnd = new Date(endDate);
    //     return begins >= periodStart && begins <= periodEnd;
    //   });
    // })
    .filter((futurePricing) => {
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
    return null;
  }

  return reservationDate
    ? futurePricings.reverse().find((n) => {
        return n.begins <= toUIDate(new Date(reservationDate), "yyyy-MM-dd");
      })
    : futurePricings[0];
};

export const getPrice = (
  pricing: ReservationUnitPricingType,
  minutes?: number, // additional minutes for total price calculation
  trailingZeros = false,
  asInt = false
): string => {
  const currencyFormatter = trailingZeros ? "currencyWithDecimals" : "currency";
  const floatFormatter = trailingZeros ? "twoDecimals" : "strippedDecimal";

  const formatters = getFormatters(i18n.language);

  if (pricing?.pricingType === "PAID" && parseFloat(pricing.highestPrice)) {
    const volume = getReservationVolume(minutes, pricing.priceUnit);
    const unitStr =
      pricing.priceUnit === "FIXED" || minutes
        ? ""
        : i18n.t(`prices:priceUnits.${pricing.priceUnit}`);

    if (pricing.priceUnit === "FIXED") {
      return formatters[currencyFormatter].format(pricing.highestPrice);
    }

    const lowestPrice = parseFloat(pricing.lowestPrice)
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

  return asInt ? "0" : i18n.t("prices:priceFree");
};

export const getReservationUnitPrice = (
  reservationUnit: ReservationUnitType | ReservationUnitByPkType,
  pricingDate?: Date,
  minutes?: number,
  trailingZeros = false,
  asInt = false
): string => {
  if (!reservationUnit) return null;

  const pricing: ReservationUnitPricingType = pricingDate
    ? getFuturePricing(
        reservationUnit as ReservationUnitByPkType,
        [],
        pricingDate
      ) || getActivePricing(reservationUnit as ReservationUnitByPkType)
    : getActivePricing(reservationUnit as ReservationUnitByPkType);

  return getPrice(pricing, minutes, trailingZeros, asInt);
};
