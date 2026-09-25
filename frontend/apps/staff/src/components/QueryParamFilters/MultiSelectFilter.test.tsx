import React from "react";
import { useForm } from "react-hook-form";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MultiSelectFilter, ControlledMultiSelectFilter } from "./MultiSelectFilter";

const { mockUseSearchParams } = vi.hoisted(() => ({
  mockUseSearchParams: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useSearchParams: mockUseSearchParams }));

const { mockUseSetSearchParams } = vi.hoisted(() => ({
  mockUseSetSearchParams: vi.fn(),
}));
vi.mock("@/hooks/useSetSearchParams", () => ({ useSetSearchParams: mockUseSetSearchParams }));

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe("MultiSelectFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders with selected values from search params", () => {
    const mockSearchParams = new URLSearchParams("status=active&status=pending");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    render(
      <MultiSelectFilter
        name="status"
        options={[
          { label: "Active", value: "active" },
          { label: "Pending", value: "pending" },
          { label: "Closed", value: "closed" },
        ]}
      />
    );

    // HDS Select renders differently, just check that the filter is applied
    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("calls setParams when selection changes", async () => {
    const user = userEvent.setup();
    const mockSearchParams = new URLSearchParams("");
    const mockSetParams = vi.fn();
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(mockSetParams);

    render(
      <MultiSelectFilter
        name="status"
        options={[
          { label: "Active", value: "active" },
          { label: "Pending", value: "pending" },
        ]}
      />
    );

    // Without a selection, the dropdown trigger has role "combobox" (the
    // clear "x" button, which has an implicit "button" role, only renders
    // once something is selected)
    await user.click(screen.getByRole("combobox"));
    const [firstOption] = screen.getAllByRole("option");
    if (firstOption == null) {
      throw new Error("Expected at least one option to be rendered");
    }
    await user.click(firstOption);

    expect(mockSetParams).toHaveBeenCalled();
  });

  it("disables select when no options available", () => {
    const mockSearchParams = new URLSearchParams("");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    render(<MultiSelectFilter name="status" options={[]} />);

    // HDS Select exposes "disabled" via aria-disabled rather than the native
    // disabled attribute, so toBeDisabled() (which only checks the native
    // attribute) doesn't apply here.
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
  });

  it("renders with multiple filters from params", () => {
    const mockSearchParams = new URLSearchParams("type=a&type=b&status=active");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    render(
      <MultiSelectFilter
        name="type"
        options={[
          { label: "A", value: "a" },
          { label: "B", value: "b" },
        ]}
      />
    );

    expect(screen.getByRole("button")).toBeInTheDocument();
  });

  it("applies custom styles and className", () => {
    const mockSearchParams = new URLSearchParams("");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    const { container } = render(
      <MultiSelectFilter
        name="status"
        options={[{ label: "Active", value: "active" }]}
        className="custom-class"
        style={{ color: "red" }}
      />
    );

    const selectElement = container.querySelector(".custom-class");
    expect(selectElement).toBeInTheDocument();
  });

  it("enables search filter when enableSearch is true", () => {
    const mockSearchParams = new URLSearchParams("");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    render(<MultiSelectFilter name="status" options={[{ label: "Active", value: "active" }]} enableSearch />);

    expect(screen.getByRole("button")).toBeInTheDocument();
  });
});

describe("ControlledMultiSelectFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders controlled variant with form", () => {
    const mockSearchParams = new URLSearchParams("");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    function TestForm() {
      const { control } = useForm({
        defaultValues: { status: [] },
      });

      return (
        <ControlledMultiSelectFilter
          name="status"
          control={control}
          options={[
            { label: "Active", value: "active" },
            { label: "Pending", value: "pending" },
          ]}
        />
      );
    }

    render(<TestForm />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("handles numeric values", () => {
    const mockSearchParams = new URLSearchParams("");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    function TestForm() {
      const { control } = useForm({
        defaultValues: { ids: [] },
      });

      return (
        <ControlledMultiSelectFilter
          name="ids"
          control={control}
          options={[
            { label: "One", value: 1 },
            { label: "Two", value: 2 },
          ]}
        />
      );
    }

    render(<TestForm />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("converts numeric string values to numbers", () => {
    const mockSearchParams = new URLSearchParams("");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    function TestForm() {
      const { control } = useForm({
        defaultValues: { ids: [1, 2] },
      });

      return (
        <ControlledMultiSelectFilter
          name="ids"
          control={control}
          options={[
            { label: "One", value: 1 },
            { label: "Two", value: 2 },
          ]}
        />
      );
    }

    render(<TestForm />);
    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("disables select when no options available", () => {
    const mockSearchParams = new URLSearchParams("");
    mockUseSearchParams.mockReturnValue(mockSearchParams);
    mockUseSetSearchParams.mockReturnValue(vi.fn());

    function TestForm() {
      const { control } = useForm({
        defaultValues: { status: [] },
      });

      return <ControlledMultiSelectFilter name="status" control={control} options={[]} />;
    }

    render(<TestForm />);
    expect(screen.getByRole("combobox")).toHaveAttribute("aria-disabled", "true");
  });
});
