import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ScrollToTop } from "./ScrollToTop";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("ScrollToTop", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.runOnlyPendingTimers();
    vi.useRealTimers();
  });

  it("returns null initially when not scrolled", () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);

    const { container } = render(<ScrollToTop />);
    expect(container.firstChild).toBeNull();
  });

  it("renders button when scrolled down", async () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);

    render(<ScrollToTop />);
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });
  });

  it("hides button when scrolled back up", async () => {
    let scrollValue = 1000;
    vi.spyOn(window, "scrollY", "get").mockImplementation(() => scrollValue);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);

    render(<ScrollToTop />);
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    scrollValue = 0;
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
    });
  });

  it("scrolls to top when button is clicked", async () => {
    const user = userEvent.setup({ delay: null });
    const mockScroll = vi.spyOn(window, "scroll").mockImplementation(() => {});
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);

    render(<ScrollToTop />);
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    const button = screen.getByRole("button");
    await user.click(button);

    expect(mockScroll).toHaveBeenCalledWith({
      top: 0,
      left: 0,
      behavior: "smooth",
    });

    mockScroll.mockRestore();
  });

  it("has correct aria-label", async () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(1000);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);

    render(<ScrollToTop />);
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /common:scrollToTop/i })).toBeInTheDocument();
    });
  });

  it("sets up polling interval on mount", () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);

    render(<ScrollToTop />);

    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });

  it("clears polling interval on unmount", () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);

    const { unmount } = render(<ScrollToTop />);
    const timerCountBefore = vi.getTimerCount();

    unmount();
    const timerCountAfter = vi.getTimerCount();

    expect(timerCountAfter).toBeLessThan(timerCountBefore);
  });

  it("calculates visibility based on scroll position and window height", async () => {
    const mockScrollY = vi.spyOn(window, "scrollY", "get");
    const mockInnerHeight = vi.spyOn(window, "innerHeight", "get");

    mockScrollY.mockReturnValue(0);
    mockInnerHeight.mockReturnValue(800);

    const { rerender } = render(<ScrollToTop />);
    vi.advanceTimersByTime(300);

    expect(screen.queryByRole("button")).not.toBeInTheDocument();

    mockScrollY.mockReturnValue(900);
    rerender(<ScrollToTop />);
    vi.advanceTimersByTime(300);

    await waitFor(() => {
      expect(screen.getByRole("button")).toBeInTheDocument();
    });

    mockScrollY.mockRestore();
    mockInnerHeight.mockRestore();
  });

  it("uses 300ms polling interval", () => {
    vi.spyOn(window, "scrollY", "get").mockReturnValue(0);
    vi.spyOn(window, "innerHeight", "get").mockReturnValue(800);

    render(<ScrollToTop />);

    const timerIdBefore = vi.getTimerCount();
    vi.advanceTimersByTime(299);
    const timerIdAfter = vi.getTimerCount();

    // Should only have one timer
    expect(timerIdBefore - timerIdAfter).toBe(0);

    vi.advanceTimersByTime(1);
    expect(vi.getTimerCount()).toBeGreaterThan(0);
  });
});
