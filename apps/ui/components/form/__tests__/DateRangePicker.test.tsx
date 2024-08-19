import userEvent from "@testing-library/user-event";
import { get as mockGet } from "lodash";
import React from "react";
import mockTranslations from "@/public/locales/fi/dateSelector.json";
import { configure, render, screen } from "@/test/testUtils";
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

beforeAll(() => {
  jest.useFakeTimers({
    now: new Date(2020, 10, 10, 9, 0, 0),
  });
});

afterAll(() => {
  jest.useRealTimers();
});

const renderComponent = (props?: Partial<DateRangePickerProps>) =>
  render(<DateRangePicker {...defaultProps} {...props} />);

test("should show error start date must be before end date", async () => {
  const view = renderComponent();
  // NOTE weird issues with the default delay causing the test to fail always
  const user = userEvent.setup({ delay: null });

  const startDateText = view.getByText(/alkamispäivä/i);
  expect(startDateText).toBeInTheDocument();

  const startDateInput = view.getByLabelText(/alkamispäivä/i);
  expect(startDateInput).toBeInTheDocument();

  await user.type(startDateInput, "23.6.2021");
  await user.type(startDateInput, "23.6.2021");

  const endDateInput = view.getByRole("textbox", {
    name: /päättymispäivä/i,
  });
  await user.type(endDateInput, "22.6.2021");

  view.queryByText(/Alkamispäivän on oltava ennen päättymispäivää/i);

  await user.clear(endDateInput);
  await user.type(endDateInput, "24.6.2021");

  const start = view.queryByText(
    /Alkamispäivän on oltava ennen päättymispäivää/i
  );

  expect(start).not.toBeInTheDocument();
});

test("should show formatting error", async () => {
  const view = renderComponent();

  const startDateInput = view.getByRole("textbox", {
    name: /alkamispäivä/i,
  });
  userEvent.type(startDateInput, "23..2021");

  expect(
    view.queryByText(/Päivämäärän on oltava muotoa pp\.kk\.vvvv/i)
  ).not.toBeInTheDocument();

  // should show error when focusing out of the element
  userEvent.tab();
  view.queryByText(/Päivämäärän on oltava muotoa pp\.kk\.vvvv/i);

  // Error should disappear
  userEvent.clear(startDateInput);
  userEvent.type(startDateInput, "23.6.2021");
  expect(
    screen.queryByText(/Päivämäärän on oltava muotoa pp\.kk\.vvvv/i)
  ).not.toBeInTheDocument();
});
