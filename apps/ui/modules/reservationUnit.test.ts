import { get as mockGet } from "lodash-es";
import {
  addDays,
  addHours,
  endOfDay,
  format,
  getHours,
  startOfDay,
  startOfToday,
} from "date-fns";
import { toApiDateUnsafe } from "common/src/common/util";
import {
  PriceUnit,
  ReservationUnitPublishingState,
  type ReservationUnitNode,
  ReservationKind,
  ReservationStartInterval,
  ReservationUnitReservationState,
  type PriceReservationUnitFragment,
  type EquipmentFieldsFragment,
} from "@gql/gql-types";
import {
  type GetReservationUnitPriceProps,
  getDayIntervals,
  getEquipmentCategories,
  getEquipmentList,
  getFuturePricing,
  getPossibleTimesForDay,
  getPriceString,
  getReservationUnitName,
  getReservationUnitPrice,
  isReservationUnitPublished,
  isReservationUnitReservable,
  type GetPriceType,
  type IsReservableReservationUnitType,
} from "./reservationUnit";
import mockTranslations from "./../public/locales/fi/prices.json";
import { type ReservableMap, dateToKey, type RoundPeriod } from "./reservable";
import {
  createMockReservationUnit,
  generateNameFragment,
  TIMERS_TO_FAKE,
} from "@/test/test.utils";
import { base64encode, ReadonlyDeep } from "common/src/helpers";
import { type TFunction } from "i18next";
import { vi, describe, test, expect, beforeEach, afterEach } from "vitest";
import { DeepRequired } from "react-hook-form";

