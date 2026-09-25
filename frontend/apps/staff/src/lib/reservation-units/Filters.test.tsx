import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import type { TagOptionsList } from "@/modules/search";
import { Filters } from "./Filters";

const { mockUseSearchParams } = vi.hoisted(() => ({ mockUseSearchParams: vi.fn() }));
vi.mock("next/navigation", () => ({ useSearchParams: mockUseSearchParams }));

const { mockUseSetSearchParams } = vi.hoisted(() => ({ mockUseSetSearchParams: vi.fn() }));
vi.mock("@/hooks/useSetSearchParams", () => ({ useSetSearchParams: mockUseSetSearchParams }));

vi.mock("next-i18next", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const EMPTY_OPTIONS: TagOptionsList = {
  units: [],
  equipments: [],
  intendedUses: [],
  reservationPurposes: [],
  reservationUnitTypes: [{ label: "Type A", value: 1 }],
  ageGroups: [],
  municipalities: [],
  stateChoices: [],
  reservationUnits: [],
  unitGroups: [{ label: "Group A", value: 1 }],
  reservationUnitStates: [],
  priorityChoices: [],
  orderChoices: [],
  orderStatus: [],
  reservationTypeChoices: [],
  recurringChoices: [],
  reserveeTypes: [],
};

describe("reservation-units Filters", () => {
  const onChangedCriteria = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSetSearchParams.mockReturnValue(vi.fn());
  });

  it("renders the filter fields and calls onChangedCriteria on mount", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(<Filters options={EMPTY_OPTIONS} onChangedCriteria={onChangedCriteria} />);

    expect(screen.getByLabelText("filters:label.reservationUnit")).toBeInTheDocument();
    expect(onChangedCriteria).toHaveBeenCalled();
  });

  it("populates the search field from the search param", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("search=pool"));

    render(<Filters options={EMPTY_OPTIONS} onChangedCriteria={onChangedCriteria} />);

    expect(screen.getByLabelText("filters:label.reservationUnit")).toHaveValue("pool");
  });

  it("submits the search text as a search param", async () => {
    const user = userEvent.setup();
    const setSearchParams = vi.fn();
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));
    mockUseSetSearchParams.mockReturnValue(setSearchParams);

    render(<Filters options={EMPTY_OPTIONS} onChangedCriteria={onChangedCriteria} />);

    await user.type(screen.getByLabelText("filters:label.reservationUnit"), "sauna");
    await user.click(screen.getByTestId("searchButton"));

    expect(setSearchParams).toHaveBeenCalledTimes(1);
    const params = setSearchParams.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.get("search")).toBe("sauna");
  });
});
