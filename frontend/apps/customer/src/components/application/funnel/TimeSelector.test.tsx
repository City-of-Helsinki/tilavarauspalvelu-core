import { FormProvider, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { WEEKDAYS_SORTED } from "ui/src/modules/const";
import { formatApiTimeUnsafe } from "ui/src/modules/date-utils";
import { createNodeId, formatTimeStruct } from "ui/src/modules/helpers";
import { Priority, Weekday } from "@gql/gql-types";
import type { ApplicationPage2Query, TimeSelectorFragment } from "@gql/gql-types";
import { createMockApplicationFragment } from "@test/application.mocks";
import type { CreateMockApplicationFragmentProps } from "@test/application.mocks";
import { ApplicationPage2SchemaRefined, convertApplicationPage2 } from "./form";
import type { ApplicationPage2FormValues } from "./form";
import { TimeSelectorForm } from "./TimeSelector";
import type { TimeSelectorProps } from "./TimeSelector";

const { errorToast, successToast } = vi.hoisted(() => ({ errorToast: vi.fn(), successToast: vi.fn() }));
vi.mock("ui/src/components/toast", () => ({ errorToast, successToast }));

type ApplicationPage2 = NonNullable<ApplicationPage2Query["application"]>;

const STEP = 15;

function hhmm(minutes: number): string {
  return formatTimeStruct({ hour: Math.floor(minutes / 60), minute: minutes % 60 });
}

// Every weekday open from 07:00 until midnight, which is the window the old hourly grid hardcoded.
const OPEN_ALL_WEEK: TimeSelectorFragment[] = WEEKDAYS_SORTED.map((weekday, index) => ({
  id: createNodeId("TimeSelector", index),
  weekday,
  isClosed: false,
  reservableTimes: [{ begin: "07:00:00", end: "00:00:00" }],
}));

interface TimeSelectorMockProps extends CreateMockApplicationFragmentProps {
  onSubmit?: (appToSave: ApplicationPage2FormValues) => Promise<void>;
  reservationUnitOpeningHours?: TimeSelectorProps["reservationUnitOpeningHours"];
  /** Defaults to the shown unit's opening hours, as if the section listed only that unit. */
  sectionOpeningHours?: TimeSelectorProps["sectionOpeningHours"];
  /** Validates with the page's schema, and adds a "validate" button that runs it. */
  validate?: boolean;
  /** Overrides the mock's applied reservations per week. */
  appliedReservationsPerWeek?: number;
  /** Defaults to `sectionOpeningHours` for every section. */
  allSectionsOpeningHours?: TimeSelectorProps["allSectionsOpeningHours"];
}

function customRender(props: TimeSelectorMockProps = {}): ReturnType<typeof render> {
  if (props.page == null) {
    props.page = "page1";
  }
  return render(<WrapTimeSelector {...props} />);
}

// To use hooks have to use component wrap
function WrapTimeSelector({
  onSubmit = vi.fn(),
  reservationUnitOpeningHours = OPEN_ALL_WEEK,
  sectionOpeningHours = reservationUnitOpeningHours,
  allSectionsOpeningHours,
  validate = false,
  appliedReservationsPerWeek,
  ...props
}: TimeSelectorMockProps) {
  const application: ApplicationPage2 = createMockApplicationFragment(props);
  const sectionsOpeningHours =
    allSectionsOpeningHours ?? Array.from({ length: props.nSections ?? 1 }, () => sectionOpeningHours);
  const defaultValues = convertApplicationPage2(application);
  if (appliedReservationsPerWeek != null) {
    for (const section of defaultValues.applicationSections) {
      section.appliedReservationsPerWeek = appliedReservationsPerWeek;
    }
  }
  const form = useForm<ApplicationPage2FormValues>({
    mode: "onChange",
    defaultValues,
    resolver: validate ? zodResolver(ApplicationPage2SchemaRefined(sectionsOpeningHours)) : undefined,
  });

  // wrap handler to match the only form values
  const onSubmitHandler = async (data: ApplicationPage2FormValues) => {
    await onSubmit(data);
  };
  const { handleSubmit } = form;

  const reservationUnitOptions =
    application.applicationSections?.flatMap((section) =>
      section.reservationUnitOptions.map((x) => ({
        label: x.reservationUnit.nameFi ?? "",
        value: x.reservationUnit.pk ?? 0,
      }))
    ) ?? [];
  return (
    <form noValidate onSubmit={handleSubmit(onSubmitHandler)}>
      <FormProvider {...form}>
        <TimeSelectorForm
          index={0}
          reservationUnitOptions={reservationUnitOptions}
          reservationUnitOpeningHours={reservationUnitOpeningHours}
          sectionOpeningHours={sectionOpeningHours}
          allSectionsOpeningHours={sectionsOpeningHours}
        />
        <button type="submit">submit</button>
        {validate && (
          <button type="button" onClick={() => void form.trigger()}>
            validate
          </button>
        )}
      </FormProvider>
    </form>
  );
}

function createMockSubmitValues(
  vals: Array<{ pk?: number; day: Weekday; start: number; end: number; priority?: Priority }>
): ApplicationPage2FormValues {
  const suitableTimeRanges = vals.map((val) => ({
    beginTime: hhmm(val.start),
    endTime: hhmm(val.end % (24 * 60)),
    pk: val.pk,
    dayOfTheWeek: val.day,
    priority: val.priority ?? Priority.Primary,
  }));
  return {
    applicationSections: [
      {
        appliedReservationsPerWeek: 1,
        minDuration: 7200,
        name: "foobar",
        pk: 1,
        priority: Priority.Primary,
        reservationUnitPk: 1,
        suitableTimeRanges,
      },
    ],
    pk: 1,
  };
}

// The mocked t() returns the key, so the weekday name is its translation key.
function weekdayLabel(day: Weekday): string {
  return `common:weekdayLongEnum.${day}`;
}

// The first cell of a painted run is named after the whole run, so pass its end.
// A run shorter than the section's minimum duration (2 h in the mocks) is also named as too short.
function cellName(
  state: "open" | "closed" | "unavailable" | "primary" | "secondary",
  day: Weekday,
  start: number,
  end: number = start + STEP,
  { tooShort = false }: { tooShort?: boolean | "nextToPrimary" } = {}
): string | RegExp {
  const name = `${weekdayLabel(day)}, ${hhmm(start)}–${hhmm(end)}, application:TimeSelector.legend.${state}`;
  if (!tooShort) {
    return name;
  }
  // The mocked t() appends its options (the formatted minimum duration), so match the reason up to them.
  const key = tooShort === "nextToPrimary" ? "tooShortNextToPrimary" : "tooShort";
  const escaped = `${name}, application:TimeSelector.${key}`.replaceAll(/[.*+?^${}()|[\]\\]/g, String.raw`\$&`);
  return new RegExp(`^${escaped}(?![A-Za-z])`);
}

function getGrid(view: ReturnType<typeof render>) {
  return view.getByLabelText("application:TimeSelector.calendarLabel");
}

describe("TimeSelector render single section", () => {
  test("should have priority radio buttons", () => {
    const view = customRender();
    const group = view.getByRole("group", { name: "application:Page2.prioritySelectLabel" });
    expect(
      within(group)
        .getAllByRole("radio")
        .map((radio) => radio.getAttribute("id"))
    ).toEqual([
      `applicationSections.0.priority.${Priority.Primary}`,
      `applicationSections.0.priority.${Priority.Secondary}`,
    ]);
  });

  test("should have reservation unit select", () => {
    const view = customRender();
    expect(
      view.getByLabelText("application:Page2.reservationUnitSelectLabel", {
        selector: "button",
      })
    ).toBeInTheDocument();
  });

  test("should have a quarter-hour time selector spanning the opening hours", () => {
    const view = customRender();
    const calendar = getGrid(view);

    // 07:00 - 24:00 is 17 hours of 4 cells, for each of 7 days
    expect(within(calendar).getAllByRole("gridcell", { hidden: true })).toHaveLength(7 * 17 * 4);
    expect(within(calendar).getAllByRole("columnheader", { hidden: true })).toHaveLength(7);
    expect(within(calendar).getAllByRole("rowheader", { hidden: true })).toHaveLength(17);

    for (const day of WEEKDAYS_SORTED) {
      const cell = within(calendar).getByLabelText(cellName("open", day, 14 * 60));
      expect(cell).toHaveAttribute("aria-selected", "false");
      expect(cell).not.toHaveAttribute("aria-disabled");
    }
  });

  test("shows every cell as unavailable when the reservation unit has no opening hours", () => {
    const view = customRender({ reservationUnitOpeningHours: [] });
    const calendar = getGrid(view);

    expect(within(calendar).getAllByRole("gridcell", { hidden: true })).toHaveLength(7 * 17 * 4);
    expect(within(calendar).queryAllByLabelText(/legend\.open/)).toHaveLength(0);
  });

  test("should have Legend for time selector", () => {
    const view = customRender();
    const legend = view.getByTestId("weekly-pattern__legend");
    expect(legend).toBeInTheDocument();
    const open = within(legend).getByText("application:TimeSelector.legend.open");
    expect(open).toBeInTheDocument();
    const unavailable = within(legend).getByText("application:TimeSelector.legend.unavailable");
    expect(unavailable).toBeInTheDocument();
    expect(within(legend).getByText("application:TimeSelector.legend.invalid")).toBeInTheDocument();
    // The priority radio buttons show what Primary and Secondary look like, so the legend leaves them out.
    expect(within(legend).queryByText("application:TimeSelector.legend.secondary")).not.toBeInTheDocument();
    expect(within(legend).queryByText("application:TimeSelector.legend.primary")).not.toBeInTheDocument();
  });

  test.for([
    {
      label: "one on wednesday",
      days: [{ day: Weekday.Wednesday, times: [{ start: 8, end: 16 }] }],
    },
    {
      label: "one on friday",
      days: [{ day: Weekday.Friday, times: [{ start: 11, end: 17 }] }],
    },
    {
      label: "on monday and thursday",
      days: [
        { day: Weekday.Monday, times: [{ start: 11, end: 17 }] },
        { day: Weekday.Thursday, times: [{ start: 9, end: 15 }] },
      ],
    },
    {
      label: "thursday with a gap",
      days: [
        {
          day: Weekday.Thursday,
          times: [
            { start: 8, end: 11 },
            { start: 14, end: 17 },
          ],
        },
      ],
    },
  ])("should render open and unavailable cells based on opening hours $label", ({ days }) => {
    const openTimes: TimeSelectorFragment[] = days.map((day, index) => ({
      id: createNodeId("TimeSelector", index),
      weekday: day.day,
      isClosed: false,
      reservableTimes: day.times.map((time) => ({
        begin: formatApiTimeUnsafe(time.start),
        end: formatApiTimeUnsafe(time.end),
      })),
    }));
    const view = customRender({ reservationUnitOpeningHours: openTimes });
    const calendar = getGrid(view);

    // the funnel always shows 07:00 to 24:00, whatever the opening hours are
    const axisStart = 7 * 60;
    const axisEnd = 24 * 60;
    const totalCells = (7 * (axisEnd - axisStart)) / STEP;
    const openCells = days.reduce(
      (acc, d) => acc + d.times.reduce((count, t) => count + ((t.end - t.start) * 60) / STEP, 0),
      0
    );

    expect(within(calendar).getAllByRole("gridcell", { hidden: true })).toHaveLength(totalCells);
    expect(within(calendar).getAllByLabelText(/legend\.open/)).toHaveLength(openCells);
    expect(within(calendar).getAllByLabelText(/legend\.unavailable/)).toHaveLength(totalCells - openCells);

    for (const day of WEEKDAYS_SORTED) {
      for (let minutes = axisStart; minutes < axisEnd; minutes += STEP) {
        const isOpen = days.some(
          (d) => d.day === day && d.times.some((t) => minutes >= t.start * 60 && minutes < t.end * 60)
        );
        expect(
          within(calendar).getByLabelText(cellName(isOpen ? "open" : "unavailable", day, minutes))
        ).toBeInTheDocument();
      }
    }
  });

  test("does not round opening hours to whole hours", () => {
    const openTimes: TimeSelectorFragment[] = [
      {
        id: createNodeId("TimeSelector", 0),
        weekday: Weekday.Monday,
        isClosed: false,
        reservableTimes: [{ begin: "08:30:00", end: "10:00:00" }],
      },
      {
        id: createNodeId("TimeSelector", 1),
        weekday: Weekday.Tuesday,
        isClosed: false,
        reservableTimes: [{ begin: "08:00:00", end: "10:00:00" }],
      },
    ];
    const view = customRender({ reservationUnitOpeningHours: openTimes });
    const calendar = getGrid(view);

    expect(within(calendar).getByLabelText(cellName("unavailable", Weekday.Monday, 8 * 60 + 15))).toBeInTheDocument();
    expect(within(calendar).getByLabelText(cellName("open", Weekday.Monday, 8 * 60 + 30))).toBeInTheDocument();
  });

  test("single application section should not have copy button", () => {
    const view = customRender();
    expect(view.queryByText("application:Page2.copyTimes")).not.toBeInTheDocument();
  });

  test("should have a copy buttons if more than one section", () => {
    const view = customRender({ nSections: 2 });
    expect(view.getByRole("button", { name: "application:Page2.copyTimes" })).toBeInTheDocument();
  });
});

describe("TimeSelector time slot selecting", () => {
  test("time slots can be selected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    // tuesday 14:00 - 14:15
    const select = within(getGrid(view)).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60));
    await user.click(select);
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledOnce();
    const vals = createMockSubmitValues([{ day: Weekday.Tuesday, start: 14 * 60, end: 14 * 60 + STEP }]);
    expect(onSubmit).toHaveBeenCalledWith(vals);
  });

  test("a run being dragged shows as valid until the mouse button is released", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    const calendar = getGrid(view);
    // A finished click leaves too short runs on Monday and on Tuesday morning.
    await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Monday, 9 * 60)));
    await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, 9 * 60)));
    const shortRun = (day: Weekday) =>
      within(calendar).getByLabelText(cellName("primary", day, 9 * 60, undefined, { tooShort: true }));
    expect(shortRun(Weekday.Monday)).toHaveAttribute("data-invalid");
    expect(shortRun(Weekday.Tuesday)).toHaveAttribute("data-invalid");

    // Holding the button down paints Tuesday's cells, but the run isn't checked yet.
    await user.pointer({
      keys: "[MouseLeft>]",
      target: within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60)),
    });
    await user.pointer({ target: within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60 + STEP)) });
    expect(
      within(calendar).getByLabelText(cellName("primary", Weekday.Tuesday, 14 * 60, 14 * 60 + 2 * STEP))
    ).not.toHaveAttribute("data-invalid");
    // Only the time being painted waits. The other runs keep showing as invalid, also the one on the same day.
    expect(shortRun(Weekday.Monday)).toHaveAttribute("data-invalid");
    expect(shortRun(Weekday.Tuesday)).toHaveAttribute("data-invalid");

    // Released at 30 min, shorter than the 2 h minimum.
    await user.pointer({ keys: "[/MouseLeft]" });
    expect(
      within(calendar).getByLabelText(
        cellName("primary", Weekday.Tuesday, 14 * 60, 14 * 60 + 2 * STEP, { tooShort: true })
      )
    ).toHaveAttribute("data-invalid");
  });

  test("a Shift+Arrow sweep is checked when Shift is released", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    const calendar = getGrid(view);

    within(calendar)
      .getByLabelText(cellName("open", Weekday.Monday, 9 * 60))
      .focus();
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}");
    expect(
      within(calendar).getByLabelText(cellName("primary", Weekday.Monday, 9 * 60, 9 * 60 + 3 * STEP))
    ).not.toHaveAttribute("data-invalid");

    await user.keyboard("{/Shift}");
    expect(
      within(calendar).getByLabelText(
        cellName("primary", Weekday.Monday, 9 * 60, 9 * 60 + 3 * STEP, { tooShort: true })
      )
    ).toHaveAttribute("data-invalid");
  });

  test("time slots can be deselected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    const calendar = getGrid(view);
    const submittedRanges = () => onSubmit.mock.lastCall?.[0]?.applicationSections[0]?.suitableTimeRanges;
    // A secondary time covers only the clicked cell, so the same click removes all of it.
    await user.click(view.getByRole("radio", { name: "application:Page2.priorityLabels.secondary" }));
    await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60)));
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(submittedRanges()).toEqual([
      { dayOfTheWeek: Weekday.Tuesday, beginTime: "14:00", endTime: "14:15", priority: Priority.Secondary },
    ]);

    await user.click(
      within(calendar).getByLabelText(cellName("secondary", Weekday.Tuesday, 14 * 60, undefined, { tooShort: true }))
    );
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledTimes(2);
    expect(submittedRanges()).toEqual([]);
  });

  test("all time slots should match the existing application section", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ page: "page2", onSubmit });
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledOnce();
    const vals = createMockSubmitValues([{ pk: 1, day: Weekday.Wednesday, start: 8 * 60, end: 16 * 60 }]);
    expect(onSubmit).toHaveBeenLastCalledWith(vals);
  });

  test("a run shorter than the minimum duration is marked invalid, a long enough one is not", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    const calendar = getGrid(view);

    // The existing Wednesday 08:00-16:00 run is longer than the 2 h minimum.
    expect(
      within(calendar).getByLabelText(cellName("primary", Weekday.Wednesday, 8 * 60, 16 * 60))
    ).not.toHaveAttribute("data-invalid");

    // A secondary time is not lengthened, so a single cell of it is too short.
    await user.click(view.getByRole("radio", { name: "application:Page2.priorityLabels.secondary" }));
    await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60)));
    const shortRun = within(calendar).getByLabelText(
      cellName("secondary", Weekday.Tuesday, 14 * 60, undefined, { tooShort: true })
    );
    expect(shortRun).toHaveAttribute("data-invalid");
    // The end time is its own element, so it can be styled on its own.
    expect(shortRun.querySelector("[data-run-end-time]")).toHaveTextContent("14:15");
  });

  test("a secondary buffer next to a too short primary run is too short too", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    const calendar = getGrid(view);

    // 15 min of primary, then secondary right after it up to 16:00: a 2 h block, the minimum in the mocks.
    await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60)));
    await user.click(view.getByRole("radio", { name: "application:Page2.priorityLabels.secondary" }));
    for (let minutes = 14 * 60 + STEP; minutes < 16 * 60; minutes += STEP) {
      await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, minutes)));
    }

    // The primary run is too short by itself, so the shorter buffer touching it is too short too.
    expect(
      within(calendar).getByLabelText(cellName("primary", Weekday.Tuesday, 14 * 60, undefined, { tooShort: true }))
    ).toHaveAttribute("data-invalid");
    expect(
      within(calendar).getByLabelText(
        cellName("secondary", Weekday.Tuesday, 14 * 60 + STEP, 16 * 60, { tooShort: "nextToPrimary" })
      )
    ).toHaveAttribute("data-invalid");
  });

  test("a long enough primary run with a short secondary buffer after it is valid", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    const calendar = getGrid(view);

    // 2 h of primary, then 30 min of secondary right after it.
    for (let minutes = 14 * 60; minutes < 16 * 60; minutes += STEP) {
      await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, minutes)));
    }
    await user.click(view.getByRole("radio", { name: "application:Page2.priorityLabels.secondary" }));
    for (let minutes = 16 * 60; minutes < 16 * 60 + 30; minutes += STEP) {
      await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, minutes)));
    }

    expect(within(calendar).getByLabelText(cellName("primary", Weekday.Tuesday, 14 * 60, 16 * 60))).not.toHaveAttribute(
      "data-invalid"
    );
    expect(
      within(calendar).getByLabelText(cellName("secondary", Weekday.Tuesday, 16 * 60, 16 * 60 + 30))
    ).not.toHaveAttribute("data-invalid");
  });

  test("touching runs of different priorities are drawn as one block, with ends only at its edges", async () => {
    const user = userEvent.setup();
    const view = customRender();
    const calendar = getGrid(view);
    const cellAt = (minutes: number) =>
      calendar.querySelector(`td[data-weekday="TUESDAY"][data-begin-minutes="${minutes}"]`);

    // 14:00-14:30 primary, then 14:30-15:00 secondary right after it.
    for (const minutes of [14 * 60, 14 * 60 + STEP]) {
      await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, minutes)));
    }
    await user.click(view.getByRole("radio", { name: "application:Page2.priorityLabels.secondary" }));
    for (const minutes of [14 * 60 + 2 * STEP, 14 * 60 + 3 * STEP]) {
      await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, minutes)));
    }

    // Each run still starts and ends where its priority changes.
    expect(cellAt(14 * 60 + STEP)).toHaveAttribute("data-run-end");
    expect(cellAt(14 * 60 + 2 * STEP)).toHaveAttribute("data-run-start");
    // But only the first and the last cell are the block's ends, so the seam between the runs isn't drawn as an end.
    expect(cellAt(14 * 60)).toHaveAttribute("data-block-start");
    expect(cellAt(14 * 60 + STEP)).not.toHaveAttribute("data-block-end");
    expect(cellAt(14 * 60 + 2 * STEP)).not.toHaveAttribute("data-block-start");
    expect(cellAt(14 * 60 + 3 * STEP)).toHaveAttribute("data-block-end");
  });

  test("hovering a too short run shows why in a tooltip, and Escape hides it", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    const calendar = getGrid(view);

    // A long enough run has no tooltip.
    await user.hover(within(calendar).getByLabelText(cellName("primary", Weekday.Wednesday, 8 * 60, 16 * 60)));
    expect(view.queryByTestId("weekly-pattern__run-error")).not.toBeInTheDocument();

    await user.click(view.getByRole("radio", { name: "application:Page2.priorityLabels.secondary" }));
    await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60)));
    await user.hover(
      within(calendar).getByLabelText(cellName("secondary", Weekday.Tuesday, 14 * 60, undefined, { tooShort: true }))
    );
    expect(view.getByTestId("weekly-pattern__run-error")).toHaveTextContent("application:TimeSelector.tooShort");

    await user.keyboard("{Escape}");
    expect(view.queryByTestId("weekly-pattern__run-error")).not.toBeInTheDocument();
  });

  test("a clicked too short run shows no tooltip once the pointer leaves, but keyboard focus does", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    const calendar = getGrid(view);

    // The click focuses the cell, as the grid keeps one cell focusable.
    await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60)));
    const run = within(calendar).getByLabelText(
      cellName("primary", Weekday.Tuesday, 14 * 60, undefined, { tooShort: true })
    );
    expect(run).toHaveFocus();
    expect(view.getByTestId("weekly-pattern__run-error")).toBeInTheDocument();

    // Leaving hides it (after a short delay), although the run still holds focus.
    await user.unhover(run);
    await waitFor(() => expect(view.queryByTestId("weekly-pattern__run-error")).not.toBeInTheDocument());

    // Moving onto the run from the keyboard shows it.
    await user.keyboard("{ArrowDown}{ArrowUp}");
    expect(
      within(calendar).getByLabelText(cellName("primary", Weekday.Tuesday, 14 * 60, undefined, { tooShort: true }))
    ).toHaveFocus();
    expect(view.getByTestId("weekly-pattern__run-error")).toBeInTheDocument();
  });

  test("an existing application section is shown as selected", () => {
    const view = customRender({ page: "page2" });
    const calendar = getGrid(view);

    expect(within(calendar).getByLabelText(cellName("primary", Weekday.Wednesday, 8 * 60, 16 * 60))).toHaveAttribute(
      "aria-selected",
      "true"
    );
    expect(within(calendar).getByLabelText(cellName("primary", Weekday.Wednesday, 15 * 60 + 45))).toBeInTheDocument();
    expect(within(calendar).getByLabelText(cellName("open", Weekday.Wednesday, 16 * 60))).toHaveAttribute(
      "aria-selected",
      "false"
    );
  });

  test("dragging over cells selects one range", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    const calendar = getGrid(view);

    await user.pointer([
      {
        keys: "[MouseLeft>]",
        target: within(calendar).getByLabelText(cellName("open", Weekday.Monday, 9 * 60)),
      },
      { target: within(calendar).getByLabelText(cellName("open", Weekday.Monday, 9 * 60 + 15)) },
      { target: within(calendar).getByLabelText(cellName("open", Weekday.Monday, 9 * 60 + 30)) },
      { target: within(calendar).getByLabelText(cellName("open", Weekday.Monday, 9 * 60 + 45)) },
      { keys: "[/MouseLeft]" },
    ]);
    await user.click(view.getByRole("button", { name: "submit" }));

    expect(onSubmit).toHaveBeenCalledWith(
      createMockSubmitValues([{ day: Weekday.Monday, start: 9 * 60, end: 10 * 60 }])
    );
  });

  test("shift and arrow keys select a range from the keyboard", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    const calendar = getGrid(view);

    within(calendar)
      .getByLabelText(cellName("open", Weekday.Monday, 9 * 60))
      .focus();
    await user.keyboard("{Shift>}{ArrowDown}{ArrowDown}{ArrowDown}{/Shift}");
    await user.click(view.getByRole("button", { name: "submit" }));

    expect(onSubmit).toHaveBeenCalledWith(
      createMockSubmitValues([{ day: Weekday.Monday, start: 9 * 60, end: 9 * 60 + 4 * STEP }])
    );
  });

  test("cells outside the opening hours cannot be selected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const openTimes: TimeSelectorFragment[] = [
      {
        id: createNodeId("TimeSelector", 0),
        weekday: Weekday.Monday,
        isClosed: false,
        reservableTimes: [{ begin: "10:00:00", end: "12:00:00" }],
      },
      {
        id: createNodeId("TimeSelector", 1),
        weekday: Weekday.Tuesday,
        isClosed: false,
        reservableTimes: [{ begin: "08:00:00", end: "12:00:00" }],
      },
    ];
    const view = customRender({ onSubmit, reservationUnitOpeningHours: openTimes });

    await user.click(within(getGrid(view)).getByLabelText(cellName("unavailable", Weekday.Monday, 9 * 60)));
    await user.click(view.getByRole("button", { name: "submit" }));

    expect(onSubmit).toHaveBeenCalledWith(createMockSubmitValues([]));
  });
});

