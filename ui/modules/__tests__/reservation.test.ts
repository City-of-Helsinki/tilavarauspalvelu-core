import { get as mockGet } from "lodash";
import { addDays, addHours, addMinutes, format } from "date-fns";
import {
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
  ReservationUnitByPkType,
} from "common/types/gql-types";
import {
  CanReservationBeChangedProps,
  canReservationTimeBeChanged,
  canUserCancelReservation,
  getDurationOptions,
  getNormalizedReservationOrderStatus,
  getReservationApplicationFields,
  getReservationApplicationMutationValues,
  getReservationCancellationReason,
  isReservationInThePast,
} from "../reservation";
import mockTranslations from "../../public/locales/fi/prices.json";

jest.mock("next-i18next", () => ({
  i18n: {
    t: (str: string) => {
      const path = str.replace("prices:", "");
      return mockGet(mockTranslations, path);
    },
    language: "fi",
  },
}));

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

describe("getDurationOptions", () => {
  test("works", () => {
    expect(getDurationOptions(null, 5400)).toEqual([]);
    expect(getDurationOptions(5400, null)).toEqual([]);
    expect(getDurationOptions(null, null)).toEqual([]);
    expect(getDurationOptions(1800, 5400)).toEqual([
      {
        label: "0:30",
        value: "0:30",
      },
      {
        label: "0:45",
        value: "0:45",
      },
      {
        label: "1:00",
        value: "1:00",
      },
      {
        label: "1:15",
        value: "1:15",
      },
      {
        label: "1:30",
        value: "1:30",
      },
    ]);
    expect(getDurationOptions(1800, 30600, "02:00:00")).toEqual([
      {
        label: "0:30",
        value: "0:30",
      },
      {
        label: "2:30",
        value: "2:30",
      },
      {
        label: "4:30",
        value: "4:30",
      },
      {
        label: "6:30",
        value: "6:30",
      },
      {
        label: "8:30",
        value: "8:30",
      },
    ]);
  });
});

describe("canUseCancelReservation", () => {
  test("that needs handling", () => {
    const reservation = {
      begin: new Date().toISOString(),
      reservationUnits: [
        {
          cancellationRule: {
            needsHandling: true,
          },
        },
      ],
    } as ReservationType;
    expect(canUserCancelReservation(reservation)).toBe(false);
  });

  test("that does not need handling", () => {
    const reservation = {
      begin: addMinutes(new Date(), 10).toISOString(),
      reservationUnits: [
        {
          cancellationRule: {
            needsHandling: false,
          },
        },
      ],
    } as ReservationType;
    expect(canUserCancelReservation(reservation)).toBe(true);
  });

  test("that does not need handling", () => {
    const reservation = {
      begin: new Date().toISOString(),
      reservationUnits: [
        {
          cancellationRule: {
            needsHandling: false,
          },
        },
      ],
    } as ReservationType;
    expect(canUserCancelReservation(reservation)).toBe(true);
  });

  test("with 0 secs of buffer time", () => {
    const reservation = {
      begin: new Date().toISOString(),
      reservationUnits: [
        {
          cancellationRule: {
            needsHandling: false,
            canBeCancelledTimeBefore: 0,
          },
        },
      ],
    } as ReservationType;
    expect(canUserCancelReservation(reservation)).toBe(true);
  });

  test("with 1 sec of buffer time", () => {
    const reservation = {
      begin: new Date().toISOString(),
      reservationUnits: [
        {
          cancellationRule: {
            needsHandling: false,
            canBeCancelledTimeBefore: 1,
          },
        },
      ],
    } as ReservationType;
    expect(canUserCancelReservation(reservation)).toBe(false);
  });

  test("without cancellation rule", () => {
    const reservation = {
      begin: new Date().toISOString(),
      reservationUnits: [{}],
    } as ReservationType;
    expect(canUserCancelReservation(reservation)).toBe(false);
  });
});

describe("getReservationApplicationFields", () => {
  test("with emrty input", () => {
    expect(
      getReservationApplicationFields(
        [],
        ReservationsReservationReserveeTypeChoices.Individual
      )
    ).toEqual([]);
  });

  const fields = ["reservee_id", "reservee_organisation_name", "name"];

  test("with individual input", () => {
    expect(
      getReservationApplicationFields(
        fields,
        ReservationsReservationReserveeTypeChoices.Individual
      )
    ).toEqual([]);
  });

  test("with common input", () => {
    expect(getReservationApplicationFields(fields, "common")).toEqual(["name"]);
  });

  test("with business input", () => {
    expect(
      getReservationApplicationFields(
        fields,
        ReservationsReservationReserveeTypeChoices.Business
      )
    ).toEqual(["reservee_organisation_name", "reservee_id"]);
  });

  test("with nonprofit input, camelCased", () => {
    expect(
      getReservationApplicationFields(
        fields,
        ReservationsReservationReserveeTypeChoices.Nonprofit,
        true
      )
    ).toEqual(["reserveeOrganisationName", "reserveeId"]);
  });
});

