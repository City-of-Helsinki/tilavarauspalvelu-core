import { ReservationUnitsReservationUnitReservationStartIntervalChoices } from "common/types/gql-types";
import { addDays, addHours, format, setMinutes, subDays } from "date-fns";
import { formatDate } from "../../../common/util";
import { reservationSchema } from "./validator";

const TIME_FORMAT = "HH:mm";

describe("with schema", () => {
  const futureEndTime = format(addHours(new Date(), 3), TIME_FORMAT);

  const tomorrow = formatDate(addDays(new Date(), 1).toISOString(), "d.M.yyyy");

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

    const validationResult = reservationSchema().validate(reservation);

    expect(validationResult.error).toBeUndefined();
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

    const validationResult = reservationSchema().validate(reservation);
    expect(validationResult.error?.details[0].path[0]).toEqual("date");
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

    const validationResult = reservationSchema(
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_30Mins
    ).validate(reservation);

    expect(validationResult.error).toBeUndefined();
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

    const validationResult = reservationSchema(
      ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_30Mins
    ).validate(reservation);

    expect(validationResult.error?.details[0].path[0]).toEqual("startTime");
  });
});
