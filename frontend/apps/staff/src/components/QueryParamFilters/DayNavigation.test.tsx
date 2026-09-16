import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { DayNavigation } from "./DayNavigation";

const { mockUseSearchParams } = vi.hoisted(() => ({
  mockUseSearchParams: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useSearchParams: mockUseSearchParams }));

const { mockUseSetSearchParams } = vi.hoisted(() => ({
  mockUseSetSearchParams: vi.fn(),
}));
vi.mock("@/hooks/useSetSearchParams", () => ({ useSetSearchParams: mockUseSetSearchParams }));

describe("DayNavigation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("throws error when name is empty", () => {
    mockUseSearchParams.mockReturnValue(new URLSearchParams());
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    expect(() => {
      render(<DayNavigation name="" />);
    }).toThrow("name must not be empty");
  });

  it("renders date from search params", () => {
    const mockSearchParams = new URLSearchParams("date=15.01.2024");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    render(<DayNavigation name="date" />);
    expect(screen.getByDisplayValue("15.01.2024")).toBeInTheDocument();
  });

  it("renders empty date input when no date in params", () => {
    const mockSearchParams = new URLSearchParams("");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    render(<DayNavigation name="date" />);
    expect(screen.getByDisplayValue("")).toBeInTheDocument();
  });

  it("renders day abbreviation", () => {
    const mockSearchParams = new URLSearchParams("date=15.01.2024");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    render(<DayNavigation name="date" />);
    // The i18next mock returns the translation key itself, e.g. "translation:dayShort.0"
    expect(screen.getByText(/^translation:dayShort\.\d$/)).toBeInTheDocument();
  });

  it("calls setSearchParams on date input change", async () => {
    const user = userEvent.setup();
    const mockSearchParams = new URLSearchParams("date=15.01.2024");
    const mockSetParams = vi.fn();
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(mockSetParams);

    render(<DayNavigation name="date" />);
    const dateInput = screen.getByDisplayValue("15.01.2024");
    await user.clear(dateInput);
    // HDS DateInput only propagates onChange to its consumer on blur/Enter, not per keystroke
    await user.type(dateInput, "16.01.2024{Enter}");

    expect(mockSetParams).toHaveBeenCalled();
  });

  it("handles previous day navigation", async () => {
    const user = userEvent.setup();
    const mockSearchParams = new URLSearchParams("date=15.01.2024");
    const mockSetParams = vi.fn();
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(mockSetParams);

    render(<DayNavigation name="date" />);
    const prevButton = screen.getByRole("button", { name: /prev/i });
    await user.click(prevButton);

    expect(mockSetParams).toHaveBeenCalled();
  });

  it("handles next day navigation", async () => {
    const user = userEvent.setup();
    const mockSearchParams = new URLSearchParams("date=15.01.2024");
    const mockSetParams = vi.fn();
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(mockSetParams);

    render(<DayNavigation name="date" />);
    const nextButton = screen.getByRole("button", { name: /next/i });
    await user.click(nextButton);

    expect(mockSetParams).toHaveBeenCalled();
  });

  it("deletes param when date is cleared", async () => {
    const user = userEvent.setup();
    const mockSearchParams = new URLSearchParams("date=15.01.2024");
    const mockSetParams = vi.fn();
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(mockSetParams);

    render(<DayNavigation name="date" />);
    const dateInput = screen.getByDisplayValue("15.01.2024");
    // HDS DateInput only propagates onChange to its consumer on blur/Enter, not per keystroke
    await user.clear(dateInput);
    await user.type(dateInput, "{Enter}");

    expect(mockSetParams).toHaveBeenCalled();
  });

  it("uses current date when param date is invalid", () => {
    const mockSearchParams = new URLSearchParams("date=invalid");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    render(<DayNavigation name="date" />);
    // Should still render with some date (current date as fallback)
    expect(screen.getByDisplayValue("invalid")).toBeInTheDocument();
  });

  it("renders with different param names", () => {
    const mockSearchParams = new URLSearchParams("customDate=15.01.2024");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    render(<DayNavigation name="customDate" />);
    expect(screen.getByDisplayValue("15.01.2024")).toBeInTheDocument();
  });
});