describe("getReservationApplcationMutationValues", () => {
  test("with empty input", () => {
    expect(
      getReservationApplicationMutationValues(
        {},
        [],
        ReservationsReservationReserveeTypeChoices.Individual
      )
    ).toEqual({
      reserveeType: ReservationsReservationReserveeTypeChoices.Individual,
    });
  });

  test("with sane input", () => {
    const payload = {
      name: "Nimi",
      reserveeId: "123456-7",
      reserveeFirstName: "Etunimi",
    };
    expect(
      getReservationApplicationMutationValues(
        payload,
        ["name", "reservee_id", "reservee_first_name"],
        ReservationsReservationReserveeTypeChoices.Individual
      )
    ).toEqual({
      name: "Nimi",
      reserveeFirstName: "Etunimi",
      reserveeType: ReservationsReservationReserveeTypeChoices.Individual,
    });
  });
});

describe("isReservationInThePast", () => {
  test("with valid data", () => {
    expect(
      isReservationInThePast({
        begin: new Date(),
      } as ReservationType)
    ).toBe(true);

    expect(
      isReservationInThePast({
        begin: addMinutes(new Date(), 10),
      } as ReservationType)
    ).toBe(false);

    expect(
      isReservationInThePast({
        begin: addMinutes(new Date(), -10),
      } as ReservationType)
    ).toBe(true);
  });

  test("with invalid data", () => {
    expect(isReservationInThePast({} as ReservationType)).toBe(null);
  });
});

describe("getReservationCancellationReason", () => {
  const reservation = {
    begin: addMinutes(new Date(), 60).toISOString(),
    reservationUnits: [
      {
        cancellationRule: {
          id: "fr8ejifod",
          canBeCancelledTimeBefore: 10,
          needsHandling: false,
        },
      },
    ],
  };

  test("with no reservation unit", () => {
    expect(
      getReservationCancellationReason({
        ...reservation,
        reservationUnits: [],
      } as ReservationType)
    ).toBe(null);
  });

  test("with no cancellation rule", () => {
    const reservationUnit = {
      ...reservation.reservationUnits[0],
      cancellationRule: null,
    };

    expect(
      getReservationCancellationReason({
        ...reservation,
        reservationUnits: [reservationUnit],
      } as ReservationType)
    ).toBe("NO_CANCELLATION_RULE");
  });

  test("with required handling", () => {
    const reservationUnit = {
      ...reservation.reservationUnits[0],
    };
    reservationUnit.cancellationRule = {
      ...reservationUnit.cancellationRule,
      needsHandling: true,
    };

    expect(
      getReservationCancellationReason({
        ...reservation,
        reservationUnits: [reservationUnit],
      } as ReservationType)
    ).toBe("REQUIRES_HANDLING");
  });

  test("with cancellation period", () => {
    expect(
      getReservationCancellationReason({
        ...reservation,
      } as ReservationType)
    ).toBe(null);
  });

  test("with cancellation period and long enough buffer", () => {
    const reservationUnit = {
      ...reservation.reservationUnits[0],
    };
    reservationUnit.cancellationRule = {
      ...reservationUnit.cancellationRule,
      canBeCancelledTimeBefore: 3500,
    };

    expect(
      getReservationCancellationReason({
        ...reservation,
        reservationUnits: [reservationUnit],
      } as ReservationType)
    ).toBe(null);
  });

  test("with cancellation period and too short buffer", () => {
    const reservationUnit = {
      ...reservation.reservationUnits[0],
    };
    reservationUnit.cancellationRule = {
      ...reservationUnit.cancellationRule,
      canBeCancelledTimeBefore: 3600,
    };

    expect(
      getReservationCancellationReason({
        ...reservation,
        reservationUnits: [reservationUnit],
      } as ReservationType)
    ).toBe("BUFFER");
  });
});

describe("getNormalizedReservationOrderStatus", () => {
  test("return correct value", () => {
    expect(
      getNormalizedReservationOrderStatus({
        orderStatus: "DRAFT",
      } as ReservationType)
    ).toBe("DRAFT");

    expect(
      getNormalizedReservationOrderStatus({
        orderStatus: "PAID",
      } as ReservationType)
    ).toBe("PAID");

    expect(
      getNormalizedReservationOrderStatus({
        orderStatus: "PAID_MANUALLY",
      } as ReservationType)
    ).toBe("PAID_MANUALLY");

    expect(
      getNormalizedReservationOrderStatus({
        orderStatus: "SOMETHING_ELSE",
      } as ReservationType)
    ).toBe(null);

    expect(getNormalizedReservationOrderStatus({} as ReservationType)).toBe(
      null
    );
  });
});

