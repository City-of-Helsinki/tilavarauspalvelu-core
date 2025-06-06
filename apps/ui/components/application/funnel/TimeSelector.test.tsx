import { FormProvider, useForm } from "react-hook-form";
import { test, describe, expect, vi } from "vitest";
import {
  type ApplicationPage2FormValues,
  convertApplicationPage2,
} from "./form";
import { TimeSelectorForm, type TimeSelectorProps } from "./TimeSelector";
import {
  createMockApplicationFragment,
  type CreateMockApplicationFragmentProps,
} from "@test/application.mocks";
import {
  type ApplicationPage2Query,
  Priority,
  type TimeSelectorFragment,
} from "@/gql/gql-types";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Day, transformWeekday } from "common/src/conversion";
import { base64encode, formatTimeStruct } from "common/src/helpers";
import { type OpenHoursState } from "common/src/components/ApplicationTimeSelector";
import { selectOption } from "@/test/test.utils";

type ApplicationPage2 = NonNullable<ApplicationPage2Query["application"]>;

interface TimeSelectorMockProps extends CreateMockApplicationFragmentProps {
  onSubmit?: (appToSave: ApplicationPage2FormValues) => Promise<void>;
  reservationUnitOpeningHours?: TimeSelectorProps["reservationUnitOpeningHours"];
}

function customRender(
  props: TimeSelectorMockProps = {}
): ReturnType<typeof render> {
  if (props.page == null) {
    props.page = "page1";
  }
  return render(<WrapTimeSelector {...props} />);
}

// Have to wrap to custome component to use hooks
function WrapTimeSelector({
  onSubmit = vi.fn(),
  reservationUnitOpeningHours = [],
  ...props
}: TimeSelectorMockProps) {
  const application: ApplicationPage2 = createMockApplicationFragment(props);
  const form = useForm<ApplicationPage2FormValues>({
    mode: "onChange",
    defaultValues: convertApplicationPage2(application),
  });

  // wrap handler to match the only form values
  const onSubmitHandler = (data: ApplicationPage2FormValues) => {
    onSubmit(data);
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

// FIXME tie this to the original mock value
function createMockSubmitValues(
  vals: { pk?: number; day: Day; start: number; end: number }[]
): ApplicationPage2FormValues {
  const suitableTimeRanges = vals.map((val) => ({
    beginTime: formatTimeStruct({ hour: val.start, minute: 0 }),
    endTime: formatTimeStruct({ hour: val.end, minute: 0 }),
    pk: val.pk,
    dayOfTheWeek: transformWeekday(val.day),
    priority: Priority.Primary,
  }));
  return {
    applicationSections: [
      {
        appliedReservationsPerWeek: 1,
        minDuration: 7200,
        name: "foobar",
        pk: 1,
        priority: "primary",
        reservationUnitPk: 1,
        suitableTimeRanges,
      },
    ],
    pk: 1,
  };
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
    // const reservationUnitSelect =
    expect(
      within(options).getByLabelText(
        "application:Page2.reservationUnitSelectLabel",
        {
          selector: "button",
        }
      )
    ).toBeInTheDocument();
  });

  test("should have time selector", () => {
    const view = customRender();
    const calendar = view.getByLabelText(
      "application:TimeSelector.calendarLabel"
    );
    expect(calendar).toBeInTheDocument();

    for (let day = 0; day < 7; day += 1) {
      for (let hour = 7; hour <= 23; hour += 1) {
        expect(
          within(calendar).getByTestId(`time-selector__button--${day}-${hour}`)
        ).toBeInTheDocument();
        const btn = within(calendar).getByRole("option", {
          name: `application:TimeSelector.legend.unavailable: common:weekDay.${day} ${hour} - ${hour + 1}`,
        });
        expect(btn).toBeInTheDocument();
        expect(btn).toHaveAttribute("aria-selected", "false");
        expect(btn).not.toHaveAttribute("aria-disabled", "true");
        expect(btn).not.toBeDisabled();
        expect(btn).toHaveTextContent(`${hour} - ${hour + 1}`);
      }
    }
  });

  test.todo("should have Legend for time selector");

  // TODO refactor this so that it tests multiple different opening hours
  // TODO how does this work with multiple different reservation units?
  // - where is the logic for that?
  test("should render available time slots based on opening hours", () => {
    const wedOpen: TimeSelectorFragment = {
      id: base64encode(`TimeSelector:${1}`),
      weekday: 2, // Wednesday
      closed: false,
      reservableTimes: [
        {
          begin: "08:00",
          end: "16:00",
        },
      ],
    };
    const view = customRender({ reservationUnitOpeningHours: [wedOpen] });
    const calendar = view.getByLabelText(
      "application:TimeSelector.calendarLabel"
    );

    // smoke
    const open = within(calendar).getAllByRole("option", {
      name: /application:TimeSelector.legend.open/,
    });
    expect(open).toHaveLength(8); // 8 hours on Wednesday
    const unavailable = within(calendar).getAllByRole("option", {
      name: /application:TimeSelector.legend.unavailable/,
    });
    expect(unavailable).toHaveLength(7 * 17 - 8); // 7 days, 17 hours (7-23)

    for (let day = 0; day < 7; day += 1) {
      for (let hour = 7; hour <= 23; hour += 1) {
        // sunday first
        const isAvailable = day === 3 && hour >= 8 && hour < 16;
        const state: OpenHoursState = isAvailable ? "open" : "unavailable";
        const btn = within(calendar).getByRole("option", {
          name: `application:TimeSelector.legend.${state}: common:weekDay.${day} ${hour} - ${hour + 1}`,
        });
        expect(btn).toBeInTheDocument();
      }
    }
  });

  test("single application section should not have copy button", () => {
    const view = customRender();
    expect(
      view.queryByText("application:Page2.copyTimes")
    ).not.toBeInTheDocument();
  });
  test("should have a copy buttons if more than one section", () => {
    const view = customRender({ nSections: 2 });
    expect(
      view.getByRole("button", { name: "application:Page2.copyTimes" })
    ).toBeInTheDocument();
  });
});