describe("TimeSelector copy times", () => {
  beforeEach(() => {
    errorToast.mockClear();
    successToast.mockClear();
  });

  test("copies the selection to every section without carrying primary keys over", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ page: "page2", nSections: 2, onSubmit });

    await user.click(view.getByRole("button", { name: "application:Page2.copyTimes" }));
    await user.click(view.getByRole("button", { name: "submit" }));

    expect(onSubmit).toHaveBeenCalledOnce();
    const submitted = onSubmit.mock.calls[0]?.[0] as ApplicationPage2FormValues;
    const copied = [
      { beginTime: "08:00", endTime: "16:00", dayOfTheWeek: Weekday.Wednesday, priority: Priority.Primary },
    ];
    expect(submitted.applicationSections).toHaveLength(2);
    for (const section of submitted.applicationSections) {
      expect(section.suitableTimeRanges).toEqual(copied);
    }
    expect(successToast).toHaveBeenCalledOnce();
    expect(errorToast).not.toHaveBeenCalled();
  });

  test("asks before replacing other sections' own times, and copies only when accepted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ page: "page2", nSections: 2, onSubmit });
    // The first section gets a time the second one doesn't have.
    await user.click(within(getGrid(view)).getByLabelText(cellName("open", Weekday.Monday, 10 * 60)));

    await user.click(view.getByRole("button", { name: "application:Page2.copyTimes" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent('application:Page2.copyConfirm.text {"names":"foobar"}');
    await user.click(within(dialog).getByRole("button", { name: "common:cancel" }));
    await user.click(view.getByRole("button", { name: "submit" }));

    const kept = onSubmit.mock.calls[0]?.[0] as ApplicationPage2FormValues;
    expect(kept.applicationSections[1]?.suitableTimeRanges).toHaveLength(1);
    expect(successToast).not.toHaveBeenCalled();

    await user.click(view.getByRole("button", { name: "application:Page2.copyTimes" }));
    await user.click(
      within(screen.getByRole("dialog")).getByRole("button", { name: "application:Page2.copyConfirm.accept" })
    );
    await user.click(view.getByRole("button", { name: "submit" }));

    const copied = onSubmit.mock.calls[1]?.[0] as ApplicationPage2FormValues;
    expect(copied.applicationSections[1]?.suitableTimeRanges).toEqual(
      copied.applicationSections[0]?.suitableTimeRanges
    );
    expect(successToast).toHaveBeenCalledOnce();
  });

  test("shows an error when the copied times are outside another section's opening hours", async () => {
    const user = userEvent.setup();
    const mondayOnly = OPEN_ALL_WEEK.filter(({ weekday }) => weekday === Weekday.Monday);
    const view = customRender({ page: "page2", nSections: 2, allSectionsOpeningHours: [OPEN_ALL_WEEK, mondayOnly] });

    await user.click(view.getByRole("button", { name: "application:Page2.copyTimes" }));

    expect(errorToast).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining("copyCellsOutsideOpeningHours") })
    );
    expect(successToast).not.toHaveBeenCalled();
  });
});

