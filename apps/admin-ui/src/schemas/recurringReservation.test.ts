import { addDays } from "date-fns";
import {
  ReservationStartInterval,
  ReservationTypeChoice,
} from "@gql/gql-types";
import {
  RecurringReservationForm,
  RecurringReservationFormSchema,
} from "./recurringReservation";
import { toUIDate } from "common/src/common/util";

const tomorrow = addDays(new Date(), 1);
const interval = ReservationStartInterval.Interval_15Mins;

function createInput({
  type = ReservationTypeChoice.Blocked,
  startingDate = toUIDate(tomorrow),
  endingDate = toUIDate(addDays(tomorrow, 6)),
  repeatOnDays = [1],
  repeatPattern = "weekly",
  startTime = "09:00",
  endTime = "10:15",
  seriesName = "name",
}: Partial<RecurringReservationForm>) {
  return {
    type,
    startingDate,
    endingDate,
    repeatOnDays,
    repeatPattern,
    startTime,
    endTime,
    seriesName,
  };
}

// Tests timeSelectionSchema instead of the form schema because of refinements

// TODO need to make more complex
// so the basic form validation test is first week (today -> week)
// with start time / end time
// with reservation unit
// no metadata
// type? BLOCKED or STAFF
test("one week blocked reservation on a single day is valid", () => {
  const res = RecurringReservationFormSchema(interval).safeParse(
    createInput({})
  );
  expect(res.success).toBeTruthy();
});

test("over 24h time should fail", () => {
  const res = RecurringReservationFormSchema(interval).safeParse(
    createInput({
      startTime: "32:00",
      endTime: "33:15",
    })
  );

  expect(res.success).toBeFalsy();
});

test(`invalid time string should fail`, () => {
  const res = RecurringReservationFormSchema(interval).safeParse(
    createInput({
      startTime: "fo:ba",
    })
  );

  expect(res.success).toBeFalsy();
});

test(`time start after time end should fail`, () => {
  const res = RecurringReservationFormSchema(interval).safeParse(
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
test.todo("RecurringReservationFormSchema checks for empty fields");
test.todo("RecurringReservationFormSchema passthrough unknown fields");
// TODO should check the error types from failures also but need to think through those cases
// for example missing type should still give a refinement error for dates
