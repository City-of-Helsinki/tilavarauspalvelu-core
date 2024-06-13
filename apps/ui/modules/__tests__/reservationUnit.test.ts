import { cloneDeep, get as mockGet } from "lodash";
import { addDays } from "date-fns";
import { toUIDate } from "common/src/common/util";
import {
  type EquipmentNode,
  ReservationStateChoice,
  type ReservationUnitPricingNode,
  PriceUnit,
  PricingType,
  ReservationUnitState,
  type ReservationUnitNode,
  Status,
  PricingFieldsFragment,
  Authentication,
  ReservationKind,
  ReservationStartInterval,
  ReservationState,
} from "@gql/gql-types";
import {
  getEquipmentCategories,
  getEquipmentList,
  getFuturePricing,
  getPrice,
  getReservationUnitInstructionsKey,
  getReservationUnitName,
  getReservationUnitPrice,
  getUnitName,
  isReservationUnitPaidInFuture,
  isReservationUnitPublished,
  isReservationUnitReservable,
} from "../reservationUnit";
import mockTranslations from "../../public/locales/fi/prices.json";
import { type RoundPeriod } from "../reservation";

jest.mock("next-i18next", () => ({
  i18n: {
    t: (str: string) => {
      const path = str.replace("prices:", "");
      return mockGet(mockTranslations, path);
    },
    language: "fi",
  },
}));

const pricingBase: PricingFieldsFragment = {
  id: "1",
  begins: "",
  taxPercentage: {
    id: "1",
    pk: 1,
    value: "24",
  },
  status: Status.Active,
  lowestPrice: "0",
  highestPrice: "60.5",
  priceUnit: PriceUnit.PerHour,
  pricingType: PricingType.Paid,
};

// Turn into describe block and spec the tests
test.todo("getNextAvailableTime");
test.todo("getDayIntervals");

describe("getPrice", () => {
  test("price range", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "10",
      highestPrice: "50.5",
      priceUnit: PriceUnit.Per_15Mins,
    };

    expect(getPrice({ pricing })).toBe("10 - 50,5 € / 15 min");
  });

  test("price range with no min", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0.0",
      highestPrice: "50.5",
      priceUnit: PriceUnit.Per_15Mins,
    };

    expect(getPrice({ pricing })).toBe("0 - 50,5 € / 15 min");
  });

  test("price range with minutes", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0",
      highestPrice: "60.5",
      priceUnit: PriceUnit.PerHour,
    };

    expect(getPrice({ pricing, minutes: 60 })).toBe("0 - 60,5 €");
  });

  test("price range with minutes", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
    };

    expect(getPrice({ pricing, minutes: 61 })).toBe("0 - 75,63 €");
  });

  test("price range with minutes", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0",
      highestPrice: "100",
    };

    expect(getPrice({ pricing, minutes: 61 })).toBe("0 - 125 €");
  });

  test("price range with minutes", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0",
      highestPrice: "100",
    };

    expect(getPrice({ pricing, minutes: 90 })).toBe("0 - 150 €");
  });

  test("price range with minutes", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0",
      highestPrice: "100",
    };

    expect(getPrice({ pricing, minutes: 91 })).toBe("0 - 175 €");
  });

  test("price range with minutes", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0",
      highestPrice: "30",
      priceUnit: PriceUnit.Per_15Mins,
    };

    expect(getPrice({ pricing, minutes: 60 })).toBe("0 - 120 €");
  });

  test("price range with minutes", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0",
      highestPrice: "30",
      priceUnit: PriceUnit.Per_30Mins,
    };

    expect(getPrice({ pricing, minutes: 60 })).toBe("0 - 60 €");
  });

  test("price range with minutes", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0",
      highestPrice: "30",
      priceUnit: PriceUnit.Per_30Mins,
    };

    expect(getPrice({ pricing, minutes: 61 })).toBe("0 - 75 €");
  });

  test("price range with minutes and fixed unit", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "10",
      highestPrice: "100",
      priceUnit: PriceUnit.PerHalfDay,
    };

    expect(getPrice({ pricing, minutes: 61 })).toBe("10 - 100 €");
  });

  test("price range with minutes and fixed unit", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "10",
      highestPrice: "100",
      priceUnit: PriceUnit.PerDay,
    };

    expect(getPrice({ pricing, minutes: 1234 })).toBe("10 - 100 €");
  });

  test("price range with minutes and fixed unit", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "10",
      highestPrice: "100",
      priceUnit: PriceUnit.PerWeek,
    };

    expect(getPrice({ pricing, minutes: 1234 })).toBe("10 - 100 €");
  });

  test("fixed price", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "50",
      highestPrice: "50",
      priceUnit: PriceUnit.Fixed,
    };

    expect(getPrice({ pricing })).toBe("50 €");
  });

  test("fixed price with decimals", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "50",
      highestPrice: "50",
      priceUnit: PriceUnit.Fixed,
    };

    expect(getPrice({ pricing, trailingZeros: true })).toBe("50,00 €");
  });

  test("no price", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0",
      highestPrice: "0",
    };

    expect(getPrice({ pricing })).toBe("Maksuton");
  });

  test("total price with minutes", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0.0",
      highestPrice: "50.5",
      priceUnit: PriceUnit.Per_15Mins,
    };

    expect(getPrice({ pricing, minutes: 180 })).toBe("0 - 606 €");
  });

  test("total price with minutes and decimals", () => {
    const pricing: PricingFieldsFragment = {
      ...pricingBase,
      lowestPrice: "0.0",
      highestPrice: "50.5",
      priceUnit: PriceUnit.Per_15Mins,
    };

    expect(getPrice({ pricing, minutes: 180, trailingZeros: true })).toBe(
      "0 - 606,00 €"
    );
  });
});

