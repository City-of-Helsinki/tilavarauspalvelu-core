import { ReservationStartInterval } from "@gql/gql-types";
import { addDays, addHours, format, setMinutes, subDays } from "date-fns";
import { ReservationFormSchema } from "./reservation";

const TIME_FORMAT = "HH:mm";
const DATE_FORMAT = "dd.MM.yyyy";

describe("with schema", () => {
  const futureEndTime = format(addHours(new Date(), 3), "HH:00");
  const tomorrow = addDays(new Date(), 1);

  // FIXME broken
  test.skip(`date ${tomorrow} is valid`, () => {
    const futureStartTime = format(
      setMinutes(addHours(new Date(), 1), 0),
      TIME_FORMAT
    );

    const reservation = {
      type: "BLOCKED",
      date: format(tomorrow, DATE_FORMAT),
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = ReservationFormSchema(
      ReservationStartInterval.Interval_15Mins
    ).safeParse(reservation);
    expect(res.success).toBeTruthy();
  });

  const yesterday = subDays(new Date(), 1);

  test(`yesterdays date ${yesterday} is not valid`, () => {
    const futureStartTime = format(addHours(new Date(), 1), TIME_FORMAT);

    const reservation = {
      type: "BLOCKED",
      date: format(yesterday, DATE_FORMAT),
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = ReservationFormSchema(
      ReservationStartInterval.Interval_15Mins
    ).safeParse(reservation);
    expect(res.success).toBeFalsy();
    if (!res.success) {
      expect(
        res.error.issues.filter((x) => x.path.includes("date"))
      ).toHaveLength(1);
      // TODO check error message
    }
  });

  // FIXME broken
  test.skip(`date ${tomorrow},  with correct interval is valid`, () => {
    const futureStartTime = format(
      setMinutes(addHours(new Date(), 2), 30),
      TIME_FORMAT
    );

    const reservation = {
      type: "BLOCKED",
      date: format(tomorrow, DATE_FORMAT),
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = ReservationFormSchema(
      ReservationStartInterval.Interval_30Mins
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
      date: format(tomorrow, DATE_FORMAT),
      startTime: futureStartTime,
      endTime: futureEndTime,
    };

    const res = ReservationFormSchema(
      ReservationStartInterval.Interval_30Mins
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
