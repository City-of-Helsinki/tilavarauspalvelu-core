import { render } from "@testing-library/react";
import {
  getReservationUnitInstructionsKey,
  Instructions,
} from "./Instructions";
import {
  type InstructionsFragment,
  ReservationStateChoice,
} from "@gql/gql-types";
import { describe, expect, it } from "vitest";
import { createMockReservation } from "@test/reservation.mocks";
import { getTranslationSafe } from "common/src/common/util";

const customRender = (
  reservation: InstructionsFragment
): ReturnType<typeof render> =>
  render(<Instructions reservation={reservation} />);

const shouldHaveInstructions = [
  ReservationStateChoice.Created,
  ReservationStateChoice.RequiresHandling,
  ReservationStateChoice.Cancelled,
  ReservationStateChoice.Confirmed,
];

const shouldNotHaveInstructions = [
  ReservationStateChoice.Denied,
  ReservationStateChoice.WaitingForPayment,
];

describe("Component: Instructions", () => {
  it("should format the instructions texts (== pass it through a sanitizer)", () => {
    const testInstructions = {
      id: "1",
      state: ReservationStateChoice.Confirmed,
      reservationUnits: [
        {
          id: "1",
          reservationConfirmedInstructionsFi:
            "regular text <script>text inside script</script>",
        },
      ],
    };
    // @ts-expect-error: doesn't match the type by design, since we're only providing reservationConfirmedInstructionsFi
    const view = customRender(testInstructions);

    // sanitizer should remove <script> and its contents
    expect(view.queryByText("<script>")).not.toBeInTheDocument();
    expect(view.queryByText("text inside script")).not.toBeInTheDocument();
    expect(view.getByText("regular text")).toBeInTheDocument();
  });

  it.for(Object.values(shouldHaveInstructions))(
    "should show correct text for reservation state: %s",
    (state) => {
      const mockReservation = createMockReservation({ state });
      const view = customRender(mockReservation);

      const instructionsKey = getReservationUnitInstructionsKey(state) ?? "";
      const mockReservationUnit = mockReservation.reservationUnits[0] ?? {};
      const instructionsText = getTranslationSafe(
        mockReservationUnit,
        instructionsKey,
        "fi"
      );
      // check that the heading is present...
      expect(
        view.queryByText("reservations:reservationInfo")
      ).toBeInTheDocument();
      // ...and that the text matches with the query result
      expect(view.getByText(instructionsText));
    }
  );

  it.for(shouldNotHaveInstructions)(
    "should not render the instructions element at all for reservation state: %s",
    (state) => {
      const mockReservation = createMockReservation({ state });
      const view = customRender(mockReservation);

      // check that the section isn't shown at all === the heading text isn't found
      expect(
        view.queryByText("reservations:reservationInfo")
      ).not.toBeInTheDocument();
    }
  );

  it.todo(
    "should show the access code section if the reservation AccessType is ACCESS_CODE",
    () => {}
  );
});
