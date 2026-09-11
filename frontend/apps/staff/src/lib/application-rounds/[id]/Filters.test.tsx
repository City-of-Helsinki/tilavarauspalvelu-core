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

const OPTIONS: TagOptionsList = {
  units: [{ label: "Unit 1", value: 1 }],
  equipments: [],
  intendedUses: [],
  reservationPurposes: [],
  reservationUnitTypes: [],
  ageGroups: [],
  municipalities: [],
  stateChoices: [],
  reservationUnits: [{ label: "Reservation unit 1", value: 1 }],
  unitGroups: [{ label: "Group 1", value: 1 }],
  reservationUnitStates: [],
  priorityChoices: [],
  orderChoices: [],
  orderStatus: [],
  reservationTypeChoices: [],
  recurringChoices: [],
  reserveeTypes: [],
};

describe("application-rounds/[id] Filters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseSetSearchParams.mockReturnValue(vi.fn());
  });

  it("renders the application status filter by default", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(<Filters options={OPTIONS} />);

    expect(screen.getByLabelText("filters:label.search")).toBeInTheDocument();
    expect(screen.getByTestId("searchButton")).toBeInTheDocument();
  });

  it("renders the section status filter instead of application status when statusOption is 'section'", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    render(<Filters options={OPTIONS} statusOption="section" />);

    expect(screen.getByLabelText("filters:label.search")).toBeInTheDocument();
  });

  it("only renders the applicant, weekday, reservationUnit and accessCodeState filters when their enable flags are set", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));

    const { rerender } = render(<Filters options={OPTIONS} />);
    // AutoGrid children count without the optional filters
    const baseCount = screen.getAllByRole("combobox").length + screen.getAllByRole("textbox").length;

    rerender(<Filters options={OPTIONS} enableApplicant enableWeekday enableReservationUnit enableAccessCodeState />);
    const expandedCount = screen.getAllByRole("combobox").length + screen.getAllByRole("textbox").length;

    expect(expandedCount).toBeGreaterThan(baseCount);
  });

  it("submits the search text as a search param", async () => {
    const user = userEvent.setup();
    const setSearchParams = vi.fn();
    mockUseSearchParams.mockReturnValue(new URLSearchParams(""));
    mockUseSetSearchParams.mockReturnValue(setSearchParams);

    render(<Filters options={OPTIONS} />);

    await user.type(screen.getByLabelText("filters:label.search"), "hall");
    await user.click(screen.getByTestId("searchButton"));

    expect(setSearchParams).toHaveBeenCalledTimes(1);
    const params = setSearchParams.mock.calls[0]?.[0] as URLSearchParams;
    expect(params.get("search")).toBe("hall");
  });

  it("maps the weekday search param through convertWeekday", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams("weekday=0&weekday=3"));

    render(<Filters options={OPTIONS} enableWeekday />);

    expect(screen.getByLabelText("filters:label.search")).toBeInTheDocument();
  });
});
