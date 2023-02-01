import { act, fireEvent, render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";
import React from "react";

import {
  arrowDownKeyPressHelper,
  arrowUpKeyPressHelper,
  enterKeyPressHelper,
  escKeyPressHelper,
  userEvent,
} from "../../../test/testUtils";
import MultiSelectDropdown, {
  MultiselectDropdownProps,
} from "../MultiselectDropdown";

jest.mock("next-i18next", () => ({
  useTranslation: () => {
    return {
      t: (str: string) => str,
    };
  },
}));

const onChange = jest.fn();
const options = [
  {
    label: "Squirrel",
    value: "value1",
  },
  {
    label: "Elephant",
    value: "value2",
  },
  {
    label: "Dog",
    value: "value3",
  },
];
const title = "test title";
const inputPlaceholder = "Kirjoita hakusana";
const toggleInputTestId = "multiselect-dropdown-toggle";

const defaultProps: MultiselectDropdownProps = {
  id: "test",
  checkboxName: "multiselect-dropdown",
  icon: <div />,
  inputPlaceholder,
  name: "test MultiSelectDropdown",
  onChange,
  options,
  showSearch: true,
  title,
  value: [],
};
const renderComponent = (props?: Partial<MultiselectDropdownProps>) =>
  render(<MultiSelectDropdown {...defaultProps} {...props} />);

test("for accessibility violations", async () => {
  const { container } = renderComponent();
  expect.extend(toHaveNoViolations);

  expect(await axe(container)).toHaveNoViolations();
});

test("should set focus to input after clicking toggle button", async () => {
  renderComponent();

  const toggleButton = await screen.findByTestId(toggleInputTestId);
  await userEvent.click(toggleButton);

  const searchInput = await screen.findByPlaceholderText(inputPlaceholder);

  expect(searchInput).toHaveFocus();
});

test("should filter results based on user search and options[].label field", async () => {
  renderComponent();

  const toggleButton = await screen.findByTestId(toggleInputTestId);
  await userEvent.click(toggleButton);

  const searchInput = await screen.findByPlaceholderText(inputPlaceholder);
  await userEvent.type(searchInput, "Ele");

  const checkboxElephant = screen.queryByRole("checkbox", {
    name: "Elephant",
  });
  const checkboxDox = screen.queryByRole("checkbox", {
    name: "Dox",
  });
  const checkboxSquirrel = screen.queryByRole("checkbox", {
    name: "Squirrel",
  });

  expect(checkboxElephant).toBeInTheDocument();
  expect(checkboxDox).not.toBeInTheDocument();
  expect(checkboxSquirrel).not.toBeInTheDocument();
});

test("should reset keyboard navigation position after a new search", async () => {
  renderComponent();

  const toggleButton = await screen.findByTestId(toggleInputTestId);
  await userEvent.click(toggleButton);

  const searchInput = await screen.findByPlaceholderText(inputPlaceholder);
  act(() => searchInput.focus());

  arrowDownKeyPressHelper();

  const checkbox = await (
    await screen.findByRole("checkbox", { name: options[0].label })
  ).parentElement.parentElement;
  expect(checkbox).toHaveClass("dropdownItem--isFocused");

  // Find something, then reset the search to ensure that all results are listed
  fireEvent.change(searchInput, { target: { value: "Ele" } });
  fireEvent.change(searchInput, { target: { value: "" } });

  const allOptions = options.map(({ label }) => label);

  // No element should have focus
  allOptions.forEach((label) => {
    expect(
      screen.getByRole("checkbox", { name: label }).parentElement.parentElement
    ).not.toHaveClass("dropdownItem--isFocused");
  });
});

describe("ArrowUp, ArrowDown", () => {
  test("should allow navigation with up and down arrows", async () => {
    renderComponent();

    const toggleButton = await screen.findByTestId(toggleInputTestId);
    await userEvent.click(toggleButton);

    arrowDownKeyPressHelper();
    arrowDownKeyPressHelper();

    const checkbox1 = (
      await screen.findByRole("checkbox", { name: options[1].label })
    ).parentElement.parentElement;

    expect(checkbox1).toHaveClass("dropdownItem--isFocused");

    arrowUpKeyPressHelper();

    const checkbox0 = (
      await screen.findByRole("checkbox", { name: options[0].label })
    ).parentElement.parentElement;

    expect(checkbox0).toHaveClass("dropdownItem--isFocused");
  });

  test("should select last item if the first keyboard navigation is button up", async () => {
    renderComponent();

    const toggleButton = await screen.findByTestId(toggleInputTestId);
    await userEvent.click(toggleButton);

    arrowUpKeyPressHelper();

    const checkboxLast = screen.getByRole("checkbox", {
      name: options[options.length - 1].label,
    }).parentElement.parentElement;

    expect(checkboxLast).toHaveClass("dropdownItem--isFocused");
  });

  test("should reset to start position when user goes up in the first member of the list", async () => {
    renderComponent();

    const toggleButton = await screen.findByTestId(toggleInputTestId);
    await userEvent.click(toggleButton);

    arrowDownKeyPressHelper();
    arrowUpKeyPressHelper();

    // No element should have focus
    options.forEach((option) => {
      expect(
        screen.getByRole("checkbox", { name: option.label }).parentElement
      ).not.toHaveClass("dropdownItem--isFocused");
    });
  });

  test("should reset to start position when user goes down from the last member of the list", async () => {
    renderComponent();

    const toggleButton = await screen.findByTestId(toggleInputTestId);
    await userEvent.click(toggleButton);

    // After we have selected the last item, press down once more to reset the
    // selection.
    arrowDownKeyPressHelper();

    // No element should have focus
    options.forEach((option) => {
      expect(
        screen.getByRole("checkbox", { name: option.label }).parentElement
      ).not.toHaveClass("dropdownItem--isFocused");
    });
  });
});

describe("Escape", () => {
  test("should close suggestions with escape", async () => {
    renderComponent();

    const toggleButton = await screen.findByTestId(toggleInputTestId);
    await userEvent.click(toggleButton);

    // Check that we can find some of the content of the MultiSelectDropdown: this suggests
    // that it is open.
    const checkbox = await screen.findByRole("checkbox", {
      name: options[0].label,
    });
    expect(checkbox).toBeInTheDocument();

    escKeyPressHelper();

    // Assert that we can no longer find the menu content after we have pressed
    // Escape.
    expect(checkbox).not.toBeInTheDocument();
  });
});

test("should not open dropdown when user focuses toggle button", async () => {
  renderComponent();

  const toggleButton = await screen.findByTestId(toggleInputTestId);
  fireEvent.focus(toggleButton);

  const checkbox = await screen.queryByRole("checkbox", {
    name: options[0].label,
  });

  expect(checkbox).not.toBeInTheDocument();
});

test("should open dropdown when user clicks on toggle button", async () => {
  renderComponent();

  const toggleButton = await screen.findByTestId(toggleInputTestId);
  await userEvent.click(toggleButton);

  const checkbox = await screen.findByRole("checkbox", {
    name: options[0].label,
  });
  expect(checkbox).toBeInTheDocument();
});

test("should call onChange when clicking checkbox", async () => {
  renderComponent({ onChange });

  const toggleButton = await screen.findByTestId(toggleInputTestId);
  await userEvent.click(toggleButton);

  const checkbox = screen.queryByRole("checkbox", { name: options[0].label });
  await userEvent.click(checkbox);

  expect(onChange).toBeCalledWith([options[0].value]);
});

test("should uncheck option", async () => {
  renderComponent({ onChange, value: [options[0].value] });

  const toggleButton = await screen.findByTestId(toggleInputTestId);
  await userEvent.click(toggleButton);

  const checkbox = screen.queryByRole("checkbox", { name: options[0].label });
  await userEvent.click(checkbox);

  expect(onChange).toBeCalledWith([]);
});

test("should show selected text for single value", () => {
  renderComponent({ value: [options[0].value] });

  expect(screen.queryByText(options[0].label)).toBeInTheDocument();
});

test("should show selected text for single value 2", () => {
  renderComponent({ value: [options[0].value, options[1].value] });

  expect(screen.queryByText(`${options[1].label} + 1`)).toBeInTheDocument();
});

describe("when dropdown has been closed, it should reopen with", () => {
  const getClosedInput = async () => {
    renderComponent();

    const toggleButton = await screen.findByTestId(toggleInputTestId);
    await userEvent.click(toggleButton);

    escKeyPressHelper();

    // const checkbox = await screen.findByRole("checkbox", {
    //   name: options[0].label,
    // });

    // expect(checkbox).not.toBeInTheDocument();

    // expect(toggleButton).toHaveFocus();
  };

  test("Enter", async () => {
    getClosedInput();

    enterKeyPressHelper();

    const checkbox = await screen.findByRole("checkbox", {
      name: options[0].label,
    });

    expect(checkbox).toBeInTheDocument();
  });

  test("ArrowDown", async () => {
    getClosedInput();

    arrowDownKeyPressHelper();

    const checkbox = await screen.findByRole("checkbox", {
      name: options[0].label,
    });

    expect(checkbox).toBeInTheDocument();
  });

  test("ArrowUp", async () => {
    getClosedInput();

    arrowDownKeyPressHelper();

    const checkbox = await screen.findByRole("checkbox", {
      name: options[0].label,
    });

    expect(checkbox).toBeInTheDocument();
  });
});
