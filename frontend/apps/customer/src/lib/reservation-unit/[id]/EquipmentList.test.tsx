import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import type { EquipmentFieldsFragment } from "@gql/gql-types";
import { EquipmentList } from "./EquipmentList";

function createEquipment(overrides: Partial<EquipmentFieldsFragment> = {}): EquipmentFieldsFragment {
  return {
    id: "eq-1",
    pk: 1,
    nameFi: "Tuoli",
    nameEn: "Chair",
    nameSv: "Stol",
    category: { id: "cat-1", nameFi: "Huonekalut", nameEn: "Furniture", nameSv: "Möbler" },
    ...overrides,
  };
}

describe("EquipmentList", () => {
  test("renders every piece of equipment when under the item limit", () => {
    const equipment = [createEquipment({ pk: 1, nameFi: "Tuoli" }), createEquipment({ pk: 2, nameFi: "Pöytä" })];
    render(<EquipmentList equipment={equipment} />);

    expect(screen.getByText("Tuoli")).toBeInTheDocument();
    expect(screen.getByText("Pöytä")).toBeInTheDocument();
    expect(screen.queryByTestId("show-all__toggle-button")).not.toBeInTheDocument();
  });

  test("shows a 'show all' toggle once equipment exceeds itemsToShow", () => {
    const equipment = Array.from({ length: 4 }, (_, i) => createEquipment({ pk: i + 1, nameFi: `Item ${i + 1}` }));
    render(<EquipmentList equipment={equipment} itemsToShow={2} />);

    expect(screen.getByTestId("show-all__toggle-button")).toBeInTheDocument();
  });

  test("renders nothing but the (empty) container when there is no equipment", () => {
    render(<EquipmentList equipment={[]} />);

    expect(screen.getByTestId("reservation-unit__equipment")).toBeInTheDocument();
    expect(screen.queryByTestId("show-all__toggle-button")).not.toBeInTheDocument();
  });
});