describe("TimeSelector times outside the opening hours", () => {
  test("are marked in the list, before being too short", () => {
    // The mock section has a time on Wednesday, 08:00-16:00, long enough but outside these hours.
    const mondayOnly = OPEN_ALL_WEEK.filter(({ weekday }) => weekday === Weekday.Monday);
    const view = customRender({ page: "page2", reservationUnitOpeningHours: mondayOnly });

    const item = within(view.getByTestId("time-selector__form-0")).getByRole("listitem");
    expect(item).toHaveTextContent(
      "application:TimeSelector.legend.primary - (application:TimeSelector.form.outsideOpeningHours!)"
    );
    expect(item).toHaveAttribute("data-invalid");
  });

  test("are shown as invalid", () => {
    // The mock section has a time on Wednesday, 08:00-16:00.
    const mondayOnly = OPEN_ALL_WEEK.filter(({ weekday }) => weekday === Weekday.Monday);
    const view = customRender({ page: "page2", reservationUnitOpeningHours: mondayOnly });

    const cell = within(getGrid(view)).getByLabelText(new RegExp(`^${weekdayLabel(Weekday.Wednesday)}, 08:00–16:00`));
    expect(cell).toHaveAttribute("data-invalid");
    expect(cell).toHaveAccessibleName(expect.stringContaining("application:TimeSelector.outsideOpeningHours"));
  });
});

