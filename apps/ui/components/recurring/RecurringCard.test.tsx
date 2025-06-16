import { render } from "@testing-library/react";
import { RecurringCard } from "./RecurringCard";
import { AccessType, type RecurringCardFragment } from "@/gql/gql-types";
import { vi, describe, test, expect } from "vitest";
import { getReservationUnitPath } from "@/modules/urls";
import { createMockReservationUnitType, generateNameFragment } from "@/test/test.gql.utils";
import userEvent from "@testing-library/user-event";
import { base64encode } from "common/src/helpers";

describe("RecurringCard", () => {
  test("should render recurring card", () => {
    const input = createInput({
      name: "foobar",
      unitName: "Unit",
    });
    const view = render(<RecurringCard {...input} />);
    // For these cards neither the title nor image are links
    const showLink = view.getByRole("link", { name: "common:show" });
    expect(showLink).toBeInTheDocument();
    expect(showLink).toHaveAttribute("href", getReservationUnitPath(input.reservationUnit.pk));
    expect(view.getByRole("button", { name: "common:selectReservationUnit" })).toBeInTheDocument();
    expect(view.getAllByRole("link")).toHaveLength(1);
    expect(view.getAllByRole("button")).toHaveLength(1);
    expect(view.getByText("foobar FI")).toBeInTheDocument();
    expect(view.getByText("Unit FI")).toBeInTheDocument();
    expect(view.getByText(`reservationUnit:accessTypes.${AccessType.AccessCode}`)).toBeInTheDocument();
    expect(view.getByText(/reservationUnitCard:maxPersons/)).toBeInTheDocument();
    // unit type icon is present, can't query by aria-label since it's hidden
    expect(view.queryByTestId("reservation-unit-card__icon--home")).toBeInTheDocument();
  });

  test("should render remove button if already selected", async () => {
    const input = createInput({
      name: "foobar",
      unitName: "Unit",
    });
    input.containsReservationUnit.mockReturnValue(true);
    const view = render(<RecurringCard {...input} />);
    const removeBtn = view.getByRole("button", {
      name: "common:removeReservationUnit",
    });
    expect(removeBtn).toBeInTheDocument();
    expect(view.queryByRole("button", { name: "common:selectReservationUnit" })).not.toBeInTheDocument();
    const user = userEvent.setup();
    await user.click(removeBtn);
    expect(input.removeReservationUnit).toHaveBeenCalledTimes(1);
  });

  test("should invoke callback on select", async () => {
    const input = createInput({
      name: "foobar",
      unitName: "Unit",
    });
    const view = render(<RecurringCard {...input} />);
    const user = userEvent.setup();
    const selectBtn = view.getByRole("button", {
      name: "common:selectReservationUnit",
    });
    expect(selectBtn).toBeInTheDocument();
    await user.click(selectBtn);
    expect(input.selectReservationUnit).toHaveBeenCalledTimes(1);
  });

  test("should not have max persons if not defined", () => {
    const input = createInput({
      name: "foobar",
      unitName: "Unit",
      maxPersons: null,
    });
    const view = render(<RecurringCard {...input} />);
    expect(view.queryByText(/reservationUnitCard:maxPersons/)).not.toBeInTheDocument();
  });

  test("should not have typename if not defined", () => {
    const input = createInput({
      name: "foobar",
      unitName: "Unit",
      reservationUnitType: null,
    });
    const view = render(<RecurringCard {...input} />);
    expect(view.queryByTestId("reservation-unit-card__icon--home")).not.toBeInTheDocument();
  });

  test("should not have access type if not defined", () => {
    const input = createInput({
      name: "foobar",
      unitName: "Unit",
      currentAccessType: null,
    });
    const view = render(<RecurringCard {...input} />);
    expect(view.queryByText(/reservationUnit:accessTypes/)).not.toBeInTheDocument();
  });
});

type MockReservationUnitInputs = {
  name: string;
  unitName: string;
  reservationUnitType?: string | null;
  maxPersons?: number | null;
  currentAccessType?: AccessType | null;
};

/// uses undefined to create default values, null to create null values
function createReservationUnit({
  name,
  unitName,
  reservationUnitType,
  maxPersons,
  currentAccessType,
}: MockReservationUnitInputs): RecurringCardFragment {
  return {
    id: "ReservationUnitNode:1",
    pk: 1,
    maxPersons: maxPersons !== undefined ? maxPersons : 10,
    currentAccessType: currentAccessType !== undefined ? currentAccessType : AccessType.AccessCode,
    effectiveAccessType:
      currentAccessType !== undefined
        ? currentAccessType // Just use the same value for effectiveAccessType
        : AccessType.AccessCode,
    reservationUnitType:
      reservationUnitType !== null // eslint-disable-line eqeqeq
        ? createMockReservationUnitType({
            name: reservationUnitType ?? "ReservationUnitType",
          })
        : null,
    unit: createUnitMock({ name: unitName }),
    images: [],
    ...generateNameFragment(name),
  };
}

function createUnitMock({ name }: { name?: string }): RecurringCardFragment["unit"] {
  if (!name) {
    return null;
  }
  return {
    id: base64encode("UnitNode:1"),
    ...generateNameFragment(name),
  };
}

function createInput(props: MockReservationUnitInputs) {
  return {
    reservationUnit: createReservationUnit(props),
    selectReservationUnit: vi.fn(),
    containsReservationUnit: vi.fn(),
    removeReservationUnit: vi.fn(),
  };
}
