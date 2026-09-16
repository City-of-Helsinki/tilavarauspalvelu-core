import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ApplicationSectionTableElementFragment } from "@gql/gql-types";
import { ApplicationSectionsTable } from "./ApplicationSectionsTable";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("ui/src/components/statuses", () => ({
  ApplicationSectionStatusLabel: ({ status }: { status: string }) => <span>{status}</span>,
}));

function createApplicationSection(
  overrides: Partial<ApplicationSectionTableElementFragment> = {}
): ApplicationSectionTableElementFragment {
  return {
    id: "section-1",
    pk: 10,
    name: "Section 1",
    status: "APPROVED",
    allocations: 0,
    reservationsBeginDate: "2024-01-01",
    reservationsEndDate: "2024-12-31",
    reservationMinDuration: 3600,
    reservationMaxDuration: 28_800,
    appliedReservationsPerWeek: 2,
    application: {
      pk: 1,
      id: "app-1",
    },
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
    ...overrides,
  } as ApplicationSectionTableElementFragment;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ApplicationSectionsTable", () => {
  it("renders table rows with all columns", () => {
    const mockSortChanged = vi.fn();
    render(
      <ApplicationSectionsTable
        sort={null}
        sortChanged={mockSortChanged}
        applicationSections={[createApplicationSection()]}
      />
    );

    expect(screen.getByText("1-10")).toBeInTheDocument();
    expect(screen.getByText("Section 1")).toBeInTheDocument();
    expect(screen.getByText("Unit 1")).toBeInTheDocument();
  });

  it("shows empty state when no application sections", () => {
    const mockSortChanged = vi.fn();
    render(<ApplicationSectionsTable sort={null} sortChanged={mockSortChanged} applicationSections={[]} />);

    expect(screen.getByText("common:noFilteredResults")).toBeInTheDocument();
  });

  it("renders applicant link with correct href", () => {
    const mockSortChanged = vi.fn();
    const { container } = render(
      <ApplicationSectionsTable
        sort={null}
        sortChanged={mockSortChanged}
        applicationSections={[createApplicationSection()]}
      />
    );

    const link = container.querySelector("a[href*='/applications/1']");
    expect(link).toBeTruthy();
  });

  it("handles multiple sections", () => {
    const mockSortChanged = vi.fn();
    const sections = [
      createApplicationSection({ pk: 10 }),
      createApplicationSection({ pk: 11 }),
      createApplicationSection({ pk: 12 }),
    ];
    render(<ApplicationSectionsTable sort={null} sortChanged={mockSortChanged} applicationSections={sections} />);

    expect(screen.getByText("1-10")).toBeInTheDocument();
    expect(screen.getByText("1-11")).toBeInTheDocument();
    expect(screen.getByText("1-12")).toBeInTheDocument();
  });
});
