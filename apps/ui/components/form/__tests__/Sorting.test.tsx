import * as React from "react";
import { get as mockGet } from "lodash";

import { getByTestId, render, userEvent } from "../../../test/testUtils";
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

const renderComponent = (props?: Partial<SortingProps>) =>
  render(<Sorting {...defaultProps} {...props} />);

test("should toggle order", async () => {
  const setIsOrderingAsc = jest.fn();
  const { container } = renderComponent({ setIsOrderingAsc });
  const toggleButton = getByTestId(container, "sorting-button");

  await userEvent.click(toggleButton);
  await userEvent.click(toggleButton);
  expect(setIsOrderingAsc).toHaveBeenCalledTimes(2);
});
