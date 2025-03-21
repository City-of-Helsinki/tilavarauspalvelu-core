import { fireEvent, render, within } from "@testing-library/react";
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

export const arrowUpKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 38, key: "ArrowUp" });

export const arrowDownKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 40, key: "ArrowDown" });

export const enterKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 13, key: "Enter" });

export const escKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 27, key: "Escape" });

export const tabKeyPressHelper = (): boolean =>
  fireEvent.keyDown(document, { code: 9, key: "Tab" });

// TODO test if we can refactor this not to include any expect calls
// use throws instead so the error bubbles to the caller
export async function selectOption(
  view: ReturnType<typeof render> | ReturnType<typeof within>,
  listLabel: RegExp | string,
  optionLabel: RegExp | string
) {
  const user = userEvent.setup();
  const btn = view.getByLabelText(listLabel, {
    selector: "button",
  });
  expect(btn).toBeInTheDocument();
  expect(btn).not.toHaveAttribute("aria-disabled", "true");
  await user.click(btn);
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
