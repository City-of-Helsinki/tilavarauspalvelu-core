import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { ReservationUnitSearch } from "./ReservationUnitSearch";

const { useRouter, mockedRouterPush } = vi.hoisted(() => {
  const mockedRouterPush = vi.fn();
  return {
    useRouter: () => ({ push: mockedRouterPush }),
    mockedRouterPush,
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

describe("ReservationUnitSearch", () => {
  beforeEach(() => {
    mockedRouterPush.mockClear();
  });

  test("renders the search input", () => {
    render(<ReservationUnitSearch />);
    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  test("submitting the form navigates to the search page with the entered text", async () => {
    const user = userEvent.setup();
    render(<ReservationUnitSearch />);

    const input = screen.getByRole("textbox");
    await user.type(input, "sauna");
    await user.keyboard("{Enter}");

    expect(mockedRouterPush).toHaveBeenCalledTimes(1);
    const [url] = mockedRouterPush.mock.calls[0] ?? [];
    expect(url).toContain("textSearch=sauna");
  });

  test("clicking the search icon navigates with an empty search when no text was entered", async () => {
    const user = userEvent.setup();
    render(<ReservationUnitSearch />);

    await user.click(screen.getByLabelText("common:search"));

    expect(mockedRouterPush).toHaveBeenCalledTimes(1);
    const [url] = mockedRouterPush.mock.calls[0] ?? [];
    expect(url).toContain("textSearch=");
  });
});