// Turn into describe block and spec the tests
describe("getPossibleTimesForDay", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [...TIMERS_TO_FAKE],
      // use two numbers for hour so we don't need to pad with 0
      now: new Date(2024, 0, 1, 10, 0, 0),
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function mockReservableTimes(): ReservableMap {
    const map: ReservableMap = new Map();
    for (let i = 0; i < 30; i++) {
      const date = addDays(startOfToday(), i);
      const key = format(date, "yyyy-MM-dd");
      const value = [{ start: startOfDay(date), end: endOfDay(date) }];
      map.set(key, value);
    }
    return map;
  }

  function createInput({
    date,
    interval,
    duration,
    reservableTimes,
  }: {
    date: Date;
    interval?: ReservationStartInterval;
    duration?: number;
    bufferTimeBefore?: number;
    bufferTimeAfter?: number;
    reservableTimes?: ReservableMap;
  }) {
    const reservationUnit = createMockReservationUnit({});
    return {
      date,
      interval: interval ?? ReservationStartInterval.Interval_30Mins,
      reservationUnit,
      activeApplicationRounds: [] as const,
      reservableTimes: reservableTimes ?? mockReservableTimes(),
      durationValue: duration ?? 30,
      blockingReservations: [] as const,
    };
  }

  // Doesn't care about the time (outside of can't be in the past) only the day
  test("returns a list of possible times for today in the future", () => {
    const date = startOfToday();
    const hour = getHours(new Date());
    const input = createInput({ date });
    const output: { label: string; value: string }[] = [];
    for (let i = hour; i < 24; i++) {
      // now is not in the set
      if (i !== hour) {
        output.push({ label: `${i}:00`, value: `${i}:00` });
      }
      output.push({ label: `${i}:30`, value: `${i}:30` });
    }
    expect(getPossibleTimesForDay(input)).toStrictEqual(output);
  });

  test("interval is 60 mins", () => {
    const date = startOfToday();
    const hour = getHours(new Date()) + 1;
    const input = createInput({
      date,
      interval: ReservationStartInterval.Interval_60Mins,
    });
    const output: { label: string; value: string }[] = [];
    for (let i = hour; i < 24; i++) {
      output.push({ label: `${i}:00`, value: `${i}:00` });
    }
    expect(getPossibleTimesForDay(input)).toStrictEqual(output);
  });

  test("interval is 120 mins", () => {
    const date = startOfToday();
    const hour = getHours(new Date()) + 2;
    const input = createInput({
      date,
      interval: ReservationStartInterval.Interval_120Mins,
    });
    const output: { label: string; value: string }[] = [];
    for (let i = hour; i < 24; i += 2) {
      output.push({ label: `${i}:00`, value: `${i}:00` });
    }
    expect(getPossibleTimesForDay(input)).toStrictEqual(output);
  });

  test("no ranges for past days", () => {
    const date = addDays(startOfToday(), -1);
    const input = createInput({ date });
    expect(getPossibleTimesForDay(input)).toStrictEqual([]);
  });

  test("no reservable times for the date", () => {
    const date = startOfToday();
    const reservableTimes = mockReservableTimes();
    reservableTimes.delete(dateToKey(date));
    const input = createInput({ date, reservableTimes });
    expect(getPossibleTimesForDay(input)).toStrictEqual([]);
  });

  test("multiple reservable times for the date", () => {
    const date = startOfToday();
    const reservableTimes = mockReservableTimes();
    reservableTimes.set(dateToKey(date), [
      { start: addHours(date, 12), end: addHours(date, 14) },
      { start: addHours(date, 16), end: addHours(date, 17) },
    ]);
    const input = createInput({ date, reservableTimes });
    const output = ["12:00", "12:30", "13:00", "13:30", "16:00", "16:30"].map(
      (label) => ({ label, value: label })
    );
    expect(getPossibleTimesForDay(input)).toStrictEqual(output);
  });

  test("duration is longer than the available times", () => {
    const date = startOfToday();
    const reservableTimes = mockReservableTimes();
    reservableTimes.set(dateToKey(date), [
      { start: addHours(date, 10), end: addHours(date, 11) },
      { start: addHours(date, 12), end: addHours(date, 14) },
      { start: addHours(date, 16), end: addHours(date, 18) },
      { start: addHours(date, 19), end: addHours(date, 20) },
    ]);
    const input = createInput({ date, duration: 150, reservableTimes });
    expect(getPossibleTimesForDay(input)).toStrictEqual([]);
  });

  // getPossibleTimesForDay does multiple calls to isRangeReservable which is heavy
  // a lot of array copying / generation
  test("performance", () => {
    const date = startOfToday();
    const reservableTimes = mockReservableTimes();
    reservableTimes.set(dateToKey(date), [
      { start: addHours(date, 10), end: addHours(date, 11) },
      { start: addHours(date, 12), end: addHours(date, 14) },
      { start: addHours(date, 16), end: addHours(date, 18) },
      { start: addHours(date, 19), end: addHours(date, 20) },
    ]);
    const input = createInput({ date, reservableTimes });
    const start = performance.now();
    getPossibleTimesForDay(input);
    const end = performance.now();
    expect(end - start).toBeLessThan(20);
  });
});

function mockT(str: string): ReturnType<TFunction> {
  const path = str.replace("prices:", "");
  return mockGet(mockTranslations, path);
}

