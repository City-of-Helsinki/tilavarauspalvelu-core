import { get as mockGet } from "lodash-es";
import { addDays, addHours, addMonths, endOfDay, format, getHours, set, startOfDay, startOfToday } from "date-fns";
import { toApiDateUnsafe } from "common/src/common/util";
import {
  PriceUnit,
  ReservationUnitPublishingState,
  type ReservationUnitNode,
  ReservationKind,
  ReservationStartInterval,
  ReservationUnitReservationState,
  type PriceReservationUnitFieldsFragment,
  type EquipmentFieldsFragment,
  PaymentType,
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
  type NotReservableFieldsFragmentNarrow,
  type GetPossibleTimesForDayProps,
  type LastPossibleReservationDateProps,
  getLastPossibleReservationDate,
  type AvailableTimesProps,
  getNextAvailableTime,
  formatNDays,
} from "./reservationUnit";
import mockTranslations from "./../public/locales/fi/prices.json";
import { type ReservableMap, dateToKey, type RoundPeriod } from "./reservable";
import { generateNameFragment } from "@/test/test.gql.utils";
import { TIMERS_TO_FAKE } from "@/test/test.utils";
import { base64encode, ReadonlyDeep } from "common/src/helpers";
import { type TFunction } from "i18next";
import { vi, describe, test, expect, beforeEach, afterEach, beforeAll, afterAll } from "vitest";
import { type DeepRequired } from "react-hook-form";
import { createMockIsReservableFieldsFragment } from "@/test/reservation-unit.mocks";

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
    interval = ReservationStartInterval.Interval_30Mins,
    duration = 30,
    reservableTimes = mockReservableTimes(),
  }: {
    date: Date;
    interval?: ReservationStartInterval;
    duration?: number;
    bufferTimeBefore?: number;
    bufferTimeAfter?: number;
    reservableTimes?: ReservableMap;
  }): GetPossibleTimesForDayProps {
    return {
      date,
      reservationUnit: createMockIsReservableFieldsFragment({ interval }),
      activeApplicationRounds: [] as const,
      reservableTimes,
      duration,
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
    const output = ["12:00", "12:30", "13:00", "13:30", "16:00", "16:30"].map((label) => ({ label, value: label }));
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
    expect(isReservationUnitPublished({ publishingState: state })).toBe(expected);
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
    const equipment = ["Item A", "Item B", "Item C"].map((name) => createMockEquipment({ name }));
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

    expect(getEquipmentCategories(equipment)).toStrictEqual(["Keittiö", "Pelikonsoli", "Liittimet", "Muu"]);
  });
});

