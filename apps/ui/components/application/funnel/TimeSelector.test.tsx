import { FormProvider, useForm } from "react-hook-form";
import { test, describe, expect, vi } from "vitest";
import {
  type ApplicationPage2FormValues,
  convertApplicationPage2,
} from "./form";
import { TimeSelector } from "./TimeSelector";
import {
  createMockApplicationFragment,
  type CreateMockApplicationFragmentProps,
} from "@/test/test.application.mocks";
import { type ApplicationPage2Query, Priority } from "@/gql/gql-types";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Day, transformWeekday } from "common/src/conversion";
import { formatTimeStruct } from "common/src/helpers";
import { selectOption } from "@/test/test.utils";

type ApplicationPage2 = NonNullable<ApplicationPage2Query["application"]>;

interface TimeSelectorMockProps extends CreateMockApplicationFragmentProps {
  onSubmit?: (appToSave: ApplicationPage2FormValues) => Promise<void>;
}

function customRender(props: TimeSelectorMockProps): ReturnType<typeof render> {
  if (props.page == null) {
    props.page = "page1";
  }
  const onSubmit = props.onSubmit ?? vi.fn();

  return render(<WrapTimeSelector props={props} onSubmit={onSubmit} />);
}

function WrapTimeSelector({
  props,
  onSubmit,
}: {
  onSubmit: (appToSave: ApplicationPage2FormValues) => void;
  props: CreateMockApplicationFragmentProps;
}) {
  const application: ApplicationPage2 = createMockApplicationFragment(props);
  const form = useForm<ApplicationPage2FormValues>({
    mode: "onChange",
    defaultValues: convertApplicationPage2(application),
  });
  return (
    <form noValidate onSubmit={form.handleSubmit(onSubmit)}>
      <FormProvider {...form}>
        <TimeSelector
          index={0}
          reservationUnitOptions={[]}
          reservationUnitOpeningHours={[]}
        />
        <button type="submit" onClick={form.handleSubmit(onSubmit)}>
          submit
        </button>
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

describe("TimeSelector", () => {
  test("should render properly", () => {
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    const info = view.getAllByText("application:Page2.info");
    // HDS notification has invisible label with same text
    expect(info).toHaveLength(2);
    const prioritySelect = view.getByLabelText(
      "application:Page2.prioritySelectLabel",
      {
        selector: "button",
      }
    );
    expect(prioritySelect).toBeInTheDocument();
    const reservationUnitSelect = view.getByLabelText(
      "application:Page2.reservationUnitSelectLabel",
      {
        selector: "button",
      }
    );
    expect(reservationUnitSelect).toBeInTheDocument();
    // TODO check time selector
    // no copy button when single section
    expect(
      view.queryByText("application:Page2.copyTimes")
    ).not.toBeInTheDocument();
  });

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
    const mockVals = onSubmit.mock.calls[0];
    const vals = createMockSubmitValues([{ day: 1, start: 14, end: 15 }]);
    expect(mockVals?.[0]).toEqual(vals);
  });

  test("all time slots should be empty for new application", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ onSubmit });
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledOnce();
    const mockVals = onSubmit.mock.calls[0];
    const vals = createMockSubmitValues([]);
    expect(mockVals?.[0]).toEqual(vals);
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
    const mockVals = onSubmit.mock.calls[0];
    const vals = createMockSubmitValues([{ day: 1, start: 14, end: 15 }]);
    expect(mockVals?.[0]).toEqual(vals);
    await user.click(select);
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledTimes(2);
    const mockVals2 = onSubmit.mock.lastCall?.[0];
    expect(createMockSubmitValues([])).toEqual(mockVals2);
  });

  test("all time slots should match the existing application section", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const view = customRender({ page: "page2", onSubmit });
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(onSubmit).toHaveBeenCalledOnce();
    const mockVals = onSubmit.mock.calls[0];
    const vals = createMockSubmitValues([{ pk: 1, day: 2, start: 8, end: 16 }]);
    expect(mockVals?.[0]).toEqual(vals);
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
    const mockVals = onSubmit.mock.calls[0];
    const vals = createMockSubmitValues([{ day: 1, start: 23, end: 0 }]);
    expect(mockVals?.[0]).toEqual(vals);
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