describe("getPriceString", () => {
  function constructInput({
    lowestPrice,
    highestPrice,
    priceUnit,
    minutes,
  }: {
    lowestPrice?: number;
    highestPrice?: number;
    priceUnit?: PriceUnit;
    minutes?: number;
  }): GetPriceType {
    return {
      t: mockT as TFunction,
      pricing: constructPricing({
        lowestPrice,
        highestPrice,
        priceUnit,
      }),
      minutes: minutes ?? undefined,
    };
  }

  test("price range", () => {
    const input = constructInput({
      lowestPrice: 10,
      highestPrice: 50.5,
      priceUnit: PriceUnit.Per_15Mins,
    });
    expect(getPriceString(input)).toBe("10,00 - 50,50 € / 15 min");
  });

  test("price range with no min", () => {
    const input = constructInput({
      lowestPrice: 0.0,
      highestPrice: 50.5,
      priceUnit: PriceUnit.Per_15Mins,
    });
    expect(getPriceString(input)).toBe("0 - 50,50 € / 15 min");
  });

  test("price range with minutes", () => {
    const input = constructInput({
      lowestPrice: 0.0,
      highestPrice: 60.5,
      minutes: 60,
    });
    expect(getPriceString(input)).toBe("0 - 60,50 €");
  });

  test("price range with minutes", () => {
    const input = constructInput({
      lowestPrice: 0.0,
      highestPrice: 60.5,
      minutes: 61,
    });
    expect(getPriceString(input)).toBe("0 - 75,63 €");
  });

  test("price range with minutes", () => {
    const input = constructInput({
      lowestPrice: 0.0,
      highestPrice: 100,
      minutes: 61,
    });
    expect(getPriceString(input)).toBe("0 - 125,00 €");
  });

  test("price range with minutes", () => {
    const input = constructInput({
      lowestPrice: 0.0,
      highestPrice: 100,
      minutes: 90,
    });
    expect(getPriceString(input)).toBe("0 - 150,00 €");
  });

  test("price range with minutes", () => {
    const input = constructInput({
      lowestPrice: 0.0,
      highestPrice: 100,
      minutes: 91,
    });
    expect(getPriceString(input)).toBe("0 - 175,00 €");
  });

  test("price range with minutes", () => {
    const input = constructInput({
      lowestPrice: 0.0,
      highestPrice: 30,
      minutes: 60,
      priceUnit: PriceUnit.Per_15Mins,
    });
    expect(getPriceString(input)).toBe("0 - 120,00 €");
  });

  test("price range with minutes", () => {
    const input = constructInput({
      lowestPrice: 0.0,
      highestPrice: 30,
      minutes: 60,
      priceUnit: PriceUnit.Per_30Mins,
    });
    expect(getPriceString(input)).toBe("0 - 60,00 €");
  });

  test("price range with minutes", () => {
    const input = constructInput({
      lowestPrice: 0.0,
      highestPrice: 30,
      minutes: 61,
      priceUnit: PriceUnit.Per_30Mins,
    });
    expect(getPriceString(input)).toBe("0 - 75,00 €");
  });

  test("price range with minutes and fixed unit", () => {
    const input = constructInput({
      lowestPrice: 10,
      highestPrice: 100,
      minutes: 61,
      priceUnit: PriceUnit.PerHalfDay,
    });
    expect(getPriceString(input)).toBe("10,00 - 100,00 €");
  });

  test("price range with minutes and fixed unit", () => {
    const input = constructInput({
      lowestPrice: 10,
      highestPrice: 100,
      minutes: 1234,
      priceUnit: PriceUnit.PerDay,
    });
    expect(getPriceString(input)).toBe("10,00 - 100,00 €");
  });

  test("price range with minutes and fixed unit", () => {
    const input = constructInput({
      lowestPrice: 10,
      highestPrice: 100,
      minutes: 1234,
      priceUnit: PriceUnit.PerWeek,
    });
    expect(getPriceString(input)).toBe("10,00 - 100,00 €");
  });

  test("fixed price", () => {
    const input = constructInput({
      lowestPrice: 50,
      highestPrice: 50,
      priceUnit: PriceUnit.Fixed,
    });
    expect(getPriceString(input)).toBe("50,00 €");
  });

  test("no price", () => {
    const input = constructInput({
      lowestPrice: 0,
      highestPrice: 0,
    });
    expect(getPriceString(input)).toBe("Maksuton");
  });

  test("total price with minutes", () => {
    const input = constructInput({
      lowestPrice: 0,
      highestPrice: 50.5,
      minutes: 180,
      priceUnit: PriceUnit.Per_15Mins,
    });
    expect(getPriceString(input)).toBe("0 - 606,00 €");
  });
});