describe("canReservationBeChanged", () => {
  const reservation = {
    id: "123f4w90",
    state: "CONFIRMED",
    price: 0,
    begin: addHours(new Date(), 1).toISOString(),
    reservationUnits: [
      {
        cancellationRule: {
          needsHandling: false,
        },
      },
    ],
  };

  const reservationUnit = {
    reservationBegins: addDays(new Date(), -1).toISOString(),
    reservationEnds: addDays(new Date(), 100).toISOString(),
    openingHours: {
      openingTimes: Array.from(Array(100)).map((val, index) => ({
        date: format(addDays(new Date(), index), "yyyy-MM-dd"),
        startTime: "07:00:00+00:00",
        endTime: "20:00:00+00:00",
        state: "open",
        periods: null,
      })),
    },
    reservations: [],
  } as ReservationUnitByPkType;

  test("returns false with incomplete data", () => {
    expect(
      canReservationTimeBeChanged({} as CanReservationBeChangedProps)
    ).toStrictEqual([false]);
  });

  test("returns true with default data", () => {
    expect(
      canReservationTimeBeChanged({
        reservation,
      } as CanReservationBeChangedProps)
    ).toStrictEqual([true]);
  });

  test("returns false with non-confirmed reservation", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: { ...reservation, state: "CREATED" },
      } as CanReservationBeChangedProps)
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

  test("handles price check", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: { ...reservation, price: 1.01 },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([false, "CANCELLATION_NOT_ALLOWED"]);
  });

  test("handles cancellation rule check", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          reservationUnits: [
            {
              ...reservation.reservationUnits[0],
              cancellationRule: null,
            },
          ],
        },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([false, "CANCELLATION_NOT_ALLOWED"]);

    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          reservationUnits: [
            {
              ...reservation.reservationUnits[0],
              cancellationRule: {
                needsHandling: true,
              },
            },
          ],
        },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([false, "CANCELLATION_NOT_ALLOWED"]);
  });

  test("handles cancellation rule buffer check", () => {
    expect(
      canReservationTimeBeChanged({
        reservation: {
          ...reservation,
          reservationUnits: [
            {
              ...reservation.reservationUnits[0],
              cancellationRule: {
                ...reservation.reservationUnits[0].cancellationRule,
                canBeCancelledTimeBefore: 3599,
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
          reservationUnits: [
            {
              ...reservation.reservationUnits[0],
              cancellationRule: {
                ...reservation.reservationUnits[0].cancellationRule,
                canBeCancelledTimeBefore: 3600,
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
        reservation: { ...reservation, handledAt: new Date().toISOString() },
      } as CanReservationBeChangedProps)
    ).toStrictEqual([false, "RESERVATION_MODIFICATION_NOT_ALLOWED"]);
  });

  test("handles new reservation price check", () => {
    expect(
      canReservationTimeBeChanged({
        reservation,
        newReservation: { ...reservation, price: 2.02 },
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
            begin: addHours(new Date(), 2).toISOString(),
          },
          reservationUnit,
          activeApplicationRounds: [],
        } as CanReservationBeChangedProps)
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);

      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: undefined,
            end: addHours(new Date(), 2).toISOString(),
          },
          reservationUnit,
          activeApplicationRounds: [],
        } as CanReservationBeChangedProps)
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);

      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: addHours(new Date(), 1),
            end: addHours(new Date(), 2),
          },
          reservationUnit: { ...reservationUnit, openingHours: null },
          activeApplicationRounds: [],
        } as CanReservationBeChangedProps)
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);
    });

    test("with reservation start buffer", () => {
      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: addHours(new Date(), 1),
            end: addHours(new Date(), 2),
          },
          reservationUnit: {
            ...reservationUnit,
            reservationsMinDaysBefore: 10,
          },
          activeApplicationRounds: [],
        } as CanReservationBeChangedProps)
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);
    });

    test("with reservation time missing reservation units reservation time slot", () => {
      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: addHours(new Date(), 1),
            end: addHours(new Date(), 2),
          },
          reservationUnit: {
            ...reservationUnit,
            reservationBegins: addDays(new Date(), 1),
          },
          activeApplicationRounds: [],
        } as CanReservationBeChangedProps)
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);

      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: addHours(new Date(), 1),
            end: addHours(new Date(), 2),
          },
          reservationUnit: {
            ...reservationUnit,
            reservationEnds: addDays(new Date(), -1),
          },
          activeApplicationRounds: [],
        } as CanReservationBeChangedProps)
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);
    });

    test("with conflicting application round", () => {
      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: addHours(new Date(), 5),
            end: addHours(new Date(), 6),
          },
          reservationUnit,
          activeApplicationRounds: [
            {
              reservationPeriodBegin: addHours(new Date(), 1).toISOString(),
              reservationPeriodEnd: addHours(new Date(), 2).toISOString(),
            },
          ],
        } as CanReservationBeChangedProps)
      ).toStrictEqual([false, "RESERVATION_TIME_INVALID"]);
    });

    test("valid data", () => {
      expect(
        canReservationTimeBeChanged({
          reservation,
          newReservation: {
            ...reservation,
            begin: addHours(new Date(), 5),
            end: addHours(new Date(), 6),
          },
          reservationUnit,
        } as CanReservationBeChangedProps)
      ).toStrictEqual([true]);
    });
  });
});
