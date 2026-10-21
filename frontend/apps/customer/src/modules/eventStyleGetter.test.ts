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
  const start = new Date();
  const end = new Date(start.getTime() + 3_600_000);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const event: any = {
    id: `reservation-${pk}`,
    pk,
    state,
    isBlocked,
  };
  return {
    event,
    start,
    end,
  };
}

describe("eventStyleGetter", () => {
  test("styles initial events and marks them draggable when allowed", () => {
    expect(eventStyleGetter(createCalendarEvent({ state: "INITIAL" }), [], true)).toEqual({
      isMovable: true,
      isBuffer: false,
      isBlocked: false,
      style: expect.objectContaining({
        backgroundColor: "var(--tilavaraus-event-initial-color)",
        color: "var(--color-black)",
        borderInline: "2px dashed var(--tilavaraus-event-initial-border)",
      }),
    });
  });

  test("styles own reservations differently from other confirmed reservations", () => {
    expect(eventStyleGetter(createCalendarEvent({ pk: 11 }), [11], true)).toEqual({
      isMovable: false,
      isBuffer: false,
      isBlocked: false,
      style: expect.objectContaining({
        backgroundColor: "var(--tilavaraus-event-initial-color)",
        color: "var(--color-black)",
        borderInline: "2px solid var(--tilavaraus-event-initial-border)",
      }),
    });
  });

  test("styles buffer reservations with the buffer class", () => {
    expect(eventStyleGetter(createCalendarEvent({ state: "BUFFER" }), [1], true)).toEqual({
      isMovable: false,
      isBuffer: true,
      isBlocked: false,
      style: expect.objectContaining({
        backgroundColor: "var(--color-black-5)",
      }),
    });
  });

  test("uses reservation styling for other reservation states", () => {
    expect(eventStyleGetter(createCalendarEvent({ state: ReservationStateChoice.Confirmed }), [], false)).toEqual({
      isMovable: false,
      isBuffer: false,
      isBlocked: false,
      style: expect.objectContaining({
        backgroundColor: "var(--tilavaraus-event-reservation-color)",
        color: "var(--color-black)",
        borderInline: "2px solid var(--tilavaraus-event-reservation-border)",
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
      isMovable: true,
      isBuffer: false,
      isBlocked: true,
      style: expect.objectContaining({
        backgroundColor: "var(--color-black-5)",
        color: "transparent",
        border: "1px solid var(--color-black-30)",
        borderLeft: "2px solid var(--color-black-30)",
      }),
    });
  });
});