describe("TimeSelector time slot selecting", () => {
  test("time slots can be selected", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    // tuesday 14 - 15
    const select = view.getByTestId("time-selector__button--1-14");
    await user.click(select);
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledOnce();
    const vals = createMockSubmitValues([{ day: 1, start: 14, end: 15 }]);
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
    // tuesday 14 - 15
    const select = view.getByTestId("time-selector__button--1-14");
    await user.click(select);
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledOnce();
    const vals = createMockSubmitValues([{ day: 1, start: 14, end: 15 }]);
    expect(onSubmit).toHaveBeenLastCalledWith(vals);
    await user.click(select);
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
    const vals = createMockSubmitValues([{ pk: 1, day: 2, start: 8, end: 16 }]);
    expect(onSubmit).toHaveBeenLastCalledWith(vals);
  });

  // TODO these requires having multiple application sections
  test.todo("time slots can be copied");
  test.todo("selected time slots should match the index");
});

describe("TimeSelector calendar select", () => {
  test("last time slot should be converted from 24:00 to 0:00", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ page: "page1", onSubmit });
    const select = view.getByTestId("time-selector__button--1-23");
    await user.click(select);
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledOnce();
    const vals = createMockSubmitValues([{ day: 1, start: 23, end: 0 }]);
    expect(onSubmit).toHaveBeenCalledWith(vals);
  });

  test.todo("contiguous selection should be combined");
  test.todo("can select multiple time slots");
  test.todo("can select multiple days");
  test.todo("can select all time slots");
  test.todo("mouse enter should select like click");
  test.todo("keyboard enter should select like click");
});

describe("TimeSelector priority select", () => {
  test("should preselect primary time", () => {
    const view = customRender({ page: "page2" });
    const selectBtn = view.getByLabelText(
      "application:Page2.prioritySelectLabel",
      {
        selector: "button",
      }
    );
    expect(selectBtn).toBeInTheDocument();
    expect(selectBtn).toHaveTextContent(
      "application:Page2.priorityLabels.primary"
    );
  });
  test("priority select can be changed", async () => {
    const view = customRender({ page: "page2" });
    await selectOption(
      view,
      "application:Page2.prioritySelectLabel",
      /Page2.priorityLabels.secondary/
    );
    const selectBtn = view.getByLabelText(
      "application:Page2.prioritySelectLabel",
      {
        selector: "button",
      }
    );
    expect(selectBtn).toHaveTextContent(
      "application:Page2.priorityLabels.secondary"
    );
  });
  // requires setting predata
  test.todo("priority select doesn't change existing selection");
  // requeires making a new selection
  test.todo("priority select changes the next selection");
  test.todo("two different priorities should not be combined");
  test.todo("different priority select overrides existing selection");
});

describe("TimeSelector reservation unit times", () => {
  test.todo("should have reservation unit select");
  test.todo("should preselect first reservation unit");
  test.todo("reservation unit times should render properly");
  test.todo("by default first reservation unit option should be selected");
  test.todo("allows selection of reservation unit");
});