describe("isReservationUnitPublished", () => {
  const EnumT = ReservationUnitPublishingState;
  test.each([
    [EnumT.Published, true],
    [EnumT.ScheduledHiding, true],
    [EnumT.Archived, false],
    [EnumT.Draft, false],
    [EnumT.Hidden, false],
    [EnumT.ScheduledPeriod, false],
    [EnumT.ScheduledPublishing, false],
  ])("%s expect %s", (state, expected) => {
    expect(isReservationUnitPublished({ publishingState: state })).toBe(
      expected
    );
  });

  test("NO without state", () => {
    expect(isReservationUnitPublished({})).toBe(false);
  });
});

function createMockEquipment({
  name,
  categoryName,
  pk = 1,
}: {
  name: string;
  categoryName?: string;
  pk?: number;
}): ReadonlyDeep<DeepRequired<EquipmentFieldsFragment>> {
  const cat = categoryName || name;
  return {
    id: name,
    pk,
    ...generateNameFragment(name),
    category: {
      id: cat,
      ...generateNameFragment(cat),
      // category name does frontend matching to known list by nameFi
      nameFi: cat,
    },
  };
}

describe("getEquipmentCategories", () => {
  test("empty equipments list", () => {
    expect(getEquipmentCategories([])).toStrictEqual([]);
  });

  test("with equipment out of predefined order", () => {
    const equipment = ["Item A", "Item B", "Item C"].map((name) =>
      createMockEquipment({ name })
    );
    expect(getEquipmentCategories(equipment)).toStrictEqual(["Muu"]);
  });

  test("with equipment in predefined order", () => {
    const equipment = [
      {
        name: "Item A",
        categoryName: "Liittimet",
      },
      {
        name: "Item B",
        categoryName: "Keittiö",
      },
      {
        name: "Item C",
        categoryName: "Foobar",
      },
      {
        name: "Item D",
        categoryName: "Pelikonsoli",
      },
      {
        name: "Item ABC 2",
        categoryName: "Keittiö",
      },
      {
        name: "Item ABC 1",
        categoryName: "Keittiö",
      },
    ].map(createMockEquipment);

    expect(getEquipmentCategories(equipment)).toStrictEqual([
      "Keittiö",
      "Pelikonsoli",
      "Liittimet",
      "Muu",
    ]);
  });
});

describe("getEquipmentList", () => {
  test("empty equipments list", () => {
    expect(getEquipmentList([], "fi")).toStrictEqual([]);
  });

  test("with equipment out of predefined order", () => {
    const equipment = ["Item A", "Item B", "Item C"].map((name) =>
      createMockEquipment({ name })
    );
    expect(getEquipmentList(equipment, "fi")).toStrictEqual([
      "Item A FI",
      "Item B FI",
      "Item C FI",
    ]);
  });

  test("with equipment in predefined order", () => {
    const equipment: ReadonlyDeep<DeepRequired<EquipmentFieldsFragment>>[] = [
      createMockEquipment({ name: "Item A", categoryName: "Liittimet" }),
      createMockEquipment({ name: "Item B", categoryName: "Keittiö" }),
      createMockEquipment({ name: "Item C 2", categoryName: "Foobar" }),
      createMockEquipment({ name: "Item D", categoryName: "Pelikonsoli" }),
      createMockEquipment({ name: "Item ABC 2", categoryName: "Keittiö" }),
      createMockEquipment({ name: "Item ABC 1", categoryName: "Keittiö" }),
      createMockEquipment({ name: "Item C 1", categoryName: "Barfoo" }),
    ];

    expect(getEquipmentList(equipment, "fi")).toStrictEqual([
      "Item ABC 1 FI",
      "Item ABC 2 FI",
      "Item B FI",
      "Item D FI",
      "Item A FI",
      "Item C 1 FI",
      "Item C 2 FI",
    ]);
  });
});

