import { get as mockGet } from "lodash";
import { addDays, addHours, addMinutes, startOfToday } from "date-fns";
import {
  type PaymentOrderNode,
  ReservationStateChoice,
  ReservationStartInterval,
  Authentication,
  ReservationKind,
  type ReservationUnitNode,
  CustomerTypeChoice,
  type ReservationMetadataFieldNode,
  OrderStatus,
  PaymentType,
} from "@gql/gql-types";
import {
  canReservationTimeBeChanged,
  isReservationCancellable,
  getCheckoutUrl,
  getDurationOptions,
  getNormalizedReservationOrderStatus,
  getReservationApplicationMutationValues,
  isReservationEditable,
  isReservationStartInFuture,
} from "../reservation";
import {
  type ReservableMap,
  isSlotWithinReservationTime,
  generateReservableMap,
} from "../reservable";
import mockTranslations from "../../public/locales/fi/prices.json";
import { toApiDate } from "common/src/common/util";
import { type TFunction } from "i18next";

function createMockReservationUnit({
  reservationsMinDaysBefore,
  reservationEnds,
  canBeCancelledTimeBefore,
}: {
  reservationsMinDaysBefore?: number;
  reservationEnds?: Date;
  canBeCancelledTimeBefore?: number;
  needsHandling?: boolean;
}): ReservationUnitNode {
  const cancellationRule = {
    canBeCancelledTimeBefore: canBeCancelledTimeBefore ?? 0,
    id: "fr8ejifod",
    name: "Cancellation rule",
  };
  return {
    authentication: Authentication.Weak,
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    canApplyFreeOfCharge: false,
    searchTerms: [],
    contactInformation: "",
    description: "",
    rank: 0,
    name: "Reservation unit",
    id: "123f4w90",
    uuid: "123f4w90",
    images: [],
    isArchived: false,
    isDraft: false,
    requireIntroduction: false,
    reservationKind: ReservationKind.Direct,
    reservationStartInterval: ReservationStartInterval.Interval_15Mins,
    reservationBegins: addDays(new Date(), -1).toISOString(),
    reservationsMinDaysBefore: reservationsMinDaysBefore ?? 0,
    reservationEnds: reservationEnds?.toISOString() ?? undefined,
    reservableTimeSpans: Array.from(Array(100)).map((_val, index) => {
      return {
        startDatetime: `${toApiDate(addDays(new Date(), index))}T07:00:00+00:00`,
        endDatetime: `${toApiDate(addDays(new Date(), index))}T20:00:00+00:00`,
      };
    }),
    reservationConfirmedInstructions: "",
    reservationPendingInstructions: "",
    reservationCancelledInstructions: "",
    applicationRounds: [],
    purposes: [],
    applicationRoundTimeSlots: [],
    paymentTypes: [],
    pricings: [],
    qualifiers: [],
    equipments: [],
    resources: [],
    spaces: [],
    cancellationRule,
    reservations: [],
    allowReservationsWithoutOpeningHours: false,
    requireReservationHandling: false,
    reservationBlockWholeDay: false,
  };
}

function createMockReservation({
  begin,
  price,
  state,
  reservationUnit,
  isHandled,
}: {
  begin?: Date;
  price?: string;
  state?: ReservationStateChoice;
  reservationUnit?: ReservationUnitNode;
  isHandled?: boolean;
}) {
  const start = begin ?? addHours(startOfToday(), 34);
  const end = addHours(start, 1);
  return {
    id: "123f4w90",
    state: state ?? ReservationStateChoice.Confirmed,
    price: price ?? "0",
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    paymentOrder: [],
    begin: start.toISOString(),
    end: end.toISOString(),
    reservationUnits: [reservationUnit ?? createMockReservationUnit({})],
    handlingDetails: "",
    isHandled,
  };
}

jest.mock("next-i18next", () => ({
  i18n: {
    t: (str: string) => {
      const path = str.replace("prices:", "");
      return mockGet(mockTranslations, path);
    },
    language: "fi",
  },
}));

const mockT = ((x: string) => x) as TFunction;

