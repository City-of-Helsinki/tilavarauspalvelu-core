import * as React from "react";
import { get as mockGet } from "lodash";

import {
  arrowDownKeyPressHelper,
  arrowUpKeyPressHelper,
  escKeyPressHelper,
  render,
  screen,
  userEvent,
  waitFor,
} from "../../../test/testUtils";
import { DATE_TYPES } from "../../../modules/const";
import mockTranslations from "../../../public/locales/fi/dateSelector.json";
import DateSelector, { DateSelectorProps } from "../DateSelector";
import { testIds } from "../DateSelectorMenu";

const defaultProps: DateSelectorProps = {
  dateTypes: [],
  endDate: null,
  isCustomDate: false,
  name: "date",
  onChangeDateTypes: jest.fn(),
  onChangeEndDate: jest.fn(),
  onChangeStartDate: jest.fn(),
  startDate: null,
  toggleIsCustomDate: jest.fn(),
};

jest.mock("next/config", () => () => ({
  serverRuntimeConfig: {},
  publicRuntimeConfig: {},
}));

jest.mock("next-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => {
        const path = str.replace("dateSelector:", "");
        return mockGet(mockTranslations, path);
      },
    };
  },
}));

const renderComponent = (props?: Partial<DateSelectorProps>) =>
  render(<DateSelector {...defaultProps} {...props} />);

test("should render selected date types when single option is selected", async () => {
  renderComponent({ dateTypes: [DATE_TYPES.TODAY] });

  const date = await screen.findByText(mockTranslations.dateTypeToday);

  expect(date).toBeInTheDocument();
});

test("should render selected date types when multiple options are selected", () => {
  renderComponent({ dateTypes: [DATE_TYPES.TOMORROW, DATE_TYPES.TODAY] });

  expect(
    screen.queryByText(`${mockTranslations.dateTypeToday} + 1`)
  ).toBeInTheDocument();
});

test("should add date type", async () => {
  const onChangeDateTypes = jest.fn();
  renderComponent({
    dateTypes: [],
    onChangeDateTypes,
  });

  const toggleButton = screen.getByRole("button", {
    name: mockTranslations.title,
  });
  userEvent.click(toggleButton);

  const menu = await screen.findByTestId(testIds.menu);
  expect(menu).toBeInTheDocument();

  const checkbox = await await screen.findByRole("checkbox", {
    name: mockTranslations.dateTypeToday,
  });
  await userEvent.click(checkbox);

  expect(onChangeDateTypes).toHaveBeenCalledWith([DATE_TYPES.TODAY]);
});

test("should call toggleIsCustomDate function", async () => {
  const toggleIsCustomDate = jest.fn();
  renderComponent({
    dateTypes: [],
    toggleIsCustomDate,
  });

  const toggleButton = screen.getByRole("button", {
    name: mockTranslations.title,
  });

  await userEvent.click(toggleButton);

  const menu = await screen.findByTestId(testIds.menu);
  expect(menu).toBeInTheDocument();

  const customDatesButton = screen.getByRole("button", {
    name: mockTranslations.menu.buttonCustom,
  });

  await userEvent.click(customDatesButton);

  expect(toggleIsCustomDate).toHaveBeenCalled();
});

test("should remove date type", async () => {
  const onChangeDateTypes = jest.fn();
  renderComponent({
    dateTypes: [DATE_TYPES.TODAY, DATE_TYPES.TOMORROW],
    onChangeDateTypes,
  });

  const toggleButton = screen.getByRole("button", {
    name: mockTranslations.title,
  });

  await userEvent.click(toggleButton);

  const menu = await screen.findByTestId(testIds.menu);
  expect(menu).toBeInTheDocument();

  const checkbox = screen.getByRole("checkbox", {
    name: mockTranslations.dateTypeToday,
  });

  await userEvent.click(checkbox);

  expect(onChangeDateTypes).toBeCalledWith([DATE_TYPES.TOMORROW]);
});

describe("should open menu with", () => {
  const getClosedMenu = async () => {
    renderComponent();

    const toggleButton = screen.getByRole("button", {
      name: mockTranslations.title,
    });

    await userEvent.click(toggleButton);

    const menu = await screen.findByTestId(testIds.menu);
    expect(menu).toBeInTheDocument();

    escKeyPressHelper();

    await waitFor(() => expect(menu).not.toBeInTheDocument());
    expect(toggleButton).toHaveFocus();
  };

  test("ArrowDown", async () => {
    await getClosedMenu();

    arrowDownKeyPressHelper();

    const menu = await screen.findByTestId(testIds.menu);
    expect(menu).toBeInTheDocument();
  });

  test("ArrowUp", async () => {
    await getClosedMenu();

    arrowUpKeyPressHelper();

    const menu = await screen.findByTestId(testIds.menu);
    expect(menu).toBeInTheDocument();
  });
});