describe("getReservationUnitName", () => {
  test.for([
    ["fi", "Unit 1 FI"],
    ["en", "Unit 1 EN"],
    ["sv", "Unit 1 SV"],
  ])("should return translated name of the unit", ([lang, name]) => {
    const reservationUnit = generateNameFragment("Unit 1");
    expect(getReservationUnitName(reservationUnit, lang)).toEqual(name);
  });

  test.for(["", undefined, "fr", "de"])(
    "should default to fi if language is not found",
    () => {
      const reservationUnit = generateNameFragment("Unit 1");
      expect(getReservationUnitName(reservationUnit)).toEqual("Unit 1 FI");
    }
  );

  test.for([
    ["", "Unit 1 FI"],
    [null, "Unit 1 FI"],
    [undefined, "Unit 1 FI"],
  ])(
    "should return the name of the unit in the default language",
    ([val, nameFi]) => {
      const reservationUnit = {
        nameFi,
        nameEn: val,
        nameSv: val,
      };
      expect(getReservationUnitName(reservationUnit, "sv")).toEqual(nameFi);
      expect(getReservationUnitName(reservationUnit, "en")).toEqual(nameFi);
    }
  );
});

describe("getFuturePricing", () => {
  function constructInput({
    reservationBegins,
    reservationEnds,
    days,
  }: {
    reservationBegins?: Date;
    reservationEnds?: Date;
    days: readonly Date[];
  }) {
    return {
      id: "1",
      reservationBegins: reservationBegins?.toISOString() ?? null,
      reservationEnds: reservationEnds?.toISOString() ?? null,
      pricings: days.map((date) =>
        constructPricing({
          begins: date,
          lowestPrice: 0,
          highestPrice: 10,
        })
      ),
    };
  }

  const DAYS: readonly Date[] = [
    addDays(new Date(), 10),
    addDays(new Date(), 20),
    addDays(new Date(), 5),
  ];

  test.for([
    { days: DAYS, expectedIndex: 2 },
    { days: DAYS.toReversed(), expectedIndex: 0 },
    { days: [...DAYS, addDays(new Date(), 1)], expectedIndex: 3 },
    { days: [addDays(new Date(), 1), ...DAYS], expectedIndex: 0 },
  ])("should sort items correctly", ({ days, expectedIndex }) => {
    const input = constructInput({ days });
    expect(getFuturePricing(input)).toEqual(input.pricings[expectedIndex]);
  });

  test("should be null if no future pricing", () => {
    const d1 = constructInput({ days: DAYS });
    expect(getFuturePricing(d1)).toEqual(d1.pricings[2]);
    const d2 = constructInput({
      days: [addDays(new Date(), -1)],
    });
    expect(getFuturePricing(d2)).toBeNull();
  });

  test.for([
    { begin: undefined, index: 2 },
    { begin: addDays(new Date(), 19), index: 1 },
    { begin: addDays(new Date(), 20), index: null },
  ])("with reservation begin time", ({ begin, index }) => {
    const data = constructInput({ days: DAYS, reservationBegins: begin });
    const val = index != null ? data.pricings[index] : null;
    expect(getFuturePricing(data)).toEqual(val);
  });

  test.for([
    { endDays: undefined, index: 2 },
    { endDays: 1, index: null },
    { endDays: 5, index: 2 },
  ])("with reservation end time", ({ endDays, index }) => {
    const data = constructInput({
      reservationEnds: endDays ? addDays(new Date(), endDays) : undefined,
      days: DAYS,
    });
    const val = index != null ? data.pricings[index] : null;
    expect(getFuturePricing(data)).toEqual(val);
  });

  test.for([
    { begin: undefined, end: undefined, index: 2 },
    { begin: 15, end: undefined, index: 1 },
    { begin: 15, end: 30, index: 1 },
  ])("with both reservation times", ({ begin, end, index }) => {
    const data = constructInput({
      days: DAYS,
      reservationBegins: begin ? addDays(new Date(), begin) : undefined,
      reservationEnds: end ? addDays(new Date(), end) : undefined,
    });
    const val = index != null ? data.pricings[index] : null;
    expect(getFuturePricing(data)).toEqual(val);
  });

  test.for([
    { begin: addDays(new Date(), 1), end: null, index: 2 },
    { begin: addDays(new Date(), 1), end: addDays(new Date(), 19), index: 1 },
    {
      begin: addDays(new Date(), 1),
      end: addDays(new Date(), 20),
      index: 9999,
    },
  ])("handles active application rounds", ({ begin, end, index }) => {
    const data = constructInput({ days: DAYS });
    const applicationRounds: RoundPeriod[] = [
      {
        reservationPeriodBegin: begin.toISOString(),
        reservationPeriodEnd: end?.toISOString() ?? "",
      },
    ];
    const expected = data.pricings[index] ?? null;
    expect(getFuturePricing(data, applicationRounds)).toEqual(expected);
  });

  test.for([
    { date: addDays(new Date(), 15), index: 0 },
    { date: addDays(new Date(), 5), index: 2 },
    { date: addDays(new Date(), 20), index: 1 },
  ])("handles date lookups", ({ date, index }) => {
    const data = constructInput({ days: DAYS });
    expect(getFuturePricing(data, [], date)).toEqual(data.pricings[index]);
  });
});

