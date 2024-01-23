import userEvent from "@testing-library/user-event";
import { advanceTo } from "jest-date-mock";
import { get as mockGet } from "lodash";
import React from "react";
import mockTranslations from "@/public/locales/fi/dateSelector.json";
import { act, configure, render, screen } from "@/test/testUtils";
import DateRangePicker, { DateRangePickerProps } from "../DateRangePicker";

jest.mock("next-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => {
        const path = str.replace("dateSelector:", "");
        return mockGet(mockTranslations, path);
      },
      i18n: { language: "fi" },
    };
  },
}));

configure({ defaultHidden: true });

const defaultProps: DateRangePickerProps = {
  endDate: null,
  onChangeEndDate: jest.fn(),
  onChangeStartDate: jest.fn(),
  startDate: null,
};

beforeEach(() => {
  advanceTo("2020-10-10");
});

const renderComponent = (props?: Partial<DateRangePickerProps>) =>
  render(<DateRangePicker {...defaultProps} {...props} />);

test("should show error start date must be before end date", async () => {
  renderComponent();
  const user = userEvent.setup();

  const startDateInput = screen.getByRole("textbox", {
    name: /alkamispäivä/i,
  });
  await act(async () => {
    await user.type(startDateInput, "23.6.2021");
  });

  const endDateInput = screen.getByRole("textbox", {
    name: /päättymispäivä/i,
  });
  await act(async () => {
    await user.type(endDateInput, "22.6.2021");
  });

  screen.queryByText(/Alkamispäivän on oltava ennen päättymispäivää/i);

  await act(async () => {
    await user.clear(endDateInput);
  });
  await act(async () => {
    await user.type(endDateInput, "24.6.2021");
  });

  const start = screen.queryByText(
    /Alkamispäivän on oltava ennen päättymispäivää/i
  );

  expect(start).not.toBeInTheDocument();
});

test("should show formatting error", async () => {
  advanceTo("2020-10-10");
  renderComponent();

  const startDateInput = screen.getByRole("textbox", {
    name: /alkamispäivä/i,
  });
  userEvent.type(startDateInput, "23..2021");

  expect(
    screen.queryByText(/Päivämäärän on oltava muotoa pp\.kk\.vvvv/i)
  ).not.toBeInTheDocument();

  // should show error when focusing out of the element
  userEvent.tab();
  screen.queryByText(/Päivämäärän on oltava muotoa pp\.kk\.vvvv/i);

  // Error should disappear
  userEvent.clear(startDateInput);
  userEvent.type(startDateInput, "23.6.2021");
  expect(
    screen.queryByText(/Päivämäärän on oltava muotoa pp\.kk\.vvvv/i)
  ).not.toBeInTheDocument();
});