describe("getDurationOptions", () => {
  test("empty inputs", () => {
    const interval90 = ReservationStartInterval.Interval_90Mins;
    const interval60 = ReservationStartInterval.Interval_60Mins;
    expect(
      getDurationOptions(
        {
          minReservationDuration: 0,
          maxReservationDuration: 5400,
          reservationStartInterval: interval90,
        },
        mockT
      )
    ).toEqual([]);
    expect(
      getDurationOptions(
        {
          minReservationDuration: 5400,
          maxReservationDuration: 0,
          reservationStartInterval: interval60,
        },
        mockT
      )
    ).toEqual([]);
    expect(
      getDurationOptions(
        {
          minReservationDuration: 0,
          maxReservationDuration: 0,
          reservationStartInterval: interval60,
        },
        mockT
      )
    ).toEqual([]);
  });
  test("with 15 min intervals", () => {
    const interval15 = ReservationStartInterval.Interval_15Mins;
    expect(
      getDurationOptions(
        {
          minReservationDuration: 1800,
          maxReservationDuration: 5400,
          reservationStartInterval: interval15,
        },
        mockT
      )
    ).toEqual([
      {
        label: " common:abbreviations.minute",
        value: 30,
      },
      {
        label: " common:abbreviations.minute",
        value: 45,
      },
      {
        label: " common:abbreviations.minute",
        value: 60,
      },
      {
        label: " common:abbreviations.minute",
        value: 75,
      },
      {
        label: " common:abbreviations.minute",
        value: 90,
      },
    ]);
  });

  test("with 90 min intervals", () => {
    const interval90 = ReservationStartInterval.Interval_90Mins;
    expect(
      getDurationOptions(
        {
          minReservationDuration: 1800,
          maxReservationDuration: 30600,
          reservationStartInterval: interval90,
        },
        mockT
      )
    ).toEqual([
      {
        label: " common:abbreviations.minute",
        value: 90,
      },
      {
        label: "common:abbreviations.hour common:abbreviations.minute",
        value: 180,
      },
      {
        label: "common:abbreviations.hour common:abbreviations.minute",
        value: 270,
      },
      {
        label: "common:abbreviations.hour common:abbreviations.minute",
        value: 360,
      },
      {
        label: "common:abbreviations.hour common:abbreviations.minute",
        value: 450,
      },
    ]);
  });
});

describe("isReservationCancellable", () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date(2024, 0, 1, 9, 0, 0),
    });
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  function constructInput({
    begin,
    state,
    canBeCancelledTimeBefore,
  }: {
    begin: Date; // reservation begin time
    state?: ReservationStateChoice; // reservation state
    canBeCancelledTimeBefore?: number; // in seconds
  }) {
    return {
      ...createMockReservation({
        begin,
        state: state ?? ReservationStateChoice.Confirmed,
        reservationUnit: createMockReservationUnit({
          canBeCancelledTimeBefore: canBeCancelledTimeBefore ?? 0,
        }),
      }),
    };
  }

  test("NO for reservation that requires handling", () => {
    const input = constructInput({
      begin: addDays(new Date(), 1),
      state: ReservationStateChoice.RequiresHandling,
    });
    expect(isReservationCancellable(input)).toBe(false);
  });

  test("NO for reservation that is cancelled", () => {
    const input = constructInput({
      begin: addDays(new Date(), 1),
      state: ReservationStateChoice.Cancelled,
    });
    expect(isReservationCancellable(input)).toBe(false);
  });

  test("YES for reservation that is confirmed", () => {
    const input = constructInput({
      begin: addDays(new Date(), 1),
      state: ReservationStateChoice.Confirmed,
    });
    expect(isReservationCancellable(input)).toBe(true);
  });

  test("NO for reservation that is waiting for payment", () => {
    const input = constructInput({
      begin: addDays(new Date(), 1),
      state: ReservationStateChoice.WaitingForPayment,
    });
    expect(isReservationCancellable(input)).toBe(false);
  });

  test("YES for reservation that does not need handling", () => {
    const input = constructInput({
      begin: addDays(new Date(), 1),
    });
    expect(isReservationCancellable(input)).toBe(true);
  });

  test("YES for a reservation that can be cancelled till it's start", () => {
    const input = constructInput({
      begin: addMinutes(new Date(), 10),
    });
    expect(isReservationCancellable(input)).toBe(true);
  });

  test("YES for a reservation in the future with 24h cancel buffer", () => {
    const input = constructInput({
      begin: addDays(new Date(), 2),
      canBeCancelledTimeBefore: 24 * 60 * 60, // 24 hours
    });
    expect(isReservationCancellable(input)).toBe(true);
  });

  test("NO for a reservation that is in the past", () => {
    const input = constructInput({
      begin: addDays(new Date(), -1),
    });
    expect(isReservationCancellable(input)).toBe(false);
  });

  test("NO for a reservation that is too close to the start time", () => {
    const input = constructInput({
      begin: addMinutes(new Date(), 10),
      canBeCancelledTimeBefore: 30 * 60,
    });
    expect(isReservationCancellable(input)).toBe(false);
  });
});