function constructPricing({
  lowestPrice,
  highestPrice,
  taxPercentage,
  begins,
  priceUnit,
}: {
  begins?: Date;
  lowestPrice?: number;
  highestPrice?: number;
  taxPercentage?: number;
  priceUnit?: PriceUnit;
}): NonNullable<PriceReservationUnitFragment>["pricings"][0] {
  const p = highestPrice ?? lowestPrice ?? 0;
  return {
    id: "1",
    begins: toApiDateUnsafe(begins ?? new Date()),
    priceUnit: priceUnit ?? PriceUnit.PerHour,
    lowestPrice: lowestPrice?.toString() ?? p.toString(),
    highestPrice: highestPrice?.toString() ?? p.toString(),
    taxPercentage: {
      id: "1",
      value: (taxPercentage ?? 24).toString(),
    },
  };
}

describe("getReservationUnitPrice", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: [...TIMERS_TO_FAKE],
      now: new Date(2024, 0, 1, 10, 0, 0),
    });
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  function connstructInput({
    date,
    pricings,
  }: {
    date: Date;
    pricings: Readonly<NonNullable<PriceReservationUnitFragment>["pricings"]>;
  }): GetReservationUnitPriceProps {
    return {
      t: mockT as TFunction,
      pricingDate: date,
      reservationUnit: {
        id: "1",
        pricings,
      },
    };
  }

  function constructDefaultPricing() {
    return [
      constructPricing({
        begins: addDays(new Date(), 10),
        lowestPrice: 10,
        highestPrice: 20,
        taxPercentage: 24,
      }),
      constructPricing({
        begins: addDays(new Date(), 20),
        lowestPrice: 20,
        highestPrice: 30,
        taxPercentage: 24,
      }),
      constructPricing({
        begins: addDays(new Date(), 5),
        lowestPrice: 40,
        highestPrice: 50,
        taxPercentage: 24,
      }),
    ] as const;
  }

  test.for([
    { days: 5, expected: "40,00 - 50,00 € / tunti" },
    { days: 11, expected: "10,00 - 20,00 € / tunti" },
  ])("returns future data based on date lookup", ({ days, expected }) => {
    const input = connstructInput({
      date: addDays(new Date(), days),
      pricings: constructDefaultPricing(),
    });
    expect(getReservationUnitPrice(input)).toEqual(expected);
  });

  function constructTaxChangePricings(isFreeNow: boolean) {
    return [
      constructPricing({
        begins: addDays(new Date(), -10),
        highestPrice: isFreeNow ? undefined : 20,
        taxPercentage: 24,
      }),
      constructPricing({
        begins: addDays(new Date(), 10),
        highestPrice: 25,
        taxPercentage: 25.5,
      }),
    ];
  }

  test.for([
    { isFreeNow: false, expected: "20,00 € / tunti" },
    { isFreeNow: true, expected: "25,00 € / tunti" },
  ])(
    "change in tax is only active in the future",
    ({ isFreeNow, expected }) => {
      const input = connstructInput({
        date: addDays(new Date(), 15),
        pricings: constructTaxChangePricings(isFreeNow),
      });
      expect(getReservationUnitPrice(input)).toBe(expected);
    }
  );
});

