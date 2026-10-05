import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
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
    render(<CancelledLinkSet apiBaseUrl="https://api.example.com" />);

    expect(screen.getByText(/reservation:searchPage/)).toBeInTheDocument();
    expect(screen.getByText("common:gotoFrontpage")).toBeInTheDocument();
  });

  test("calls signOut with the api base url when the logout button is clicked", async () => {
    const user = userEvent.setup();
    render(<CancelledLinkSet apiBaseUrl="https://api.example.com" />);

    await user.click(screen.getByText("common:logout"));

    expect(mockedSignOut).toHaveBeenCalledWith("https://api.example.com");
  });
});

describe("BackLinkList", () => {
  test("links back to the reservation unit page when a home url is given", () => {
    render(<BackLinkList apiBaseUrl="https://api.example.com" reservationUnitHome="/reservation-unit/1" />);

    expect(screen.getByText(/reservation:reservationUnitPage/)).toBeInTheDocument();
  });
});