describe("getReservationApplcationMutationValues", () => {
  test("with empty input", () => {
    expect(
      getReservationApplicationMutationValues(
        {},
        [],
        CustomerTypeChoice.Individual
      )
    ).toEqual({
      reserveeType: CustomerTypeChoice.Individual,
    });
  });

  test("with sane input", () => {
    const payload = {
      name: "Nimi",
      reserveeId: "123456-7",
      reserveeFirstName: "Etunimi",
    };
    const supportedFields: ReservationMetadataFieldNode[] = [
      {
        id: "123456-7",
        fieldName: "name",
      },
      {
        id: "123456-7",
        fieldName: "reservee_id",
      },
      {
        id: "123456-7",
        fieldName: "reservee_first_name",
      },
    ];
    expect(
      getReservationApplicationMutationValues(
        payload,
        supportedFields,
        CustomerTypeChoice.Individual
      )
    ).toEqual({
      name: "Nimi",
      reserveeFirstName: "Etunimi",
      reserveeType: CustomerTypeChoice.Individual,
    });
  });
});

describe("getNormalizedReservationOrderStatus", () => {
  // ??? what is the correct value?
  test("return correct value", () => {
    expect(
      getNormalizedReservationOrderStatus({
        state: ReservationStateChoice.Cancelled,
        paymentOrder: [
          {
            id: "foobar",
            status: OrderStatus.Draft,
          },
        ],
      })
    ).toBe(OrderStatus.Draft);

    expect(
      getNormalizedReservationOrderStatus({
        state: ReservationStateChoice.Cancelled,
        paymentOrder: [
          {
            id: "foobar",
            status: OrderStatus.Paid,
          },
        ],
      })
    ).toBe(OrderStatus.Paid);

    expect(
      getNormalizedReservationOrderStatus({
        state: ReservationStateChoice.Confirmed,
        paymentOrder: [
          {
            id: "foobar",
            status: OrderStatus.PaidManually,
          },
        ],
      })
    ).toBe(OrderStatus.PaidManually);
  });

  test("null if created", () => {
    expect(
      getNormalizedReservationOrderStatus({
        state: ReservationStateChoice.Created,
        paymentOrder: [
          {
            id: "foobar",
            status: OrderStatus.Draft,
          },
        ],
      })
    ).toBe(null);
  });

  test("null if Waiting for Payment", () => {
    expect(
      getNormalizedReservationOrderStatus({
        state: ReservationStateChoice.WaitingForPayment,
        paymentOrder: [
          {
            id: "foobar",
            status: OrderStatus.Draft,
          },
        ],
      })
    ).toBe(null);
  });

  test("null if Requires Handling", () => {
    expect(
      getNormalizedReservationOrderStatus({
        state: ReservationStateChoice.RequiresHandling,
        paymentOrder: [
          {
            id: "foobar",
            status: OrderStatus.Draft,
          },
        ],
      })
    ).toBe(null);
  });
});

describe("isReservationEditable", () => {
  function constructInput({
    state,
    begin,
    isHandled,
  }: {
    state: ReservationStateChoice;
    begin: Date;
    isHandled?: boolean;
  }) {
    return {
      reservation: createMockReservation({
        state,
        begin,
        isHandled: isHandled ?? false,
      }),
    };
  }

  test("true for confirmed reservation in the future", () => {
    const input = constructInput({
      state: ReservationStateChoice.Confirmed,
      begin: addHours(new Date(), 24),
    });
    expect(isReservationEditable(input)).toBe(true);
  });

  test("returns false with non-confirmed reservation", () => {
    const input = constructInput({
      state: ReservationStateChoice.Created,
      begin: addHours(new Date(), 24),
    });
    expect(isReservationEditable(input)).toBe(false);
  });

  test("handles past reservation check", () => {
    const input = constructInput({
      state: ReservationStateChoice.Confirmed,
      begin: addHours(new Date(), -1),
    });
    expect(isReservationEditable(input)).toBe(false);
  });

  test("handles situation when reservation has been handled", () => {
    const input = constructInput({
      state: ReservationStateChoice.Confirmed,
      begin: addHours(new Date(), 24),
      isHandled: true,
    });
    expect(isReservationEditable(input)).toBe(false);
  });
});

