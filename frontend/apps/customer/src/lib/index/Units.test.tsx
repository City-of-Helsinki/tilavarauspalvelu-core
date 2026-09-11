import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, test, expect } from "vitest";
import type { UnitListFieldsFragment } from "@gql/gql-types";
import { Units } from "./Units";

function createUnit(overrides: Partial<UnitListFieldsFragment> = {}): UnitListFieldsFragment {
  return {
    id: "unit-1",
    pk: 1,
    nameFi: "Yksikkö FI",
    nameEn: "Unit EN",
    nameSv: "Enhet SV",
    ...overrides,
  };
}

describe("Units", () => {
  test("renders nothing when there are no units", () => {
    const { container } = render(<Units units={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  test("renders a link per unit with a search href, and no 'show all' link under the limit", () => {
    const units = [createUnit({ pk: 1, nameFi: "Yksikkö A" }), createUnit({ pk: 2, nameFi: "Yksikkö B" })];
    render(<Units units={units} />);

    const links = screen.getAllByTestId("front-page__units--unit");
    expect(links).toHaveLength(2);
    expect(screen.getByText("Yksikkö A").closest("a")).toHaveAttribute("href", expect.stringContaining("units=1"));
    expect(screen.queryByTestId("front-page__units--more-link")).not.toBeInTheDocument();
  });

  test("shows only the first 8 units and a 'show all' link when there are more", () => {
    const units = Array.from({ length: 10 }, (_, i) => createUnit({ pk: i + 1, nameFi: `Yksikkö ${i + 1}` }));
    render(<Units units={units} />);

    expect(screen.getAllByTestId("front-page__units--unit")).toHaveLength(8);
    expect(screen.getByTestId("front-page__units--more-link")).toBeInTheDocument();
  });

  test("falls back to a dash when a unit has no translated name", () => {
    const units = [createUnit({ pk: 1, nameFi: null, nameEn: null, nameSv: null })];
    render(<Units units={units} />);

    expect(screen.getByTestId("front-page__units--unit")).toHaveTextContent("-");
  });
});
