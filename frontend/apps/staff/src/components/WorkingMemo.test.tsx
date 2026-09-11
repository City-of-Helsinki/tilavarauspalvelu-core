import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { ReservationWorkingMemo, ApplicationWorkingMemo } from "./WorkingMemo";

vi.mock("ui/src/components/toast", () => ({
  successToast: vi.fn(),
}));

vi.mock("ui/src/hooks", () => ({
  useDisplayError: () => vi.fn(),
}));

vi.mock("@gql/gql-types", () => ({
  useUpdateReservationWorkingMemoMutation: () => [vi.fn()],
  useUpdateApplicationWorkingMemoMutation: () => [vi.fn()],
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("ReservationWorkingMemo", () => {
  it("renders textarea with initial value", () => {
    const mockRefetch = vi.fn();
    render(<ReservationWorkingMemo reservationPk={1} initialValue="Test memo" refetch={mockRefetch} />);
    expect(screen.getByDisplayValue("Test memo")).toBeInTheDocument();
  });

  it("disables buttons when memo is unchanged", () => {
    const mockRefetch = vi.fn();
    render(<ReservationWorkingMemo reservationPk={1} initialValue="Test memo" refetch={mockRefetch} />);
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("enables buttons when memo is changed", async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn();
    render(<ReservationWorkingMemo reservationPk={1} initialValue="Test memo" refetch={mockRefetch} />);
    await user.type(screen.getByDisplayValue("Test memo"), " changed");
    expect(screen.getByRole("button", { name: /save/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeEnabled();
  });

  it("cancels changes when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn();
    render(<ReservationWorkingMemo reservationPk={1} initialValue="Test memo" refetch={mockRefetch} />);
    const textarea = screen.getByDisplayValue("Test memo");
    await user.clear(textarea);
    await user.type(textarea, "Test memo changed");
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByDisplayValue("Test memo")).toBeInTheDocument();
  });
});

describe("ApplicationWorkingMemo", () => {
  it("renders textarea with initial value", () => {
    const mockRefetch = vi.fn();
    render(<ApplicationWorkingMemo applicationPk={1} initialValue="Test memo" refetch={mockRefetch} />);
    expect(screen.getByDisplayValue("Test memo")).toBeInTheDocument();
  });

  it("disables buttons when memo is unchanged", () => {
    const mockRefetch = vi.fn();
    render(<ApplicationWorkingMemo applicationPk={1} initialValue="Test memo" refetch={mockRefetch} />);
    expect(screen.getByRole("button", { name: /save/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeDisabled();
  });

  it("enables buttons when memo is changed", async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn();
    render(<ApplicationWorkingMemo applicationPk={1} initialValue="Test memo" refetch={mockRefetch} />);
    await user.type(screen.getByDisplayValue("Test memo"), " changed");
    expect(screen.getByRole("button", { name: /save/i })).toBeEnabled();
    expect(screen.getByRole("button", { name: /cancel/i })).toBeEnabled();
  });

  it("cancels changes when cancel button is clicked", async () => {
    const user = userEvent.setup();
    const mockRefetch = vi.fn();
    render(<ApplicationWorkingMemo applicationPk={1} initialValue="Test memo" refetch={mockRefetch} />);
    const textarea = screen.getByDisplayValue("Test memo");
    await user.clear(textarea);
    await user.type(textarea, "Test memo changed");
    await user.click(screen.getByRole("button", { name: /cancel/i }));
    expect(screen.getByDisplayValue("Test memo")).toBeInTheDocument();
  });
});
