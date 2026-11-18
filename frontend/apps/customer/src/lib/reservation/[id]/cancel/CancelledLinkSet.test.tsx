import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { getCookie } from "typescript-cookie";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { LOGOUT_RETURN_PATH_COOKIE } from "@/modules/logout";
import { CancelledLinkSet, BackLinkList } from "./CancelledLinkSet";

const mockedSignOut = vi.fn();
vi.mock("ui/src/modules/browserHelpers", () => ({
  signOut: (...args: unknown[]) => mockedSignOut(...args),
}));

describe("CancelledLinkSet", () => {
  beforeEach(() => {
    mockedSignOut.mockClear();
  });

  test("links back to the search page when no reservation unit home is given", () => {
    render(<CancelledLinkSet />);

    expect(screen.getByText(/reservation:searchPage/)).toBeInTheDocument();
    expect(screen.getByText("common:gotoFrontpage")).toBeInTheDocument();
  });

  test("calls signOut when the logout button is clicked", async () => {
    const user = userEvent.setup();
    render(<CancelledLinkSet />);

    await user.click(screen.getByText("common:logout"));

    expect(mockedSignOut).toHaveBeenCalledWith();
  });

  test("saves the current page for the return after the logout", async () => {
    window.history.replaceState({}, "", "/en/reservations/5/cancel?step=1");
    const user = userEvent.setup();
    render(<CancelledLinkSet />);

    await user.click(screen.getByText("common:logout"));

    expect(getCookie(LOGOUT_RETURN_PATH_COOKIE)).toBe("/en/reservations/5/cancel?step=1");
  });
});

describe("BackLinkList", () => {
  test("links back to the reservation unit page when a home url is given", () => {
    render(<BackLinkList reservationUnitHome="/reservation-unit/1" />);

    expect(screen.getByText(/reservation:reservationUnitPage/)).toBeInTheDocument();
  });
});
