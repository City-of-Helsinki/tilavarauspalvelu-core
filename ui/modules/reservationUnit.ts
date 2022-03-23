import { flatten, trim, uniq } from "lodash";
import { i18n } from "next-i18next";
import {
  EquipmentType,
  ReservationUnitByPkType,
  ReservationUnitsReservationUnitPriceUnitChoices,
  ReservationUnitType,
} from "./gql-types";
import { getFormatters as formatters, getTranslation } from "./util";

export const getPriceUnitMinutes = (
  unit: ReservationUnitsReservationUnitPriceUnitChoices
): number => {
  switch (unit) {
    case "PER_15_MINS":
      return 15;
    case "PER_30_MINS":
      return 30;
    case "PER_HOUR":
      return 60;
    case "PER_HALF_DAY":
      return 720;
    case "PER_DAY":
      return 1440;
    case "PER_WEEK":
      return 10080;
    default:
      return 1;
  }
};

export const getVolume = (
  minutes: number,
  unit: ReservationUnitsReservationUnitPriceUnitChoices
): number => {
  if (!minutes) {
    return 1;
  }

  return Math.ceil(minutes / getPriceUnitMinutes(unit));
};

export const getPrice = (
  reservationUnit: ReservationUnitType | ReservationUnitByPkType,
  minutes?: number, // additional minutes for total price calculation
  trailingZeros = false
): string => {
  const unit: ReservationUnitsReservationUnitPriceUnitChoices =
    reservationUnit.priceUnit;
  const volume = getVolume(minutes, unit);
  const currencyFormatter = trailingZeros ? "currencyWithDecimals" : "currency";
  const floatFormatter = trailingZeros ? "twoDecimals" : "strippedDecimal";

  const unitStr =
    unit === "FIXED" || minutes ? "" : i18n.t(`prices:priceUnits.${unit}`);

  if (parseFloat(reservationUnit.highestPrice)) {
    if (unit === "FIXED") {
      return formatters()[currencyFormatter].format(
        reservationUnit.highestPrice
      );
    }

    const lowestPrice = parseFloat(reservationUnit.lowestPrice)
      ? formatters()[floatFormatter].format(
          reservationUnit.lowestPrice * volume
        )
      : 0;
    const highestPrice = formatters()[currencyFormatter].format(
      reservationUnit.highestPrice * volume
    );
    const price =
      reservationUnit.lowestPrice === reservationUnit.highestPrice
        ? formatters()[currencyFormatter].format(
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
