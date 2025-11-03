import { addDays, nextMonday } from "date-fns";
import { describe, expect, test } from "vitest";
import { WEEKDAYS_SORTED } from "ui/src/modules/const";
import { formatDate } from "ui/src/modules/date-utils";
import { Weekday } from "@gql/gql-types";
import { generateReservations } from "./generateReservations";

function createInput({
  startingDate,
  endingDate,
  startTime = "00:00",
  endTime = "01:00",
  repeatOnDays = [Weekday.Tuesday],
  repeatPattern = "weekly" as const,
}: {
  startingDate?: Date;
  endingDate?: Date;
  startTime?: string;
  endTime?: string;
  repeatOnDays?: Weekday[];
  repeatPattern?: "weekly" | "biweekly";
}) {
  const today = new Date();
  const dtoday = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());

  const start = startingDate ?? today;
  // two weeks is 13 days since the last day is inclusive
  const end = endingDate ?? addDays(dtoday, 13);
  return {
    startingDate: formatDate(start),
    endingDate: formatDate(end),
    startTime,
    endTime,
    repeatOnDays,
    repeatPattern,
  };
}

describe("generate reservations", () => {
  test("can generate reservations with valid data", () => {
    const res = generateReservations(createInput({}));
    expect(res).toHaveLength(2);
  });

  test("two weeks twice a week", () => {
    const res = generateReservations(
      createInput({
        repeatOnDays: [Weekday.Tuesday, Weekday.Thursday],
      })
    );
    expect(res).toHaveLength(4);
  });

  test("two weeks every day a week => 15 elements", () => {
    const res = generateReservations(
      createInput({
        repeatOnDays: WEEKDAYS_SORTED,
      })
    );
    expect(res).toHaveLength(14);
  });

  // inclusive of both start and end
  test("monday to monday with only mondays => two elements", () => {
    const start = nextMonday(new Date());
    const res = generateReservations(
      createInput({
        startingDate: start,
        endingDate: addDays(start, 7),
        repeatOnDays: [Weekday.Monday],
      })
    );
    expect(res).toHaveLength(2);
  });

  test("repeat on for less than a week has inclusive range [start, end]", () => {
    const start = nextMonday(new Date());
    const res = generateReservations(
      createInput({
        startingDate: start,
        endingDate: addDays(start, 1),
        repeatOnDays: [Weekday.Monday, Weekday.Tuesday],
      })
    );
    expect(res).toHaveLength(2);
  });

  test("repeat on monday with no monday on range => empty result", () => {
    const start = nextMonday(new Date());
    const res = generateReservations(
      createInput({
        startingDate: addDays(start, 1),
        endingDate: addDays(start, 6),
        repeatOnDays: [Weekday.Monday],
      })
    );
    expect(res).toHaveLength(0);
  });

  //  - (biweekly vs. weekly)
  test("four weeks once a week weekly", () => {
    const today = new Date();
    const res = generateReservations(
      createInput({
        endingDate: addDays(today, 27),
        repeatOnDays: [Weekday.Monday],
      })
    );
    expect(res).toHaveLength(4);
  });

  test("four weeks once a week biweekly", () => {
    const today = new Date();
    const res = generateReservations(
      createInput({
        endingDate: addDays(today, 27),
        repeatOnDays: [Weekday.Monday],
        repeatPattern: "biweekly",
      })
    );
    expect(res).toHaveLength(2);
  });

  test("start date > end date => empty array", () => {
    const today = new Date();
    const res = generateReservations(
      createInput({
        startingDate: addDays(today, 28),
        endingDate: addDays(today, 20),
        repeatOnDays: [Weekday.Monday],
      })
    );
    expect(res).toHaveLength(0);
  });

  // start date === end date doesn't pass validators so it's going to be empty
  test("start date === end date => one", () => {
    const today = new Date();
    const res = generateReservations(
      createInput({
        endingDate: addDays(today, 28),
        startingDate: addDays(today, 28),
        repeatOnDays: WEEKDAYS_SORTED,
      })
    );
    expect(res).toHaveLength(1);
  });
});
