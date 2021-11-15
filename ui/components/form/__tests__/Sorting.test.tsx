import * as React from "react";
import { get as mockGet } from "lodash";

import { render, screen, userEvent } from "../../../test/testUtils";
import mockTranslations from "../../../public/locales/fi/search.json";
import Sorting, { SortingProps } from "../Sorting";

const defaultProps: SortingProps = {
  value: "foo",
  sortingOptions: [
    {
      label: "foo",
      value: "foo",
    },
    { label: "bar", value: "bar" },
    { label: "baz", value: "baz" },
  ],
  setSorting: jest.fn(),
  isOrderingAsc: true,
  setIsOrderingAsc: jest.fn(),
};

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
    };
  },
}));

const renderComponent = (props?: Partial<SortingProps>) =>
  render(<Sorting {...defaultProps} {...props} />);

test("should toggle order", () => {
  const setIsOrderingAsc = jest.fn();
  renderComponent({
    setIsOrderingAsc,
  });
  const toggleButton = screen.getAllByRole("button")[0];
  userEvent.click(toggleButton);
  userEvent.click(toggleButton);
  expect(setIsOrderingAsc).toBeCalledTimes(2);
});
