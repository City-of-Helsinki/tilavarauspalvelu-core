import { render } from "@testing-library/react";
import { ReservationUnitCard } from "./RecurringCard";
import { ReservationUnitCardFieldsFragment } from "@/gql/gql-types";
import { vi, describe, test, expect } from "vitest";

type MockReservationUnitInputs = {
  name: string;
  unitName: string;
  reservationUnitType?: string;
};
function createReservationUnit({
  name,
  unitName,
  reservationUnitType,
}: MockReservationUnitInputs): ReservationUnitCardFieldsFragment {
  return {
    id: "ReservationUnitNode:1",
    pk: 1,
    accessTypes: [],
    reservationUnitType: createReservationUnitType({
      name: reservationUnitType,
    }),
    unit: createUnit({ name: unitName }),
    images: [],
    ...generateNameFragment(name),
  };
}

function createUnit({ name }: { name?: string }) {
  if (!name) {
    return null;
  }
  return {
    id: "UnitNode:1",
    pk: 1,
    ...generateNameFragment(name),
  };
}

function generateNameFragment(name: string) {
  return {
    nameFi: `${name} FI`,
    nameSv: `${name} SV`,
    nameEn: `${name} EN`,
  };
}

function createReservationUnitType({ name }: { name?: string }) {
  if (!name) {
    return null;
  }
  return {
    pk: 1,
    id: name,
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

describe("RecurringCard", () => {
  test("should render recurring card", () => {
    const name = "foobar";
    const unitName = "Unit";
    const input = createInput({ name, unitName });
    const view = render(<ReservationUnitCard {...input} />);
    expect(view.getByRole("link", { name: "common:show" })).toBeInTheDocument();
    expect(view.getAllByRole("link")).toHaveLength(1);
    expect(view.getAllByRole("button")).toHaveLength(1);
    expect(view.getByText(`${name} FI`)).toBeInTheDocument();
    expect(view.getByText(`${unitName} FI`)).toBeInTheDocument();
  });
  // should render name, unit name, image?, typename (optional), maxPersons (optional),
  // should have two buttons always
});
