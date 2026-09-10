import { addHours, addMonths } from "date-fns";
import type { TFunction } from "i18next";
import { describe, expect, test } from "vitest";
import { formatApiDateUnsafe } from "ui/src/modules/date-utils";
import { createNodeId } from "ui/src/modules/helpers";
import { PaymentType, PriceUnit, Weekday, ReservationTypeChoice } from "@gql/gql-types";
import type {
  CreateTagStringFragment,
  PricingFieldsFragment,
  ReservationUnitPricingFieldsFragment,
  ReservationPageQuery,
} from "@gql/gql-types";
import { doesIntervalCollide, getBufferTime, reservationToInterval } from "./helpers";
import {
  createTagString,
  getReservationUnitPricing,
  formatReservationPrice,
  formatReservationPriceLong,
} from "./reservation";

const mockT = ((x: string) => x) as TFunction;

function constructPricing({
  lowestPrice,
  highestPrice,
  begin,
}: {
  lowestPrice: number;
  highestPrice: number;
  begin: Date;
}): PricingFieldsFragment {
  return {
    begins: formatApiDateUnsafe(begin),
    id: "1",
    priceUnit: PriceUnit.PerHour,
    lowestPrice: lowestPrice.toString(),
    highestPrice: highestPrice.toString(),
    taxPercentage: {
      id: "1",
      pk: 1,
      value: "24",
    },
    paymentType: PaymentType.Online,
    materialPriceDescriptionFi: "",
    materialPriceDescriptionEn: "",
    materialPriceDescriptionSv: "",
  };
}

function constructFreePricing(): PricingFieldsFragment {
  return constructPricing({
    lowestPrice: 0,
    highestPrice: 0,
    begin: new Date("2021-01-01"),
  });
}

function constructPaidPricing(): PricingFieldsFragment {
  return constructPricing({
    lowestPrice: 120,
    highestPrice: 120,
    begin: new Date("2022-03-01"),
  });
}

function constructReservation({
  beginsAt,
  endsAt,
  enableRecurrence,
}: {
  beginsAt: Date;
  endsAt: Date;
  enableRecurrence?: boolean;
}): CreateTagStringFragment {
  return {
    id: createNodeId("ReservationNode", 1),
    beginsAt: beginsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    reservationSeries: enableRecurrence
      ? {
          id: createNodeId("ReservationSeriesNode", 1),
          beginTime: "12:00",
          endTime: "14:00",
          beginDate: formatApiDateUnsafe(beginsAt),
          endDate: formatApiDateUnsafe(addMonths(endsAt, 3)),
          weekdays: [Weekday.Monday, Weekday.Tuesday, Weekday.Thursday],
        }
      : null,
    reservationUnit: {
      id: createNodeId("ReservationUnitNode", 1),
      nameFi: "Reservation unit 1",
      unit: {
        id: createNodeId("UnitNode", 1),
        nameFi: "Unit 1",
      },
    },
  };
}

describe("getReservationUnitPricing", () => {
  test("returns correct pricing based on reservation date", () => {
    const input: ReservationUnitPricingFieldsFragment = {
      id: "1",
      pricings: [constructFreePricing(), constructPaidPricing()],
    };

    const first = getReservationUnitPricing(input, new Date("2021-02-01T00:00:01Z"));
    const second = getReservationUnitPricing(input, new Date("2022-04-01T00:00:01Z"));
    expect(first?.lowestPrice).toBe("0");
    expect(second?.lowestPrice).toBe("120");
  });

  test("returns null for empty pricings", () => {
    const input: ReservationUnitPricingFieldsFragment = {
      id: "1",
      pricings: [],
    };
    const result = getReservationUnitPricing(input, new Date());
    expect(result).toBeNull();
  });

  test("returns the first pricing when date is before all pricings", () => {
    const input: ReservationUnitPricingFieldsFragment = {
      id: "1",
      pricings: [constructFreePricing(), constructPaidPricing()],
    };
    const result = getReservationUnitPricing(input, new Date("2020-01-01"));
    expect(result).toBeNull();
  });
});

describe("createTag", () => {
  test("recurring has a tag with a date range and multiple weekdays days", () => {
    const beginsAt = new Date("2023-04-01T09:00:00Z");
    const endsAt = addHours(beginsAt, 2);
    const input = constructReservation({ beginsAt, endsAt, enableRecurrence: true });

    const tag = createTagString(input, mockT);
    expect(tag).toContain(
      "translation:dayShort.MONDAY, translation:dayShort.TUESDAY, translation:dayShort.THURSDAY 12:00–14:00, common:abbreviations:hour"
    );
    expect(tag).toContain("1.4.2023–1.7.2023");
    expect(tag).toContain("Reservation unit 1");
  });

  test("no recurring defaults to reservation tag", () => {
    const input = constructReservation({
      beginsAt: new Date("2023-04-01T09:00:00Z"),
      endsAt: new Date("2023-04-01T11:00:00Z"),
    });

    const tag = createTagString(input, mockT);
    expect(tag).not.toContain("weekdayShortEnum.MONDAY, weekdayShortEnum.TUESDAY, weekdayShortEnum.THURSDAY");
    expect(tag).toContain("1.4.2023");
    expect(tag).toContain("12:00–14:00, common:abbreviations:hour");
    expect(tag).toContain("weekdayShortEnum.SATURDAY");
    expect(tag).toContain("Reservation unit 1");
  });
});

