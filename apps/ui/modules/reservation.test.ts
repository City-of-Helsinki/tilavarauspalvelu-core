import { addDays, addHours, addMinutes, startOfToday } from "date-fns";
import {
  ReservationStateChoice,
  ReservationStartInterval,
  OrderStatus,
  type ReservationOrderStatusFragment,
  type CanUserCancelReservationFragment,
  type PaymentOrderNode,
  type CanReservationBeChangedFragment,
} from "@gql/gql-types";
import {
  isReservationCancellable,
  getCheckoutUrl,
  getDurationOptions,
  getNormalizedReservationOrderStatus,
  isReservationEditable,
  type CanReservationBeChangedProps,
} from "./reservation";
import { isSlotWithinReservationTime } from "./reservable";
import { toApiDate } from "common/src/common/util";
import { type TFunction } from "i18next";
import { vi, describe, test, expect, beforeAll, afterAll } from "vitest";
import { base64encode } from "common/src/helpers";

function createMockCancellationRule({
  canBeCancelledTimeBefore = 0,
}: {
  canBeCancelledTimeBefore?: number;
} = {}): CanUserCancelReservationFragment["reservationUnit"]["cancellationRule"] {
  return {
    canBeCancelledTimeBefore,
    id: "fr8ejifod",
  };
}

function createMockReservationUnit({
  reservationsMinDaysBefore = 0,
  reservationEndsAt,
}: {
  reservationsMinDaysBefore?: number;
  reservationEndsAt?: Date;
}): CanReservationBeChangedProps["reservationUnit"] {
  return {
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    id: "123f4w90",
    reservationStartInterval: ReservationStartInterval.Interval_15Mins,
    reservationBeginsAt: addDays(new Date(), -1).toISOString(),
    reservationsMinDaysBefore,
    reservationsMaxDaysBefore: null,
    minReservationDuration: null,
    maxReservationDuration: null,
    reservationEndsAt: reservationEndsAt?.toISOString() ?? null,
    reservableTimeSpans: Array.from(Array(100)).map((_val, index) => {
      return {
        startDatetime: `${toApiDate(addDays(new Date(), index))}T07:00:00+00:00`,
        endDatetime: `${toApiDate(addDays(new Date(), index))}T20:00:00+00:00`,
      };
    }),
  };
}

function createMockReservation({
  beginsAt,
  price,
  state,
  reservationUnit,
  isHandled = null,
  canBeCancelledTimeBefore,
  reservationsMinDaysBefore,
  reservationEndsAt,
}: {
  beginsAt?: Date;
  price?: string;
  state?: ReservationStateChoice;
  reservationUnit?: CanReservationBeChangedProps["reservationUnit"] &
    CanUserCancelReservationFragment["reservationUnit"];
  isHandled?: boolean | null;
  canBeCancelledTimeBefore?: number;
  reservationsMinDaysBefore?: number;
  reservationEndsAt?: Date;
}): CanReservationBeChangedProps["reservation"] {
  const start = beginsAt ?? addHours(startOfToday(), 34);
  const end = addHours(start, 1);
  const resUnit = reservationUnit ?? {
    ...createMockReservationUnit({
      reservationsMinDaysBefore,
      reservationEndsAt,
    }),
    cancellationRule: createMockCancellationRule({ canBeCancelledTimeBefore }),
  };
  return {
    id: "123f4w90",
    state: state ?? ReservationStateChoice.Confirmed,
    price: price ?? "0",
    beginsAt: start.toISOString(),
    endsAt: end.toISOString(),
    reservationUnit: resUnit,
    isHandled,
  };
}

function createMockCanUserCancelReservation({
  beginsAt,
  state = ReservationStateChoice.Confirmed,
  canBeCancelledTimeBefore = 0,
}: {
  beginsAt: Date; // reservation begin time
  state?: ReservationStateChoice; // reservation state
  canBeCancelledTimeBefore?: number; // in seconds
}): CanUserCancelReservationFragment {
  return {
    id: base64encode("ReservationNode:1"),
    state,
    beginsAt: beginsAt.toISOString(),
    reservationUnit: {
      id: base64encode("ReservationUnitNode:1"),
      cancellationRule: {
        id: base64encode("CancellationRuleNode:1"),
        canBeCancelledTimeBefore,
      },
    },
  };
}