describe("canReservationBeChanged", () => {
  beforeAll(() => {
    jest.useFakeTimers({
      now: new Date(2024, 0, 1, 9, 0, 0),
    });
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  let mockReservableTimes: ReservableMap;
  beforeEach(() => {
    const WEEK_OF_TIMES = [0, 1, 2, 3, 4, 5, 6]
      .map((i) => ({
        start: addDays(addHours(startOfToday(), 5), i),
        end: addDays(addHours(startOfToday(), 21), i),
      }))
      .map(({ start, end }) => ({
        startDatetime: start.toISOString(),
        endDatetime: end.toISOString(),
      }));
    mockReservableTimes = generateReservableMap(WEEK_OF_TIMES);
  });

  function constructInput({
    begin,
    oldBegin,
    price,
    reservableTimes,
    reservationsMinDaysBefore,
    reservationEnds,
    state,
    cancellationBuffer,
  }: {
    begin: Date;
    oldBegin?: Date;
    price?: string;
    reservableTimes?: ReservableMap;
    reservationsMinDaysBefore?: number;
    reservationEnds?: Date;
    state?: ReservationStateChoice;
    cancellationBuffer?: number;
  }) {
    const baseUnit = createMockReservationUnit({
      canBeCancelledTimeBefore: cancellationBuffer ?? 0,
      reservationsMinDaysBefore: reservationsMinDaysBefore ?? 0,
      reservationEnds,
    });
    const baseReservation = createMockReservation({
      reservationUnit: baseUnit,
      begin: oldBegin,
      state: state ?? ReservationStateChoice.Confirmed,
    });
    return {
      reservableTimes: reservableTimes ?? mockReservableTimes,
      reservation: baseReservation,
      newReservation: {
        begin: begin.toISOString(),
        end: addHours(begin, 1).toISOString(),
        price: price ?? "0",
        bufferTimeBefore: baseReservation.bufferTimeBefore,
        bufferTimeAfter: baseReservation.bufferTimeAfter,
      },
      reservationUnit: baseUnit,
      activeApplicationRounds: [],
      blockingReservations: [],
    };
  }

  test("YES for a reservation tomorrow", () => {
    const input = constructInput({
      begin: addHours(new Date(), 24),
    });
    expect(canReservationTimeBeChanged(input)).toBe(true);
  });

  test("NO with non-confirmed reservation", () => {
    const input = constructInput({
      begin: addHours(new Date(), 24),
      state: ReservationStateChoice.Created,
    });
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });

  test("NO if the reservation would require payment", () => {
    const input = constructInput({
      begin: addHours(new Date(), 24),
      price: "2.02",
    });
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });

  test("NO without reservable times", () => {
    const input = constructInput({
      begin: addHours(new Date(), 24),
      reservableTimes: new Map(),
    });
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });

  test("NO with malformed begin time", () => {
    const input = {
      ...constructInput({ begin: new Date() }),
      begin: "foobar",
    };
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });

  test("NO with empty begin time", () => {
    const input = {
      ...constructInput({ begin: new Date() }),
      begin: "",
    };
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });

  test("NO with minimum reservation days", () => {
    const input = constructInput({
      begin: addHours(new Date(), 24),
      reservationsMinDaysBefore: 10,
    });
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });

  test("NO when the reservation unit has been closed for reservations", () => {
    const input = {
      ...constructInput({
        begin: addHours(new Date(), 24),
        reservationEnds: addDays(new Date(), -1),
      }),
    };
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });

  test("NO without a cancellation rule", () => {
    const baseUnit = createMockReservationUnit({});
    const reservationUnit1: ReservationUnitNode = {
      ...baseUnit,
      cancellationRule: null,
    };
    const input = {
      ...constructInput({
        begin: addHours(new Date(), 24),
        reservationEnds: addDays(new Date(), -1),
      }),
      reservation: createMockReservation({
        reservationUnit: reservationUnit1,
      }),
      reservationUnit: reservationUnit1,
    };
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });

  test("YES if outside cancellation buffer", () => {
    const input = constructInput({
      begin: addHours(new Date(), 24),
      oldBegin: addHours(new Date(), 2),
      cancellationBuffer: 60 * 60,
    });
    expect(canReservationTimeBeChanged(input)).toBe(true);
  });

  test("NO if inside cancellation buffer", () => {
    const input = constructInput({
      begin: addHours(new Date(), 24),
      oldBegin: addHours(new Date(), 2),
      cancellationBuffer: 2 * 60 * 60 + 1,
    });
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });

  test("NO when the reservation is in the past", () => {
    const input = constructInput({
      begin: addHours(new Date(), -1),
    });
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });

  test("NO with conflicting application round", () => {
    const input = {
      ...constructInput({
        begin: addHours(new Date(), 24),
      }),
      activeApplicationRounds: [
        {
          reservationPeriodBegin: addHours(new Date(), 1).toISOString(),
          reservationPeriodEnd: addHours(new Date(), 20).toISOString(),
        },
      ],
    };
    expect(canReservationTimeBeChanged(input)).toBe(false);
  });
});

describe("getCheckoutUrl", () => {
  const order: PaymentOrderNode = {
    id: "order-id",
    checkoutUrl: "https://checkout.url/path?user=1111-2222-3333-4444",
    paymentType: PaymentType.Online,
  };

  test("returns checkout url with lang sv", () => {
    expect(getCheckoutUrl(order, "sv")).toBe(
      "https://checkout.url/path/paymentmethod?user=1111-2222-3333-4444&lang=sv"
    );
  });

  test("returns checkout url with lang fi", () => {
    expect(getCheckoutUrl(order, "fi")).toBe(
      "https://checkout.url/path/paymentmethod?user=1111-2222-3333-4444&lang=fi"
    );
  });

  test("returns checkout url with lang en", () => {
    expect(getCheckoutUrl(order, "en")).toBe(
      "https://checkout.url/path/paymentmethod?user=1111-2222-3333-4444&lang=en"
    );
  });

  test("returns undefined if checkoutUrl is not defined", () => {
    expect(
      getCheckoutUrl({ ...order, checkoutUrl: undefined })
    ).not.toBeDefined();
  });

  test("returns undefined if checkoutUrl is not an url", () => {
    // we are expecting console.errors => suppress
    jest.spyOn(console, "error").mockImplementation(jest.fn());
    expect(
      getCheckoutUrl({
        ...order,
        checkoutUrl: "checkout.url?user=1111-2222-3333-4444",
      })
    ).not.toBeDefined();
  });
});

describe("isReservationStartInFuture", () => {
  test("YES for a reservation that starts in the future", () => {
    const reservationBegins = addMinutes(new Date(), 10).toISOString();
    expect(isReservationStartInFuture({ reservationBegins })).toBe(true);
  });

  test("NO for a reservation that starts in the past", () => {
    const reservationBegins = addMinutes(new Date(), -10).toISOString();
    expect(isReservationStartInFuture({ reservationBegins })).toBe(false);
  });

  test("NO for a reservation that now", () => {
    const reservationBegins = new Date().toISOString();
    expect(isReservationStartInFuture({ reservationBegins })).toBe(false);
    expect(isReservationStartInFuture({})).toBe(false);
  });

  // Why? the name of the function doesn't make sense here
  test("YES if start < buffer days", () => {
    const input = {
      reservationBegins: addDays(new Date(), 10).toISOString(),
      reservationsMaxDaysBefore: 9,
    };
    expect(isReservationStartInFuture(input)).toBe(true);
  });

  test("NO if start === buffer days", () => {
    const input = {
      reservationBegins: addDays(new Date(), 10).toISOString(),
      reservationsMaxDaysBefore: 10,
    };
    expect(isReservationStartInFuture(input)).toBe(false);
  });
});

describe("isSlotWithinReservationTime", () => {
  test("with no reservation times", () => {
    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        undefined,
        undefined
      )
    ).toBe(true);
  });

  test("with begin time", () => {
    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-08-22T12:00:00+00:00"),
        undefined
      )
    ).toBe(true);

    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-09-23T12:00:00+00:00"),
        undefined
      )
    ).toBe(false);
  });

  test("with end time", () => {
    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        undefined,
        new Date("2019-08-22T12:00:00+00:00")
      )
    ).toBe(false);

    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        undefined,
        new Date("2019-09-23T13:00:00+00:00")
      )
    ).toBe(true);
  });

  test("with both times", () => {
    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-09-22T12:00:00+00:00")
      )
    ).toBe(false);

    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-08-22T12:00:00+00:00"),
        new Date("2019-09-22T12:00:00+00:00")
      )
    ).toBe(false);

    expect(
      isSlotWithinReservationTime(
        new Date("2019-09-22T12:00:00+00:00"),
        new Date("2019-08-22T12:00:00+00:00"),
        new Date("2019-10-22T12:00:00+00:00")
      )
    ).toBe(true);
  });
});