describe("TimeSelector error message", () => {
  function findError(view: ReturnType<typeof render>) {
    return view.findByTestId("application__page2--notification-min-duration");
  }

  test("tells how many reservations per week were applied for, and how many fit", async () => {
    const user = userEvent.setup();
    // The mock's Wednesday 08:00-16:00 fits four reservations of 2 h.
    const view = customRender({ page: "page2", validate: true, appliedReservationsPerWeek: 5 });
    await user.click(view.getByRole("button", { name: "validate" }));

    const error = await findError(view);
    expect(error).toHaveTextContent(
      'application:validation.calendar.At least as many suitable time ranges as applied reservations per week {"applied":5,"fitting":4}'
    );
    expect(within(error).queryByRole("list")).not.toBeInTheDocument();
  });

  test("lists the too short times", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2", validate: true });
    await user.click(within(getGrid(view)).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60)));

    const list = within(await findError(view)).getByRole("list", {
      name: "application:validation.calendar.tooShortTimes",
    });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent)
    ).toEqual(["common:weekdayLongEnum.TUESDAY 14:00-14:15, application:TimeSelector.legend.primary"]);
  });

  test("lists the times outside the opening hours", async () => {
    const user = userEvent.setup();
    const mondayOnly = OPEN_ALL_WEEK.filter(({ weekday }) => weekday === Weekday.Monday);
    const view = customRender({ page: "page2", validate: true, reservationUnitOpeningHours: mondayOnly });
    await user.click(view.getByRole("button", { name: "validate" }));

    const list = within(await findError(view)).getByRole("list", {
      name: "application:validation.calendar.outsideOpeningHoursTimes",
    });
    expect(
      within(list)
        .getAllByRole("listitem")
        .map((li) => li.textContent)
    ).toEqual(["common:weekdayLongEnum.WEDNESDAY 08:00-16:00, application:TimeSelector.legend.primary"]);
  });
});

