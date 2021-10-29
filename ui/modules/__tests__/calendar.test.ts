import { addDays, format } from "date-fns";
import {
  areSlotsReservable,
  doReservationsCollide,
  isReservationLongEnough,
  isReservationShortEnough,
  isSlotWithinTimeframe,
} from "../calendar";
import { ReservationType } from "../gql-types";
import { ApplicationRound } from "../types";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

test("isReservationShortEnough", () => {
  expect(
    isReservationShortEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 12, 30, 0),
      "1:30:00"
    )
  ).toBe(true);
  expect(
    isReservationShortEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 30, 0),
      "1:30:00"
    )
  ).toBe(true);
  expect(
    isReservationShortEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 31, 0),
      "1:30:00"
    )
  ).toBe(false);
});

test("isReservationLongEnough", () => {
  expect(
    isReservationLongEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 12, 30, 0),
      "1:30:00"
    )
  ).toBe(false);
  expect(
    isReservationLongEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 30, 0),
      "1:30:00"
    )
  ).toBe(true);
  expect(
    isReservationLongEnough(
      new Date(2021, 11, 10, 12, 0, 0),
      new Date(2021, 11, 10, 13, 31, 0),
      "1:30:00"
    )
  ).toBe(true);
});

test("isSlotWithinTimeframe", () => {
  expect(isSlotWithinTimeframe(new Date(2021, 9, 9))).toBe(false);
  expect(isSlotWithinTimeframe(new Date())).toBe(false);
  expect(isSlotWithinTimeframe(new Date(), -1)).toBe(true);
});

test("areSlotsReservable", () => {
  const openingTimes = [
    {
      date: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      endTime: "21:00:00",
      periods: null,
      startTime: "09:00:00",
      state: "open",
    },
    {
      date: format(addDays(new Date(), 8), "yyyy-MM-dd"),
      endTime: "21:00:00",
      periods: null,
      startTime: "09:00:00",
      state: "open",
    },
  ];

  const activeApplicationRounds = [
    {
      reservationPeriodBegin: format(addDays(new Date(), 8), "yyyy-MM-dd"),
      reservationPeriodEnd: format(addDays(new Date(), 8), "yyyy-MM-dd"),
    },
  ] as ApplicationRound[];

  expect(areSlotsReservable([addDays(new Date(), 6)], openingTimes, [])).toBe(
    false
  );
  expect(
    areSlotsReservable([addDays(new Date().setHours(6), 7)], openingTimes, [])
  ).toBe(false);
  expect(
    areSlotsReservable([addDays(new Date().setHours(9), 7)], openingTimes, [])
  ).toBe(true);
  expect(
    areSlotsReservable([addDays(new Date().setHours(9), 8)], openingTimes, [])
  ).toBe(true);
  expect(
    areSlotsReservable(
      [addDays(new Date().setHours(9), 8)],
      openingTimes,
      activeApplicationRounds
    )
  ).toBe(false);
  expect(areSlotsReservable([addDays(new Date(), 10)], openingTimes, [])).toBe(
    false
  );
});

test("doReservationsCollide", () => {
  const reservations = [
    {
      begin: "2021-10-31T09:30:00+00:00",
      end: "2021-10-31T10:30:00+00:00",
    },
  ] as ReservationType[];

  expect(
    doReservationsCollide(reservations, {
      start: new Date("2021-10-31T09:00:00+00:00"),
      end: new Date("2021-10-31T09:30:00+00:00"),
    })
  ).toBe(false);
  expect(
    doReservationsCollide(reservations, {
      start: new Date("2021-10-31T09:00:00+00:00"),
      end: new Date("2021-10-31T09:31:00+00:00"),
    })
  ).toBe(true);
  expect(
    doReservationsCollide(reservations, {
      start: new Date("2021-10-31T10:30:00+00:00"),
      end: new Date("2021-10-31T11:30:00+00:00"),
    })
  ).toBe(false);
  expect(
    doReservationsCollide(reservations, {
      start: new Date("2021-10-31T10:30:00+00:00"),
      end: new Date("2021-10-31T11:30:00+00:00"),
    })
  ).toBe(false);
});
