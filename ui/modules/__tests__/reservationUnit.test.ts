import { cloneDeep, get as mockGet } from "lodash";
import { addDays, addMinutes } from "date-fns";
import {
  ApplicationRound,
  ReservationState,
  ReservationUnit,
} from "common/types/common";
import { toUIDate } from "common/src/common/util";
import {
  EquipmentType,
  ReservationsReservationStateChoices,
  ReservationUnitByPkType,
  ReservationUnitPricingType,
  ReservationUnitsReservationUnitPricingPriceUnitChoices,
  ReservationUnitsReservationUnitPricingPricingTypeChoices,
  ReservationUnitsReservationUnitPricingStatusChoices,
  ReservationUnitType,
  UnitType,
} from "../gql-types";
import {
  getEquipmentCategories,
  getEquipmentList,
  getFuturePricing,
  getOldReservationUnitName,
  getPrice,
  getReservationUnitInstructionsKey,
  getReservationUnitName,
  getReservationUnitPrice,
  getUnitName,
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
    const pricing = {
      lowestPrice: 10,
      highestPrice: 50.5,
      priceUnit: "PER_15_MINS",
      pricingType: "PAID",
    } as unknown as ReservationUnitPricingType;

    expect(getPrice(pricing)).toBe("10 - 50,5 € / 15 min");
  });

  test("price range with no min", () => {
    const pricing = {
      lowestPrice: 0.0,
      highestPrice: 50.5,
      priceUnit: "PER_15_MINS",
      pricingType: "PAID",
    } as unknown as ReservationUnitPricingType;

    expect(getPrice(pricing)).toBe("0 - 50,5 € / 15 min");
  });

  test("fixed price", () => {
    const pricing = {
      lowestPrice: 50,
      highestPrice: 50,
      priceUnit: "FIXED",
      pricingType: "PAID",
    } as unknown as ReservationUnitPricingType;

    expect(getPrice(pricing)).toBe("50 €");
  });

  test("fixed price with decimals", () => {
    const pricing = {
      lowestPrice: 50,
      highestPrice: 50,
      priceUnit: "FIXED",
      pricingType: "PAID",
    } as unknown as ReservationUnitPricingType;

    expect(getPrice(pricing, undefined, true)).toBe("50,00 €");
  });

  test("no price", () => {
    const pricing = {
      priceUnit: "FIXED",
    } as unknown as ReservationUnitPricingType;

    expect(getPrice(pricing)).toBe("Maksuton");
    expect(getPrice({} as ReservationUnitPricingType)).toBe("Maksuton");
  });

  test("free", () => {
    const pricing = {
      priceUnit: "FIXED",
      pricingType: "FREE",
    } as unknown as ReservationUnitPricingType;

    expect(getPrice(pricing)).toBe("Maksuton");
  });

  test("total price with minutes", () => {
    const pricing = {
      lowestPrice: 0.0,
      highestPrice: 50.5,
      priceUnit: "PER_15_MINS",
      pricingType: "PAID",
      status: "ACTIVE",
    } as unknown as ReservationUnitPricingType;

    expect(getPrice(pricing, 180)).toBe("0 - 606 €");
  });

  test("total price with minutes and decimals", () => {
    const pricing = {
      lowestPrice: 0.0,
      highestPrice: 50.5,
      priceUnit: "PER_15_MINS",
      pricingType: "PAID",
      status: "ACTIVE",
    } as unknown as ReservationUnitPricingType;

    expect(getPrice(pricing, 180, true)).toBe("0 - 606,00 €");
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

describe("getReservationUnitName", () => {
  it("should return the name of the unit", () => {
    const reservationUnit = {
      nameFi: "Unit 1 FI",
      nameEn: "Unit 1 EN",
      nameSv: "Unit 1 SV",
    } as ReservationUnitType;

    expect(getReservationUnitName(reservationUnit)).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the current language", () => {
    const reservationUnit = {
      nameFi: "Unit 1 FI",
      nameEn: "Unit 1 EN",
      nameSv: "Unit 1 SV",
    } as ReservationUnitType;

    expect(getReservationUnitName(reservationUnit, "sv")).toEqual("Unit 1 SV");
  });

  it("should return the name of the unit in the default language", () => {
    const reservationUnit = {
      nameFi: "Unit 1 FI",
      nameEn: "",
      nameSv: "",
    } as ReservationUnitType;

    expect(getReservationUnitName(reservationUnit, "sv")).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the default language", () => {
    const reservationUnit = {
      nameFi: "Unit 1 FI",
    } as ReservationUnitType;

    expect(getReservationUnitName(reservationUnit, "sv")).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the default language", () => {
    const reservationUnit = {
      nameFi: "Unit 1 FI",
      nameEn: null,
      nameSv: null,
    } as ReservationUnitType;

    expect(getReservationUnitName(reservationUnit, "sv")).toEqual("Unit 1 FI");
  });
});

describe("getOldReservationUnitName", () => {
  it("should return the name of the unit", () => {
    const reservationUnit = {
      name: {
        fi: "Unit 1 FI",
        en: "Unit 1 EN",
        sv: "Unit 1 SV",
      },
    } as ReservationUnit;

    expect(getOldReservationUnitName(reservationUnit)).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the current language", () => {
    const reservationUnit = {
      name: {
        fi: "Unit 1 FI",
        en: "Unit 1 EN",
        sv: "Unit 1 SV",
      },
    } as ReservationUnit;

    expect(getOldReservationUnitName(reservationUnit, "sv")).toEqual(
      "Unit 1 SV"
    );
  });

  it("should return the name of the unit in the default language", () => {
    const reservationUnit = {
      name: {
        fi: "Unit 1 FI",
        en: "",
        sv: "",
      },
    } as ReservationUnit;

    expect(getOldReservationUnitName(reservationUnit, "sv")).toEqual(
      "Unit 1 FI"
    );
  });

  it("should return the name of the unit in the default language", () => {
    const reservationUnit = {
      name: {
        fi: "Unit 1 FI",
      },
    } as ReservationUnit;

    expect(getOldReservationUnitName(reservationUnit, "sv")).toEqual(
      "Unit 1 FI"
    );
  });

  it("should return the name of the unit in the default language", () => {
    const reservationUnit = {
      name: {
        fi: "Unit 1 FI",
        en: null,
        sv: null,
      },
    } as ReservationUnit;

    expect(getOldReservationUnitName(reservationUnit, "sv")).toEqual(
      "Unit 1 FI"
    );
  });
});

describe("getUnitName", () => {
  it("should return the name of the unit", () => {
    const unit = {
      nameFi: "Unit 1 FI",
      nameEn: "Unit 1 EN",
      nameSv: "Unit 1 SV",
    } as UnitType;

    expect(getUnitName(unit)).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the current language", () => {
    const unit = {
      nameFi: "Unit 1 FI",
      nameEn: "Unit 1 EN",
      nameSv: "Unit 1 SV",
    } as UnitType;

    expect(getUnitName(unit, "sv")).toEqual("Unit 1 SV");
  });

  it("should return the name of the unit in the default language", () => {
    const unit = {
      nameFi: "Unit 1 FI",
      nameEn: "",
      nameSv: "",
    } as UnitType;

    expect(getUnitName(unit, "sv")).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the default language", () => {
    const unit = {
      nameFi: "Unit 1 FI",
    } as UnitType;

    expect(getUnitName(unit, "sv")).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the default language", () => {
    const unit = {
      nameFi: "Unit 1 FI",
      nameEn: null,
      nameSv: null,
    } as UnitType;

    expect(getUnitName(unit, "sv")).toEqual("Unit 1 FI");
  });
});

describe("getReservationUnitInstructionsKey", () => {
  it("should return correct key pending states", () => {
    expect(getReservationUnitInstructionsKey("initial")).toEqual(
      "reservationPendingInstructions"
    );
    expect(getReservationUnitInstructionsKey("created")).toEqual(
      "reservationPendingInstructions"
    );
    expect(getReservationUnitInstructionsKey("requested")).toEqual(
      "reservationPendingInstructions"
    );
    expect(getReservationUnitInstructionsKey("waiting for payment")).toEqual(
      "reservationPendingInstructions"
    );
    expect(
      getReservationUnitInstructionsKey(
        ReservationsReservationStateChoices.Created
      )
    ).toEqual("reservationPendingInstructions");
    expect(
      getReservationUnitInstructionsKey(
        ReservationsReservationStateChoices.RequiresHandling
      )
    ).toEqual("reservationPendingInstructions");
  });

  it("should return correct key cancelled states", () => {
    expect(getReservationUnitInstructionsKey("cancelled")).toEqual(
      "reservationCancelledInstructions"
    );
    expect(
      getReservationUnitInstructionsKey(
        ReservationsReservationStateChoices.Cancelled
      )
    ).toEqual("reservationCancelledInstructions");
  });

  it("should return correct key confirmed states", () => {
    expect(getReservationUnitInstructionsKey("confirmed")).toEqual(
      "reservationConfirmedInstructions"
    );
    expect(
      getReservationUnitInstructionsKey(
        ReservationsReservationStateChoices.Confirmed
      )
    ).toEqual("reservationConfirmedInstructions");
  });

  it("should return no key for rest", () => {
    expect(getReservationUnitInstructionsKey("denied")).toEqual(null);
    expect(
      getReservationUnitInstructionsKey(
        ReservationsReservationStateChoices.Denied
      )
    ).toEqual(null);
    expect(getReservationUnitInstructionsKey("" as ReservationState)).toEqual(
      null
    );
  });
});

describe("getFuturePricing", () => {
  const reservationUnit: ReservationUnitByPkType = {
    openingHours: {
      openingTimePeriods: [
        {
          startDate: new Date(),
          endDate: addDays(new Date(), 300),
        },
      ],
    },
    pricings: [
      {
        pk: 1,
        begins: toUIDate(addDays(new Date(), 10), "yyyy-MM-dd"),
        pricingType:
          ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
        priceUnit:
          ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
        lowestPrice: 0,
        highestPrice: 10,
        taxPercentage: {
          id: "1",
          value: 24,
        },
        status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
      },
      {
        pk: 2,
        begins: toUIDate(addDays(new Date(), 20), "yyyy-MM-dd"),
        pricingType:
          ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
        priceUnit:
          ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
        lowestPrice: 0,
        highestPrice: 10,
        taxPercentage: {
          id: "1",
          value: 24,
        },
        status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
      },
      {
        pk: 3,
        begins: toUIDate(addDays(new Date(), 5), "yyyy-MM-dd"),
        pricingType:
          ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
        priceUnit:
          ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
        lowestPrice: 0,
        highestPrice: 10,
        taxPercentage: {
          id: "1",
          value: 24,
        },
        status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
      },
    ],
  } as ReservationUnitByPkType;

  it("should sort items correctly", () => {
    const data = cloneDeep(reservationUnit);
    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    data.pricings[1].begins = toUIDate(addDays(new Date(), 3), "yyyy-MM-dd");
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);

    data.pricings[2].begins = toUIDate(addDays(new Date(), 2), "yyyy-MM-dd");
    expect(getFuturePricing(data)).toEqual(data.pricings[2]);
  });

  it("should return null if no future pricing", () => {
    const data = cloneDeep(reservationUnit);

    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    data.pricings[0].status =
      ReservationUnitsReservationUnitPricingStatusChoices.Past;
    data.pricings[1].status =
      ReservationUnitsReservationUnitPricingStatusChoices.Active;
    data.pricings[2].status =
      ReservationUnitsReservationUnitPricingStatusChoices.Past;
    expect(getFuturePricing(data)).toEqual(null);

    expect(getFuturePricing({} as ReservationUnitByPkType)).toEqual(null);
  });

  it("with reservation begin time", () => {
    const data = cloneDeep(reservationUnit);

    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    data.reservationBegins = addDays(new Date(), 19).toISOString();
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);

    data.reservationBegins = addDays(new Date(), 20).toISOString();
    expect(getFuturePricing(data)).toEqual(null);
  });

  it("with reservation end time", () => {
    const data = cloneDeep(reservationUnit);

    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    data.reservationEnds = addDays(new Date(), 1).toISOString();
    expect(getFuturePricing(data)).toEqual(null);

    data.reservationEnds = addDays(new Date(), 5).toISOString();
    expect(getFuturePricing(data)).toEqual(data.pricings[2]);
  });

  it("with both reservation times", () => {
    const data = cloneDeep(reservationUnit);

    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    data.reservationBegins = addDays(new Date(), 15).toISOString();
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);

    data.reservationEnds = addDays(new Date(), 30).toISOString();
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);
  });

  it("with opening time periods", () => {
    const data = cloneDeep(reservationUnit);

    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    data.pricings[1].begins = toUIDate(addDays(new Date(), 2), "yyyy-MM-dd");
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);

    data.openingHours.openingTimePeriods = [];
    expect(getFuturePricing(data)).toEqual(null);

    data.openingHours.openingTimePeriods.push({
      startDate: addDays(new Date(), 1),
      endDate: addDays(new Date(), 20),
    });
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);

    data.openingHours.openingTimePeriods[0].startDate = null;
    expect(getFuturePricing(data)).toEqual(null);

    data.openingHours.openingTimePeriods[0].startDate = new Date();
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);

    data.openingHours.openingTimePeriods[0].endDate = null;
    expect(getFuturePricing(data)).toEqual(null);
  });

  it("handles active application rounds", () => {
    const data = cloneDeep(reservationUnit);
    const applicationRounds = [{} as ApplicationRound];

    expect(getFuturePricing(data, applicationRounds)).toEqual(data.pricings[2]);

    applicationRounds[0] = {
      reservationPeriodBegin: addDays(new Date(), 1).toISOString(),
    } as ApplicationRound;
    expect(getFuturePricing(data, applicationRounds)).toEqual(data.pricings[2]);

    applicationRounds[0] = {
      reservationPeriodBegin: addDays(new Date(), 1).toISOString(),
      reservationPeriodEnd: addDays(new Date(), 19).toISOString(),
    } as ApplicationRound;
    expect(getFuturePricing(data, applicationRounds)).toEqual(data.pricings[1]);

    applicationRounds[0] = {
      reservationPeriodBegin: addDays(new Date(), 1).toISOString(),
      reservationPeriodEnd: addDays(new Date(), 20).toISOString(),
    } as ApplicationRound;
    expect(getFuturePricing(data, applicationRounds)).toEqual(null);
  });

  it("handles date lookups", () => {
    const data = cloneDeep(reservationUnit);
    let date = addDays(new Date(), 15);

    expect(getFuturePricing(data, [], date)).toEqual(data.pricings[0]);

    date = addDays(new Date(), 5);
    expect(getFuturePricing(data, [], date)).toEqual(data.pricings[2]);

    date = addDays(new Date(), 20);
    expect(getFuturePricing(data, [], date)).toEqual(data.pricings[1]);
  });
});

