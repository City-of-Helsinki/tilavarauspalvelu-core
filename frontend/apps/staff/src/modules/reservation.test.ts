import { addHours, addMonths } from "date-fns";
import { describe, expect, test } from "vitest";
import type { TFunction } from "i18next";
import { formatApiDateUnsafe } from "ui/src/modules/date-utils";
import { createNodeId } from "ui/src/modules/helpers";
import { PriceUnit, Weekday, ReservationTypeChoice } from "@gql/gql-types";
import type {
  CreateTagStringFragment,
  ReservationPageQuery,
  ReservationPriceDetailsFieldsFragment,
} from "@gql/gql-types";
import { doesIntervalCollide, getBufferTime, reservationToInterval } from "./helpers";
import {
  createTagString,
  formatReservationPrice,
  getReservationPriceDetails,
  isReservationPriceFree,
  formatReservationPriceLong,
} from "./reservation";

const mockT = ((x: string) => x) as TFunction;

type PriceLine = NonNullable<ReservationPriceDetailsFieldsFragment["priceLines"]>[number];

function createPriceLine(overrides: Partial<PriceLine> = {}): PriceLine {
  return {
    id: createNodeId("ReservationPriceLineNode", 1),
    pk: 1,
    quantity: "2.0000",
    priceUnit: PriceUnit.PerHour,
    unitAmount: "10.00",
    amount: "20.00",
    overrideAmount: null,
    taxPercentage: "25.50",
    ...overrides,
  };
}

function createPriceDetails(
  overrides: Partial<ReservationPriceDetailsFieldsFragment> = {}
): ReservationPriceDetailsFieldsFragment {
  return {
    id: createNodeId("ReservationNode", 1),
    price: "20.00",
    priceLines: [createPriceLine()],
    ...overrides,
  };
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

describe("isReservationPriceFree", () => {
  test("is not free when a price line has an amount", () => {
    expect(isReservationPriceFree(createPriceDetails())).toBe(false);
  });

  test("is not free when the handler made the price free", () => {
    const reservation = createPriceDetails({ price: "0", priceLines: [createPriceLine({ overrideAmount: "0" })] });
    expect(isReservationPriceFree(reservation)).toBe(false);
  });

  test("is free when the price lines have no amount", () => {
    const reservation = createPriceDetails({ price: "0", priceLines: [createPriceLine({ amount: "0" })] });
    expect(isReservationPriceFree(reservation)).toBe(true);
  });

  test("uses the price when the reservation has no price lines", () => {
    expect(isReservationPriceFree(createPriceDetails({ priceLines: [] }))).toBe(false);
    expect(isReservationPriceFree(createPriceDetails({ price: "0", priceLines: [] }))).toBe(true);
  });
});

describe("getReservationPriceDetails", () => {
  test("shows the calculation of the price line", () => {
    expect(getReservationPriceDetails(createPriceDetails(), mockT)).toBe("reservation:ApproveDialog.priceBreakdown");
  });

  test("shows only the price for a fixed price", () => {
    const reservation = createPriceDetails({ priceLines: [createPriceLine({ priceUnit: PriceUnit.Fixed })] });
    expect(getReservationPriceDetails(reservation, mockT)).toMatch(/^20\s€$/);
  });

  test("shows only the price of the reservation without exactly one price line", () => {
    expect(getReservationPriceDetails(createPriceDetails({ price: "12.00", priceLines: [] }), mockT)).toMatch(
      /^12\s€$/
    );
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
  test("formats paid reservation price", () => {
    const mockReservation = {
      price: "100.00",
    } as unknown as NonNullable<ReservationPageQuery["reservation"]>;

    const result = formatReservationPrice(mockT, mockReservation);
    expect(result).toContain("100");
  });

  test("formats free reservation price with fallback text", () => {
    const mockReservation = {
      price: "0.00",
    } as unknown as NonNullable<ReservationPageQuery["reservation"]>;

    const result = formatReservationPrice(mockT, mockReservation);
    expect(result).toBe("reservation:noPrice");
  });

  test("handles null price with fallback text", () => {
    const mockReservation = {
      price: null,
    } as unknown as NonNullable<ReservationPageQuery["reservation"]>;

    const result = formatReservationPrice(mockT, mockReservation);
    expect(result).toBe("reservation:noPrice");
  });
});

describe("formatReservationPriceLong", () => {
  test("formats price without subvention when not applicable", () => {
    const mockReservation = {
      price: "100.00",
      paymentOrder: null,
      applyingForFreeOfCharge: false,
    } as unknown as NonNullable<ReservationPageQuery["reservation"]>;

    const result = formatReservationPriceLong(mockT, mockReservation);
    expect(result).toContain("100");
    expect(result).not.toContain("reservation:appliesSubvention");
  });

  test("includes subvention text when applicable", () => {
    const mockReservation = {
      price: "100.00",
      paymentOrder: null,
      applyingForFreeOfCharge: true,
    } as unknown as NonNullable<ReservationPageQuery["reservation"]>;

    const result = formatReservationPriceLong(mockT, mockReservation);
    expect(result).toContain("100");
    expect(result).toContain("reservation:appliesSubvention");
  });

  test("includes due date when payment order exists", () => {
    const mockReservation = {
      price: "100.00",
      paymentOrder: {
        handledPaymentDueBy: "2024-12-31T23:59:59Z",
      },
      applyingForFreeOfCharge: false,
    } as unknown as NonNullable<ReservationPageQuery["reservation"]>;

    const result = formatReservationPriceLong(mockT, mockReservation);
    expect(result).toContain("100");
    expect(result).toContain("reservation:dueBy");
    expect(result).not.toContain("reservation:appliesSubvention");
  });

  test("includes both due date and subvention when both applicable", () => {
    const mockReservation = {
      price: "100.00",
      paymentOrder: {
        handledPaymentDueBy: "2024-12-31T23:59:59Z",
      },
      applyingForFreeOfCharge: true,
    } as unknown as NonNullable<ReservationPageQuery["reservation"]>;

    const result = formatReservationPriceLong(mockT, mockReservation);
    expect(result).toContain("100");
    expect(result).toContain("reservation:dueBy");
    expect(result).toContain("reservation:appliesSubvention");
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
    expect(result?.buffers.before).toBe(600);
    expect(result?.buffers.after).toBe(600);
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
