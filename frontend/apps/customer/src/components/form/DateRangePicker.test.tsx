import React from "react";
import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, test, expect, describe } from "vitest";
import { DateRangePicker } from "./DateRangePicker";
import type { DateRangePickerProps } from "./DateRangePicker";

const defaultProps: DateRangePickerProps = {
  endDate: "",
  onChangeEndDate: vi.fn(),
  onChangeStartDate: vi.fn(),
  startDate: "",
};

const renderComponent = (props?: Partial<DateRangePickerProps>) =>
  render(<DateRangePicker {...defaultProps} {...props} />);

describe("DateRangePicker", () => {
  test("should pass the typed date to the parent", async () => {
    const onChangeStartDate = vi.fn();
    const view = renderComponent({ onChangeStartDate });
    const user = userEvent.setup();

    const startDateInput = view.getByRole("textbox", { name: /labelStartDate/ });
    await user.type(startDateInput, "23.6.2027");
    await user.tab();

    expect(onChangeStartDate).toHaveBeenLastCalledWith("23.6.2027", expect.anything());
  });

  test("should show the errors", () => {
    const view = renderComponent({ errors: { begin: "start error", end: "end error" } });

    expect(view.getByText("start error")).toBeInTheDocument();
    expect(view.getByText("end error")).toBeInTheDocument();
  });
});
