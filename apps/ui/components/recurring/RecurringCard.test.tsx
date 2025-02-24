import { render } from "@testing-library/react";
import { ReservationUnitCard } from "./RecurringCard";
import { ReservationUnitCardFieldsFragment } from "@/gql/gql-types";

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
    selectReservationUnit: jest.fn(),
    containsReservationUnit: jest.fn(),
    removeReservationUnit: jest.fn(),
  };
}

describe("RecurringCard", () => {
  test("should render recurring card", () => {
    const input = createInput({
      name: "foobar",
      unitName: "Unit",
    });
    const view = render(<ReservationUnitCard {...input} />);
    expect(view.getByRole("link", { name: "common:show" })).toBeInTheDocument();
    expect(view.getAllByRole("link")).toHaveLength(1);
    expect(view.getAllByRole("button")).toHaveLength(1);
    expect(view.getByText("foobar FI")).toBeInTheDocument();
    expect(view.getByText("Unit FI")).toBeInTheDocument();
  });
  // should render name, unit name, image?, typename (optional), maxPersons (optional),
  // should have two buttons always
});
