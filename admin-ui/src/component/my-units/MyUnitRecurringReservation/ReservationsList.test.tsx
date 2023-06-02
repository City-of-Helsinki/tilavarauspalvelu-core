import React from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { addDays, nextMonday } from "date-fns";
import { ReservationUnitsReservationUnitReservationStartIntervalChoices } from "common/types/gql-types";
import { toUIDate } from "common/src/common/util";
import { generateReservations } from "./generateReservations";
import ReservationList from "../../ReservationsList";

const today = new Date();
const dtoday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
const twoWeeksOnceAWeek = {
  startingDate: today,
  // two weeks is 13 days since the last day is inclusive
  endingDate: addDays(dtoday, 13),
  startTime: "00:00",
  endTime: "01:00",
  repeatOnDays: [1],
  repeatPattern: {
    label: "",
    value: "weekly" as const, // | "biweekly";
  },
};

const interval15mins =
  ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins;
describe("generate reservations", () => {
  test("can generate reservations with valid data", () => {
    const res = generateReservations(twoWeeksOnceAWeek, interval15mins);
    expect(res.reservations).toHaveLength(2);
  });

  test("two weeks twice a week", () => {
    const res = generateReservations(
      {
        ...twoWeeksOnceAWeek,
        repeatOnDays: [1, 3],
      },
      interval15mins
    );
    expect(res.reservations).toHaveLength(4);
  });

  test("two weeks every day a week => 15 elements", () => {
    const res = generateReservations(
      {
        ...twoWeeksOnceAWeek,
        repeatOnDays: [0, 1, 2, 3, 4, 5, 6],
      },
      interval15mins
    );
    expect(res.reservations).toHaveLength(14);
  });

  // inclusive of both start and end
  test("monday to monday with only mondays => two elements", () => {
    const start = nextMonday(new Date());
    const res = generateReservations(
      {
        ...twoWeeksOnceAWeek,
        startingDate: start,
        endingDate: addDays(start, 7),
        repeatOnDays: [0],
      },
      interval15mins
    );
    expect(res.reservations).toHaveLength(2);
  });

  test("repeat on for less than a week has inclusive range [start, end]", () => {
    const start = nextMonday(new Date());
    const res = generateReservations(
      {
        ...twoWeeksOnceAWeek,
        startingDate: start,
        endingDate: addDays(start, 1),
        repeatOnDays: [0, 1],
      },
      interval15mins
    );
    expect(res.reservations).toHaveLength(2);
  });

  test("repeat on moday with no monday on range => empty result", () => {
    const start = nextMonday(new Date());
    const res = generateReservations(
      {
        ...twoWeeksOnceAWeek,
        startingDate: addDays(start, 1),
        endingDate: addDays(start, 6),
        repeatOnDays: [0],
      },
      interval15mins
    );
    expect(res.reservations).toHaveLength(0);
  });

  //  - (biweekly vs. weekly)
  test("four weeks once a week weekly", () => {
    const res = generateReservations(
      {
        ...twoWeeksOnceAWeek,
        endingDate: addDays(dtoday, 27),
        repeatOnDays: [0],
      },
      interval15mins
    );
    expect(res.reservations).toHaveLength(4);
  });

  test("four weeks once a week biweekly", () => {
    const res = generateReservations(
      {
        ...twoWeeksOnceAWeek,
        endingDate: addDays(dtoday, 27),
        repeatOnDays: [0],
        repeatPattern: {
          label: "",
          value: "biweekly",
        },
      },
      interval15mins
    );
    expect(res.reservations).toHaveLength(2);
  });

  test("start date > end date => empty array", () => {
    const res = generateReservations(
      {
        ...twoWeeksOnceAWeek,
        startingDate: addDays(dtoday, 28),
        endingDate: addDays(dtoday, 20),
        repeatOnDays: [0],
      },
      interval15mins
    );
    expect(res.reservations).toHaveLength(0);
  });

  // start date === end date doesn't pass validators so it's gonna be empty
  test("start date === end date => empty", () => {
    const res = generateReservations(
      {
        ...twoWeeksOnceAWeek,
        endingDate: addDays(dtoday, 28),
        startingDate: addDays(dtoday, 28),
        repeatOnDays: [0, 1, 2, 3, 4, 5, 6],
      },
      interval15mins
    );
    expect(res.reservations).toHaveLength(0);
  });
});

describe("ReservationsList", () => {
  test("Render reservations list", async () => {
    const items = [
      {
        date: new Date(),
        startTime: "19:00",
        endTime: "20:00",
      },
    ];

    const screen = render(<ReservationList items={items} />);

    const dstring = `${toUIDate(today)}`;
    expect(await screen.findByText(/19:00/)).toBeInTheDocument();
    expect(await screen.findByText(/20:00/)).toBeInTheDocument();
    expect(await screen.findByText(RegExp(dstring))).toBeInTheDocument();
  });

  test("Render reservations list", async () => {
    const N_DAYS = 5;
    const items = Array.from(Array(N_DAYS)).map((_, i) => ({
      date: addDays(new Date(), i),
      startTime: "19:00",
      endTime: "20:00",
    }));

    const screen = render(<ReservationList items={items} />);

    const dstring = `${toUIDate(today)}`;
    expect(await screen.findAllByText(/19:00/)).toHaveLength(N_DAYS);
    expect(await screen.findAllByText(/20:00/)).toHaveLength(N_DAYS);
    expect(await screen.findByText(RegExp(dstring))).toBeInTheDocument();
  });
});