describe("getReservationUnitPrice", () => {
  const reservationUnit: ReservationUnitByPkType = {
    openingHours: {
      openingTimePeriods: [
        {
          startDate: new Date(),
          endDate: addDays(new Date(), 300),
        },
      ],
    },
    pricings: [
      {
        pk: 1,
        begins: toUIDate(addDays(new Date(), 10), "yyyy-MM-dd"),
        pricingType:
          ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
        priceUnit:
          ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
        lowestPrice: 10,
        highestPrice: 20,
        taxPercentage: {
          id: "1",
          value: 24,
        },
        status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
      },
      {
        pk: 2,
        begins: toUIDate(addDays(new Date(), 20), "yyyy-MM-dd"),
        pricingType:
          ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
        priceUnit:
          ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
        lowestPrice: 20,
        highestPrice: 30,
        taxPercentage: {
          id: "1",
          value: 24,
        },
        status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
      },
      {
        pk: 3,
        begins: toUIDate(addDays(new Date(), 5), "yyyy-MM-dd"),
        pricingType:
          ReservationUnitsReservationUnitPricingPricingTypeChoices.Paid,
        priceUnit:
          ReservationUnitsReservationUnitPricingPriceUnitChoices.PerHour,
        lowestPrice: 40,
        highestPrice: 50,
        taxPercentage: {
          id: "1",
          value: 24,
        },
        status: ReservationUnitsReservationUnitPricingStatusChoices.Future,
      },
      {
        pk: 4,
        pricingType: "PAID",
        priceUnit: "PER_HOUR",
        lowestPrice: 0,
        highestPrice: 10,
        taxPercentage: {
          value: 24,
        },
        status: "ACTIVE",
      },
    ],
  } as ReservationUnitByPkType;

  it("returns future data based on date lookup", () => {
    const data = cloneDeep(reservationUnit);

    expect(getReservationUnitPrice(data, addDays(new Date(), 5))).toEqual(
      "40 - 50 € / tunti"
    );

    expect(getReservationUnitPrice(data, addDays(new Date(), 11))).toEqual(
      "10 - 20 € / tunti"
    );
  });

  it("returns null if incomplete data", () => {
    expect(getReservationUnitPrice(null as ReservationUnitByPkType)).toEqual(
      null
    );
  });
});
