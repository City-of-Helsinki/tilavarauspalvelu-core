import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { type ReservationNode, ReservationStateChoice } from "@gql/gql-types";
import { addDays, addMinutes } from "date-fns";
import ApprovalButtons from "./ApprovalButtons";
import { vi, describe, test, expect } from "vitest";

const wrappedRender = (reservation: ReservationNode) => {
  return render(
    <BrowserRouter>
      <ApprovalButtons
        state={reservation.state ?? ReservationStateChoice.Created}
        isFree
        reservation={reservation}
        handleClose={vi.fn()}
        handleAccept={vi.fn()}
      />
    </BrowserRouter>
  );
};

describe("State change rules", () => {
  test("Return and Deny are enabled for future Confirmed events", () => {
    const res = {
      state: ReservationStateChoice.Confirmed,
      end: addDays(new Date(), 2).toISOString(),
      recurringReservation: undefined,
    } as ReservationNode;

    const view = wrappedRender(res);

    expect(
      view.getByRole("button", { name: "RequestedReservation.reject" })
    ).toBeInTheDocument();
    expect(
      view.getByRole("button", {
        name: "RequestedReservation.returnToHandling",
      })
    ).toBeInTheDocument();
  });

  test("Approve and deny are enabled for future RequiresHandling", () => {
    const res = {
      state: ReservationStateChoice.RequiresHandling,
      end: addDays(new Date(), 2).toISOString(),
      recurringReservation: undefined,
    } as ReservationNode;

    const view = wrappedRender(res);

    expect(
      view.getByRole("button", { name: "RequestedReservation.reject" })
    ).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "RequestedReservation.approve" })
    ).toBeInTheDocument();
  });

  test("Only Return to Handling is enabled if Denied", () => {
    const res = {
      state: ReservationStateChoice.Denied,
      end: addDays(new Date(), 2).toISOString(),
      recurringReservation: undefined,
    } as ReservationNode;

    const view = wrappedRender(res);

    expect(view.queryAllByRole("button")).toHaveLength(1);
    expect(
      view.getByRole("button", {
        name: "RequestedReservation.returnToHandling",
      })
    ).toBeInTheDocument();
  });

  test("Past Confirmed all buttons are disabled", () => {
    const res = {
      state: ReservationStateChoice.Confirmed,
      end: addDays(new Date(), -2).toISOString(),
      recurringReservation: undefined,
    } as ReservationNode;
    const view = wrappedRender(res);
    expect(view.queryAllByRole("button")).toHaveLength(0);
  });

  test("Past Denied all buttons are disabled", () => {
    const res = {
      state: ReservationStateChoice.Denied,
      end: addDays(new Date(), -2).toISOString(),
      recurringReservation: undefined,
    } as ReservationNode;
    const view = wrappedRender(res);
    expect(view.queryAllByRole("button")).toHaveLength(0);
  });

  test("Past RequiresHandling can be Denied", () => {
    const res = {
      state: ReservationStateChoice.RequiresHandling,
      end: addDays(new Date(), -2).toISOString(),
      recurringReservation: undefined,
    } as ReservationNode;

    const view = wrappedRender(res);

    expect(view.queryAllByRole("button")).toHaveLength(1);
    expect(
      view.getByRole("button", { name: "RequestedReservation.reject" })
    ).toBeInTheDocument();
  });
});

describe("Editing allowed", () => {
  test("Editing is allowed for future Confirmed events", () => {
    const res = {
      state: ReservationStateChoice.Confirmed,
      end: addDays(new Date(), 2).toISOString(),
      recurringReservation: undefined,
    } as ReservationNode;

    const view = wrappedRender(res);

    expect(
      view.getByRole("link", { name: "ApprovalButtons.edit" })
    ).toBeInTheDocument();
  });

  test("No editing if the event isn't Confirmed", () => {
    const res = {
      state: ReservationStateChoice.RequiresHandling,
      end: addDays(new Date(), 2).toISOString(),
      recurringReservation: undefined,
    } as ReservationNode;

    const view = wrappedRender(res);
    expect(view.queryAllByRole("link")).toHaveLength(0);

    const view2 = wrappedRender({
      ...res,
      state: ReservationStateChoice.Denied,
    });
    expect(view2.queryAllByRole("link")).toHaveLength(0);

    const view3 = wrappedRender({
      ...res,
      state: ReservationStateChoice.Cancelled,
    });
    expect(view3.queryAllByRole("link")).toHaveLength(0);

    const view4 = wrappedRender({
      ...res,
      state: ReservationStateChoice.WaitingForPayment,
    });
    expect(view4.queryAllByRole("link")).toHaveLength(0);

    const view5 = wrappedRender({
      ...res,
      state: ReservationStateChoice.Created,
    });
    expect(view5.queryAllByRole("link")).toHaveLength(0);
  });

  test("Past Confirmed has a one hour edit window", () => {
    const res = {
      state: ReservationStateChoice.Confirmed,
      end: addMinutes(new Date(), -45).toISOString(),
      recurringReservation: undefined,
    } as ReservationNode;
    const view = wrappedRender(res);
    expect(
      view.getByRole("link", { name: "ApprovalButtons.edit" })
    ).toBeInTheDocument();
  });
});
