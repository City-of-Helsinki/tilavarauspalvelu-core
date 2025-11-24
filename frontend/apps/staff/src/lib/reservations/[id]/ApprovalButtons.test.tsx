import React from "react";
import { render } from "@testing-library/react";
import { addDays, addMinutes } from "date-fns";
import { describe, expect, test, vi } from "vitest";
import { createNodeId } from "ui/src/modules/helpers";
import { ReservationStateChoice } from "@gql/gql-types";
import type { ApprovalButtonsFragment } from "@gql/gql-types";
import { ApprovalButtons } from "./ApprovalButtons";

const wrappedRender = (reservation: ApprovalButtonsFragment) => {
  return render(<ApprovalButtons isFree reservation={reservation} handleClose={vi.fn()} handleAccept={vi.fn()} />);
};

function createInput({
  state,
  endsAt = addDays(new Date(), 2),
}: {
  state: ReservationStateChoice;
  endsAt?: Date;
}): ApprovalButtonsFragment {
  return {
    id: createNodeId("ReservationNode", 1),
    pk: 1,
    state,
    beginsAt: endsAt.toISOString(),
    endsAt: endsAt.toISOString(),
    paymentOrder: null,
    reservationSeries: null,
    reservationUnit: {
      id: createNodeId("ReservationUnitNode", 1),
      pricings: [],
    },
    price: null,
    handlingDetails: null,
    applyingForFreeOfCharge: false,
    freeOfChargeReason: null,
    appliedPricing: null,
  };
}

describe("State change rules", () => {
  test("Return and Deny are enabled for future Confirmed events", () => {
    const input = createInput({ state: ReservationStateChoice.Confirmed });
    const view = wrappedRender(input);

    expect(view.getByRole("button", { name: "reservation:reject" })).toBeInTheDocument();
    expect(
      view.getByRole("button", {
        name: "reservation:returnToHandling",
      })
    ).toBeInTheDocument();
  });

  test("Approve and deny are enabled for future RequiresHandling", () => {
    const input = createInput({
      state: ReservationStateChoice.RequiresHandling,
    });
    const view = wrappedRender(input);

    expect(view.getByRole("button", { name: "reservation:reject" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "reservation:approve" })).toBeInTheDocument();
  });

  test("Only Return to Handling is enabled if Denied", () => {
    const input = createInput({ state: ReservationStateChoice.Denied });
    const view = wrappedRender(input);

    expect(view.queryAllByRole("button")).toHaveLength(1);
    expect(
      view.getByRole("button", {
        name: "reservation:returnToHandling",
      })
    ).toBeInTheDocument();
  });

  test("Past Confirmed all buttons are disabled", () => {
    const input = createInput({
      state: ReservationStateChoice.Confirmed,
      endsAt: addDays(new Date(), -2),
    });
    const view = wrappedRender(input);
    expect(view.queryAllByRole("button")).toHaveLength(0);
  });

  test("Past Denied all buttons are disabled", () => {
    const input = createInput({
      state: ReservationStateChoice.Denied,
      endsAt: addDays(new Date(), -2),
    });
    const view = wrappedRender(input);
    expect(view.queryAllByRole("button")).toHaveLength(0);
  });

  test("Past RequiresHandling can be Denied", () => {
    const input = createInput({
      state: ReservationStateChoice.RequiresHandling,
      endsAt: addDays(new Date(), -2),
    });
    const view = wrappedRender(input);

    expect(view.queryAllByRole("button")).toHaveLength(1);
    expect(view.getByRole("button", { name: "reservation:reject" })).toBeInTheDocument();
  });
});

describe("Editing allowed", () => {
  test("Editing is allowed for future Confirmed events", () => {
    const input = createInput({ state: ReservationStateChoice.Confirmed });
    const view = wrappedRender(input);

    expect(view.getByRole("link", { name: "reservation:ApprovalButtons.edit" })).toBeInTheDocument();
  });

  test.for([
    ReservationStateChoice.RequiresHandling,
    ReservationStateChoice.Denied,
    ReservationStateChoice.Cancelled,
    ReservationStateChoice.WaitingForPayment,
    ReservationStateChoice.Created,
  ] as const)("No editing for state %s", (state) => {
    const view = wrappedRender(createInput({ state }));
    expect(view.queryAllByRole("link")).toHaveLength(0);
  });

  test("Past Confirmed has a one hour edit window", () => {
    const input = createInput({
      state: ReservationStateChoice.Confirmed,
      endsAt: addMinutes(new Date(), -45),
    });
    const view = wrappedRender(input);
    expect(view.getByRole("link", { name: "reservation:ApprovalButtons.edit" })).toBeInTheDocument();
  });
});
