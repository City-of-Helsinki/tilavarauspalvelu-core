import { get as mockGet } from "lodash";
import { addDays, addHours, addMinutes, startOfToday } from "date-fns";
import {
  type PaymentOrderNode,
  State,
  type ReservationNode,
  ReservationStartInterval,
  Authentication,
  ReservationKind,
  type ReservationUnitCancellationRuleNode,
  type ReservationUnitNode,
  CustomerTypeChoice,
  type ReservationMetadataFieldNode,
  OrderStatus,
  PaymentType,
} from "@gql/gql-types";
import {
  CanReservationBeChangedProps,
  canReservationTimeBeChanged,
  canUserCancelReservation,
  getCheckoutUrl,
  getDurationOptions,
  getNormalizedReservationOrderStatus,
  getReservationApplicationMutationValues,
  getReservationCancellationReason,
  isReservationInThePast,
} from "../reservation";
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

describe("getDurationOptions", () => {
  test("empty inputs", () => {
    const mockT = ((x: string) => x) as TFunction;
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
    const mockT = ((x: string) => x) as TFunction;
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
    const mockT = ((x: string) => x) as TFunction;
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

const reservation: ReservationNode = {
  id: "123f4w90",
  state: State.Confirmed,
  price: "0",
  bufferTimeBefore: 0,
  bufferTimeAfter: 0,
  begin: addHours(startOfToday(), 34).toISOString(),
  end: addHours(startOfToday(), 35).toISOString(),
  reservationUnit: [reservationUnit],
  handlingDetails: "",
};

describe("canUserCancelReservation", () => {
  test("that needs handling", () => {
    const res: ReservationNode = {
      ...reservation,
      begin: new Date().toISOString(),
      end: addHours(new Date(), 1).toISOString(),
      id: "123",
      reservationUnit: [
        {
          ...reservationUnit,
          cancellationRule: {
            needsHandling: true,
          } as ReservationUnitCancellationRuleNode,
        } as ReservationUnitNode,
      ],
    };
    expect(canUserCancelReservation(res)).toBe(false);
  });

  test("that does not need handling", () => {
    const res: ReservationNode = {
      ...reservation,
      begin: addMinutes(new Date(), 10).toISOString(),
      state: State.Confirmed,
      reservationUnit: [
        {
          ...reservationUnit,
          cancellationRule: {
            needsHandling: false,
          } as ReservationUnitCancellationRuleNode,
        } as ReservationUnitNode,
      ],
    };
    expect(canUserCancelReservation(res)).toBe(true);
  });

  test("that does not need handling", () => {
    const reservation_ = {
      begin: new Date().toISOString(),
      state: State.Confirmed,
      reservationUnit: [
        {
          cancellationRule: {
            needsHandling: false,
          },
        },
      ],
    } as ReservationNode;
    expect(canUserCancelReservation(reservation_)).toBe(true);
  });

  test("with non-confirmed state", () => {
    const reservation_ = {
      begin: new Date().toISOString(),
      state: State.RequiresHandling,
      reservationUnit: [
        {
          cancellationRule: {
            needsHandling: false,
          },
        },
      ],
    } as ReservationNode;
    expect(canUserCancelReservation(reservation_)).toBe(false);
  });

  test("with 0 secs of buffer time", () => {
    const reservation_ = {
      begin: new Date().toISOString(),
      state: State.Confirmed,
      reservationUnit: [
        {
          cancellationRule: {
            needsHandling: false,
            canBeCancelledTimeBefore: 0,
          },
        },
      ],
    } as ReservationNode;
    expect(canUserCancelReservation(reservation_)).toBe(true);
  });

  test("with 1 sec of buffer time", () => {
    const reservation_ = {
      begin: new Date().toISOString(),
      reservationUnit: [
        {
          cancellationRule: {
            needsHandling: false,
            canBeCancelledTimeBefore: 1,
          },
        },
      ],
    } as ReservationNode;
    expect(canUserCancelReservation(reservation_)).toBe(false);
  });

  test("without cancellation rule", () => {
    const reservation_ = {
      begin: new Date().toISOString(),
      reservationUnit: [{}],
    } as ReservationNode;
    expect(canUserCancelReservation(reservation_)).toBe(false);
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
        begin: new Date(),
      } as unknown as ReservationNode)
    ).toBe(true);

    expect(
      isReservationInThePast({
        begin: addMinutes(new Date(), 10),
      } as unknown as ReservationNode)
    ).toBe(false);

    expect(
      isReservationInThePast({
        begin: addMinutes(new Date(), -10),
      } as unknown as ReservationNode)
    ).toBe(true);
  });

  test("with invalid data", () => {
    expect(isReservationInThePast({} as ReservationNode)).toBe(false);
  });
});

describe("getReservationCancellationReason", () => {
  const reservation2: ReservationNode = {
    ...reservation,
    begin: addMinutes(new Date(), 60).toISOString(),
    reservationUnit: [
      {
        ...reservationUnit,
        cancellationRule: {
          id: "fr8ejifod",
          canBeCancelledTimeBefore: 10,
          needsHandling: false,
        } as ReservationUnitCancellationRuleNode,
      } as ReservationUnitNode,
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
    const resUnit: ReservationUnitNode = {
      ...reservationUnit,
      cancellationRule: null,
    } as ReservationUnitNode;

    expect(
      getReservationCancellationReason({
        ...reservation,
        reservationUnit: [resUnit],
      })
    ).toBe("NO_CANCELLATION_RULE");
  });

  test("with required handling", () => {
    const resUnit: ReservationUnitNode = {
      ...reservationUnit,
      cancellationRule: {
        ...reservationUnit.cancellationRule,
        needsHandling: true,
      } as ReservationUnitCancellationRuleNode,
    } as ReservationUnitNode;
    expect(
      getReservationCancellationReason({
        ...reservation,
        reservationUnit: [resUnit],
      })
    ).toBe("REQUIRES_HANDLING");
  });

  test("with cancellation period", () => {
    expect(
      getReservationCancellationReason({
        ...reservation,
      } as ReservationNode)
    ).toBe(null);
  });

  // TODO this looks sketchy unless there is something that overrides system clock
  test("can be cancelled when the reservation is outside the cancellation buffer", () => {
    const resUnit = {
      ...reservationUnit,
      cancellationRule: {
        ...reservationUnit.cancellationRule,
        canBeCancelledTimeBefore: 3600,
      } as ReservationUnitCancellationRuleNode,
    } as ReservationUnitNode;

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
    const resUnit: ReservationUnitNode = {
      ...reservationUnit,
      cancellationRule: {
        ...reservationUnit.cancellationRule,
        canBeCancelledTimeBefore: 24 * 60 * 60, // 24 hours
      } as ReservationUnitCancellationRuleNode,
    } as ReservationUnitNode;

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
  test("return correct value", () => {
    expect(
      getNormalizedReservationOrderStatus({
        state: "CANCELLED",
        order: {
          status: OrderStatus.Draft,
        } as PaymentOrderNode,
      } as ReservationNode)
    ).toBe("DRAFT");

    expect(
      getNormalizedReservationOrderStatus({
        state: "CANCELLED",
        order: {
          status: OrderStatus.Paid,
        } as PaymentOrderNode,
      } as ReservationNode)
    ).toBe("PAID");

    expect(
      getNormalizedReservationOrderStatus({
        state: "CONFIRMED",
        order: {
          status: OrderStatus.PaidManually,
        } as PaymentOrderNode,
      } as ReservationNode)
    ).toBe("PAID_MANUALLY");
  });

  test("return null", () => {
    expect(getNormalizedReservationOrderStatus({} as ReservationNode)).toBe(
      null
    );

    expect(
      getNormalizedReservationOrderStatus({
        state: "CREATED",
        order: {
          status: "DRAFT",
        } as PaymentOrderNode,
      } as ReservationNode)
    ).toBe(null);

    expect(
      getNormalizedReservationOrderStatus({
        state: "WAITING_FOR_PAYMENT",
        order: {
          status: "DRAFT",
        } as PaymentOrderNode,
      } as ReservationNode)
    ).toBe(null);

    expect(
      getNormalizedReservationOrderStatus({
        state: "REQUIRES_HANDLING",
        order: {
          status: "DRAFT",
        } as PaymentOrderNode,
      } as ReservationNode)
    ).toBe(null);
  });
});

describe("canReservationBeChanged", () => {
  test("returns false with incomplete data", () => {
    expect(canReservationTimeBeChanged({})).toStrictEqual([false]);
  });

  test("returns true with default data", () => {
    expect(canReservationTimeBeChanged({ reservation })).toStrictEqual([true]);
  });

  test("returns false with non-confirmed reservation", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          state: State.Created,
        },
      })
    ).toStrictEqual([false, "RESERVATION_MODIFICATION_NOT_ALLOWED"]);
  });

  test("handles past reservation check", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          begin: addHours(new Date(), -1).toISOString(),
        },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([false, "RESERVATION_BEGIN_IN_PAST"]);
  });

  test("handles cancellation rule check", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          reservationUnit: [
            {
              ...reservationUnit,
              cancellationRule: null,
            },
          ],
        },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([false, "RESERVATION_MODIFICATION_NOT_ALLOWED"]);

    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          reservationUnit: [
            {
              ...reservationUnit,
              cancellationRule: {
                needsHandling: true,
              },
            },
          ],
        },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([false, "RESERVATION_MODIFICATION_NOT_ALLOWED"]);
  });

  test("handles cancellation rule buffer check", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          begin: addHours(new Date(), 1).toISOString(),
          reservationUnit: [
            {
              ...reservationUnit,
              cancellationRule: {
                ...reservationUnit.cancellationRule,
                canBeCancelledTimeBefore: 3000,
              },
            },
          ],
        },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([true]);

    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          begin: addHours(new Date(), 1).toISOString(),
          reservationUnit: [
            {
              ...reservationUnit,
              cancellationRule: {
                ...reservationUnit.cancellationRule,
                canBeCancelledTimeBefore: 3601,
              },
            },
          ],
        },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([false, "CANCELLATION_TIME_PAST"]);
  });

  test("handles situation when reservation has been handled", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: { ...reservation, isHandled: true },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([false, "RESERVATION_MODIFICATION_NOT_ALLOWED"]);
  });

  test("handles new reservation price check", () => {
    expect(
      canReservationTimeBeChanged({
        reservation,
        newReservation: { ...reservation, price: "2.02" },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([false, "RESERVATION_MODIFICATION_NOT_ALLOWED"]);
  });

  describe("handles new reservation general validation", () => {
    test("with incomplete data", () => {
      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: addHours(startOfToday(), 12).toISOString(),
          },
          reservationUnit,
          activeApplicationRounds: [],
        })
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);

      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: "",
            end: addHours(startOfToday(), 12).toISOString(),
          },
          reservationUnit,
          activeApplicationRounds: [],
        })
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);

      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: addHours(startOfToday(), 10).toString(),
            end: addHours(startOfToday(), 12).toString(),
          },
          reservationUnit: {
            ...reservationUnit,
            reservableTimeSpans: [],
          },
          activeApplicationRounds: [],
        })
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);
    });

    test("with reservation start buffer", () => {
      expect(
        canReservationTimeBeChanged({
          reservation,
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
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);
    });

    test("with reservation time missing reservation units reservation time slot", () => {
      expect(
        canReservationTimeBeChanged({
          reservation,
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
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);

      expect(
        canReservationTimeBeChanged({
          reservation,
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
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);
    });

    test("with conflicting application round", () => {
      expect(
        canReservationTimeBeChanged({
          reservation,
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
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);
    });

    test("valid data", () => {
      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: addHours(startOfToday(), 35).toString(),
            end: addHours(startOfToday(), 36).toString(),
          },
          reservationUnit,
          activeApplicationRounds: [],
        })
      ).toStrictEqual([true]);
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
