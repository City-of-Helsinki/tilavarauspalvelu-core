import { ReservationType } from "../gql-types";
import { canUserCancelReservation, getDurationOptions } from "../reservation";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

test("getDurationOptions", () => {
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

test("canUseCancelReservation that needs handling", () => {
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

test("canUseCancelReservation that does not need handling", () => {
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

test("canUseCancelReservation that does not need handling", () => {
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

test("canUseCancelReservation with 0 secs of buffer time", () => {
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

test("canUseCancelReservation with 1 sec of buffer time", () => {
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

test("canUseCancelReservation without cancellation rule", () => {
  const reservation = {
    begin: new Date().toISOString(),
    reservationUnits: [{}],
  } as ReservationType;
  expect(canUserCancelReservation(reservation)).toBe(false);
});
