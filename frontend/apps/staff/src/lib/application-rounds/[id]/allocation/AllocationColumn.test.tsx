import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import type { VisibleHours, WeekdayInterval } from "@ui/components/WeeklyPatternCalendar/types";
import {
  ApplicationRoundStatusChoice,
  ApplicationSectionStatusChoice,
  Priority,
  ReservationStartInterval,
  ReserveeType,
  Weekday,
} from "@gql/gql-types";
import { ALLOCATION_TIME_FORM_ID } from "@/modules/const";
import { AllocationColumn } from "./AllocationColumn";
import type {
  AllocatedTimeSlotNodeT,
  ReservationUnitOptionNodeT,
  SectionNodeT,
  SuitableTimeRangeNodeT,
} from "./modules/applicationRoundAllocation";
import { SelectedSlotsContextProvider, useSelectedSlots } from "./SelectedSlotsContext";

// The status line counts, so this fake t appends a count where the component passes one. Every other key reads as
// its own name, the same way the shared test setup does it.
vi.mock("next-i18next/pages", () => ({
  useTranslation: () => ({
    t: (key: string, params?: { count?: number }) => (params?.count == null ? key : `${key}:${params.count}`),
    i18n: {
      changeLanguage: () => new Promise(() => {}),
      language: "fi",
      exists: () => true,
    },
  }),
  initReactI18next: { type: "3rdParty", init: () => {} },
}));

// Two hours, so the time fields offer a handful of options and not the whole day.
const extent: VisibleHours = { beginMinutes: 10 * 60, endMinutes: 12 * 60 };

const RESERVATION_UNIT = { pk: 1 };

function createOption(overrides: Partial<ReservationUnitOptionNodeT> = {}): ReservationUnitOptionNodeT {
  return {
    pk: 10,
    allocatedTimeSlots: [],
    reservationUnit: {
      pk: RESERVATION_UNIT.pk,
      reservationStartInterval: ReservationStartInterval.Interval_15Minutes,
    },
    ...overrides,
  } as ReservationUnitOptionNodeT;
}

function createSection(overrides: Partial<SectionNodeT> = {}): SectionNodeT {
  return {
    pk: 1,
    name: "Section name",
    status: ApplicationSectionStatusChoice.Unallocated,
    reservationMinDuration: 3600,
    reservationMaxDuration: 3600,
    appliedReservationsPerWeek: 1,
    suitableTimeRanges: [],
    reservationUnitOptions: [createOption()],
    application: {
      pk: 1,
      applicantType: ReserveeType.Individual,
      contactPersonFirstName: "First",
      contactPersonLastName: "Last",
      organisationName: null,
    },
    ...overrides,
  } as SectionNodeT;
}

/** Wants Monday 10:00 to 12:00, so every Selection inside those hours gets a request card from it. */
function createRequesting(pk: number): SectionNodeT {
  const range = {
    dayOfTheWeek: Weekday.Monday,
    beginTime: "10:00:00",
    endTime: "12:00:00",
    priority: Priority.Primary,
  } as SuitableTimeRangeNodeT;

  return createSection({ pk, suitableTimeRanges: [range] });
}

/** Already has Monday 10:00 to 11:00 on this reservation unit, so it gets an allocation card. */
function createAllocated(pk: number): SectionNodeT {
  const slot = {
    pk: 5,
    dayOfTheWeek: Weekday.Monday,
    beginTime: "10:00:00",
    endTime: "11:00:00",
  } as AllocatedTimeSlotNodeT;

  return createSection({
    pk,
    status: ApplicationSectionStatusChoice.Handled,
    reservationUnitOptions: [createOption({ pk: 11, allocatedTimeSlots: [slot] })],
  });
}

/** Shows the Selection the context holds, and writes one the way the grid does. */
function SelectionProbe({ grid }: { grid: WeekdayInterval }): React.ReactElement {
  const { selection, setSelection } = useSelectedSlots();

  return (
    <>
      <button type="button" onClick={() => setSelection(grid)}>
        drag the grid
      </button>
      <span data-testid="selection">
        {selection == null ? "none" : `${selection.weekday} ${selection.beginMinutes} ${selection.endMinutes}`}
      </span>
    </>
  );
}

function renderColumn({
  sections = [],
  grid = { weekday: Weekday.Monday, beginMinutes: 630, endMinutes: 690 },
}: {
  sections?: SectionNodeT[];
  grid?: WeekdayInterval;
} = {}) {
  return render(
    <MockedProvider mocks={[]}>
      <SelectedSlotsContextProvider reservationUnitPk={RESERVATION_UNIT.pk}>
        <AllocationColumn
          applicationSections={sections}
          reservationUnit={RESERVATION_UNIT}
          refetchApplicationEvents={vi.fn()}
          applicationRoundStatus={ApplicationRoundStatusChoice.InAllocation}
          affecting={[]}
          priorityFilter={null}
          extent={extent}
        />
        <SelectionProbe grid={grid} />
      </SelectedSlotsContextProvider>
    </MockedProvider>
  );
}

