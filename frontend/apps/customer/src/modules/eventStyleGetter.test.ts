import { describe, expect, test } from "vitest";
import { ReservationStateChoice } from "@gql/gql-types";
import { eventStyleGetter } from "./eventStyleGetter";

function createCalendarEvent({
  pk = 1,
  state = ReservationStateChoice.Confirmed,
  isBlocked = false,
}: {
  pk?: number;
  state?: string;
  isBlocked?: boolean;
}) {
  return {
    event: {
      pk,
      state,
      isBlocked,
    },
  };
}

describe("eventStyleGetter", () => {
  test("styles initial events and marks them draggable when allowed", () => {
    expect(eventStyleGetter(createCalendarEvent({ state: "INITIAL" }), [], true)).toEqual({
      className: "rbc-event-movable",
      style: expect.objectContaining({
        backgroundColor: "var(--tilavaraus-event-initial-color)",
        color: "var(--color-black)",
        border: "2px dashed var(--tilavaraus-event-initial-border)",
      }),
    });
  });

  test("styles own reservations differently from other confirmed reservations", () => {
    expect(eventStyleGetter(createCalendarEvent({ pk: 11 }), [11], true)).toEqual({
      className: "",
      style: expect.objectContaining({
        backgroundColor: "var(--tilavaraus-event-initial-color)",
        color: "var(--color-black)",
        border: "2px solid var(--tilavaraus-event-initial-border)",
      }),
    });
  });

  test("styles buffer reservations with the buffer class", () => {
    expect(eventStyleGetter(createCalendarEvent({ state: "BUFFER" }), [1], true)).toEqual({
      className: "rbc-event-buffer",
      style: expect.objectContaining({
        backgroundColor: "var(--color-black-5)",
      }),
    });
  });

  test("uses reservation styling for other reservation states", () => {
    expect(eventStyleGetter(createCalendarEvent({ state: ReservationStateChoice.Confirmed }), [], false)).toEqual({
      className: "",
      style: expect.objectContaining({
        backgroundColor: "var(--tilavaraus-event-reservation-color)",
        color: "var(--color-black)",
        border: "2px solid var(--tilavaraus-event-reservation-border)",
      }),
    });
  });

  test("overrides all other styles for blocked events", () => {
    expect(
      eventStyleGetter(
        createCalendarEvent({
          state: "INITIAL",
          isBlocked: true,
        }),
        [],
        true
      )
    ).toEqual({
      className: "rbc-timeslot-inactive",
      style: expect.objectContaining({
        backgroundColor: "var(--color-black-5)",
        color: "transparent",
        border: "1px solid var(--color-black-30)",
        borderLeft: "2px solid var(--color-black-30)",
      }),
    });
  });
});
