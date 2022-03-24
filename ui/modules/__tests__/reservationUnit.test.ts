import { get as mockGet } from "lodash";
import { addMinutes } from "date-fns";
import { EquipmentType, ReservationUnitByPkType } from "../gql-types";
import {
  getEquipmentCategories,
  getEquipmentList,
  getPrice,
  isReservationUnitPublished,
} from "../reservationUnit";
import mockTranslations from "../../public/locales/fi/prices.json";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

jest.mock("next-i18next", () => ({
  i18n: {
    t: (str: string) => {
      const path = str.replace("prices:", "");
      return mockGet(mockTranslations, path);
    },
    language: "fi",
  },
}));

describe("getPrice", () => {
  test("price range", () => {
    const reservationUnit = {
      lowestPrice: 10,
      highestPrice: 50.5,
      priceUnit: "PER_15_MINS",
    };

    expect(getPrice(reservationUnit as ReservationUnitByPkType)).toBe(
      "10 - 50,5 € / 15 min"
    );
  });

  test("price range with no min", () => {
    const reservationUnit = {
      lowestPrice: 0.0,
      highestPrice: 50.5,
      priceUnit: "PER_15_MINS",
    };

    expect(getPrice(reservationUnit as ReservationUnitByPkType)).toBe(
      "0 - 50,5 € / 15 min"
    );
  });

  test("fixed price", () => {
    const reservationUnit = {
      lowestPrice: 50,
      highestPrice: 50,
      priceUnit: "FIXED",
    };

    expect(getPrice(reservationUnit as ReservationUnitByPkType)).toBe("50 €");
  });

  test("fixed price with decimals", () => {
    const reservationUnit = {
      lowestPrice: 50,
      highestPrice: 50,
      priceUnit: "FIXED",
    };

    expect(
      getPrice(reservationUnit as ReservationUnitByPkType, undefined, true)
    ).toBe("50,00 €");
  });

  test("no price", () => {
    const reservationUnit = {
      priceUnit: "FIXED",
    };

    expect(getPrice(reservationUnit as ReservationUnitByPkType)).toBe(
      "Maksuton"
    );
  });

  test("total price with minutes", () => {
    const reservationUnit = {
      lowestPrice: 0.0,
      highestPrice: 50.5,
      priceUnit: "PER_15_MINS",
    };

    expect(getPrice(reservationUnit as ReservationUnitByPkType, 180)).toBe(
      "0 - 606 €"
    );
  });

  test("total price with minutes and decimals", () => {
    const reservationUnit = {
      lowestPrice: 0.0,
      highestPrice: 50.5,
      priceUnit: "PER_15_MINS",
    };

    expect(
      getPrice(reservationUnit as ReservationUnitByPkType, 180, true)
    ).toBe("0 - 606,00 €");
  });
});

describe("isReservationPublished", () => {
  expect(isReservationUnitPublished({} as ReservationUnitByPkType)).toBe(true);

  test("with just publishBegins", () => {
    expect(
      isReservationUnitPublished({
        publishBegins: addMinutes(new Date(), -1),
      } as ReservationUnitByPkType)
    ).toBe(true);

    expect(
      isReservationUnitPublished({
        publishBegins: addMinutes(new Date(), 1),
      } as ReservationUnitByPkType)
    ).toBe(false);

    expect(
      isReservationUnitPublished({
        publishBegins: new Date(),
      } as ReservationUnitByPkType)
    ).toBe(true);
  });

  test("with just publishEnds", () => {
    expect(
      isReservationUnitPublished({
        publishEnds: addMinutes(new Date(), -1),
      } as ReservationUnitByPkType)
    ).toBe(false);

    expect(
      isReservationUnitPublished({
        publishEnds: addMinutes(new Date(), 1),
      } as ReservationUnitByPkType)
    ).toBe(true);

    expect(
      isReservationUnitPublished({
        publishEnds: new Date(),
      } as ReservationUnitByPkType)
    ).toBe(true);
  });

  test("with both dates", () => {
    expect(
      isReservationUnitPublished({
        publishBegins: new Date(),
        publishEnds: new Date(),
      } as ReservationUnitByPkType)
    ).toBe(true);

    expect(
      isReservationUnitPublished({
        publishBegins: addMinutes(new Date(), -1),
        publishEnds: new Date(),
      } as ReservationUnitByPkType)
    ).toBe(true);

    expect(
      isReservationUnitPublished({
        publishBegins: addMinutes(new Date(), 1),
        publishEnds: new Date(),
      } as ReservationUnitByPkType)
    ).toBe(false);

    expect(
      isReservationUnitPublished({
        publishBegins: new Date(),
        publishEnds: addMinutes(new Date(), -1),
      } as ReservationUnitByPkType)
    ).toBe(false);

    expect(
      isReservationUnitPublished({
        publishBegins: new Date(),
        publishEnds: addMinutes(new Date(), 1),
      } as ReservationUnitByPkType)
    ).toBe(true);
  });
});

