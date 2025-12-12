import { addDays } from "date-fns";
import { expect, test } from "vitest";
import { formatDate } from "ui/src/modules/date-utils";
import { ReservationStartInterval, ReservationTypeChoice, Weekday } from "@gql/gql-types";
import type { ReservationSeriesFormValues } from "./reservationSeries";
import { getReservationSeriesSchema } from "./reservationSeries";

const tomorrow = addDays(new Date(), 1);
const interval = ReservationStartInterval.Interval_15Minutes;

function createInput({
  type = ReservationTypeChoice.Blocked,
  startingDate = formatDate(tomorrow),
  endingDate = formatDate(addDays(tomorrow, 6)),
  repeatOnDays = [Weekday.Tuesday],
  repeatPattern = "weekly",
  startTime = "09:00",
  endTime = "10:15",
  seriesName = "name",
  enableBufferTimeAfter = false,
  enableBufferTimeBefore = false,
}: Partial<ReservationSeriesFormValues>): ReservationSeriesFormValues {
  return {
    type,
    startingDate,
    endingDate,
    repeatOnDays,
    repeatPattern,
    enableBufferTimeAfter,
    enableBufferTimeBefore,
    comments: "",
    startTime,
    endTime,
    seriesName,
  };
}

test("one week blocked reservation on a single day is valid", () => {
  const res = getReservationSeriesSchema(interval).safeParse(createInput({}));
  expect(res.success).toBeTruthy();
});

test("over 24h time should fail", () => {
  const res = getReservationSeriesSchema(interval).safeParse(
    createInput({
      startTime: "32:00",
      endTime: "33:15",
    })
  );

  expect(res.success).toBeFalsy();
});

test(`invalid time string should fail`, () => {
  const res = getReservationSeriesSchema(interval).safeParse(
    createInput({
      startTime: "fo:ba",
    })
  );

  expect(res.success).toBeFalsy();
});

test(`time start after time end should fail`, () => {
  const res = getReservationSeriesSchema(interval).safeParse(
    createInput({
      startTime: "10:30",
      endTime: "10:00",
    })
  );

  expect(res.success).toBeFalsy();
});

test.todo(`STAFF reservation should be a success`);

test.todo(`start date cannot be in the past`);
test.todo(`end date cannot be after start date`);
test.todo(`start time can't be after end time`);
test.todo("ReservationSeriesFormSchema checks for empty fields");
test.todo("ReservationSeriesFormSchema passthrough unknown fields");
// TODO should check the error types from failures also but need to think through those cases
// for example missing type should still give a refinement error for dates