describe("isReservationUnitReservable", () => {
  function constructReservationUnitNode({
    minReservationDuration = 3600,
    maxReservationDuration = 3600,
    reservationState = ReservationUnitReservationState.Reservable,
    reservationBegins,
    reservableTimeSpans,
    reservationsMaxDaysBefore,
  }: {
    minReservationDuration?: number;
    maxReservationDuration?: number;
    reservationState?: ReservationUnitReservationState;
    reservationBegins?: Date;
    reservableTimeSpans?: ReservationUnitNode["reservableTimeSpans"];
    reservationsMaxDaysBefore?: number;
  }): ReadonlyDeep<IsReservableReservationUnitType> {
    return {
      id: base64encode("ReservationUnitNode:1"),
      reservationKind: ReservationKind.Direct,
      maxPersons: 10,
      minReservationDuration,
      maxReservationDuration,
      reservationBegins: reservationBegins?.toISOString() ?? null,
      reservationsMaxDaysBefore,
      metadataSet: {
        id: "1234",
        supportedFields: [
          {
            id: "1234",
            fieldName: "name",
          },
        ],
        requiredFields: [] as const,
      },
      reservationState,
      reservableTimeSpans,
    };
  }

  const date = new Date().toISOString().split("T")[0];
  const defaultTimeSpans = [
    {
      startDatetime: `${date}T04:00:00+00:00`,
      endDatetime: `${date}T20:00:00+00:00`,
    },
  ];

  test.for([{ spans: undefined }, { spans: [] }])(
    "not reservable with no time spans",
    ({ spans }) => {
      const input = constructReservationUnitNode({
        reservableTimeSpans: spans,
        reservationState: ReservationUnitReservationState.Reservable,
      });
      const { isReservable } = isReservationUnitReservable(input);
      expect(isReservable).toBe(false);
    }
  );

  test.for([
    {
      reservationState: ReservationUnitReservationState.Reservable,
      expected: true,
    },
    {
      reservationState: ReservationUnitReservationState.ScheduledClosing,
      expected: true,
    },
    {
      reservationState: ReservationUnitReservationState.ReservationClosed,
      expected: false,
    },
    {
      reservationState: ReservationUnitReservationState.ScheduledReservation,
      expected: false,
    },
    {
      reservationState: ReservationUnitReservationState.ScheduledPeriod,
      expected: false,
    },
  ])(
    "determines reservability correctly for state $reservationState",
    ({ reservationState, expected }) => {
      const input = constructReservationUnitNode({
        reservableTimeSpans: defaultTimeSpans,
        reservationState,
        reservationBegins: addDays(new Date(), -1),
      });
      const { isReservable } = isReservationUnitReservable(input);
      expect(isReservable).toBe(expected);
    }
  );

  test.for([
    {
      reservableTimeSpans: defaultTimeSpans,
      reservationBegins: addDays(new Date(), 5),
      reservationsMaxDaysBefore: 5,
      expected: false,
    },
    {
      reservableTimeSpans: undefined,
      reservationBegins: addDays(new Date(), 5),
      reservationsMaxDaysBefore: 4,
      expected: false,
    },
    // TODO add a few more cases, especially a positive one with buffers
  ])("returns correct value with buffer days", ({ expected, ...rest }) => {
    const input = constructReservationUnitNode(rest);
    const { isReservable: res1 } = isReservationUnitReservable(input);
    expect(res1).toBe(expected);
  });
});

