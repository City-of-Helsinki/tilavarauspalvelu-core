import { get as mockGet } from "lodash";
import { ReservationType } from "../gql-types";
import {
  canUserCancelReservation,
  getDurationOptions,
  getReservationApplicationFields,
  getReservationApplicationMutatationValues,
  getReservationPrice,
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
    expect(getDurationOptions("0:30:00", "01:30:00")).toEqual([]);
    expect(getDurationOptions("00:30:00", "1:30:00")).toEqual([]);
    expect(getDurationOptions("00:30:00", "01:30:00")).toEqual([
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
    expect(getDurationOptions("00:30:00", "08:30:00", "02:00:00")).toEqual([
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

describe("getReservationPrice", () => {
  test("with no price", () => {
    expect(getReservationPrice(0)).toBe("Maksuton");
  });

  test("with a price", () => {
    expect(getReservationPrice(10)).toBe("10 €"); // contains non-breaking space
  });

  test("with a price and a decimal", () => {
    expect(getReservationPrice(10.2)).toBe("10,2 €"); // contains non-breaking space
  });

  test("with a price and a decimal and a forced leading one", () => {
    expect(getReservationPrice(10.2, true)).toBe("10,20 €"); // contains non-breaking space
  });

  test("with a price and decimals", () => {
    expect(getReservationPrice(10.23)).toBe("10,23 €"); // contains non-breaking space
  });

  test("with a price and forced decimals", () => {
    expect(getReservationPrice(10, true)).toBe("10,00 €"); // contains non-breaking space
  });
});

describe("getReservationApplicationFields", () => {
  test("with emrty input", () => {
    expect(getReservationApplicationFields([], "individual")).toEqual([]);
  });

  const fields = ["reservee_id", "reservee_organisation_name", "name"];

  test("with individual input", () => {
    expect(getReservationApplicationFields(fields, "individual")).toEqual([
      "name",
    ]);
  });

  test("with business input", () => {
    expect(getReservationApplicationFields(fields, "business")).toEqual([
      "name",
      "reservee_organisation_name",
      "reservee_id",
    ]);
  });

  test("with nonprofit input, camelCased", () => {
    expect(getReservationApplicationFields(fields, "nonprofit", true)).toEqual([
      "name",
      "reserveeOrganisationName",
      "reserveeId",
    ]);
  });
});

describe("getReservationApplcationMutationValues", () => {
  test("with empty input", () => {
    expect(
      getReservationApplicationMutatationValues({}, [], "individual")
    ).toEqual({
      reserveeType: "individual",
    });
  });

  test("with sane input", () => {
    const payload = {
      name: "Nimi",
      reserveeId: "123456-7",
      reserveeFirstName: "Etunimi",
    };
    expect(
      getReservationApplicationMutatationValues(
        payload,
        ["name", "reservee_id", "reservee_first_name"],
        "individual"
      )
    ).toEqual({
      name: "Nimi",
      reserveeFirstName: "Etunimi",
      reserveeType: "individual",
    });
  });
});
