import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplicationsTableElementFragment } from "@gql/gql-types";
import { ApplicationsTable } from "./ApplicationsTable";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("ui/src/components/statuses", () => ({
  ApplicationStatusLabel: ({ status }: { status: string }) => <span>{status}</span>,
}));

function createApplication(
  overrides: Partial<ApplicationsTableElementFragment> = {}
): ApplicationsTableElementFragment {
  return {
    id: "app-1",
    pk: 1,
    status: "IN_HANDLING",
    organisationIdentifier: "",
    applicantType: "INDIVIDUAL",
    applicationSections: [
      {
        id: "section-1",
        pk: 10,
        name: "Section 1",
        reservationsBeginDate: "2024-01-01",
        reservationsEndDate: "2024-12-31",
        appliedReservationsPerWeek: 2,
        reservationMinDuration: 3600,
        reservationUnitOptions: [
          {
            id: "opt-1",
            preferredOrder: 1,
            reservationUnit: {
              id: "ru-1",
              unit: {
                id: "unit-1",
                pk: 100,
                nameFi: "Unit 1",
              },
            },
          },
        ],
      },
    ],
    ...overrides,
  } as ApplicationsTableElementFragment;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ApplicationsTable", () => {
  it("renders table with application data", () => {
    const mockSortChanged = vi.fn();
    const { container } = render(
      <ApplicationsTable sort={null} sortChanged={mockSortChanged} applications={[createApplication()]} />
    );

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(container.querySelector("a[href*='/applications/1']")).toBeTruthy();
  });

  it("shows empty state when no applications", () => {
    const mockSortChanged = vi.fn();
    render(<ApplicationsTable sort={null} sortChanged={mockSortChanged} applications={[]} />);

    expect(screen.getByText("common:noFilteredResults")).toBeInTheDocument();
  });

  it("renders application link with correct href", () => {
    const mockSortChanged = vi.fn();
    const { container } = render(
      <ApplicationsTable sort={null} sortChanged={mockSortChanged} applications={[createApplication()]} />
    );

    const link = container.querySelector("a[href*='/applications/1']");
    expect(link).toBeTruthy();
  });

  it("handles multiple applications", () => {
    const mockSortChanged = vi.fn();
    const applications = [createApplication({ pk: 1 }), createApplication({ pk: 2 }), createApplication({ pk: 3 })];
    render(<ApplicationsTable sort={null} sortChanged={mockSortChanged} applications={applications} />);

    expect(screen.getByText("1")).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();
    expect(screen.getByText("3")).toBeInTheDocument();
  });
});