describe("getDayIntervals", () => {
  test("getDayIntervals from 9 to 17 with 30 min interval", () => {
    const input = {
      startTime: { h: 9, m: 0 },
      endTime: { h: 17, m: 0 },
      interval: ReservationStartInterval.Interval_30Mins,
    };
    const output: { h: number; m: number }[] = [];
    for (let i = 9; i < 17; i++) {
      output.push({ h: i, m: 0 });
      output.push({ h: i, m: 30 });
    }
    const res = getDayIntervals(input.startTime, input.endTime, input.interval);
    expect(res).toEqual(output);
  });
  test("getDayIntervals from 9 to 17 with 15 min interval", () => {
    const input = {
      startTime: { h: 9, m: 0 },
      endTime: { h: 17, m: 0 },
      interval: ReservationStartInterval.Interval_15Mins,
    };
    const output: { h: number; m: number }[] = [];
    for (let i = 9; i < 17; i++) {
      output.push({ h: i, m: 0 });
      output.push({ h: i, m: 15 });
      output.push({ h: i, m: 30 });
      output.push({ h: i, m: 45 });
    }
    const res = getDayIntervals(input.startTime, input.endTime, input.interval);
    expect(res).toEqual(output);
  });
  test("getDayIntervals from 9 to 17 with 60 min interval", () => {
    const input = {
      startTime: { h: 9, m: 0 },
      endTime: { h: 17, m: 0 },
      interval: ReservationStartInterval.Interval_60Mins,
    };
    const output: { h: number; m: number }[] = [];
    for (let i = 9; i < 17; i++) {
      output.push({ h: i, m: 0 });
    }
    const res = getDayIntervals(input.startTime, input.endTime, input.interval);
    expect(res).toEqual(output);
  });
  test("getDayIntervals from 0 to 24 with 30 min interval", () => {
    const input = {
      startTime: { h: 0, m: 0 },
      endTime: { h: 24, m: 0 },
      interval: ReservationStartInterval.Interval_30Mins,
    };
    const output: { h: number; m: number }[] = [];
    for (let i = 0; i < 24; i++) {
      output.push({ h: i, m: 0 });
      output.push({ h: i, m: 30 });
    }
    const res = getDayIntervals(input.startTime, input.endTime, input.interval);
    expect(res).toEqual(output);
  });
  test("getDayIntervals with invalid range", () => {
    const input = {
      startTime: { h: 17, m: 0 },
      endTime: { h: 9, m: 0 },
      interval: ReservationStartInterval.Interval_30Mins,
    };
    const res = getDayIntervals(input.startTime, input.endTime, input.interval);
    expect(res).toEqual([]);
  });
  test("getDayIntervals with 0 size range", () => {
    const input = {
      startTime: { h: 17, m: 0 },
      endTime: { h: 17, m: 0 },
      interval: ReservationStartInterval.Interval_30Mins,
    };
    const res = getDayIntervals(input.startTime, input.endTime, input.interval);
    expect(res).toEqual([]);
  });
  test("getDayIntervals with uneven times", () => {
    const input = {
      startTime: { h: 9, m: 20 },
      endTime: { h: 17, m: 20 },
      interval: ReservationStartInterval.Interval_30Mins,
    };
    const output: { h: number; m: number }[] = [];
    for (let i = 9; i < 17; i++) {
      output.push({ h: i, m: 20 });
      output.push({ h: i, m: 50 });
    }
    const res = getDayIntervals(input.startTime, input.endTime, input.interval);
    expect(res).toEqual(output);
  });
  test("getDayIntervals with uneven times", () => {
    const input = {
      startTime: { h: 9, m: 20 },
      endTime: { h: 17, m: 0 },
      interval: ReservationStartInterval.Interval_30Mins,
    };
    const output: { h: number; m: number }[] = [];
    for (let i = 9; i < 17; i++) {
      output.push({ h: i, m: 20 });
      if (i < 16) {
        output.push({ h: i, m: 50 });
      }
    }
    const res = getDayIntervals(input.startTime, input.endTime, input.interval);
    expect(res).toEqual(output);
  });
});
