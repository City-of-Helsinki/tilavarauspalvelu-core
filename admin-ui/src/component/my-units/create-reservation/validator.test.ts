import { ReservationUnitsReservationUnitReservationStartIntervalChoices } from "common/types/gql-types";
import { addDays, addHours, format, setMinutes, subDays } from "date-fns";
// eslint-disable-next-line import/no-extraneous-dependencies
import { expect, test, describe } from "@jest/globals";
import { formatDate } from "../../../common/util";
import { ReservationFormSchema } from "./validator";

const TIME_FORMAT = "HH:mm";

describe("with schema", () => {
  const futureEndTime = format(addHours(new Date(), 3), "HH:00");
  const tomorrow = addDays(new Date(), 1);

  test(`date ${tomorrow} is valid`, () => {
    const futureStartTime = format(
      setMinutes(addHours(new Date(), 1), 0),
      TIME_FORMAT
    );

    const reservation = {
      type: "BLOCKED",
      date: tomorrow,
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = ReservationFormSchema(
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins
    ).safeParse(reservation);
    expect(res.success).toBeTruthy();
  });

  const yesterday = formatDate(
    subDays(new Date(), 1).toISOString(),
    "d.M.yyyy"
  );

  test(`yesterdays date ${yesterday} is not valid`, () => {
    const futureStartTime = format(addHours(new Date(), 1), TIME_FORMAT);

    const reservation = {
      type: "BLOCKED",
      date: yesterday,
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = ReservationFormSchema(
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins
    ).safeParse(reservation);
    expect(res.success).toBeFalsy();
    if (!res.success) {
      expect(
        res.error.issues.filter((x) => x.path.includes("date"))
      ).toHaveLength(1);
      // TODO check error message
    }
  });

  test(`date ${tomorrow},  with correct interval is valid`, () => {
    const futureStartTime = format(
      setMinutes(addHours(new Date(), 2), 30),
      TIME_FORMAT
    );

    const reservation = {
      type: "BLOCKED",
      date: tomorrow,
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = ReservationFormSchema(
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_30Mins
    ).safeParse(reservation);
    expect(res.success).toBeTruthy();
  });

  test(`date ${tomorrow} with incorrect interval is invalid`, () => {
    const futureStartTime = format(
      setMinutes(addHours(new Date(), 2), 3),
      TIME_FORMAT
    );

    const reservation = {
      type: "BLOCKED",
      date: tomorrow,
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = ReservationFormSchema(
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_30Mins
    ).safeParse(reservation);
    expect(res.success).toBeFalsy();
    if (!res.success) {
      expect(
        res.error.issues.filter((x) => x.path.includes("startTime"))
      ).toHaveLength(1);
      // TODO check error message
    }
  });
});

test.todo("validate date < today => error");
test.todo("end time < start time => error");
test.todo("end time | start time not a time => error");
