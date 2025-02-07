import React from "react";
import "@testing-library/jest-dom";
import { render } from "@testing-library/react";
import { addDays } from "date-fns";
import { toUIDate } from "common/src/common/util";
import { ReservationList } from "./ReservationsList";

const today = new Date();

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

    const dstring = toUIDate(today);
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

    const dstring = toUIDate(today);
    expect(await screen.findAllByText(/19:00/)).toHaveLength(N_DAYS);
    expect(await screen.findAllByText(/20:00/)).toHaveLength(N_DAYS);
    expect(await screen.findByText(RegExp(dstring))).toBeInTheDocument();
  });

  test("Error message is translated correctly", async () => {
    const items = [
      {
        date: new Date(),
        error: "ApolloError: Overlapping reservations are not allowed.",
        startTime: "19:00",
        endTime: "20:00",
      },
    ];

    const screen = render(<ReservationList items={items} />);
    expect(await screen.findAllByText(/19:00/)).toHaveLength(1);
    expect(screen.getByText(/overlap/)).toBeInTheDocument();
  });

  test("Error message that has no translation has a default message", async () => {
    const items = [
      {
        date: new Date(),
        error: "failExistsOnPurpose",
        startTime: "19:00",
        endTime: "20:00",
      },
    ];

    const screen = render(<ReservationList items={items} />);
    expect(await screen.findAllByText(/19:00/)).toHaveLength(1);
    expect(screen.getByText(/default/)).toBeInTheDocument();
  });
});