/** The three fields of the form, in the order they are read. */
function formFields(): { weekday: HTMLElement; begin: HTMLElement; end: HTMLElement } {
  const [weekday, begin, end] = screen.getAllByRole("combobox");
  if (weekday == null || begin == null || end == null) {
    throw new Error("Expected the weekday, the begin time and the end time fields");
  }
  return { weekday, begin, end };
}

async function choose(user: ReturnType<typeof userEvent.setup>, field: HTMLElement, label: string): Promise<void> {
  await user.click(field);
  const option = within(screen.getByRole("listbox")).getByRole("option", { name: label });
  await user.click(option);
}

function statusLine(): HTMLElement {
  return screen.getByRole("status");
}

describe("the allocation form", () => {
  it("lands the grid's skip link on the weekday field", () => {
    renderColumn();

    const target = document.querySelector<HTMLElement>(`#${ALLOCATION_TIME_FORM_ID}`);
    expect(target).not.toBeNull();
    expect(target).toContainElement(formFields().weekday);
  });

  it("offers no time until a weekday says which day it is", () => {
    renderColumn();

    const { begin, end } = formFields();
    expect(begin).toHaveAttribute("aria-disabled", "true");
    expect(end).toHaveAttribute("aria-disabled", "true");
  });

  it("makes the same Selection as the grid from a weekday, a begin time and an end time", async () => {
    const user = userEvent.setup();
    const grid: WeekdayInterval = { weekday: Weekday.Monday, beginMinutes: 630, endMinutes: 690 };
    renderColumn({ grid });

    // A weekday alone starts a Selection, so the form needs nothing from the grid.
    await choose(user, formFields().weekday, "translation:dayLong.0");
    expect(screen.getByTestId("selection")).toHaveTextContent(`${Weekday.Monday} 600 615`);

    await choose(user, formFields().begin, "10:30");
    await choose(user, formFields().end, "11:30");

    // Which is what a drag from 10:30 to 11:30 on Monday writes.
    expect(screen.getByTestId("selection")).toHaveTextContent(
      `${grid.weekday} ${grid.beginMinutes} ${grid.endMinutes}`
    );
  });

  it("keeps the times when the weekday changes", async () => {
    const user = userEvent.setup();
    renderColumn();

    await choose(user, formFields().weekday, "translation:dayLong.0");
    await choose(user, formFields().end, "11:00");
    await choose(user, formFields().weekday, "translation:dayLong.2");

    expect(screen.getByTestId("selection")).toHaveTextContent(`${Weekday.Wednesday} 600 660`);
  });

  it("moves the end one step on when the begin time reaches it", async () => {
    const user = userEvent.setup();
    renderColumn();

    await choose(user, formFields().weekday, "translation:dayLong.0");
    await choose(user, formFields().begin, "11:00");

    expect(screen.getByTestId("selection")).toHaveTextContent(`${Weekday.Monday} 660 675`);
  });

  it("states the time and both card counts after a change made in the form", async () => {
    const user = userEvent.setup();
    renderColumn({ sections: [createRequesting(1), createRequesting(2), createAllocated(3)] });

    await choose(user, formFields().weekday, "translation:dayLong.0");
    await choose(user, formFields().begin, "10:30");
    await choose(user, formFields().end, "11:30");

    expect(statusLine()).toHaveTextContent(
      "translation:dayLong.0 10:30–11:30. allocation:form.status.demand:2, allocation:form.status.allocation:1."
    );
  });

  it("stays quiet when the grid is what changed, because the grid says it itself", async () => {
    const user = userEvent.setup();
    renderColumn({ sections: [createRequesting(1)] });

    await user.click(screen.getByRole("button", { name: /drag the grid/i }));

    expect(screen.getByTestId("selection")).toHaveTextContent(`${Weekday.Monday} 630 690`);
    expect(statusLine()).toBeEmptyDOMElement();
  });

  it("falls quiet again when the grid moves a Selection the form made", async () => {
    const user = userEvent.setup();
    renderColumn({ sections: [createRequesting(1)] });

    await choose(user, formFields().weekday, "translation:dayLong.0");
    expect(statusLine()).not.toBeEmptyDOMElement();

    await user.click(screen.getByRole("button", { name: /drag the grid/i }));

    expect(statusLine()).toBeEmptyDOMElement();
  });
});
