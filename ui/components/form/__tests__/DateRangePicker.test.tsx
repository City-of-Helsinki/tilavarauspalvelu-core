import userEvent from "@testing-library/user-event";
import { utcToZonedTime } from "date-fns-tz";
import { advanceTo } from "jest-date-mock";
import { get as mockGet } from "lodash";
import React from "react";
import mockTranslations from "../../../public/locales/fi/dateSelector.json";

import {
  act,
  actWait,
  configure,
  render,
  screen,
  waitFor,
} from "../../../test/testUtils";
import DateRangePicker, { DateRangePickerProps } from "../DateRangePicker";

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

jest.mock("react-i18next", () => ({
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

// TODO: Fix when component is used
// test("should call onChangeEndDate with clicking date", async () => {
//   const endDate = new Date("2020-10-10");
//   const onChangeEndDate = jest.fn();
//   renderComponent({ endDate, onChangeEndDate });

//   const endDateInput = screen.getByRole("textbox", {
//     name: /loppumispäivä/i,
//   });

//   userEvent.click(endDateInput);
//   userEvent.click(
//     screen.getAllByRole("button", { name: /valitse päivämäärä/i })[1]
//   );
//   userEvent.click(
//     screen.getByRole("button", {
//       name: /lokakuu 15/i,
//     })
//   );
//   // need to wait one useEffect cycle for date go take effect
//   await actWait();

//   const startDateInput = screen.getByRole("textbox", {
//     name: /alkamispäivä/i,
//   });
//   act(() => userEvent.click(startDateInput));

//   await waitFor(() =>
//     expect(onChangeEndDate).toBeCalledWith(
//       utcToZonedTime(new Date("2020-10-15"), "UTC")
//     )
//   );
// });

test("should call onChangeStartDate", async () => {
  const startDate = new Date("2020-10-10");
  const onChangeStartDate = jest.fn();
  renderComponent({ startDate, onChangeStartDate });

  const startDateInput = screen.getByRole("textbox", {
    name: /alkamispäivä/i,
  });

  const startDateStr = "12.10.2020";
  userEvent.click(startDateInput);
  userEvent.clear(startDateInput);
  userEvent.type(startDateInput, startDateStr);

  const endDateInput = screen.getByRole("textbox", {
    name: /loppumispäivä/i,
  });
  act(() => userEvent.click(endDateInput));

  await waitFor(() =>
    expect(onChangeStartDate).toBeCalledWith(
      utcToZonedTime(new Date("2020-10-12"), "UTC")
    )
  );
}, 20000);

test("should call onChangeStartDate with clicking date", async () => {
  const startDate = new Date("2020-10-10");
  const onChangeStartDate = jest.fn();
  renderComponent({ startDate, onChangeStartDate });

  const startDateInput = screen.getByRole("textbox", {
    name: /alkamispäivä/i,
  });
  userEvent.click(startDateInput);

  userEvent.click(
    screen.getAllByRole("button", { name: /valitse päivämäärä/i })[0]
  );
  userEvent.click(
    screen.getByRole("button", {
      name: /lokakuu 15/i,
    })
  );
  // need to wait one useEffect cycle for date go take effect
  await actWait();

  const endDateInput = screen.getByRole("textbox", {
    name: /loppumispäivä/i,
  });
  act(() => userEvent.click(endDateInput));

  await waitFor(() =>
    expect(onChangeStartDate).toBeCalledWith(
      utcToZonedTime(new Date("2020-10-15"), "UTC")
    )
  );
}, 20000);

test("should show error start date must be before end date", async () => {
  renderComponent();

  const startDateInput = screen.getByRole("textbox", {
    name: /alkamispäivä/i,
  });
  userEvent.type(startDateInput, "23.6.2021");

  const endDateInput = screen.getByRole("textbox", {
    name: /loppumispäivä/i,
  });
  userEvent.type(endDateInput, "22.6.2021");

  await screen.findByText(/Alkamispäivän on oltava ennen loppumispäivää/i);

  userEvent.clear(endDateInput);
  userEvent.type(endDateInput, "24.6.2021");

  expect(
    screen.queryByText(/Alkamispäivän on oltava ennen loppumispäivää/i)
  ).not.toBeInTheDocument();
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
  await screen.findByText(/Päivämäärän on oltava muotoa pp\.kk\.vvvv/i);

  // Error should disappear
  userEvent.clear(startDateInput);
  userEvent.type(startDateInput, "23.6.2021");
  expect(
    screen.queryByText(/Päivämäärän on oltava muotoa pp\.kk\.vvvv/i)
  ).not.toBeInTheDocument();
});
