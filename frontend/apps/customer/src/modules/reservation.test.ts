import { createMockIsReservableFieldsFragment, createMockReservableTimes } from "@test/reservation-unit.mocks";
import { addDays, addHours, addMinutes, format, startOfDay, startOfToday } from "date-fns";
import type { TFunction } from "i18next";
import { vi, describe, test, expect, beforeAll, afterAll } from "vitest";
import { formatApiDate } from "ui/src/modules/date-utils";
import { createNodeId } from "ui/src/modules/helpers";
import {
  ReservationStateChoice,
  ReservationStartInterval,
  OrderStatus,
  ReservationCancelReasonChoice,
} from "@gql/gql-types";
import type {
  ReservationOrderStatusFragment,
  CanUserCancelReservationFragment,
  PaymentOrderNode,
  CanReservationBeChangedFragment,
  ReservationPaymentUrlFragment,
} from "@gql/gql-types";
import { isSlotWithinReservationTime } from "./reservable";
import {
  convertFormToFocustimeSlot,
  convertReservationFormToApi,
  createDateTime,
  isReservationCancellable,
  isReservationCancellableReason,
  getCheckoutUrl,
  getNewReservation,
  getPaymentUrl,
  getDurationOptions,
  getNormalizedReservationOrderStatus,
  getWhyReservationCantBeChanged,
  isReservationEditable,
  transformReservation,
} from "./reservation";
import type { CanReservationBeChangedProps } from "./reservation";

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
    reservationStartInterval: ReservationStartInterval.Interval_15Minutes,
    reservationBeginsAt: addDays(new Date(), -1).toISOString(),
    reservationsMinDaysBefore,
    reservationsMaxDaysBefore: null,
    minReservationDuration: null,
    maxReservationDuration: null,
    reservationEndsAt: reservationEndsAt?.toISOString() ?? null,
    reservableTimeSpans: Array.from({ length: 100 }).map((_val, index) => {
      return {
        startDatetime: `${formatApiDate(addDays(new Date(), index))}T07:00:00+00:00`,
        endDatetime: `${formatApiDate(addDays(new Date(), index))}T20:00:00+00:00`,
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
    id: createNodeId("ReservationNode", 1),
    state,
    beginsAt: beginsAt.toISOString(),
    reservationUnit: {
      id: createNodeId("ReservationUnitNode", 1),
      cancellationRule: {
        id: createNodeId("CancellationRuleNode", 1),
        canBeCancelledTimeBefore,
      },
    },
  };
}

describe("getDurationOptions", () => {
  const mockT = ((x: string) => x) as TFunction;

  test.for([
    {
      reservationStartInterval: ReservationStartInterval.Interval_120Minutes,
      minReservationDuration: 0,
      maxReservationDuration: 5400,
      expected: [],
    },
    {
      reservationStartInterval: ReservationStartInterval.Interval_60Minutes,
      minReservationDuration: 5400,
      maxReservationDuration: 0,
      expected: [],
    },
    {
      reservationStartInterval: ReservationStartInterval.Interval_60Minutes,
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
      reservationStartInterval: ReservationStartInterval.Interval_15Minutes,
    } as const;
    expect(getDurationOptions(input, mockT).map((x) => x.value)).toEqual([30, 45, 60, 75, 90]);
  });

  test("values for 90 min intervals", () => {
    const input = {
      minReservationDuration: 1800,
      maxReservationDuration: 30_600,
      reservationStartInterval: ReservationStartInterval.Interval_90Minutes,
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

describe("isReservationCancellableReason", () => {
  test("returns reason codes for main failure paths", () => {
    expect(
      isReservationCancellableReason(
        createMockCanUserCancelReservation({
          beginsAt: addDays(new Date(), -1),
        })
      )
    ).toBe("RESERVATION_BEGIN_IN_PAST");

    expect(
      isReservationCancellableReason({
        ...createMockCanUserCancelReservation({
          beginsAt: addDays(new Date(), 1),
        }),
        reservationUnit: null as unknown as NonNullable<
          ReturnType<typeof createMockCanUserCancelReservation>
        >["reservationUnit"],
      })
    ).toBe("CANCELLATION_NOT_ALLOWED");

    expect(
      isReservationCancellableReason(
        createMockCanUserCancelReservation({
          beginsAt: addDays(new Date(), 1),
          state: ReservationStateChoice.Cancelled,
        })
      )
    ).toBe("ALREADY_CANCELLED");
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
    id: createNodeId("ReservationNode", 1),
    state,
    paymentOrder: {
      id: createNodeId("PaymentOrderNode", 1),
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

describe("getWhyReservationCantBeChanged", () => {
  test("returns null for editable reservations", () => {
    expect(
      getWhyReservationCantBeChanged(
        createMockReservation({
          beginsAt: addHours(new Date(), 24),
          price: "0",
        })
      )
    ).toBeNull();
  });

  test("rejects priced reservations even if cancellable", () => {
    expect(
      getWhyReservationCantBeChanged(
        createMockReservation({
          beginsAt: addHours(new Date(), 24),
          price: "12.5",
        })
      )
    ).toBe("RESERVATION_MODIFICATION_NOT_ALLOWED");
  });
});

describe("getNewReservation", () => {
  test("uses the minimum duration when dragged selection is too short", () => {
    const start = addHours(startOfDay(addDays(new Date(), 1)), 10);
    expect(
      getNewReservation({
        start,
        end: addMinutes(start, 10),
        reservationUnit: {
          minReservationDuration: 30 * 60,
          reservationStartInterval: ReservationStartInterval.Interval_30Minutes,
        },
      })
    ).toEqual({
      begin: start,
      end: addMinutes(start, 30),
    });
  });

  test("rounds the end time down to the nearest valid interval", () => {
    const start = addHours(startOfDay(addDays(new Date(), 1)), 10);
    expect(
      getNewReservation({
        start,
        end: addMinutes(start, 65),
        reservationUnit: {
          minReservationDuration: 15 * 60,
          reservationStartInterval: ReservationStartInterval.Interval_30Minutes,
        },
      })
    ).toEqual({
      begin: start,
      end: addMinutes(start, 60),
    });
  });
});

describe("reservation form transformations", () => {
  test("convertFormToFocustimeSlot returns a reservable slot", () => {
    const start = addDays(startOfToday(), 1);
    expect(
      convertFormToFocustimeSlot({
        data: {
          date: format(start, "d.M.yyyy"),
          duration: 60,
          time: "10:00",
          isControlsVisible: false,
        },
        reservationUnit: createMockIsReservableFieldsFragment({
          interval: ReservationStartInterval.Interval_30Minutes,
          minReservationDuration: 0,
          maxReservationDuration: 4 * 60 * 60,
        }),
        reservableTimes: createMockReservableTimes(),
        activeApplicationRounds: [],
        blockingReservations: [],
      })
    ).toMatchObject({
      isReservable: true,
      durationMinutes: 60,
      start: addHours(startOfDay(start), 10),
      end: addHours(startOfDay(start), 11),
    });
  });

  test("convertFormToFocustimeSlot rejects malformed values", () => {
    expect(
      convertFormToFocustimeSlot({
        data: {
          date: "not-a-date",
          duration: 60,
          time: "oops",
          isControlsVisible: false,
        },
        reservationUnit: createMockIsReservableFieldsFragment({}),
        reservableTimes: createMockReservableTimes(),
        activeApplicationRounds: [],
        blockingReservations: [],
      })
    ).toEqual({ isReservable: false });
  });

  test("convertReservationFormToApi serializes valid values", () => {
    const formValues = {
      date: "2.1.2024",
      time: "10:30",
      duration: 90,
      isControlsVisible: false,
    };
    expect(convertReservationFormToApi(formValues)).toEqual({
      beginsAt: "2024-01-02T08:30:00.000Z",
      endsAt: "2024-01-02T10:00:00.000Z",
    });
    expect(
      convertReservationFormToApi({
        ...formValues,
        time: "",
      })
    ).toBeNull();
  });

  test("transformReservation preserves local date, time and duration", () => {
    const begin = new Date(2024, 0, 2, 10, 30);
    const end = new Date(2024, 0, 2, 12, 0);
    expect(
      transformReservation({
        beginsAt: begin.toISOString(),
        endsAt: end.toISOString(),
      })
    ).toEqual({
      date: "2.1.2024",
      duration: 90,
      time: "10:30",
      isControlsVisible: false,
    });
  });
});

describe("createDateTime", () => {
  test("combines UI date and time into a datetime", () => {
    expect(createDateTime("2.1.2024", "10:30")).toEqual(new Date(2024, 0, 2, 10, 30));
  });
});

describe("getPaymentUrl", () => {
  function createPaymentReservation(
    overrides: Partial<ReservationPaymentUrlFragment> = {}
  ): ReservationPaymentUrlFragment {
    return {
      id: "ReservationNode:1",
      pk: 1,
      state: ReservationStateChoice.WaitingForPayment,
      cancelReason: null,
      paymentOrder: {
        id: "PaymentOrderNode:1",
        status: OrderStatus.Draft,
        handledPaymentDueBy: null,
        checkoutUrl: "https://checkout.url/path?user=1111-2222-3333-4444",
      },
      ...overrides,
    };
  }

  test("returns webstore checkout url for direct payments", () => {
    expect(getPaymentUrl(createPaymentReservation(), "fi", "https://api.example")).toBe(
      "https://checkout.url/path/paymentmethod?user=1111-2222-3333-4444&lang=fi"
    );
  });

  test("returns handled payment redirect url when payment is pending", () => {
    const origin = window.location.origin;
    expect(
      getPaymentUrl(
        createPaymentReservation({
          state: ReservationStateChoice.Confirmed,
          paymentOrder: {
            id: "PaymentOrderNode:1",
            status: OrderStatus.Pending,
            handledPaymentDueBy: addDays(new Date(), 1).toISOString(),
            checkoutUrl: null,
          },
        }),
        "sv",
        "https://api.example"
      )
    ).toBe(
      `https://api.example/v1/pay_pending_reservation/1/?lang=sv&redirect_on_error=${encodeURIComponent(
        `${origin}/sv/reservations/1`
      )}`
    );
  });

  test("returns undefined for expired not-paid reservations", () => {
    expect(
      getPaymentUrl(
        createPaymentReservation({
          state: ReservationStateChoice.Cancelled,
          cancelReason: ReservationCancelReasonChoice.NotPaid,
        }),
        "fi",
        "https://api.example"
      )
    ).toBeUndefined();
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
    expect(getCheckoutUrl({ ...order, checkoutUrl: null }, "fi")).toBeUndefined();
  });

  test("returns undefined if checkoutUrl is not an url", () => {
    // we are expecting console.errors => suppress
    vi.spyOn(console, "error").mockImplementation(vi.fn());
    expect(
      getCheckoutUrl(
        {
          ...order,
          checkoutUrl: "checkout.url?user=1111-2222-3333-4444",
        },
        "fi"
      )
    ).toBeUndefined();
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
