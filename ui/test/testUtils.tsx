import { act, fireEvent } from "@testing-library/react";
import wait from "waait";

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

export const actWait = (amount?: number): Promise<void> =>
  act(() => wait(amount));

// re-export everything
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
