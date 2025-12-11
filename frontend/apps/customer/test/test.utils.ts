import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect } from "vitest";

// Default implementation fakes all timers (expect tick), remove performance from the list
export const TIMERS_TO_FAKE = [
  "setTimeout",
  "clearTimeout",
  "setInterval",
  "clearInterval",
  "setImmediate",
  "clearImmediate",
  "Date",
] as const;

export async function selectOption(
  view: ReturnType<typeof render> | ReturnType<typeof within>,
  listLabel: RegExp | string,
  optionLabel: RegExp | string
) {
  const user = userEvent.setup();
  const btn = view.getByLabelText(listLabel, {
    selector: "button",
  });
  if (btn == null) {
    throw new Error("Select button not found");
  }

  expect(btn).not.toHaveAttribute("aria-disabled", "true");
  await user.click(btn);
  // NOTE using "listbox" forces the users to narrow down the view
  // if this finds multiple elements, the test will fail
  // not an issue with multiple HDS selects since "listbox" is only visible after click
  const listbox = view.getByRole("listbox");
  // Hack to deal with options not having unique labels due to translation mocks
  const opts = within(listbox).getAllByText(optionLabel);
  const opt = opts[0];
  if (opt == null) {
    throw new Error("Option not found");
  }
  expect(opt).toBeInTheDocument();
  await user.click(opt);
}

export async function selectFirstOption(
  view: ReturnType<typeof render> | ReturnType<typeof within>,
  listLabel: RegExp | string
) {
  const user = userEvent.setup();
  const btn = view.getByLabelText(listLabel, {
    selector: "button",
  });
  if (btn == null) {
    throw new Error("Select button not found");
  }

  expect(btn).not.toHaveAttribute("aria-disabled", "true");
  await user.click(btn);
  // NOTE using "listbox" forces the users to narrow down the view
  // if this finds multiple elements, the test will fail
  // not an issue with multiple HDS selects since "listbox" is only visible after click
  const listbox = view.getByRole("listbox");
  const opt = within(listbox).getAllByRole("option")[0];
  if (opt == null) {
    throw new Error("Option not found");
  }
  expect(opt).toBeInTheDocument();
  await user.click(opt);
}

export function formatHtmlElement(e: HTMLElement): string {
  return e.textContent ?? "";
}
