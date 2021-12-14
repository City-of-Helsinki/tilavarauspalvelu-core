import { get as mockGet } from "lodash";
import { ReservationUnitByPkType } from "../gql-types";
import { getPrice } from "../reservationUnit";
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