describe("getEquipmentCategories", () => {
  test("with equipment out of predefined order", () => {
    const equipment: EquipmentType[] = [
      {
        id: "1",
        nameFi: "Item A",
        category: {
          id: "1",
          nameFi: "Category A",
        },
      },
      {
        id: "2",
        nameFi: "Item B",
        category: {
          id: "2",
          nameFi: "Category B",
        },
      },
      {
        id: "3",
        nameFi: "Item C",
        category: {
          id: "3",
          nameFi: "Category C",
        },
      },
    ];

    expect(getEquipmentCategories(equipment)).toStrictEqual(["Muu"]);
  });

  test("with equipment in predefined order", () => {
    const equipment: EquipmentType[] = [
      {
        id: "1",
        nameFi: "Item A",
        category: {
          id: "1",
          nameFi: "Liittimet",
        },
      },
      {
        id: "2",
        nameFi: "Item B",
        category: {
          id: "2",
          nameFi: "Keittiö",
        },
      },
      {
        id: "3",
        nameFi: "Item C",
        category: {
          id: "3",
          nameFi: "Foobar",
        },
      },
      {
        id: "4",
        nameFi: "Item D",
        category: {
          id: "4",
          nameFi: "Pelikonsoli",
        },
      },
      {
        id: "5",
        nameFi: "Item ABC 2",
        category: {
          id: "2",
          nameFi: "Keittiö",
        },
      },
      {
        id: "6",
        nameFi: "Item ABC 1",
        category: {
          id: "2",
          nameFi: "Keittiö",
        },
      },
    ];

    expect(getEquipmentCategories(equipment)).toStrictEqual([
      "Keittiö",
      "Pelikonsoli",
      "Liittimet",
      "Muu",
    ]);
  });

  test("without categories", () => {
    expect(getEquipmentCategories([])).toStrictEqual([]);
  });
});

describe("getEquipmentList", () => {
  test("with equipment out of predefined order", () => {
    const equipment: EquipmentType[] = [
      {
        id: "1",
        nameFi: "Item A",
        category: {
          id: "1",
          nameFi: "Category A",
        },
      },
      {
        id: "2",
        nameFi: "Item B",
        category: {
          id: "2",
          nameFi: "Category B",
        },
      },
      {
        id: "3",
        nameFi: "Item C",
        category: {
          id: "3",
          nameFi: "Category C",
        },
      },
    ];

    expect(getEquipmentList(equipment)).toStrictEqual([
      "Item A",
      "Item B",
      "Item C",
    ]);
  });

  test("with equipment out of predefined order", () => {
    const equipment: EquipmentType[] = [
      {
        id: "1",
        nameFi: "Item A",
        category: {
          id: "1",
          nameFi: "Category C",
        },
      },
      {
        id: "2",
        nameFi: "Item B",
        category: {
          id: "2",
          nameFi: "Category B",
        },
      },
      {
        id: "3",
        nameFi: "Item C",
        category: {
          id: "3",
          nameFi: "Category A",
        },
      },
    ];

    expect(getEquipmentList(equipment)).toStrictEqual([
      "Item A",
      "Item B",
      "Item C",
    ]);
  });

  test("with equipment in predefined order", () => {
    const equipment: EquipmentType[] = [
      {
        id: "1",
        nameFi: "Item A",
        category: {
          id: "1",
          nameFi: "Liittimet",
        },
      },
      {
        id: "2",
        nameFi: "Item B",
        category: {
          id: "2",
          nameFi: "Keittiö",
        },
      },
      {
        id: "3",
        nameFi: "Item C 2",
        category: {
          id: "3",
          nameFi: "Foobar",
        },
      },
      {
        id: "4",
        nameFi: "Item D",
        category: {
          id: "4",
          nameFi: "Pelikonsoli",
        },
      },
      {
        id: "5",
        nameFi: "Item ABC 2",
        category: {
          id: "2",
          nameFi: "Keittiö",
        },
      },
      {
        id: "6",
        nameFi: "Item ABC 1",
        category: {
          id: "2",
          nameFi: "Keittiö",
        },
      },
      {
        id: "6",
        nameFi: "Item C 1",
        category: {
          id: "2",
          nameFi: "Barfoo",
        },
      },
    ];

    expect(getEquipmentList(equipment)).toStrictEqual([
      "Item ABC 1",
      "Item ABC 2",
      "Item B",
      "Item D",
      "Item A",
      "Item C 1",
      "Item C 2",
    ]);
  });

  test("without equipment", () => {
    expect(getEquipmentList([])).toStrictEqual([]);
  });
});