describe("TimeSelector calendar select", () => {
  test("last time slot should be converted from 24:00 to 0:00", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ page: "page1", onSubmit });
    const select = within(getGrid(view)).getByLabelText(cellName("open", Weekday.Tuesday, 24 * 60 - STEP));
    await user.click(select);
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledOnce();
    const vals = createMockSubmitValues([{ day: Weekday.Tuesday, start: 24 * 60 - STEP, end: 24 * 60 }]);
    expect(onSubmit).toHaveBeenCalledWith(vals);
  });
});

describe("TimeSelector priority select", () => {
  function priorityRadio(view: ReturnType<typeof render>, priority: "primary" | "secondary") {
    return view.getByRole("radio", { name: `application:Page2.priorityLabels.${priority}` });
  }

  test("should preselect primary time", () => {
    const view = customRender({ page: "page2" });
    expect(priorityRadio(view, "primary")).toBeChecked();
    expect(priorityRadio(view, "secondary")).not.toBeChecked();
  });
  test("priority select can be changed", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    await user.click(priorityRadio(view, "secondary"));
    expect(priorityRadio(view, "secondary")).toBeChecked();
    expect(priorityRadio(view, "primary")).not.toBeChecked();
  });

  test("selected time slots take the chosen priority", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    await user.click(priorityRadio(view, "secondary"));

    await user.click(within(getGrid(view)).getByLabelText(cellName("open", Weekday.Friday, 12 * 60)));
    await user.click(view.getByRole("button", { name: "submit" }));

    expect(onSubmit).toHaveBeenCalledWith({
      ...createMockSubmitValues([
        { day: Weekday.Friday, start: 12 * 60, end: 12 * 60 + STEP, priority: Priority.Secondary },
      ]),
      applicationSections: [
        expect.objectContaining({
          priority: Priority.Secondary,
          suitableTimeRanges: [expect.objectContaining({ priority: Priority.Secondary })],
        }),
      ],
    });
  });
});

