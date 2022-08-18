import { formatters as getFormatters, getReservationVolume } from "common";
import { flatten, trim, uniq } from "lodash";
import { i18n } from "next-i18next";
import {
  EquipmentType,
  ReservationsReservationStateChoices,
  ReservationUnitByPkType,
  ReservationUnitType,
  UnitType,
} from "./gql-types";
import { ReservationState, ReservationUnit } from "./types";
import { capitalize, getTranslation, localizedValue } from "./util";

export const getPrice = (
  reservationUnit: ReservationUnitType | ReservationUnitByPkType,
  minutes?: number, // additional minutes for total price calculation
  trailingZeros = false
): string => {
  const unit = reservationUnit.priceUnit as string;
  const volume = getReservationVolume(minutes, unit);
  const currencyFormatter = trailingZeros ? "currencyWithDecimals" : "currency";
  const floatFormatter = trailingZeros ? "twoDecimals" : "strippedDecimal";

  const unitStr =
    unit === "FIXED" || minutes ? "" : i18n.t(`prices:priceUnits.${unit}`);

  const formatters = getFormatters(i18n.language);

  if (parseFloat(reservationUnit.highestPrice)) {
    if (unit === "FIXED") {
      return formatters[currencyFormatter].format(reservationUnit.highestPrice);
    }

    const lowestPrice = parseFloat(reservationUnit.lowestPrice)
      ? formatters[floatFormatter].format(reservationUnit.lowestPrice * volume)
      : 0;
    const highestPrice = formatters[currencyFormatter].format(
      reservationUnit.highestPrice * volume
    );
    const price =
      reservationUnit.lowestPrice === reservationUnit.highestPrice
        ? formatters[currencyFormatter].format(
            reservationUnit.lowestPrice * volume
          )
        : `${lowestPrice} - ${highestPrice}`;
    return trim(`${price} / ${unitStr}`, " / ");
  }

  return i18n.t("prices:priceFree");
};

export const isReservationUnitPublished = (
  reservationUnit: ReservationUnitType | ReservationUnitByPkType
): boolean => {
  const now = new Date();
  let beginOK = true;
  let endOK = true;

  if (reservationUnit.publishBegins) {
    beginOK = new Date(reservationUnit.publishBegins) <= now;
  }

  if (reservationUnit.publishEnds) {
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
