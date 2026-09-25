import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { SearchTags } from "./SearchTags";

const { mockUseSearchParams } = vi.hoisted(() => ({
  mockUseSearchParams: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useSearchParams: mockUseSearchParams }));

const { mockUseSetSearchParams } = vi.hoisted(() => ({
  mockUseSetSearchParams: vi.fn(),
}));
vi.mock("@/hooks/useSetSearchParams", () => ({ useSetSearchParams: mockUseSetSearchParams }));

describe("SearchTags", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders tags from search params", () => {
    const mockSearchParams = new URLSearchParams("filter=value&status=active");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    const translateTag = vi.fn((key, val) => `${key}: ${val}`);

    render(<SearchTags translateTag={translateTag} />);

    expect(screen.getByText("filter: value")).toBeInTheDocument();
    expect(screen.getByText("status: active")).toBeInTheDocument();
  });

  it("hides specified param keys", () => {
    const mockSearchParams = new URLSearchParams("filter=value&hidden=secret&status=active");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    const translateTag = vi.fn((key, val) => `${key}: ${val}`);

    render(<SearchTags translateTag={translateTag} hide={["hidden"]} />);

    expect(screen.getByText("filter: value")).toBeInTheDocument();
    expect(screen.getByText("status: active")).toBeInTheDocument();
    expect(screen.queryByText(/hidden/)).not.toBeInTheDocument();
  });

  it("skips tags with empty translation", () => {
    const mockSearchParams = new URLSearchParams("filter=value&skip=notranslation");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    const translateTag = vi.fn((key, val) => {
      if (key === "skip") return "";
      return `${key}: ${val}`;
    });

    render(<SearchTags translateTag={translateTag} />);

    expect(screen.getByText("filter: value")).toBeInTheDocument();
    expect(screen.queryByText(/skip/)).not.toBeInTheDocument();
  });

  it("deletes a tag when clicked", async () => {
    const user = userEvent.setup();
    const mockSearchParams = new URLSearchParams("filter=value&status=active");
    const mockSetParams = vi.fn();
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(mockSetParams);

    const translateTag = vi.fn((key, val) => `${key}: ${val}`);

    render(<SearchTags translateTag={translateTag} />);

    const deleteButtons = screen.getAllByRole("button");
    // Find the delete button for the first tag
    const [firstDeleteButton] = deleteButtons;
    if (firstDeleteButton == null) {
      throw new Error("Expected at least one delete button to be rendered");
    }
    await user.click(firstDeleteButton);

    expect(mockSetParams).toHaveBeenCalled();
  });

  it("shows reset button when tags exist", () => {
    const mockSearchParams = new URLSearchParams("filter=value");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    const translateTag = vi.fn((key, val) => `${key}: ${val}`);

    render(<SearchTags translateTag={translateTag} clearButtonLabel="Clear all" />);

    expect(screen.getByText("Clear all")).toBeInTheDocument();
  });

  it("hides reset button when no tags and no default tags", () => {
    const mockSearchParams = new URLSearchParams("");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    const translateTag = vi.fn();

    const { container } = render(<SearchTags translateTag={translateTag} />);

    // Should only render the container, no reset button
    expect(container.querySelector("button")).not.toBeInTheDocument();
  });

  it("resets to default tags when reset button is clicked", async () => {
    const user = userEvent.setup();
    const mockSearchParams = new URLSearchParams("filter=value&hidden=keep");
    const mockSetParams = vi.fn();
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(mockSetParams);

    const translateTag = vi.fn((key, val) => `${key}: ${val}`);

    render(
      <SearchTags
        translateTag={translateTag}
        hide={["hidden"]}
        defaultTags={[{ key: "filter", value: "default" }]}
        clearButtonLabel="Reset"
      />
    );

    await user.click(screen.getByText("Reset"));

    expect(mockSetParams).toHaveBeenCalled();
  });

  it("handles default tags with array values", async () => {
    const user = userEvent.setup();
    const mockSearchParams = new URLSearchParams("filter=value");
    const mockSetParams = vi.fn();
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(mockSetParams);

    const translateTag = vi.fn((key, val) => `${key}: ${val}`);

    render(
      <SearchTags
        translateTag={translateTag}
        defaultTags={[{ key: "status", value: ["active", "pending"] }]}
        clearButtonLabel="Reset"
      />
    );

    await user.click(screen.getByText("Reset"));

    expect(mockSetParams).toHaveBeenCalled();
  });
});