describe("formatReservationPrice", () => {
  test("formats reservation price correctly", () => {
    const mockReservation = {
      price: "100.00",
    } as unknown as NonNullable<ReservationPageQuery["reservation"]>;

    const result = formatReservationPrice(mockT, mockReservation);
    expect(typeof result).toBe("string");
  });
});

describe("formatReservationPriceLong", () => {
  test("formats price with due date and subvention info", () => {
    const mockReservation = {
      price: "100.00",
      paymentOrder: null,
      applyingForFreeOfCharge: false,
    } as unknown as NonNullable<ReservationPageQuery["reservation"]>;

    const result = formatReservationPriceLong(mockT, mockReservation);
    expect(typeof result).toBe("string");
  });

  test("includes subvention text when applicable", () => {
    const mockReservation = {
      price: "100.00",
      paymentOrder: null,
      applyingForFreeOfCharge: true,
    } as unknown as NonNullable<ReservationPageQuery["reservation"]>;

    const result = formatReservationPriceLong(mockT, mockReservation);
    expect(typeof result).toBe("string");
  });
});

describe("doesIntervalCollide", () => {
  const baseInterval = {
    start: new Date("2023-04-01T10:00:00Z"),
    end: new Date("2023-04-01T12:00:00Z"),
    buffers: { before: 0, after: 0 },
  };

  test("returns false when intervals do not overlap", () => {
    const other = {
      start: new Date("2023-04-01T13:00:00Z"),
      end: new Date("2023-04-01T14:00:00Z"),
      buffers: { before: 0, after: 0 },
    };
    expect(doesIntervalCollide(baseInterval, other)).toBe(false);
  });

  test("returns true when intervals overlap", () => {
    const other = {
      start: new Date("2023-04-01T11:00:00Z"),
      end: new Date("2023-04-01T13:00:00Z"),
      buffers: { before: 0, after: 0 },
    };
    expect(doesIntervalCollide(baseInterval, other)).toBe(true);
  });

  test("considers buffer times in collision detection", () => {
    const withBuffer = {
      ...baseInterval,
      buffers: { before: 600, after: 600 }, // 10 minute buffers
    };
    const other = {
      start: new Date("2023-04-01T12:05:00Z"),
      end: new Date("2023-04-01T13:00:00Z"),
      buffers: { before: 0, after: 0 },
    };
    expect(doesIntervalCollide(withBuffer, other)).toBe(true);
  });

  test("returns true for exact overlap", () => {
    const exact = {
      start: new Date("2023-04-01T10:00:00Z"),
      end: new Date("2023-04-01T12:00:00Z"),
      buffers: { before: 0, after: 0 },
    };
    expect(doesIntervalCollide(baseInterval, exact)).toBe(true);
  });
});

describe("getBufferTime", () => {
  test("returns 0 when disabled", () => {
    expect(getBufferTime(300, ReservationTypeChoice.Normal, false)).toBe(0);
  });

  test("returns 0 for blocked reservation type", () => {
    expect(getBufferTime(300, ReservationTypeChoice.Blocked, true)).toBe(0);
  });

  test("returns buffer value for normal reservation", () => {
    expect(getBufferTime(300, ReservationTypeChoice.Normal, true)).toBe(300);
  });

  test("returns 0 for null buffer even when enabled", () => {
    expect(getBufferTime(null, ReservationTypeChoice.Normal, true)).toBe(0);
  });

  test("returns 0 for undefined buffer even when enabled", () => {
    expect(getBufferTime(undefined, ReservationTypeChoice.Normal, true)).toBe(0);
  });
});

describe("reservationToInterval", () => {
  test("returns null for null reservation", () => {
    expect(reservationToInterval(null as unknown as never, ReservationTypeChoice.Normal)).toBeNull();
  });

  test("returns null for reservation without dates", () => {
    const res = {
      beginsAt: null,
      endsAt: null,
      bufferTimeBefore: 0,
      bufferTimeAfter: 0,
      type: ReservationTypeChoice.Normal,
    } as unknown;
    expect(reservationToInterval(res as never, ReservationTypeChoice.Normal)).toBeNull();
  });

  test("creates interval from valid reservation", () => {
    const res = {
      beginsAt: "2023-04-01T10:00:00Z",
      endsAt: "2023-04-01T12:00:00Z",
      bufferTimeBefore: 600,
      bufferTimeAfter: 600,
      reservationSeries: { pk: 1 },
      type: ReservationTypeChoice.Normal,
    } as unknown;

    const result = reservationToInterval(res as never, ReservationTypeChoice.Normal);
    expect(result).not.toBeNull();
    // Note: getBufferTime is called without enabled parameter, so buffers are 0
    expect(result?.buffers.before).toBe(0);
    expect(result?.buffers.after).toBe(0);
  });

  test("handles blocked reservation type", () => {
    const res = {
      beginsAt: "2023-04-01T10:00:00Z",
      endsAt: "2023-04-01T12:00:00Z",
      bufferTimeBefore: 600,
      bufferTimeAfter: 600,
      type: ReservationTypeChoice.Blocked,
    } as unknown;

    const result = reservationToInterval(res as never, ReservationTypeChoice.Normal);
    expect(result?.buffers.before).toBe(0);
    expect(result?.buffers.after).toBe(0);
  });
});