describe("getDurationOptions", () => {
  const mockT = ((x: string) => x) as TFunction;

  test.for([
    {
      reservationStartInterval: ReservationStartInterval.Interval_120Mins,
      minReservationDuration: 0,
      maxReservationDuration: 5400,
      expected: [],
    },
    {
      reservationStartInterval: ReservationStartInterval.Interval_60Mins,
      minReservationDuration: 5400,
      maxReservationDuration: 0,
      expected: [],
    },
    {
      reservationStartInterval: ReservationStartInterval.Interval_60Mins,
      minReservationDuration: 0,
      maxReservationDuration: 0,
      expected: [],
    },
  ])("impossible combination of values", ({ expected, ...rest }) => {
    expect(getDurationOptions(rest, mockT)).toEqual(expected);
  });

  test("values for 15 min intervals", () => {
    const input = {
      minReservationDuration: 1800,
      maxReservationDuration: 5400,
      reservationStartInterval: ReservationStartInterval.Interval_15Mins,
    } as const;
    expect(getDurationOptions(input, mockT).map((x) => x.value)).toEqual([30, 45, 60, 75, 90]);
  });

  test("values for 90 min intervals", () => {
    const input = {
      minReservationDuration: 1800,
      maxReservationDuration: 30600,
      reservationStartInterval: ReservationStartInterval.Interval_90Mins,
    } as const;
    expect(getDurationOptions(input, mockT).map((x) => x.value)).toEqual([90, 180, 270, 360, 450]);
  });
});

describe("isReservationCancellable", () => {
  beforeAll(() => {
    vi.useFakeTimers({
      now: new Date(2024, 0, 1, 9, 0, 0),
    });
  });
  afterAll(() => {
    vi.useRealTimers();
  });

  const constructInput = createMockCanUserCancelReservation;

  test("NO for reservation that requires handling", () => {
    const input = constructInput({
      beginsAt: addDays(new Date(), 1),
      state: ReservationStateChoice.RequiresHandling,
    });
    expect(isReservationCancellable(input)).toBe(false);
  });

  test("NO for reservation that is cancelled", () => {
    const input = constructInput({
      beginsAt: addDays(new Date(), 1),
      state: ReservationStateChoice.Cancelled,
    });
    expect(isReservationCancellable(input)).toBe(false);
  });

  test("YES for reservation that is confirmed", () => {
    const input = constructInput({
      beginsAt: addDays(new Date(), 1),
      state: ReservationStateChoice.Confirmed,
    });
    expect(isReservationCancellable(input)).toBe(true);
  });

  test("NO for reservation that is waiting for payment", () => {
    const input = constructInput({
      beginsAt: addDays(new Date(), 1),
      state: ReservationStateChoice.WaitingForPayment,
    });
    expect(isReservationCancellable(input)).toBe(false);
  });

  test("YES for reservation that does not need handling", () => {
    const input = constructInput({
      beginsAt: addDays(new Date(), 1),
    });
    expect(isReservationCancellable(input)).toBe(true);
  });

  test("YES for a reservation that can be cancelled till it's start", () => {
    const input = constructInput({
      beginsAt: addMinutes(new Date(), 10),
    });
    expect(isReservationCancellable(input)).toBe(true);
  });

  test("YES for a reservation in the future with 24h cancel buffer", () => {
    const input = constructInput({
      beginsAt: addDays(new Date(), 2),
      canBeCancelledTimeBefore: 24 * 60 * 60, // 24 hours
    });
    expect(isReservationCancellable(input)).toBe(true);
  });

  test("NO for a reservation that is in the past", () => {
    const input = constructInput({
      beginsAt: addDays(new Date(), -1),
    });
    expect(isReservationCancellable(input)).toBe(false);
  });

  test("NO for a reservation that is too close to the start time", () => {
    const input = constructInput({
      beginsAt: addMinutes(new Date(), 10),
      canBeCancelledTimeBefore: 30 * 60,
    });
    expect(isReservationCancellable(input)).toBe(false);
  });
});

function createReservationOrderStatusFragment({
  orderStatus,
  state,
}: {
  orderStatus: OrderStatus;
  state: ReservationStateChoice;
}): ReservationOrderStatusFragment {
  return {
    id: base64encode("ReservationNode:1"),
    state,
    paymentOrder: {
      id: base64encode("PaymentOrderNode:1"),
      status: orderStatus,
      checkoutUrl: "https://checkout.url/path?user=1111-2222-3333-4444",
    },
  };
}

describe("getNormalizedReservationOrderStatus", () => {
  test.each([
    ...Object.values(OrderStatus).map((value) => ({
      state: ReservationStateChoice.Created,
      orderStatus: value,
      expected: null,
    })),
    ...Object.values(OrderStatus).map((value) => ({
      state: ReservationStateChoice.WaitingForPayment,
      orderStatus: value,
      expected: null,
    })),
    ...Object.values(OrderStatus).map((value) => ({
      state: ReservationStateChoice.RequiresHandling,
      orderStatus: value,
      expected: null,
    })),
    ...Object.values(OrderStatus).map((value) => ({
      state: ReservationStateChoice.Cancelled,
      orderStatus: value,
      expected: value,
    })),
    ...Object.values(OrderStatus).map((value) => ({
      state: ReservationStateChoice.Confirmed,
      orderStatus: value,
      expected: value,
    })),
  ])("$state and $orderStatus -> $expected", ({ state, orderStatus, expected }) => {
    const input = createReservationOrderStatusFragment({
      state,
      orderStatus,
    });
    expect(getNormalizedReservationOrderStatus(input)).toBe(expected);
  });
});

