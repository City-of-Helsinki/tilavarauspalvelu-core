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
} from "@/test/test.gql.utils";
import { type ApplicationPage2Query, Priority } from "@/gql/gql-types";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Day, transformWeekday } from "common/src/conversion";
import { formatTimeStruct } from "common/src/helpers";

type ApplicationPage2 = NonNullable<ApplicationPage2Query["application"]>;
function customRender(
  hnadleSubmit: (appToSave: ApplicationPage2FormValues) => Promise<void>,
  props: CreateMockApplicationFragmentProps = {}
): ReturnType<typeof render> {
  if (props.page == null) {
    props.page = "page1";
  }

  return render(<WrapTimeSelector props={props} onSubmit={hnadleSubmit} />);
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
        minDuration: 3600,
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
  test("smoke: should render properly", () => {
    const submit = vi.fn();
    const view = customRender(submit);
    expect(
      view.getByLabelText("application:Page2.prioritySelectLabel", {
        selector: "button",
      })
    ).toBeInTheDocument();
    expect(
      view.getByLabelText("application:Page2.reservationUnitSelectLabel", {
        selector: "button",
      })
    ).toBeInTheDocument();
  });

  test("time slots can be selected", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const view = customRender(submit);
    // tuesday 14 - 15
    const select = view.getByTestId("time-selector__button--1-14");
    await user.click(select);
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(submit).toHaveBeenCalledOnce();
    const mockVals = submit.mock.calls[0];
    const vals = createMockSubmitValues([{ day: 1, start: 14, end: 15 }]);
    expect(mockVals?.[0]).toEqual(vals);
  });

  test("all time slots should be empty for new application", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const view = customRender(submit);
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(submit).toHaveBeenCalledOnce();
    const mockVals = submit.mock.calls[0];
    const vals = createMockSubmitValues([]);
    expect(mockVals?.[0]).toEqual(vals);
  });

  test("time slots can be deselected", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const view = customRender(submit);
    // tuesday 14 - 15
    const select = view.getByTestId("time-selector__button--1-14");
    await user.click(select);
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(submit).toHaveBeenCalledOnce();
    const mockVals = submit.mock.calls[0];
    const vals = createMockSubmitValues([{ day: 1, start: 14, end: 15 }]);
    expect(mockVals?.[0]).toEqual(vals);
    await user.click(select);
    await user.click(btn);
    expect(submit).toHaveBeenCalledTimes(2);
    const mockVals2 = submit.mock.lastCall?.[0];
    expect(createMockSubmitValues([])).toEqual(mockVals2);
  });

  test.todo("time slots can be reset");
  test("all time slots should match the existing application section", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    const view = customRender(submit, { page: "page2" });
    const btn = view.getByRole("button", { name: "submit" });
    await user.click(btn);
    expect(submit).toHaveBeenCalledOnce();
    const mockVals = submit.mock.calls[0];
    const vals = createMockSubmitValues([{ pk: 1, day: 2, start: 8, end: 16 }]);
    expect(mockVals?.[0]).toEqual(vals);
  });
  test.todo("contiguous selection should be combined");
  test.todo("can select multiple time slots");
  test.todo("can select multiple days");
  test.todo("can select all time slots");
  test.todo("mouse enter should select like click");
  test.todo("keyboard enter should select like click");

  // TODO these requires having multiple application sections
  test.todo("time slots can be copied");
  test.todo("selected time slots should match the index");
});

describe("TimeSelector priority select", () => {
  test.todo("should preselect primary time");
  test.todo("priority select doesn't change existing selection");
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
