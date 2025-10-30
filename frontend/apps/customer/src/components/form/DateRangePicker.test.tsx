import userEvent from "@testing-library/user-event";
import React from "react";
import { render, screen } from "@testing-library/react";
import { DateRangePicker, type DateRangePickerProps } from "./DateRangePicker";
import { vi, test, expect, describe } from "vitest";

const defaultProps: DateRangePickerProps = {
  endDate: null,
  onChangeEndDate: vi.fn(),
  onChangeStartDate: vi.fn(),
  startDate: null,
};

const renderComponent = (props?: Partial<DateRangePickerProps>) =>
  render(<DateRangePicker {...defaultProps} {...props} />);

describe("DateRangePicker", () => {
  test("should show error start date must be before end date", async () => {
    const view = renderComponent();
    const user = userEvent.setup();

    const startDateText = view.getByText(/labelStartDate/i);
    expect(startDateText).toBeInTheDocument();

    const startDateInput = view.getByLabelText(/labelStartDate/);
    expect(startDateInput).toBeInTheDocument();

    await user.type(startDateInput, "23.6.2021");
    await user.tab();

    const endDateInput = view.getByRole("textbox", {
      name: /labelEndDate/i,
    });
    await user.type(endDateInput, "22.6.2021");
    await user.tab();

    expect(view.getByText(/errors.endDateBeforeStartDate/)).toBeInTheDocument();

    await user.clear(endDateInput);
    await user.type(endDateInput, "24.6.2021");
    await user.tab();

    expect(view.queryByText(/errors.endDateBeforeStartDate/)).not.toBeInTheDocument();
  });

  test("should show formatting error", async () => {
    const view = renderComponent();
    const user = userEvent.setup();

    const startDateInput = view.getByRole("textbox", {
      name: /labelStartDate/,
    });
    await user.type(startDateInput, "23..2021");
    await user.tab();

    expect(view.queryByText(/errors.dateInvalid/)).toBeInTheDocument();

    // Error should disappear
    await user.clear(startDateInput);
    await user.tab();
    expect(screen.queryByText(/errors.dateInvalid/)).not.toBeInTheDocument();
  });
});
