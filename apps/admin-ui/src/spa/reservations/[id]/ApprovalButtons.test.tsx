import React from "react";
import { render } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import {
  type ApprovalButtonsFragment,
  ReservationStateChoice,
} from "@gql/gql-types";
import { addDays, addMinutes } from "date-fns";
import ApprovalButtons from "./ApprovalButtons";
import { vi, describe, test, expect } from "vitest";
import { base64encode } from "common/src/helpers";

const wrappedRender = (reservation: ApprovalButtonsFragment) => {
  return render(
    <BrowserRouter>
      <ApprovalButtons
        isFree
        reservation={reservation}
        handleClose={vi.fn()}
        handleAccept={vi.fn()}
      />
    </BrowserRouter>
  );
};

function createInput({
  state,
  end = addDays(new Date(), 2),
}: {
  state: ReservationStateChoice;
  end?: Date;
}): ApprovalButtonsFragment {
  return {
    id: base64encode("ReservationNode:1"),
    pk: 1,
    state,
    begin: end.toISOString(),
    end: end.toISOString(),
    paymentOrder: null,
    recurringReservation: null,
    reservationUnits: [],
    price: null,
    handlingDetails: null,
    applyingForFreeOfCharge: false,
    freeOfChargeReason: null,
  };
}

describe("State change rules", () => {
  test("Return and Deny are enabled for future Confirmed events", () => {
    const input = createInput({ state: ReservationStateChoice.Confirmed });
    const view = wrappedRender(input);

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
    const input = createInput({
      state: ReservationStateChoice.RequiresHandling,
    });
    const view = wrappedRender(input);

    expect(
      view.getByRole("button", { name: "RequestedReservation.reject" })
    ).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "RequestedReservation.approve" })
    ).toBeInTheDocument();
  });

  test("Only Return to Handling is enabled if Denied", () => {
    const input = createInput({ state: ReservationStateChoice.Denied });
    const view = wrappedRender(input);

    expect(view.queryAllByRole("button")).toHaveLength(1);
    expect(
      view.getByRole("button", {
        name: "RequestedReservation.returnToHandling",
      })
    ).toBeInTheDocument();
  });

  test("Past Confirmed all buttons are disabled", () => {
    const input = createInput({
      state: ReservationStateChoice.Confirmed,
      end: addDays(new Date(), -2),
    });
    const view = wrappedRender(input);
    expect(view.queryAllByRole("button")).toHaveLength(0);
  });

  test("Past Denied all buttons are disabled", () => {
    const input = createInput({
      state: ReservationStateChoice.Denied,
      end: addDays(new Date(), -2),
    });
    const view = wrappedRender(input);
    expect(view.queryAllByRole("button")).toHaveLength(0);
  });

  test("Past RequiresHandling can be Denied", () => {
    const input = createInput({
      state: ReservationStateChoice.RequiresHandling,
      end: addDays(new Date(), -2),
    });
    const view = wrappedRender(input);

    expect(view.queryAllByRole("button")).toHaveLength(1);
    expect(
      view.getByRole("button", { name: "RequestedReservation.reject" })
    ).toBeInTheDocument();
  });
});

describe("Editing allowed", () => {
  test("Editing is allowed for future Confirmed events", () => {
    const input = createInput({ state: ReservationStateChoice.Confirmed });
    const view = wrappedRender(input);

    expect(
      view.getByRole("link", { name: "ApprovalButtons.edit" })
    ).toBeInTheDocument();
  });

  test("No editing if the event isn't Confirmed", () => {
    const input = createInput({
      state: ReservationStateChoice.RequiresHandling,
    });
    const view = wrappedRender(input);
    expect(view.queryAllByRole("link")).toHaveLength(0);

    const view2 = wrappedRender({
      ...input,
      state: ReservationStateChoice.Denied,
    });
    expect(view2.queryAllByRole("link")).toHaveLength(0);

    const view3 = wrappedRender({
      ...input,
      state: ReservationStateChoice.Cancelled,
    });
    expect(view3.queryAllByRole("link")).toHaveLength(0);

    const view4 = wrappedRender({
      ...input,
      state: ReservationStateChoice.WaitingForPayment,
    });
    expect(view4.queryAllByRole("link")).toHaveLength(0);

    const view5 = wrappedRender({
      ...input,
      state: ReservationStateChoice.Created,
    });
    expect(view5.queryAllByRole("link")).toHaveLength(0);
  });

  test("Past Confirmed has a one hour edit window", () => {
    const input = createInput({
      state: ReservationStateChoice.Confirmed,
      end: addMinutes(new Date(), -45),
    });
    const view = wrappedRender(input);
    expect(
      view.getByRole("link", { name: "ApprovalButtons.edit" })
    ).toBeInTheDocument();
  });
});