describe("isReservationEditable", () => {
  function constructInput({
    state = ReservationStateChoice.Confirmed,
    beginsAt,
    isHandled = false,
    cancellationBuffer = 0,
  }: {
    state?: ReservationStateChoice;
    beginsAt: Date;
    isHandled?: boolean;
    cancellationBuffer?: number;
  }) {
    return createMockReservation({
      state,
      beginsAt,
      isHandled,
      canBeCancelledTimeBefore: cancellationBuffer,
    });
  }

  test("YES for confirmed reservation in the future", () => {
    const input = constructInput({
      beginsAt: addHours(new Date(), 24),
    });
    expect(isReservationEditable(input)).toBe(true);
  });

  test("NO for non-confirmed reservation", () => {
    const input = constructInput({
      state: ReservationStateChoice.Created,
      beginsAt: addHours(new Date(), 24),
    });
    expect(isReservationEditable(input)).toBe(false);
  });

  test("NO for past reservation", () => {
    const input = constructInput({
      beginsAt: addHours(new Date(), -1),
    });
    expect(isReservationEditable(input)).toBe(false);
  });

  test("NO for handled reservation", () => {
    const input: CanReservationBeChangedFragment = constructInput({
      beginsAt: addHours(new Date(), 24),
      isHandled: true,
    });
    expect(isReservationEditable(input)).toBe(false);
  });

  test("NO without a cancellation rule", () => {
    const baseUnit = createMockReservationUnit({});
    const input: CanReservationBeChangedFragment = {
      ...constructInput({
        beginsAt: addHours(new Date(), 24),
      }),
      reservationUnit: {
        ...baseUnit,
        cancellationRule: null,
      },
    };
    expect(isReservationEditable(input)).toBe(false);
  });

  test("YES if outside cancellation buffer", () => {
    const input = constructInput({
      beginsAt: addHours(new Date(), 24),
      cancellationBuffer: 60 * 60,
    });
    expect(isReservationEditable(input)).toBe(true);
  });

  test("NO if inside cancellation buffer", () => {
    const input = constructInput({
      beginsAt: addHours(new Date(), 24),
      cancellationBuffer: 24 * 60 * 60 + 1,
    });
    expect(isReservationEditable(input)).toBe(false);
  });
});

describe("getCheckoutUrl", () => {
  const baseCheckoutUrl = "https://checkout.url/path";
  const userParam = "user=1111-2222-3333-4444";
  const order: Pick<PaymentOrderNode, "checkoutUrl"> = {
    checkoutUrl: `${baseCheckoutUrl}?${userParam}`,
  };
  const checkoutUrl = `${baseCheckoutUrl}/paymentmethod?${userParam}`;

  test("returns checkout url with lang sv", () => {
    expect(getCheckoutUrl(order, "sv")).toBe(`${checkoutUrl}&lang=sv`);
  });

  test("returns checkout url with lang fi", () => {
    expect(getCheckoutUrl(order, "fi")).toBe(`${checkoutUrl}&lang=fi`);
  });

  test("returns checkout url with lang en", () => {
    expect(getCheckoutUrl(order, "en")).toBe(`${checkoutUrl}&lang=en`);
  });

  test("returns undefined if checkoutUrl is not defined", () => {
    expect(getCheckoutUrl({ ...order, checkoutUrl: null })).toBeNull();
  });

  test("returns undefined if checkoutUrl is not an url", () => {
    // we are expecting console.errors => suppress
    vi.spyOn(console, "error").mockImplementation(vi.fn());
    expect(
      getCheckoutUrl({
        ...order,
        checkoutUrl: "checkout.url?user=1111-2222-3333-4444",
      })
    ).toBeNull();
  });
});

describe("isSlotWithinReservationTime", () => {
  test.for([
    { begin: null, end: null, expected: true },
    { begin: null, end: -1, expected: false },
    { begin: null, end: 1, expected: true },
    { begin: -1, end: null, expected: false },
    { begin: 1, end: null, expected: true },
    { begin: 0, end: 0, expected: false },
    { begin: 30, end: 0, expected: false },
    { begin: 0, end: 30, expected: false },
    { begin: 30, end: 30, expected: true },
  ])("from $begin to $end -> $expected", ({ begin, end, expected }) => {
    const baseDate = new Date("2019-09-22T12:00:00+00:00");
    const input = {
      start: baseDate,
      reservationBeginsAt: begin != null ? addDays(baseDate, -begin) : undefined,
      reservationEndsAt: end != null ? addDays(baseDate, end) : undefined,
    };
    expect(isSlotWithinReservationTime(input)).toBe(expected);
  });
});
