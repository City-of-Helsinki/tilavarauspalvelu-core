import { get as mockGet } from "lodash";
import { addDays, addHours, addMinutes, startOfToday } from "date-fns";
import {
  type PaymentOrderNode,
  ReservationStateChoice,
  type ReservationNode,
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
  canUserCancelReservation,
  getCheckoutUrl,
  getDurationOptions,
  getNormalizedReservationOrderStatus,
  getReservationApplicationMutationValues,
  getReservationCancellationReason,
  isReservationEditable,
  isReservationInThePast,
  isReservationStartInFuture,
} from "../reservation";
import { type ReservableMap, isSlotWithinReservationTime } from "../reservable";
import mockTranslations from "../../public/locales/fi/prices.json";
import { toApiDate } from "common/src/common/util";
import { type TFunction } from "i18next";

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

const reservationUnit: ReservationUnitNode = {
  authentication: Authentication.Weak,
  bufferTimeBefore: 0,
  bufferTimeAfter: 0,
  canApplyFreeOfCharge: false,
  contactInformation: "",
  description: "",
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
  reservationEnds: undefined, // addDays(new Date(), 200).toISOString(),
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
  services: [],
  spaces: [],
  cancellationRule: {
    id: "fr8ejifod",
    name: "Cancellation rule",
    needsHandling: false,
  },
  reservationSet: [],
  allowReservationsWithoutOpeningHours: false,
  requireReservationHandling: false,
  reservationBlockWholeDay: false,
};

const reservation = {
  id: "123f4w90",
  state: ReservationStateChoice.Confirmed,
  price: "0",
  bufferTimeBefore: 0,
  bufferTimeAfter: 0,
  paymentOrder: [],
  begin: addHours(startOfToday(), 34).toISOString(),
  end: addHours(startOfToday(), 35).toISOString(),
  reservationUnit: [reservationUnit],
  handlingDetails: "",
} as const;

