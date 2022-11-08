import { get as mockGet } from "lodash";
import { addMinutes } from "date-fns";
import {
  ReservationsReservationReserveeTypeChoices,
  ReservationType,
} from "../gql-types";
import {
  canUserCancelReservation,
  getDurationOptions,
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