describe("isReservationUnitPublished", () => {
  test("without state", () => {
    expect(isReservationUnitPublished({} as ReservationUnitNode)).toBe(false);
  });

  test("with valid states", () => {
    expect(
      isReservationUnitPublished({ state: ReservationUnitState.Published })
    ).toBe(true);

    expect(
      isReservationUnitPublished({
        state: ReservationUnitState.ScheduledHiding,
      })
    ).toBe(true);
  });

  test("with invalid states", () => {
    expect(
      isReservationUnitPublished({ state: ReservationUnitState.Archived })
    ).toBe(false);

    expect(
      isReservationUnitPublished({ state: ReservationUnitState.Draft })
    ).toBe(false);

    expect(
      isReservationUnitPublished({ state: ReservationUnitState.Hidden })
    ).toBe(false);

    expect(
      isReservationUnitPublished({
        state: ReservationUnitState.ScheduledPeriod,
      })
    ).toBe(false);

    expect(
      isReservationUnitPublished({
        state: ReservationUnitState.ScheduledPublishing,
      })
    ).toBe(false);
  });
});

describe("getEquipmentCategories", () => {
  test("with equipment out of predefined order", () => {
    const equipment: EquipmentNode[] = [
      {
        id: "1",
        nameFi: "Item A",
        name: "Item A",
        category: {
          id: "1",
          nameFi: "Category A",
          name: "Category A",
        },
      },
      {
        id: "2",
        nameFi: "Item B",
        name: "Item B",
        category: {
          id: "2",
          nameFi: "Category B",
          name: "Category B",
        },
      },
      {
        id: "3",
        nameFi: "Item C",
        name: "Item C",
        category: {
          id: "3",
          nameFi: "Category C",
          name: "Category C",
        },
      },
    ];

    expect(getEquipmentCategories(equipment)).toStrictEqual(["Muu"]);
  });

  test("with equipment in predefined order", () => {
    const equipment: EquipmentNode[] = [
      {
        id: "1",
        nameFi: "Item A",
        name: "Item A",
        category: {
          id: "1",
          nameFi: "Liittimet",
          name: "Liittimet",
        },
      },
      {
        id: "2",
        nameFi: "Item B",
        name: "Item B",
        category: {
          id: "2",
          nameFi: "Keittiö",
          name: "Keittiö",
        },
      },
      {
        id: "3",
        nameFi: "Item C",
        name: "Item C",
        category: {
          id: "3",
          nameFi: "Foobar",
          name: "Foobar",
        },
      },
      {
        id: "4",
        nameFi: "Item D",
        name: "Item D",
        category: {
          id: "4",
          nameFi: "Pelikonsoli",
          name: "Pelikonsoli",
        },
      },
      {
        id: "5",
        nameFi: "Item ABC 2",
        name: "Item ABC 2",
        category: {
          id: "2",
          nameFi: "Keittiö",
          name: "Keittiö",
        },
      },
      {
        id: "6",
        nameFi: "Item ABC 1",
        name: "Item ABC 1",
        category: {
          id: "2",
          nameFi: "Keittiö",
          name: "Keittiö",
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
    const equipment: EquipmentNode[] = [
      {
        id: "1",
        nameFi: "Item A",
        name: "Item A",
        category: {
          id: "1",
          nameFi: "Category A",
          name: "Category A",
        },
      },
      {
        id: "2",
        nameFi: "Item B",
        name: "Item B",
        category: {
          id: "2",
          nameFi: "Category B",
          name: "Category B",
        },
      },
      {
        id: "3",
        nameFi: "Item C",
        name: "Item C",
        category: {
          id: "3",
          nameFi: "Category C",
          name: "Category C",
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
    const equipment: EquipmentNode[] = [
      {
        id: "1",
        nameFi: "Item A",
        name: "Item A",
        category: {
          id: "1",
          nameFi: "Category C",
          name: "Category C",
        },
      },
      {
        id: "2",
        nameFi: "Item B",
        name: "Item B",
        category: {
          id: "2",
          nameFi: "Category B",
          name: "Category B",
        },
      },
      {
        id: "3",
        nameFi: "Item C",
        name: "Item C",
        category: {
          id: "3",
          nameFi: "Category A",
          name: "Category A",
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
    const equipment: EquipmentNode[] = [
      {
        id: "1",
        nameFi: "Item A",
        name: "Item A",
        category: {
          id: "1",
          nameFi: "Liittimet",
          name: "Liittimet",
        },
      },
      {
        id: "2",
        nameFi: "Item B",
        name: "Item B",
        category: {
          id: "2",
          nameFi: "Keittiö",
          name: "Keittiö",
        },
      },
      {
        id: "3",
        nameFi: "Item C 2",
        name: "Item C 2",
        category: {
          id: "3",
          nameFi: "Foobar",
          name: "Foobar",
        },
      },
      {
        id: "4",
        nameFi: "Item D",
        name: "Item D",
        category: {
          id: "4",
          nameFi: "Pelikonsoli",
          name: "Pelikonsoli",
        },
      },
      {
        id: "5",
        nameFi: "Item ABC 2",
        name: "Item ABC 2",
        category: {
          id: "2",
          nameFi: "Keittiö",
          name: "Keittiö",
        },
      },
      {
        id: "6",
        nameFi: "Item ABC 1",
        name: "Item ABC 1",
        category: {
          id: "2",
          nameFi: "Keittiö",
          name: "Keittiö",
        },
      },
      {
        id: "6",
        nameFi: "Item C 1",
        name: "Item C 1",
        category: {
          id: "2",
          nameFi: "Barfoo",
          name: "Barfoo",
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
    } as ReservationUnitNode;

    expect(getReservationUnitName(reservationUnit)).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the current language", () => {
    const reservationUnit = {
      nameFi: "Unit 1 FI",
      nameEn: "Unit 1 EN",
      nameSv: "Unit 1 SV",
    } as ReservationUnitNode;

    expect(getReservationUnitName(reservationUnit, "sv")).toEqual("Unit 1 SV");
  });

  it("should return the name of the unit in the default language", () => {
    const reservationUnit = {
      nameFi: "Unit 1 FI",
      nameEn: "",
      nameSv: "",
    };

    expect(getReservationUnitName(reservationUnit, "sv")).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the default language", () => {
    const reservationUnit = {
      nameFi: "Unit 1 FI",
    };

    expect(getReservationUnitName(reservationUnit, "sv")).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the default language", () => {
    const reservationUnit = {
      nameFi: "Unit 1 FI",
      nameEn: null,
      nameSv: null,
    };

    expect(getReservationUnitName(reservationUnit, "sv")).toEqual("Unit 1 FI");
  });
});

describe("getUnitName", () => {
  it("should return the name of the unit", () => {
    const unit = {
      nameFi: "Unit 1 FI",
      nameEn: "Unit 1 EN",
      nameSv: "Unit 1 SV",
    };

    expect(getUnitName(unit)).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the current language", () => {
    const unit = {
      nameFi: "Unit 1 FI",
      nameEn: "Unit 1 EN",
      nameSv: "Unit 1 SV",
    };

    expect(getUnitName(unit, "sv")).toEqual("Unit 1 SV");
  });

  it("should return the name of the unit in the default language", () => {
    const unit = {
      nameFi: "Unit 1 FI",
      nameEn: "",
      nameSv: "",
    };

    expect(getUnitName(unit, "sv")).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the default language", () => {
    const unit = {
      nameFi: "Unit 1 FI",
    };

    expect(getUnitName(unit, "sv")).toEqual("Unit 1 FI");
  });

  it("should return the name of the unit in the default language", () => {
    const unit = {
      nameFi: "Unit 1 FI",
      nameEn: null,
      nameSv: null,
    };

    expect(getUnitName(unit, "sv")).toEqual("Unit 1 FI");
  });
});

describe("getReservationUnitInstructionsKey", () => {
  it("should return correct key pending states", () => {
    expect(
      getReservationUnitInstructionsKey(ReservationStateChoice.Created)
    ).toEqual("reservationPendingInstructions");
    expect(
      getReservationUnitInstructionsKey(ReservationStateChoice.RequiresHandling)
    ).toEqual("reservationPendingInstructions");
  });

  it("should return correct key cancelled states", () => {
    expect(
      getReservationUnitInstructionsKey(ReservationStateChoice.Cancelled)
    ).toEqual("reservationCancelledInstructions");
  });

  it("should return correct key confirmed states", () => {
    expect(
      getReservationUnitInstructionsKey(ReservationStateChoice.Confirmed)
    ).toEqual("reservationConfirmedInstructions");
  });

  it("should return no key for rest", () => {
    expect(
      getReservationUnitInstructionsKey(ReservationStateChoice.Denied)
    ).toEqual(null);
  });
});

describe("getFuturePricing", () => {
  const reservationUnit: ReservationUnitNode = {
    id: "testing",
    pricings: [
      {
        id: "1",
        pk: 1,
        begins: toUIDate(addDays(new Date(), 10), "yyyy-MM-dd"),
        pricingType: PricingType.Paid,
        priceUnit: PriceUnit.PerHour,
        lowestPrice: 0,
        highestPrice: 10,
        taxPercentage: {
          id: "1",
          value: 24,
        },
        status: Status.Future,
      },
      {
        id: "2",
        pk: 2,
        begins: toUIDate(addDays(new Date(), 20), "yyyy-MM-dd"),
        pricingType: PricingType.Paid,
        priceUnit: PriceUnit.PerHour,
        lowestPrice: 0,
        highestPrice: 10,
        taxPercentage: {
          id: "1",
          value: 24,
        },
        status: Status.Future,
      },
      {
        id: "3",
        pk: 3,
        begins: toUIDate(addDays(new Date(), 5), "yyyy-MM-dd"),
        pricingType: PricingType.Paid,
        priceUnit: PriceUnit.PerHour,
        lowestPrice: 0,
        highestPrice: 10,
        taxPercentage: {
          id: "1",
          value: 24,
        },
        status: Status.Future,
      },
    ],
  } as unknown as ReservationUnitNode;

  it("should sort items correctly", () => {
    const data = cloneDeep(reservationUnit);
    if (data.pricings == null || data.pricings.length < 2) {
      throw new Error("Invalid test data");
    }
    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    data.pricings[1]!.begins = toUIDate(addDays(new Date(), 3), "yyyy-MM-dd");
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    data.pricings[2]!.begins = toUIDate(addDays(new Date(), 2), "yyyy-MM-dd");
    expect(getFuturePricing(data)).toEqual(data.pricings[2]);
  });

  it("should return undefined if no future pricing", () => {
    const data = cloneDeep(reservationUnit);
    if (data.pricings == null || data.pricings.length < 2) {
      throw new Error("Invalid test data");
    }

    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    data.pricings[0]!.status = Status.Past;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    data.pricings[1]!.status = Status.Active;
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    data.pricings[2]!.status = Status.Past;
    expect(getFuturePricing(data)).toBeUndefined();

    expect(getFuturePricing({} as ReservationUnitNode)).toBeUndefined();
  });

  it("with reservation begin time", () => {
    const data = cloneDeep(reservationUnit);
    if (data.pricings == null || data.pricings.length < 2) {
      throw new Error("Invalid test data");
    }

    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    data.reservationBegins = addDays(new Date(), 19).toISOString();
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);

    data.reservationBegins = addDays(new Date(), 20).toISOString();
    expect(getFuturePricing(data)).toBeUndefined();
  });

  it("with reservation end time", () => {
    const data = cloneDeep(reservationUnit);
    if (data.pricings == null || data.pricings.length < 2) {
      throw new Error("Invalid test data");
    }

    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    data.reservationEnds = addDays(new Date(), 1).toISOString();
    expect(getFuturePricing(data)).toBeUndefined();

    data.reservationEnds = addDays(new Date(), 5).toISOString();
    expect(getFuturePricing(data)).toEqual(data.pricings[2]);
  });

  it("with both reservation times", () => {
    const data = cloneDeep(reservationUnit);
    if (data.pricings == null || data.pricings.length < 2) {
      throw new Error("Invalid test data");
    }

    expect(getFuturePricing(data)).toEqual(data.pricings[2]);

    data.reservationBegins = addDays(new Date(), 15).toISOString();
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);

    data.reservationEnds = addDays(new Date(), 30).toISOString();
    expect(getFuturePricing(data)).toEqual(data.pricings[1]);
  });

  it("handles active application rounds", () => {
    const data = cloneDeep(reservationUnit);
    if (data.pricings == null || data.pricings.length < 2) {
      throw new Error("Invalid test data");
    }
    const applicationRounds = [{} as RoundPeriod];

    expect(getFuturePricing(data, applicationRounds)).toEqual(data.pricings[2]);

    applicationRounds[0] = {
      reservationPeriodBegin: addDays(new Date(), 1).toISOString(),
    } as RoundPeriod;
    expect(getFuturePricing(data, applicationRounds)).toEqual(data.pricings[2]);

    applicationRounds[0] = {
      reservationPeriodBegin: addDays(new Date(), 1).toISOString(),
      reservationPeriodEnd: addDays(new Date(), 19).toISOString(),
    };
    expect(getFuturePricing(data, applicationRounds)).toEqual(data.pricings[1]);

    applicationRounds[0] = {
      reservationPeriodBegin: addDays(new Date(), 1).toISOString(),
      reservationPeriodEnd: addDays(new Date(), 20).toISOString(),
    };
    expect(getFuturePricing(data, applicationRounds)).toBeUndefined();
  });

  it("handles date lookups", () => {
    const data = cloneDeep(reservationUnit);
    if (data.pricings == null || data.pricings.length < 2) {
      throw new Error("Invalid test data");
    }
    let date = addDays(new Date(), 15);

    expect(getFuturePricing(data, [], date)).toEqual(data.pricings[0]);

    date = addDays(new Date(), 5);
    expect(getFuturePricing(data, [], date)).toEqual(data.pricings[2]);

    date = addDays(new Date(), 20);
    expect(getFuturePricing(data, [], date)).toEqual(data.pricings[1]);
  });
});

describe("getReservationUnitPrice", () => {
  const reservationUnit = {
    id: "testing",
    pricings: [
      {
        id: "1",
        pk: 1,
        begins: toUIDate(addDays(new Date(), 10), "yyyy-MM-dd"),
        pricingType: PricingType.Paid,
        priceUnit: PriceUnit.PerHour,
        lowestPrice: "10",
        lowestPriceNet: "10",
        highestPrice: "20",
        highestPriceNet: "20",
        taxPercentage: {
          id: "1",
          value: "24",
        },
        status: Status.Future,
      },
      {
        id: "2",
        pk: 2,
        begins: toUIDate(addDays(new Date(), 20), "yyyy-MM-dd"),
        pricingType: PricingType.Paid,
        priceUnit: PriceUnit.PerHour,
        lowestPrice: "20",
        lowestPriceNet: "20",
        highestPrice: "30",
        highestPriceNet: "30",
        taxPercentage: {
          id: "1",
          value: "24",
        },
        status: Status.Future,
      },
      {
        id: "3",
        pk: 3,
        begins: toUIDate(addDays(new Date(), 5), "yyyy-MM-dd"),
        pricingType: PricingType.Paid,
        priceUnit: PriceUnit.PerHour,
        lowestPrice: "40",
        lowestPriceNet: "40",
        highestPrice: "50",
        highestPriceNet: "50",
        taxPercentage: {
          id: "1",
          value: "24",
        },
        status: Status.Future,
      },
      {
        id: "4",
        pk: 4,
        begins: toUIDate(addDays(new Date(), 5), "yyyy-MM-dd"),
        pricingType: PricingType.Paid,
        priceUnit: PriceUnit.PerHour,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "10",
        highestPriceNet: "10",
        taxPercentage: {
          id: "1",
          value: "24",
        },
        status: Status.Active,
      },
    ],
  };

  it("returns future data based on date lookup", () => {
    const data = cloneDeep(reservationUnit);

    expect(
      getReservationUnitPrice({
        reservationUnit: data,
        pricingDate: addDays(new Date(), 5),
      })
    ).toEqual("40 - 50 € / tunti");

    expect(
      getReservationUnitPrice({
        reservationUnit: data,
        pricingDate: addDays(new Date(), 11),
        trailingZeros: true,
      })
    ).toEqual("10,00 - 20,00 € / tunti");
  });
});

describe("isReservationUnitPaidInFuture", () => {
  it("return true if active and future are paid", () => {
    const pricings = [
      {
        pricingType: PricingType.Paid,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "20",
        highestPriceNet: "20",
        status: Status.Future,
      },
      {
        pricingType: PricingType.Paid,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "10",
        highestPriceNet: "10",
        status: Status.Active,
      },
    ] as ReservationUnitPricingNode[];

    expect(isReservationUnitPaidInFuture(pricings)).toBe(true);
  });

  it("return true if only active is paid", () => {
    const pricings = [
      {
        pricingType: PricingType.Free,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "0",
        highestPriceNet: "0",
        status: Status.Future,
      },
      {
        pricingType: PricingType.Paid,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "10",
        highestPriceNet: "10",
        status: Status.Active,
      },
    ] as ReservationUnitPricingNode[];

    expect(isReservationUnitPaidInFuture(pricings)).toBe(true);
  });

  it("return true if only future one paid", () => {
    const pricings = [
      {
        pricingType: PricingType.Paid,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "20",
        highestPriceNet: "20",
        status: Status.Future,
      },
      {
        pricingType: PricingType.Free,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "0",
        highestPriceNet: "0",
        status: Status.Active,
      },
    ] as ReservationUnitPricingNode[];

    expect(isReservationUnitPaidInFuture(pricings)).toBe(true);
  });

  it("returns false if future one if paid but price is set in zero", () => {
    const pricings = [
      {
        pricingType: PricingType.Paid,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "0",
        highestPriceNet: "0",
        status: Status.Future,
      },
      {
        pricingType: PricingType.Free,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "0",
        highestPriceNet: "0",
        status: Status.Active,
      },
    ] as ReservationUnitPricingNode[];

    expect(isReservationUnitPaidInFuture(pricings)).toBe(false);
  });

  it("returns false all are free", () => {
    const pricings = [
      {
        pricingType: PricingType.Free,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "20",
        highestPriceNet: "20",
        status: Status.Future,
      },
      {
        pricingType: PricingType.Free,
        lowestPrice: "0",
        lowestPriceNet: "0",
        highestPrice: "20",
        highestPriceNet: "20",
        status: Status.Active,
      },
    ] as ReservationUnitPricingNode[];

    expect(isReservationUnitPaidInFuture(pricings)).toBe(false);
  });
});

describe("isReservationUnitReservable", () => {
  const date = new Date().toISOString().split("T")[0];
  const reservationUnit: ReservationUnitNode = {
    id: "1234",
    allowReservationsWithoutOpeningHours: false,
    authentication: Authentication.Strong,
    canApplyFreeOfCharge: false,
    contactInformation: "",
    isArchived: false,
    isDraft: false,
    requireIntroduction: false,
    requireReservationHandling: false,
    ReservationKind: ReservationKind.Direct,
    reservationStartInterval: ReservationStartInterval.Interval_15Mins,
    uuid: "1234",
    images: [],
    reservableTimeSpans: [
      {
        startDatetime: `${date}T04:00:00+00:00`,
        endDatetime: `${date}T20:00:00+00:00`,
      },
    ],
  } as unknown as ReservationUnitNode;

  test("returns true for a unit that is reservable", () => {
    const [res1] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [],
      },
      reservationState: ReservationState.Reservable,
    });
    expect(res1).toBe(true);

    const [res2] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [],
      },
      reservationState: ReservationState.ScheduledClosing,
    });
    expect(res2).toBe(true);
  });

  test("returns false for a unit that is not reservable", () => {
    const [res1] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      reservableTimeSpans: undefined,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [],
      },
      reservationState: ReservationState.ReservationClosed,
    });
    expect(res1).toBe(false);

    const [res2] = isReservationUnitReservable({
      ...reservationUnit,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [],
      },
      reservationState: ReservationState.ReservationClosed,
    });
    expect(res2).toBe(false);

    const [res3] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [],
      },
      reservationState: ReservationState.Reservable,
    });
    expect(res3).toBe(false);

    const [res4] = isReservationUnitReservable({
      ...reservationUnit,
      maxReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [],
      },
      reservationState: ReservationState.Reservable,
    });
    expect(res4).toBe(false);

    const [res5] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [],
      },
      reservationState: ReservationState.ScheduledReservation,
    });
    expect(res5).toBe(false);

    const [res6] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [],
      },
      reservationState: ReservationState.ScheduledPeriod,
    });
    expect(res6).toBe(false);
  });

  test("returns correct value with buffer days", () => {
    const [res1] = isReservationUnitReservable({
      ...reservationUnit,
      minReservationDuration: 3600,
      maxReservationDuration: 3600,
      reservationBegins: addDays(new Date(), 5).toISOString(),
      reservationsMaxDaysBefore: 5,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [],
      },
    });
    expect(res1).toBe(false);

    const [res2] = isReservationUnitReservable({
      ...reservationUnit,
      reservationBegins: addDays(new Date(), 5).toISOString(),
      reservationsMaxDaysBefore: 4,
      reservableTimeSpans: undefined,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [],
      },
    });
    expect(res2).toBe(false);
  });
});