describe("canUserCancelReservation", () => {
  test("NO for reservation that needs handling", () => {
    const res = {
      ...reservation,
      begin: new Date().toISOString(),
      end: addHours(new Date(), 1).toISOString(),
      id: "123",
      reservationUnit: [
        {
          ...reservationUnit,
          cancellationRule: {
            id: "fr8ejifod",
            name: "",
            needsHandling: true,
          },
        },
      ],
    };
    expect(canUserCancelReservation(res)).toBe(false);
  });

  test("YES for reservation that does not need handling", () => {
    const res = {
      ...reservation,
      begin: addMinutes(new Date(), 10).toISOString(),
      state: ReservationStateChoice.Confirmed,
      reservationUnit: [
        {
          ...reservationUnit,
          cancellationRule: {
            id: "fr8ejifod",
            name: "",
            needsHandling: false,
          },
        },
      ],
    };
    expect(canUserCancelReservation(res)).toBe(true);
  });

  test.todo("NO for a reservation that is in the past");
  // TODO time checks require mocking the system clock (otherwise it's flaky)
  test.todo("NO for a reservation that is too close to the start time");

  test("NO for reservation that requires handling", () => {
    const res = {
      ...reservation,
      begin: new Date().toISOString(),
      state: ReservationStateChoice.RequiresHandling,
      reservationUnit: [
        {
          ...reservationUnit,
          cancellationRule: {
            id: "fr8ejifod",
            name: "",
            needsHandling: false,
            canBeCancelledTimeBefore: 0,
          },
        },
      ],
    };
    expect(canUserCancelReservation(res)).toBe(false);
  });

  // TODO mock the system clock
  test("YES for a reservatuin that can be confirmed till it's start", () => {
    const res = {
      ...reservation,
      begin: new Date().toISOString(),
      state: ReservationStateChoice.Confirmed,
      reservationUnit: [
        {
          ...reservationUnit,
          cancellationRule: {
            id: "fr8ejifod",
            name: "",
            needsHandling: false,
            canBeCancelledTimeBefore: 0,
          },
        },
      ],
    };
    expect(canUserCancelReservation(res)).toBe(true);
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

describe("isReservationInThePast", () => {
  test("with valid data", () => {
    expect(
      isReservationInThePast({
        begin: new Date().toISOString(),
      })
    ).toBe(true);

    expect(
      isReservationInThePast({
        begin: addMinutes(new Date(), 10).toISOString(),
      })
    ).toBe(false);

    expect(
      isReservationInThePast({
        begin: addMinutes(new Date(), -10).toISOString(),
      })
    ).toBe(true);
  });
});

describe("getReservationCancellationReason", () => {
  const reservation2 = {
    ...reservation,
    begin: addMinutes(new Date(), 60).toISOString(),
    reservationUnit: [
      {
        ...reservationUnit,
        cancellationRule: {
          id: "fr8ejifod",
          name: "",
          canBeCancelledTimeBefore: 10,
          needsHandling: false,
        },
      },
    ],
  };

  test("with no reservation unit", () => {
    expect(
      getReservationCancellationReason({
        ...reservation2,
        reservationUnit: [],
      })
    ).toBe("NO_CANCELLATION_RULE");
  });

  test("with no cancellation rule", () => {
    const resUnit = {
      ...reservationUnit,
      cancellationRule: null,
    };

    expect(
      getReservationCancellationReason({
        ...reservation,
        reservationUnit: [resUnit],
      })
    ).toBe("NO_CANCELLATION_RULE");
  });

  test("with required handling", () => {
    const resUnit = {
      ...reservationUnit,
      cancellationRule: {
        ...reservationUnit.cancellationRule,
        name: "Cancellation rule",
        id: "fr8ejifod",
        needsHandling: true,
      },
    };
    expect(
      getReservationCancellationReason({
        ...reservation,
        reservationUnit: [resUnit],
      })
    ).toBe("REQUIRES_HANDLING");
  });

  test("with cancellation period", () => {
    const res = {
      ...reservation,
      reservationUnit: [reservation.reservationUnit[0]],
    };
    expect(getReservationCancellationReason(res)).toBe(null);
  });

  // TODO this looks sketchy unless there is something that overrides system clock
  test("can be cancelled when the reservation is outside the cancellation buffer", () => {
    const resUnit = {
      ...reservationUnit,
      cancellationRule: {
        ...reservationUnit.cancellationRule,
        canBeCancelledTimeBefore: 3600,
        needsHandling: false,
      },
    };

    expect(
      getReservationCancellationReason({
        ...reservation,
        // duplicating these to be explicit what is tested
        begin: addHours(startOfToday(), 34).toISOString(),
        reservationUnit: [resUnit],
      })
    ).toBe(null);
  });

  test("can't cancel if the reservation is too close to the start time", () => {
    const resUnit = {
      ...reservationUnit,
      cancellationRule: {
        ...reservationUnit.cancellationRule,
        name: "Cancellation rule",
        id: "fr8ejifod",
        needsHandling: false,
        canBeCancelledTimeBefore: 24 * 60 * 60, // 24 hours
      },
    };

    expect(
      getReservationCancellationReason({
        ...reservation,
        begin: addHours(new Date(), 12).toISOString(),
        reservationUnit: [resUnit],
      })
    ).toBe("BUFFER");
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

  test("return null", () => {
    expect(getNormalizedReservationOrderStatus({} as ReservationNode)).toBe(
      null
    );

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
  test("returns false with non-confirmed reservation", () => {
    const res = isReservationEditable({
      reservation: {
        ...reservation,
        state: ReservationStateChoice.Created,
        reservationUnit: [reservation.reservationUnit[0]],
      },
    });
    expect(res).toBe(false);
  });
  test("handles past reservation check", () => {
    const res = {
      ...reservation,
      reservationUnit: [reservation.reservationUnit[0]],
      begin: addHours(new Date(), -1).toISOString(),
    };
    expect(isReservationEditable({ reservation: res })).toBe(false);
  });

  test("handles situation when reservation has been handled", () => {
    const res = {
      ...reservation,
      reservationUnit: [reservation.reservationUnit[0]],
      isHandled: true,
    };
    expect(
      isReservationEditable({
        reservation: res,
      })
    ).toBe(false);
  });
});

describe("canReservationBeChanged", () => {
  /*
  test("returns false with non-confirmed reservation", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          state: ReservationStateChoice.Created,
        },
        reservationUnit,
      })
    ).toBe(false);
  });

  test("handles past reservation check", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          begin: addHours(new Date(), -1).toISOString(),
        },
        reservationUnit,
      })
    ).toBe(false);
  });

  test("handles cancellation rule check", () => {
    const reservationUnit1: ReservationUnitNode = {
      ...reservationUnit,
      cancellationRule: null,
    };
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          reservationUnit: [reservationUnit1],
        },
        reservationUnit: reservationUnit1,
      })
    ).toStrictEqual(false);

    const reservationUnit2: ReservationUnitNode = {
      ...reservationUnit,
      cancellationRule: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...reservationUnit.cancellationRule!,
        needsHandling: true,
      },
    };
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          reservationUnit: [reservationUnit2],
        },
        reservationUnit: reservationUnit2,
      })
    ).toStrictEqual(false);
  })
  test("handles cancellation rule buffer check", () => {
    const reservationUnit1: ReservationUnitNode = {
      ...reservationUnit,
      cancellationRule: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...reservationUnit.cancellationRule!,
        canBeCancelledTimeBefore: 3000,
      },
    };
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          begin: addHours(new Date(), 1).toISOString(),
          reservationUnit: [reservationUnit1],
        },
        reservationUnit: reservationUnit1,
      })
    ).toBe(true);

    const reservationUnit2: ReservationUnitNode = {
      ...reservationUnit,
      cancellationRule: {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        ...reservationUnit.cancellationRule!,
        canBeCancelledTimeBefore: 3601,
      },
    };
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          begin: addHours(new Date(), 1).toISOString(),
          reservationUnit: [reservationUnit2],
        },
        reservationUnit: reservationUnit2,
      })
    ).toBe(false);
  });
  */
  /* TODO these are working on partial data, which is not a supported use case
  test("handles cancellation rule buffer check", () => {
    // FIXME
    const reservableTimes: ReservableMap = new Map();
    const res1 = canReservationTimeBeChanged({
      reservableTimes,
      reservation: {
        ...reservation,
        begin: addHours(new Date(), 1).toISOString(),
      },
      reservationUnit: {
        ...reservationUnit,
        cancellationRule: {
          ...reservationUnit.cancellationRule,
          canBeCancelledTimeBefore: 3000,
        },
      } as IsReservableFieldsFragment,
    });
    expect(res1).toBe(true);

    const res2 = canReservationTimeBeChanged({
      reservableTimes,
      reservation: {
        ...reservation,
        begin: addHours(new Date(), 1).toISOString(),
      },
      reservationUnit: {
        ...reservationUnit,
        cancellationRule: {
          ...reservationUnit.cancellationRule,
          canBeCancelledTimeBefore: 3601,
        },
      } as IsReservableFieldsFragment,
    });
    expect(res2).toBe(false);
  });
  */

  /* TODO these are working on partial data, which is not a supported use case
  test("handles new reservation price check", () => {
    // TODO need to test the exact same thing except with price
    // without price should be true, with price should be false
    expect(
      canReservationTimeBeChanged({
        reservation,
        // FIXME
        reservableTimes: new Map(),
        newReservation: { ...reservation, price: "2.02" },
        reservationUnit,
      })
    ).toBe(false);
  });
  */

  describe("handles new reservation general validation", () => {
    const reservation_ = {
      ...reservation,
      reservationUnit: [reservation.reservationUnit[0]],
    };

    test("false without reservable times", () => {
      const reservableTimes = new Map();
      expect(
        canReservationTimeBeChanged({
          reservation: reservation_,
          reservableTimes,
          newReservation: {
            ...reservation,
            begin: addHours(startOfToday(), 10).toString(),
            end: addHours(startOfToday(), 12).toString(),
          },
          reservationUnit,
        })
      ).toBe(false);
    });

    // TODO what is incomplete data? what are we testing?
    test("with incomplete data", () => {
      // FIXME
      const reservableTimes: ReservableMap = new Map();
      expect(
        canReservationTimeBeChanged({
          reservation: reservation_,
          reservableTimes,
          newReservation: {
            ...reservation,
            begin: addHours(startOfToday(), 12).toISOString(),
          },
          reservationUnit,
          activeApplicationRounds: [],
        })
      ).toBe(false);

      expect(
        canReservationTimeBeChanged({
          reservation: reservation_,
          reservableTimes,
          newReservation: {
            ...reservation,
            begin: "",
            end: addHours(startOfToday(), 12).toISOString(),
          },
          reservationUnit,
          activeApplicationRounds: [],
        })
      ).toBe(false);
    });

    test("with reservation start buffer", () => {
      // FIXME
      const reservableTimes: ReservableMap = new Map();
      expect(
        canReservationTimeBeChanged({
          reservation: reservation_,
          reservableTimes,
          newReservation: {
            ...reservation,
            begin: addHours(startOfToday(), 10).toString(),
            end: addHours(startOfToday(), 12).toString(),
          },
          reservationUnit: {
            ...reservationUnit,
            reservationsMinDaysBefore: 10,
          },
          activeApplicationRounds: [],
        })
      ).toBe(false);
    });

    test("with reservation time missing reservation units reservation time slot", () => {
      // FIXME
      const reservableTimes: ReservableMap = new Map();
      expect(
        canReservationTimeBeChanged({
          reservation: reservation_,
          reservableTimes,
          newReservation: {
            ...reservation,
            begin: addHours(new Date(), 1).toString(),
            end: addHours(new Date(), 2).toString(),
          },
          reservationUnit: {
            ...reservationUnit,
            reservationBegins: addDays(new Date(), 1).toString(),
          },
          activeApplicationRounds: [],
        })
      ).toBe(false);

      expect(
        canReservationTimeBeChanged({
          reservation: reservation_,
          // FIXME
          reservableTimes: new Map(),
          newReservation: {
            ...reservation,
            begin: addHours(new Date(), 1).toString(),
            end: addHours(new Date(), 2).toString(),
          },
          reservationUnit: {
            ...reservationUnit,
            reservationEnds: addDays(new Date(), -1).toString(),
          },
          activeApplicationRounds: [],
        })
      ).toBe(false);
    });

    test("with conflicting application round", () => {
      // FIXME
      const reservableTimes: ReservableMap = new Map();
      expect(
        canReservationTimeBeChanged({
          reservation: reservation_,
          reservableTimes,
          newReservation: {
            ...reservation,
            begin: addHours(startOfToday(), 10).toString(),
            end: addHours(startOfToday(), 12).toString(),
          },
          reservationUnit,
          activeApplicationRounds: [
            {
              reservationPeriodBegin: addHours(startOfToday(), 1).toISOString(),
              reservationPeriodEnd: addHours(startOfToday(), 20).toISOString(),
            },
          ],
        })
      ).toBe(false);
    });

    test("valid data", () => {
      // FIXME
      const reservableTimes: ReservableMap = new Map();
      expect(
        canReservationTimeBeChanged({
          reservableTimes,
          reservation: reservation_,
          newReservation: {
            ...reservation,
            begin: addHours(startOfToday(), 35).toString(),
            end: addHours(startOfToday(), 36).toString(),
          },
          reservationUnit,
          activeApplicationRounds: [],
        })
      ).toBe(true);
    });
  });
});

describe("getCheckoutUrl", () => {
  const order: PaymentOrderNode = {
    id: "order-id",
    checkoutUrl: "https://checkout.url/path?user=1111-2222-3333-4444",
    paymentType: PaymentType.Online,
  };

  test("returns checkout url", () => {
    expect(getCheckoutUrl(order, "sv")).toBe(
      "https://checkout.url/path/paymentmethod?user=1111-2222-3333-4444&lang=sv"
    );

    expect(getCheckoutUrl(order, "fi")).toBe(
      "https://checkout.url/path/paymentmethod?user=1111-2222-3333-4444&lang=fi"
    );
  });

  test("returns undefined with falsy input", () => {
    expect(
      getCheckoutUrl({ ...order, checkoutUrl: undefined })
    ).not.toBeDefined();

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
  test("returns true for a reservation that starts in the future", () => {
    expect(
      isReservationStartInFuture({
        reservationBegins: addMinutes(new Date(), 10),
      } as unknown as ReservationUnitNode)
    ).toBe(true);
  });

  test("returns false for a reservation that starts in the past", () => {
    expect(
      isReservationStartInFuture({
        reservationBegins: addMinutes(new Date(), -10).toISOString(),
      })
    ).toBe(false);

    expect(
      isReservationStartInFuture({
        reservationBegins: new Date().toISOString(),
      })
    ).toBe(false);

    expect(isReservationStartInFuture({})).toBe(false);
  });

  test("returns correct value with buffer days", () => {
    expect(
      isReservationStartInFuture({
        reservationBegins: addDays(new Date(), 10).toISOString(),
        reservationsMaxDaysBefore: 9,
      })
    ).toBe(true);

    expect(
      isReservationStartInFuture({
        reservationBegins: addDays(new Date(), 10).toISOString(),
        reservationsMaxDaysBefore: 10,
      })
    ).toBe(false);
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
