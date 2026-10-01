import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Filters } from "./Filters";

const { mockUseSearchParams } = vi.hoisted(() => ({ mockUseSearchParams: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: mockUseSearchParams }));

const { mockUseSetSearchParams } = vi.hoisted(() => ({ mockUseSetSearchParams: vi.fn() }));
vi.mock("@/hooks/useSetSearchParams", () => ({ useSetSearchParams: mockUseSetSearchParams }));

const { mockUseFilterOptions } = vi.hoisted(() => ({ mockUseFilterOptions: vi.fn() }));
vi.mock("@/hooks/useFilterOptions", () => ({ useFilterOptions: mockUseFilterOptions }));

vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: "fi" } }),
}));

describe("reservations Filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSetSearchParams.mockReturnValue(vi.fn());
    mockUseFilterOptions.mockReturnValue({
      reservationUnitTypes: [{ label: "Type A", value: 1 }],
      units: [{ label: "Unit A", value: 1 }],
      reservationUnits: [{ label: "Reservation unit A", value: 1 }],
      stateChoices: [{ label: "Confirmed", value: "CONFIRMED" }],
      orderStatus: [{ label: "Paid", value: "PAID" }],
      reservationTypeChoices: [{ label: "Normal", value: "NORMAL" }],
      recurringChoices: [
        { label: "Only recurring", value: "only" },
        { label: "Only not recurring", value: "onlyNot" },
      ],
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

  it("renders the always-visible search field and search button", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(<Filters />);

    expect(screen.getByLabelText("filters:label.searchReservation")).toBeInTheDocument();
    expect(screen.getByTestId("searchButton")).toBeInTheDocument();
  });

  it("passes the unit search param through to useFilterOptions", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("unit=1&unit=2"));

    render(<Filters />);

    expect(mockUseFilterOptions).toHaveBeenCalledWith([1, 2]);
  });

  it("populates the search field from the search param", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("search=badminton"));

    render(<Filters />);

    expect(screen.getByLabelText("filters:label.searchReservation")).toHaveValue("badminton");
  });

  it("submits the search text as a search param", async () => {
    const user = userEvent.setup();
    const setSearchParams = vi.fn();
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));
    mockUseSetSearchParams.mockReturnValue(setSearchParams);

    render(<Filters />);

    await user.type(screen.getByLabelText("filters:label.searchReservation"), "badminton");
    await user.click(screen.getByTestId("searchButton"));

    expect(setSearchParams).toHaveBeenCalledTimes(1);
    const params = setSearchParams.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.get("search")).toBe("badminton");
  });

  it("renders default tags and the clear-button labels passed in as props", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(
      <Filters
        defaultFilters={[{ key: "state", value: "CONFIRMED" }]}
        clearButtonLabel="Clear all"
        clearButtonAriaLabel="Clear all filters"
      />
    );

    expect(screen.getByLabelText("filters:label.searchReservation")).toBeInTheDocument();
  });
});