describe("TimeSelector form alternative", () => {
  function getForm(view: ReturnType<typeof render>) {
    return view.getByTestId("time-selector__form-0");
  }

  test("has a skip link from the calendar to the form", () => {
    const view = customRender();
    expect(view.getByRole("link", { name: "application:TimeSelector.skipToForm" })).toHaveAttribute(
      "href",
      "#time-selector__form-0"
    );
    expect(getForm(view)).toHaveAttribute("id", "time-selector__form-0");
  });

  test("a time can be added with the form and shows in the calendar", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    const form = getForm(view);

    await user.selectOptions(within(form).getByLabelText("application:TimeSelector.form.day"), Weekday.Thursday);
    await user.selectOptions(within(form).getByLabelText("application:TimeSelector.form.from"), String(10 * 60));
    await user.selectOptions(within(form).getByLabelText("application:TimeSelector.form.to"), String(12 * 60));
    await user.click(within(form).getByRole("button", { name: "application:TimeSelector.form.add" }));

    expect(
      within(getGrid(view)).getByLabelText(cellName("primary", Weekday.Thursday, 10 * 60, 12 * 60))
    ).toHaveAttribute("aria-selected", "true");
    expect(within(form).getByRole("status")).toHaveTextContent("application:TimeSelector.announcements.painted");

    await user.click(view.getByRole("button", { name: "submit" }));
    expect(onSubmit).toHaveBeenCalledWith(
      createMockSubmitValues([{ day: Weekday.Thursday, start: 10 * 60, end: 12 * 60 }])
    );
  });

  test("a time can be removed with the form", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ page: "page2", onSubmit });
    const form = getForm(view);

    await user.click(within(form).getByRole("button", { name: /application:TimeSelector\.form\.removeTime/ }));
    expect(within(form).getByText("application:TimeSelector.form.empty")).toBeInTheDocument();

    await user.click(view.getByRole("button", { name: "submit" }));
    expect(onSubmit).toHaveBeenCalledWith(createMockSubmitValues([]));
  });

  test("a time that ends before it starts is refused", async () => {
    const user = userEvent.setup();
    const view = customRender();
    const form = getForm(view);

    await user.selectOptions(within(form).getByLabelText("application:TimeSelector.form.from"), String(12 * 60));
    await user.selectOptions(within(form).getByLabelText("application:TimeSelector.form.to"), String(11 * 60));
    await user.click(within(form).getByRole("button", { name: "application:TimeSelector.form.add" }));

    expect(within(form).getByRole("alert")).toHaveTextContent("application:TimeSelector.form.errors.endAfterStart");
  });

  test("a time outside the opening hours is refused", async () => {
    const user = userEvent.setup();
    const openTimes: TimeSelectorFragment[] = [
      {
        id: createNodeId("TimeSelector", 0),
        weekday: Weekday.Tuesday,
        isClosed: false,
        reservableTimes: [{ begin: "10:00:00", end: "12:00:00" }],
      },
    ];
    const view = customRender({ reservationUnitOpeningHours: openTimes });
    const form = getForm(view);

    await user.click(within(form).getByRole("button", { name: "application:TimeSelector.form.add" }));

    expect(within(form).getByRole("alert")).toHaveTextContent("application:TimeSelector.form.errors.outsideReservable");
  });
});

