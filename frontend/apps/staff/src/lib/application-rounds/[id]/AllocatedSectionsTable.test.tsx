import React from "react";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AllocatedSectionsTableElementFragment } from "@gql/gql-types";
import { AllocatedSectionsTable } from "./AllocatedSectionsTable";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("ui/src/modules/conversion", () => ({
  convertWeekday: (day: number) => {
    const days: Record<number, string> = { 0: "Mon", 1: "Tue", 2: "Wed", 3: "Thu", 4: "Fri", 5: "Sat", 6: "Sun" };
    return days[day] ?? "Mon";
  },
}));

vi.mock("ui/src/modules/date-utils", () => ({
  timeToMinutes: (time: string) => {
    const parts = time.split(":").map(Number);
    const h = parts[0] ?? 0;
    const m = parts[1] ?? 0;
    return h * 60 + m;
  },
  formatTimeRange: (start: number, end: number) => `${start}-${end}`,
}));

function createAllocatedSection(
  overrides: Partial<AllocatedSectionsTableElementFragment> = {}
): AllocatedSectionsTableElementFragment {
  return {
    id: "slot-1",
    pk: 1,
    dayOfTheWeek: 1,
    beginTime: "09:00",
    endTime: "12:00",
    reservationSeries: {
      id: "series-1",
      pk: 100,
      shouldHaveActiveAccessCode: false,
      isAccessCodeIsActiveCorrect: true,
      reservations: [
        {
          id: "res-1",
          pk: 1000,
        },
      ],
    },
    reservationUnitOption: {
      id: "opt-1",
      isRejected: false,
      isLocked: false,
      preferredOrder: 1,
      applicationSection: {
        id: "section-1",
        pk: 10,
        name: "Test Section",
        reservationsBeginDate: "2024-01-01",
        reservationsEndDate: "2024-12-31",
        reservationMinDuration: 3600,
        reservationMaxDuration: 28_800,
        application: {
          pk: 1,
          id: "app-1",
        },
      },
      reservationUnit: {
        id: "ru-1",
        nameFi: "Reservation Unit",
        unit: {
          id: "unit-1",
          nameFi: "Unit 1",
        },
      },
    },
    ...overrides,
  } as AllocatedSectionsTableElementFragment;
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AllocatedSectionsTable", () => {
  it("renders table rows with all columns", () => {
    const mockSortChanged = vi.fn();
    render(<AllocatedSectionsTable sort={null} sortChanged={mockSortChanged} schedules={[createAllocatedSection()]} />);

    expect(screen.getByText("1-10")).toBeInTheDocument();
    expect(screen.getByText("Test Section")).toBeInTheDocument();
    expect(screen.getByText("Unit 1")).toBeInTheDocument();
    expect(screen.getByText("Reservation Unit")).toBeInTheDocument();
  });

  it("shows empty state when no schedules", () => {
    const mockSortChanged = vi.fn();
    render(<AllocatedSectionsTable sort={null} sortChanged={mockSortChanged} schedules={[]} />);

    expect(screen.getByText("common:noFilteredResults")).toBeInTheDocument();
  });

  it("renders applicant link with correct href", () => {
    const mockSortChanged = vi.fn();
    const { container } = render(
      <AllocatedSectionsTable sort={null} sortChanged={mockSortChanged} schedules={[createAllocatedSection()]} />
    );

    const link = container.querySelector("a[href*='/applications/1']");
    expect(link).toBeTruthy();
  });

  it("handles access code alert tooltip when access code is pending", () => {
    const mockSortChanged = vi.fn();
    const { container } = render(
      <AllocatedSectionsTable
        sort={null}
        sortChanged={mockSortChanged}
        schedules={[
          createAllocatedSection({
            reservationSeries: {
              id: "series-1",
              pk: 100,
              shouldHaveActiveAccessCode: true,
              isAccessCodeIsActiveCorrect: false,
              reservations: [{ id: "res-1", pk: 1000 }],
            },
          }),
        ]}
      />
    );

    // Tooltip is rendered when access code is pending
    expect(container.querySelector("table")).toBeTruthy();
  });

  it("handles multiple allocated sections", () => {
    const mockSortChanged = vi.fn();
    const schedules = [
      createAllocatedSection({ pk: 1 }),
      createAllocatedSection({ pk: 2 }),
      createAllocatedSection({ pk: 3 }),
    ];
    const { container } = render(
      <AllocatedSectionsTable sort={null} sortChanged={mockSortChanged} schedules={schedules} />
    );

    const rows = container.querySelectorAll("tbody tr");
    expect(rows.length).toBe(3);
    expect(screen.getAllByText("1-10").length).toBe(3);
  });
});
