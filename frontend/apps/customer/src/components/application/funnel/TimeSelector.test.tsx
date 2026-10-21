import { FormProvider, useForm } from "react-hook-form";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { WEEKDAYS_SORTED } from "ui/src/modules/const";
import { formatApiTimeUnsafe } from "ui/src/modules/date-utils";
import { createNodeId, formatTimeStruct } from "ui/src/modules/helpers";
import { Priority, Weekday } from "@gql/gql-types";
import type { ApplicationPage2Query, TimeSelectorFragment } from "@gql/gql-types";
import { createMockApplicationFragment } from "@test/application.mocks";
import type { CreateMockApplicationFragmentProps } from "@test/application.mocks";
import { selectOption } from "@test/test.utils";
import { convertApplicationPage2 } from "./form";
import type { ApplicationPage2FormValues } from "./form";
import { TimeSelectorForm } from "./TimeSelector";
import type { TimeSelectorProps } from "./TimeSelector";

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
  ...props
}: TimeSelectorMockProps) {
  const application: ApplicationPage2 = createMockApplicationFragment(props);
  const form = useForm<ApplicationPage2FormValues>({
    mode: "onChange",
    defaultValues: convertApplicationPage2(application),
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
        />
        <button type="submit">submit</button>
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

// The mocked language is Finnish and the mocked t() returns the key, so the labels are predictable.
function weekdayLabel(day: Weekday): string {
  const monday = Date.UTC(2024, 0, 1);
  const offset = WEEKDAYS_SORTED.indexOf(day);
  return new Intl.DateTimeFormat("fi", { weekday: "long", timeZone: "UTC" }).format(
    new Date(monday + offset * 86_400_000)
  );
}

// The first cell of a painted run is named after the whole run, so pass its end.
function cellName(
  state: "open" | "unavailable" | "primary" | "secondary",
  day: Weekday,
  start: number,
  end: number = start + STEP
): string {
  return `${weekdayLabel(day)}, ${hhmm(start)}–${hhmm(end)}, application:TimeSelector.legend.${state}`;
}

function getGrid(view: ReturnType<typeof render>) {
  return view.getByLabelText("application:TimeSelector.calendarLabel");
}

describe("TimeSelector render single section", () => {
  test("should have info section", () => {
    const view = customRender();
    const info = view.getAllByText("application:Page2.info");
    // HDS notification has invisible label with same text
    expect(info).toHaveLength(2);
  });

  test("should have priority select", () => {
    const view = customRender();
    const options = view.getByTestId("time-selector__options-0");
    expect(
      within(options).getByLabelText("application:Page2.prioritySelectLabel", {
        selector: "button",
      })
    ).toBeInTheDocument();
  });

  test("should have reservation unit select", () => {
    const view = customRender();
    const options = view.getByTestId("time-selector__options-0");
    expect(
      within(options).getByLabelText("application:Page2.reservationUnitSelectLabel", {
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
    const secondary = within(legend).getByText("application:TimeSelector.legend.secondary");
    expect(secondary).toBeInTheDocument();
    const primary = within(legend).getByText("application:TimeSelector.legend.primary");
    expect(primary).toBeInTheDocument();
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

  test("all time slots should be empty for new application", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledOnce();
    const vals = createMockSubmitValues([]);
    expect(onSubmit).toHaveBeenCalledWith(vals);
  });

  test("time slots can be deselected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    const calendar = getGrid(view);
    // tuesday 14:00 - 14:15
    await user.click(within(calendar).getByLabelText(cellName("open", Weekday.Tuesday, 14 * 60)));
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledOnce();
    const vals = createMockSubmitValues([{ day: Weekday.Tuesday, start: 14 * 60, end: 14 * 60 + STEP }]);
    expect(onSubmit).toHaveBeenLastCalledWith(vals);
    await user.click(within(calendar).getByLabelText(cellName("primary", Weekday.Tuesday, 14 * 60)));
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledTimes(2);
    const vals2 = createMockSubmitValues([]);
    expect(onSubmit).toHaveBeenLastCalledWith(vals2);
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
  test("should preselect primary time", () => {
    const view = customRender({ page: "page2" });
    const selectBtn = view.getByLabelText("application:Page2.prioritySelectLabel", {
      selector: "button",
    });
    expect(selectBtn).toBeInTheDocument();
    expect(selectBtn).toHaveTextContent("application:Page2.priorityLabels.primary");
  });
  test("priority select can be changed", async () => {
    const view = customRender({ page: "page2" });
    await selectOption(view, "application:Page2.prioritySelectLabel", /Page2.priorityLabels.secondary/);
    const selectBtn = view.getByLabelText("application:Page2.prioritySelectLabel", {
      selector: "button",
    });
    expect(selectBtn).toHaveTextContent("application:Page2.priorityLabels.secondary");
  });

  test("selected time slots take the chosen priority", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    await selectOption(view, "application:Page2.prioritySelectLabel", /Page2.priorityLabels.secondary/);

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