describe("TimeSelector with several reservation units", () => {
  // The shown unit opens Tuesday 10:00-12:00, and another unit in the section opens Tuesday 12:00-14:00.
  const tuesday = (index: number, begin: string, end: string): TimeSelectorFragment => ({
    id: createNodeId("TimeSelector", index),
    weekday: Weekday.Tuesday,
    isClosed: false,
    reservableTimes: [{ begin, end }],
  });
  const shownUnit = [tuesday(0, "10:00:00", "12:00:00")];
  const sectionUnits = [...shownUnit, tuesday(1, "12:00:00", "14:00:00")];

  test("a time only another unit opens is closed, and a time no unit opens is unavailable", () => {
    const view = customRender({ reservationUnitOpeningHours: shownUnit, sectionOpeningHours: sectionUnits });
    const calendar = getGrid(view);

    expect(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, 11 * 60))).not.toHaveAttribute(
      "aria-disabled"
    );
    expect(within(calendar).getByLabelText(cellName("closed", Weekday.Tuesday, 12 * 60))).not.toHaveAttribute(
      "aria-disabled"
    );
    expect(within(calendar).getByLabelText(cellName("unavailable", Weekday.Tuesday, 14 * 60))).toHaveAttribute(
      "aria-disabled",
      "true"
    );
  });

  test("a time only another unit opens can be painted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit, reservationUnitOpeningHours: shownUnit, sectionOpeningHours: sectionUnits });

    await user.click(within(getGrid(view)).getByLabelText(cellName("closed", Weekday.Tuesday, 12 * 60)));
    await user.click(view.getByRole("button", { name: "submit" }));

    expect(onSubmit).toHaveBeenCalledWith(
      createMockSubmitValues([{ day: Weekday.Tuesday, start: 12 * 60, end: 12 * 60 + STEP }])
    );
  });

  test("a time no unit opens cannot be painted", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit, reservationUnitOpeningHours: shownUnit, sectionOpeningHours: sectionUnits });

    await user.click(within(getGrid(view)).getByLabelText(cellName("unavailable", Weekday.Tuesday, 14 * 60)));
    await user.click(view.getByRole("button", { name: "submit" }));

    expect(onSubmit).toHaveBeenCalledWith(createMockSubmitValues([]));
  });

  test("the form adds a time only another unit opens, and refuses one no unit opens", async () => {
    const user = userEvent.setup();
    const view = customRender({ reservationUnitOpeningHours: shownUnit, sectionOpeningHours: sectionUnits });
    const form = view.getByTestId("time-selector__form-0");
    const add = async (from: number, to: number) => {
      await user.selectOptions(within(form).getByLabelText("application:TimeSelector.form.day"), Weekday.Tuesday);
      await user.selectOptions(within(form).getByLabelText("application:TimeSelector.form.from"), String(from));
      await user.selectOptions(within(form).getByLabelText("application:TimeSelector.form.to"), String(to));
      await user.click(within(form).getByRole("button", { name: "application:TimeSelector.form.add" }));
    };

    await add(12 * 60, 13 * 60);
    expect(
      within(getGrid(view)).getByLabelText(cellName("primary", Weekday.Tuesday, 12 * 60, 13 * 60, { tooShort: true }))
    ).toBeInTheDocument();

    await add(13 * 60, 15 * 60);
    expect(within(form).getByRole("alert")).toHaveTextContent("application:TimeSelector.form.errors.outsideReservable");
  });

  test("a too short time is marked in the list too", async () => {
    const user = userEvent.setup();
    const view = customRender({ page: "page2" });
    await user.click(within(getGrid(view)).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60)));

    const items = within(view.getByTestId("time-selector__form-0")).getAllByRole("listitem");
    const item = (day: Weekday) =>
      items.find((li) => li.textContent?.startsWith(`common:weekdayLongEnum.${day}`)) ?? null;
    expect(item(Weekday.Tuesday)).toHaveTextContent(
      "application:TimeSelector.legend.primary - (application:TimeSelector.form.tooShort!)"
    );
    expect(item(Weekday.Tuesday)).toHaveAttribute("data-invalid");
    // Wednesday's 8 h primary time is long enough.
    expect(item(Weekday.Wednesday)).not.toHaveTextContent("application:TimeSelector.form.tooShort");
    expect(item(Weekday.Wednesday)).not.toHaveAttribute("data-invalid");
  });

  test("the legend explains closed and unavailable times apart", () => {
    const view = customRender({ reservationUnitOpeningHours: shownUnit, sectionOpeningHours: sectionUnits });
    const legend = view.getByTestId("weekly-pattern__legend");

    expect(within(legend).getByText("application:TimeSelector.legend.closed")).toBeInTheDocument();
    expect(within(legend).getByText("application:TimeSelector.legend.unavailable")).toBeInTheDocument();
  });
});
