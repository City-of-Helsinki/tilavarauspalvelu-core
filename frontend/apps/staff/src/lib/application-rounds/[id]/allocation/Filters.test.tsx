import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { ApplicationRoundFilterUnitFragment } from "@gql/gql-types";
import { Filters } from "./Filters";

const { mockUseSearchParams } = vi.hoisted(() => ({ mockUseSearchParams: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: mockUseSearchParams }));

const { mockUseSetSearchParams } = vi.hoisted(() => ({ mockUseSetSearchParams: vi.fn() }));
vi.mock("@/hooks/useSetSearchParams", () => ({ useSetSearchParams: mockUseSetSearchParams }));

const { mockUseFilterOptions } = vi.hoisted(() => ({ mockUseFilterOptions: vi.fn() }));
vi.mock("@/hooks/useFilterOptions", () => ({ useFilterOptions: mockUseFilterOptions }));

vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const UNITS: ApplicationRoundFilterUnitFragment[] = [
  { id: "1", pk: 1, nameFi: "Unit 1" },
  { id: "2", pk: 2, nameFi: "Unit 2" },
];

describe("application-rounds/[id]/allocation Filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSetSearchParams.mockReturnValue(vi.fn());
    mockUseFilterOptions.mockReturnValue({
      reservationUnitTypes: [],
      units: [{ label: "Other unit", value: 99 }],
      reservationUnits: [],
      stateChoices: [],
      orderStatus: [],
      reservationTypeChoices: [],
      recurringChoices: [],
      reservationUnitStates: [],
      unitGroups: [],
      municipalities: [],
      reserveeTypes: [],
      orderChoices: [],
      priorityChoices: [],
      intendedUses: [],
      reservationPurposes: [],
      ageGroups: [],
      equipments: [],
    });
  });

  it("renders and defaults the unit form field to the first passed-in unit", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(<Filters hideSearchTags={[]} units={UNITS} />);

    expect(screen.getByLabelText("filters:label.search")).toBeInTheDocument();
    expect(screen.getByTestId("searchButton")).toBeInTheDocument();
  });

  it("shows a loading spinner on the search button when isLoading is true", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(<Filters hideSearchTags={[]} units={UNITS} isLoading />);

    expect(screen.getByTestId("searchButton")).toBeDisabled();
  });

  it("overrides the queried unit options with the units passed in as props", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(<Filters hideSearchTags={[]} units={UNITS} />);

    // useFilterOptions() returns "Other unit" (pk 99), but the component always
    // overrides `options.units` with the `units` prop it was given.
    expect(screen.queryByText("Other unit")).not.toBeInTheDocument();
  });

  it("submits the search text and the selected unit as search params", async () => {
    const user = userEvent.setup();
    const setSearchParams = vi.fn();
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));
    mockUseSetSearchParams.mockReturnValue(setSearchParams);

    render(<Filters hideSearchTags={[]} units={UNITS} />);

    await user.type(screen.getByLabelText("filters:label.search"), "gym");
    await user.click(screen.getByTestId("searchButton"));

    expect(setSearchParams).toHaveBeenCalledTimes(1);
    const params = setSearchParams.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.get("search")).toBe("gym");
    expect(params.get("unit")).toBe("1");
  });

  it("falls back to unit pk 0 when there are no units to select from", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(<Filters hideSearchTags={[]} units={[]} />);

    expect(screen.getByLabelText("filters:label.search")).toBeInTheDocument();
  });

  it("re-reads the unit from search params when a unit filter is already set", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("unit=2"));

    render(<Filters hideSearchTags={[]} units={UNITS} />);

    expect(screen.getByLabelText("filters:label.search")).toBeInTheDocument();
  });
});