describe("getEquipmentList", () => {
  test("empty equipments list", () => {
    expect(getEquipmentList([], "fi")).toStrictEqual([]);
  });

  test("with equipment out of predefined order", () => {
    const equipment = ["Item A", "Item B", "Item C"].map((name) => createMockEquipment({ name }));
    expect(getEquipmentList(equipment, "fi")).toStrictEqual(["Item A FI", "Item B FI", "Item C FI"]);
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

  test.for(["", undefined, "fr", "de"])("should default to fi if language is not found", () => {
    const reservationUnit = generateNameFragment("Unit 1");
    expect(getReservationUnitName(reservationUnit)).toEqual("Unit 1 FI");
  });
});

describe("getFuturePricing", () => {
  function constructInput({
    reservationBeginsAt,
    reservationEndsAt,
    days,
  }: {
    reservationBeginsAt?: Date;
    reservationEndsAt?: Date;
    days: readonly Date[];
  }) {
    return {
      id: "1",
      reservationBeginsAt: reservationBeginsAt?.toISOString() ?? null,
      reservationEndsAt: reservationEndsAt?.toISOString() ?? null,
      pricings: days.map((date) =>
        constructPricing({
          begins: date,
          lowestPrice: 0,
          highestPrice: 10,
        })
      ),
    };
  }

  const DAYS: readonly Date[] = [addDays(new Date(), 10), addDays(new Date(), 20), addDays(new Date(), 5)];

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
    const data = constructInput({ days: DAYS, reservationBeginsAt: begin });
    const val = index != null ? data.pricings[index] : null;
    expect(getFuturePricing(data)).toEqual(val);
  });

  test.for([
    { endDays: undefined, index: 2 },
    { endDays: 1, index: null },
    { endDays: 5, index: 2 },
  ])("with reservation end time", ({ endDays, index }) => {
    const data = constructInput({
      reservationEndsAt: endDays ? addDays(new Date(), endDays + 1) : undefined,
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
      reservationBeginsAt: begin ? addDays(new Date(), begin) : undefined,
      reservationEndsAt: end ? addDays(new Date(), end) : undefined,
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
        reservationPeriodBeginDate: begin.toISOString(),
        reservationPeriodEndDate: end?.toISOString() ?? "",
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
}): NonNullable<PriceReservationUnitFieldsFragment>["pricings"][0] {
  const p = highestPrice ?? lowestPrice ?? 0;
  return {
    id: "1",
    begins: toApiDateUnsafe(begins ?? new Date()),
    priceUnit: priceUnit ?? PriceUnit.PerHour,
    lowestPrice: lowestPrice?.toString() ?? p.toString(),
    highestPrice: highestPrice?.toString() ?? p.toString(),
    taxPercentage: {
      id: "1",
      pk: 1,
      value: (taxPercentage ?? 24).toString(),
    },
    paymentType: PaymentType.OnlineOrInvoice,
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
    pricings: Readonly<NonNullable<PriceReservationUnitFieldsFragment>["pricings"]>;
  }): GetReservationUnitPriceProps {
    return {
      t: mockT as TFunction,
      pricingDate: date,
      reservationUnit: {
        id: "1",
        reservationBeginsAt: null,
        reservationEndsAt: null,
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
  ])("change in tax is only active in the future", ({ isFreeNow, expected }) => {
    const input = connstructInput({
      date: addDays(new Date(), 15),
      pricings: constructTaxChangePricings(isFreeNow),
    });
    expect(getReservationUnitPrice(input)).toBe(expected);
  });
});

describe("isReservationUnitReservable", () => {
  function constructReservationUnitNode({
    minReservationDuration = 3600,
    maxReservationDuration = 3600,
    reservationState = ReservationUnitReservationState.Reservable,
    reservationBeginsAt,
    reservableTimeSpans = [],
  }: {
    minReservationDuration?: number;
    maxReservationDuration?: number;
    reservationState?: ReservationUnitReservationState;
    reservationBeginsAt?: Date;
    reservableTimeSpans?: ReservationUnitNode["reservableTimeSpans"];
  }): NotReservableFieldsFragmentNarrow {
    return {
      id: base64encode("ReservationUnitNode:1"),
      reservationKind: ReservationKind.Direct,
      minReservationDuration,
      maxReservationDuration,
      reservationBeginsAt: reservationBeginsAt?.toISOString() ?? null,
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

  test.for([{ spans: undefined }, { spans: [] }])("not reservable with no time spans", ({ spans }) => {
    const input = constructReservationUnitNode({
      reservableTimeSpans: spans,
      reservationState: ReservationUnitReservationState.Reservable,
    });
    const { isReservable } = isReservationUnitReservable(input);
    expect(isReservable).toBe(false);
  });

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
  ])("determines reservability correctly for state $reservationState", ({ reservationState, expected }) => {
    const input = constructReservationUnitNode({
      reservableTimeSpans: defaultTimeSpans,
      reservationState,
      reservationBeginsAt: addDays(new Date(), -1),
    });
    const { isReservable } = isReservationUnitReservable(input);
    expect(isReservable).toBe(expected);
  });

  test.for([
    {
      reservableTimeSpans: defaultTimeSpans,
      reservationBeginsAt: addDays(new Date(), 5),
      reservationsMaxDaysBefore: 5,
      expected: false,
    },
    {
      reservableTimeSpans: undefined,
      reservationBeginsAt: addDays(new Date(), 5),
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

describe("getLastPossibleReservationDate", () => {
  beforeAll(() => {
    vi.useFakeTimers({
      now: new Date(2024, 0, 1, 9, 0, 0),
    });
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  function createInput({
    reservationsMaxDaysBefore = null,
    reservableTimeSpans = [],
    reservationEndsAt,
  }: {
    reservationsMaxDaysBefore?: number | null;
    reservableTimeSpans?: {
      begin: Date;
      end: Date;
    }[];
    reservationEndsAt?: Date;
  }): LastPossibleReservationDateProps {
    return {
      reservationsMaxDaysBefore,
      reservableTimeSpans: reservableTimeSpans?.map(({ begin, end }) => ({
        startDatetime: begin.toISOString(),
        endDatetime: end.toISOString(),
      })),
      reservationEndsAt: reservationEndsAt?.toISOString() ?? null,
    };
  }

  test("returns null without reservableTimeSpans", () => {
    const input = createInput({
      reservationsMaxDaysBefore: 1,
      reservationEndsAt: addDays(new Date(), 10),
    });
    expect(getLastPossibleReservationDate(input)).toBeNull();
  });

  test("if 'reservationsMaxDaysBefore' is set to 1 returns tomorrow", () => {
    const today = new Date();
    const input = createInput({
      reservationsMaxDaysBefore: 1,
      reservableTimeSpans: [
        {
          begin: addDays(today, -10),
          end: addDays(today, 10),
        },
      ],
      reservationEndsAt: addDays(today, 10),
    });
    const tommorow = addDays(today, 1);
    expect(getLastPossibleReservationDate(input)).toEqual(tommorow);
  });

  test("if 'reservationEndsAt' is set for tomorrow returns tomorrow", () => {
    const tomorrow = addDays(new Date(), 1);
    const input = createInput({
      reservationsMaxDaysBefore: 1,
      reservableTimeSpans: [
        {
          begin: addDays(new Date(), -10),
          end: addDays(new Date(), 10),
        },
      ],
      reservationEndsAt: tomorrow,
    });
    expect(getLastPossibleReservationDate(input)).toEqual(tomorrow);
  });

  test("if 'reservableTimeSpans' contains a range that ends tomorrow returns tomorrow", () => {
    const tomorrow = addDays(new Date(), 1);
    const input = createInput({
      reservableTimeSpans: [
        {
          begin: addDays(new Date(), -10),
          end: tomorrow,
        },
      ],
    });
    expect(getLastPossibleReservationDate(input)).toEqual(tomorrow);
  });

  test("returns the minimum of the above", () => {
    const input = createInput({
      reservationsMaxDaysBefore: 5,
      reservableTimeSpans: [
        {
          begin: addDays(new Date(), -10),
          end: addDays(new Date(), 10),
        },
      ],
      reservationEndsAt: addDays(new Date(), 3),
    });
    const expected = addDays(new Date(), 3);
    expect(getLastPossibleReservationDate(input)).toEqual(expected);
  });
});

function constructDate(d: Date, hours: number, minutes: number) {
  return set(d, { hours, minutes, seconds: 0, milliseconds: 0 });
}
// Rules for writing tests:
// 1. default data for happy path, progressively modify it for other cases
// 2. only modify one thing at a time
// 3. never cast inputs for any reason
// These avoid errors (false positives) due to incorrect mocks.
// More important when testing error cases.
// Alternative would be to refactor and reduce inputs to the function.
// e.g. this is not necessary for a function that takes 2 - 3 parameters.

describe("getNextAvailableTime", () => {
  beforeAll(() => {
    vi.useFakeTimers({
      toFake: [...TIMERS_TO_FAKE],
      // There is some weird time zone issues (this seems to work)
      now: new Date(2024, 0, 1, 9, 0, 0),
    });
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  let reservableTimes: ReservableMap;
  beforeEach(() => {
    const today = new Date();
    reservableTimes = new Map();
    reservableTimes.set(format(today, "yyyy-MM-dd"), [
      { start: constructDate(today, 11, 0), end: constructDate(today, 12, 0) },
      { start: constructDate(today, 13, 0), end: constructDate(today, 15, 0) },
      { start: constructDate(today, 16, 0), end: constructDate(today, 17, 0) },
      { start: constructDate(today, 18, 0), end: constructDate(today, 20, 0) },
    ]);
    reservableTimes.set(format(addDays(today, 1), "yyyy-MM-dd"), [
      {
        start: constructDate(addDays(today, 1), 10, 0),
        end: constructDate(addDays(today, 1), 15, 0),
      },
    ]);
  });

  function mockOpenTimes(start: Date, days: number, data?: Array<{ start: Date; end: Date }>) {
    for (let i = 0; i < days; i++) {
      reservableTimes.set(
        dateToKey(addDays(start, i)),
        data ?? [
          {
            start: constructDate(addDays(start, i), 10, 0),
            end: constructDate(addDays(start, i), 15, 0),
          },
        ]
      );
    }
  }

  function createInput({
    start,
    duration,
    reservationsMinDaysBefore = null,
    reservationsMaxDaysBefore = null,
    activeApplicationRounds = [],
  }: {
    start: Date;
    duration: number;
    reservationsMinDaysBefore?: number | null;
    reservationsMaxDaysBefore?: number | null;
    activeApplicationRounds?: RoundPeriod[];
  }): Readonly<AvailableTimesProps> {
    return {
      start,
      duration,
      reservationUnit: {
        id: base64encode("ReservationUnit:1"),
        reservationsMinDaysBefore,
        reservationsMaxDaysBefore,
        bufferTimeBefore: 0,
        bufferTimeAfter: 0,
        reservationStartInterval: ReservationStartInterval.Interval_30Mins,
        maxReservationDuration: null,
        minReservationDuration: null,
        reservationBeginsAt: null,
        reservationEndsAt: null,
        reservableTimeSpans: [],
      },
      activeApplicationRounds,
      blockingReservations: [],
      reservableTimes,
    } as const;
  }

  test("finds the next available time for today", () => {
    const today = new Date();
    const input = createInput({
      start: today,
      duration: 60,
    });
    const val = getNextAvailableTime(input);
    const d = startOfDay(today);
    expect(val).toEqual(addHours(d, 11));
  });

  // there is earlier times available but they are too short
  test("finds the first long enough time today", () => {
    const today = new Date();
    const input = createInput({
      start: today,
      duration: 90,
    });
    const val = getNextAvailableTime(input);
    const d = startOfDay(today);
    expect(val).toEqual(addHours(d, 13));
  });

  // today is reservable, has available times but they are too short
  test("looking for tomorrow finds the correct length time", () => {
    const start = addDays(new Date(), 1);
    const input = createInput({
      start,
      duration: 90,
    });
    const val = getNextAvailableTime(input);
    const d = startOfDay(start);
    expect(val).toEqual(addHours(d, 10));
  });

  test("finds the next available time tomorrow when today has too short times", () => {
    const start = new Date();
    const input = createInput({
      start,
      duration: 300,
    });
    const val = getNextAvailableTime(input);
    const d = startOfDay(addDays(new Date(), 1));
    expect(val).toEqual(addHours(d, 10));
  });

  test("finds no available times if the duration is too long", () => {
    const today = new Date();
    const shortTimes = reservableTimes.get(format(today, "yyyy-MM-dd"));
    if (!shortTimes) {
      throw new Error("Mock data broken");
    }
    mockOpenTimes(today, 5, shortTimes);
    const input = createInput({
      start: today,
      duration: 160,
    });
    const val = getNextAvailableTime(input);
    expect(val).toBeNull();
  });

  test("Finds a date even if there are empty ranges before it", () => {
    const today = new Date();
    mockOpenTimes(today, 7, []);
    const date = addDays(today, 7);
    reservableTimes.set(format(date, "yyyy-MM-dd"), [
      {
        start: constructDate(date, 10, 0),
        end: constructDate(date, 15, 0),
      },
    ]);
    const input = createInput({
      start: today,
      duration: 30,
    });
    const val = getNextAvailableTime(input);
    expect(val).toEqual(addHours(startOfDay(date), 10));
  });

  test("Finds a single date after two months", () => {
    const today = new Date();
    mockOpenTimes(today, 7, []);
    const date = addMonths(today, 2);
    reservableTimes.set(format(date, "yyyy-MM-dd"), [
      {
        start: constructDate(date, 10, 0),
        end: constructDate(date, 15, 0),
      },
    ]);
    const input = createInput({
      start: today,
      duration: 30,
    });
    const val = getNextAvailableTime(input);
    expect(val).toEqual(addHours(startOfDay(date), 10));
  });

  test("Finds a date after a requested date", () => {
    const today = new Date();
    const date1 = addMonths(today, 1);
    const date2 = addMonths(today, 6);
    mockOpenTimes(today, 7, []);
    reservableTimes.set(format(date1, "yyyy-MM-dd"), [
      {
        start: constructDate(date1, 10, 0),
        end: constructDate(date1, 15, 0),
      },
    ]);
    reservableTimes.set(format(date2, "yyyy-MM-dd"), [
      {
        start: constructDate(date2, 10, 0),
        end: constructDate(date2, 15, 0),
      },
    ]);
    const input = createInput({
      start: addDays(date1, 1),
      duration: 30,
    });
    const val = getNextAvailableTime(input);
    expect(val).toEqual(addHours(startOfDay(date2), 10));
  });

  describe("reservationsMinDaysBefore check", () => {
    test("Min days before 0, should find today", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: today,
        duration: 60,
        reservationsMinDaysBefore: 0,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(today);
      expect(val).toEqual(addHours(d, 10));
    });

    test("Min days before 1, should find tomorrow", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: today,
        duration: 60,
        reservationsMinDaysBefore: 1,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(today, 1));
      expect(val).toEqual(addHours(d, 10));
    });

    test("finds the next available time a week from now", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: today,
        duration: 60,
        reservationsMinDaysBefore: 7,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(today, 7));
      expect(val).toEqual(addHours(d, 10));
    });

    test("NO times if times are only available before reservationsMinDaysBefore", () => {
      const today = new Date();
      const cpy = new Date(today);
      mockOpenTimes(today, 7);
      const input = createInput({
        start: today,
        duration: 60,
        reservationsMinDaysBefore: 7,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
      // date should not be modified
      expect(today).toEqual(cpy);
    });
  });

  describe("reservationsMaxDaysBefore check", () => {
    test("Max days before 0, should find a week from now", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: addDays(today, 7),
        duration: 60,
        reservationsMaxDaysBefore: 0,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(today, 7));
      expect(val).toEqual(addHours(d, 10));
    });

    test("Max days before undefined is equal to 0", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: addDays(today, 7),
        duration: 60,
        reservationsMaxDaysBefore: undefined,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(today, 7));
      expect(val).toEqual(addHours(d, 10));
    });

    test("Max days before 6, should not find a week from now", () => {
      const today = new Date();
      mockOpenTimes(today, 2 * 7);
      const input = createInput({
        start: addDays(today, 7),
        duration: 60,
        reservationsMaxDaysBefore: 6,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
    });

    test("NO times if times are only available after reservationsMaxDaysBefore", () => {
      const today = new Date();
      const cpy = new Date(today);
      reservableTimes.set(format(today, "yyyy-MM-dd"), []);
      const input = createInput({
        start: today,
        duration: 30,
        reservationsMaxDaysBefore: 1,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
      // date should not be modified
      expect(today).toEqual(cpy);
    });
  });

  describe("activeApplicationRounds", () => {
    test("finds the next available time after activeApplicationRounds", () => {
      const today = new Date();
      mockOpenTimes(today, 30);
      const end = addDays(today, 7);
      const activeApplicationRounds: RoundPeriod[] = [
        {
          reservationPeriodBeginDate: addDays(today, -7).toISOString(),
          reservationPeriodEndDate: end.toISOString(),
        },
      ];
      const input = createInput({
        start: today,
        duration: 60,
        activeApplicationRounds,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(end, 1));
      expect(val).toEqual(addHours(d, 10));
    });

    test("multiple overlapping activeApplicationRounds", () => {
      const today = new Date();
      mockOpenTimes(today, 30);
      const end = addDays(today, 7);
      const activeApplicationRounds: RoundPeriod[] = [
        {
          reservationPeriodBeginDate: addDays(today, -7).toISOString(),
          reservationPeriodEndDate: end.toISOString(),
        },
        {
          reservationPeriodBeginDate: addDays(today, -5).toISOString(),
          reservationPeriodEndDate: addDays(end, 2).toISOString(),
        },
      ];
      const input = createInput({
        start: today,
        duration: 60,
        activeApplicationRounds,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(end, 3));
      expect(val).toEqual(addHours(d, 10));
    });

    test("finds a time between non-overlapping activeApplicationRounds", () => {
      const today = new Date();
      mockOpenTimes(today, 60);
      const middle = addDays(today, 7);
      const activeApplicationRounds: RoundPeriod[] = [
        {
          reservationPeriodBeginDate: addDays(today, -7).toISOString(),
          reservationPeriodEndDate: middle.toISOString(),
        },
        {
          reservationPeriodBeginDate: addDays(middle, 2).toISOString(),
          reservationPeriodEndDate: addDays(middle, 10).toISOString(),
        },
      ];
      const input = createInput({
        start: today,
        duration: 60,
        activeApplicationRounds,
      });
      const val = getNextAvailableTime(input);
      const d = startOfDay(addDays(middle, 1));
      expect(val).toEqual(addHours(d, 10));
    });

    test("no times available after activeApplicationRound", () => {
      const today = new Date();
      mockOpenTimes(today, 30);
      const end = addDays(today, 31);
      const activeApplicationRounds: RoundPeriod[] = [
        {
          reservationPeriodBeginDate: addDays(today, -7).toISOString(),
          reservationPeriodEndDate: end.toISOString(),
        },
      ];
      const input = createInput({
        start: addDays(end, 1),
        duration: 60,
        activeApplicationRounds,
      });
      const val = getNextAvailableTime(input);
      expect(val).toBeNull();
    });

    // TODO add more tests for application round
    // block 12 months using activeApplicationRounds, measure the time it takes
    test("performance: finds the next available time after a long application round", () => {
      mockOpenTimes(new Date(), 2 * 365);
      const activeApplicationRounds: RoundPeriod[] = [
        {
          reservationPeriodBeginDate: new Date().toISOString(),
          reservationPeriodEndDate: addDays(new Date(), 365).toISOString(),
        },
      ];
      const today = new Date();
      const input = createInput({
        start: today,
        duration: 60,
        activeApplicationRounds,
      });
      const perfStart = performance.now();
      const val = getNextAvailableTime(input);
      const perfEnd = performance.now();
      const perfTime = perfEnd - perfStart;
      expect(val).toBeInstanceOf(Date);
      expect(perfTime).toBeLessThan(100);
    });
  });
});

describe("formatNDays", () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockT = ((key: string, record: any) => `${record.count} ${key}`) as TFunction;

  // Same list of options available in the admin-ui
  // this is the primary use case
  test.for([
    { value: 14, label: "2 common:weeks" },
    { value: 30, label: "1 common:months" },
    { value: 60, label: "2 common:months" },
    { value: 90, label: "3 common:months" },
    { value: 182, label: "6 common:months" },
    { value: 365, label: "12 common:months" },
    { value: 730, label: "24 common:months" },
  ])("formats $value days correctly as $label", ({ value, label }) => {
    const res = formatNDays(mockT, value);
    expect(res).toBe(label);
  });

  test.for([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13])("formats < 2 weeks as days", (val) => {
    const res = formatNDays(mockT, val);
    expect(res).toBe(`${val} common:days`);
  });

  test("formats 0 days as a empty string", () => {
    const res = formatNDays(mockT, 0);
    expect(res).toBe("");
  });

  test.for([14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29])("formats %s days as weeks", (val) => {
    const res = formatNDays(mockT, val);
    expect(res).toBe(`${Math.floor(val / 7)} common:weeks`);
  });

  test.for(Array.from({ length: 30 }, (_, i) => 30 + Math.random() * 10 * i).map(Math.floor))(
    "formats %s days > as months",
    (days) => {
      const res = formatNDays(mockT, days);
      expect(res).toBe(`${Math.floor(days / 30)} common:months`);
    }
  );

  test.for(Array.from({ length: 30 }, () => Math.random() * 365))("removes decimals from %s", (days) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const t = ((_key: string, record: any) => `${record.count}`) as TFunction;
    const res = formatNDays(t, days);
    expect(res).toBe(Math.floor(Number(res)).toString());
  });

  test("formats negative days as empty string", () => {
    const res = formatNDays(mockT, -5);
    expect(res).toBe("");
  });
});
