import { createMockReservation } from "@test/reservation.mocks";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { type InstructionsFragment, ReservationStateChoice } from "@gql/gql-types";
import { Instructions } from "./Instructions";

const customRender = (reservation: InstructionsFragment): ReturnType<typeof render> =>
  render(<Instructions reservation={reservation} />);

describe("Component: Instructions", () => {
  it("should sanitize html content", () => {
    const reservation = createMockReservation({
      state: ReservationStateChoice.Confirmed,
      reservationConfirmedInstructions: "regular text <script>text inside script</script>",
    });
    const view = customRender(reservation);

    // sanitizer should remove <script> and its contents
    expect(view.queryByText(/<script>/)).not.toBeInTheDocument();
    expect(view.queryByText(/text inside script/)).not.toBeInTheDocument();
    expect(view.getByText(/regular text/)).toBeInTheDocument();
  });

  it.for([
    ReservationStateChoice.Created,
    ReservationStateChoice.RequiresHandling,
    ReservationStateChoice.Cancelled,
    ReservationStateChoice.Confirmed,
  ])("should show correct text for reservation state: %s", (state) => {
    const mockReservation = createMockReservation({ state });
    const view = customRender(mockReservation);

    const mockReservationUnit = mockReservation.reservationUnit;
    let instructionsText = "FAIL HERE";
    if (state === ReservationStateChoice.Cancelled) {
      instructionsText = mockReservationUnit.reservationCancelledInstructionsFi ?? "FAIL HERE";
    } else if (state === ReservationStateChoice.Confirmed) {
      instructionsText = mockReservationUnit.reservationConfirmedInstructionsFi ?? "FAIL HERE";
    } else {
      instructionsText = mockReservationUnit.reservationPendingInstructionsFi ?? "FAIL HERE";
    }
    // check that the heading is present...
    expect(view.queryByText("reservation:reservationInfo")).toBeInTheDocument();
    // ...and that the text matches with the query result
    expect(view.getByText(instructionsText));
  });

  it.for([ReservationStateChoice.Denied, ReservationStateChoice.WaitingForPayment])(
    "should NOT render the instructions element at all for reservation state: %s",
    (state) => {
      const mockReservation = createMockReservation({ state });
      const view = customRender(mockReservation);

      // check that the section isn't shown at all === the heading text isn't found
      expect(view.queryByText("reservation:reservationInfo")).not.toBeInTheDocument();
    }
  );

  it.todo("should show the access code section if the reservation AccessType is ACCESS_CODE", () => {});
});
