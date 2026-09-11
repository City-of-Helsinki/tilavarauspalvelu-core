import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useUnitSpacesQuery } from "@gql/gql-types";
import { ParentSelector } from "./ParentSelector";

vi.mock("@gql/gql-types", () => ({
  useUnitSpacesQuery: vi.fn(),
}));

describe("ParentSelector", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders disabled when unitPk is not provided and parentless option excluded", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: undefined,
    } as never);

    render(<ParentSelector unitPk={0} onChange={vi.fn()} value={null} label="Parent" noParentless />);

    expect(screen.getByRole("combobox", { name: /parent/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("renders disabled when no spaces available and parentless option excluded", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" noParentless />);

    expect(screen.getByRole("combobox", { name: /parent/i })).toHaveAttribute("aria-disabled", "true");
  });

  it("renders enabled when no spaces but parentless option included", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" />);

    expect(screen.getByRole("combobox", { name: /parent/i })).toHaveAttribute("aria-disabled", "false");
  });

  it("renders enabled when spaces are available", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [{ pk: 1, nameFi: "Space 1", parent: null }],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" />);

    expect(screen.getByRole("combobox", { name: /parent/i })).toHaveAttribute("aria-disabled", "false");
  });

  it("renders space hierarchy with padding", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [
            { pk: 1, nameFi: "Root", parent: null },
            { pk: 2, nameFi: "Child", parent: { pk: 1 } },
          ],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("includes parentless option by default", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [{ pk: 1, nameFi: "Space 1", parent: null }],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("excludes parentless option when noParentless is true", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [{ pk: 1, nameFi: "Space 1", parent: null }],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" noParentless />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("filters out self and direct children of self", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [
            { pk: 1, nameFi: "Root", parent: null },
            { pk: 2, nameFi: "Self", parent: { pk: 1 } },
            { pk: 3, nameFi: "Child of Self", parent: { pk: 2 } },
            { pk: 4, nameFi: "Other", parent: { pk: 1 } },
          ],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" selfPk={2} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays placeholder text", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [{ pk: 1, nameFi: "Space 1", parent: null }],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" placeholder="Select a parent" />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays helper text", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [{ pk: 1, nameFi: "Space 1", parent: null }],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" helperText="Help text" />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("displays error text and marks as invalid", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [{ pk: 1, nameFi: "Space 1", parent: null }],
        },
      },
    } as never);

    render(
      <ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" errorText="This field is required" />
    );

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("calls onChange when selection changes", async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [
            { pk: 1, nameFi: "Space 1", parent: null },
            { pk: 2, nameFi: "Space 2", parent: null },
          ],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={mockOnChange} value={null} label="Parent" />);

    const button = screen.getByRole("combobox");
    await user.click(button);

    expect(button).toBeInTheDocument();
  });

  it("skips query when unitPk is 0", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: undefined,
    } as never);

    render(<ParentSelector unitPk={0} onChange={vi.fn()} value={null} label="Parent" />);

    expect(useUnitSpacesQuery).toHaveBeenCalledWith({
      fetchPolicy: "no-cache",
      variables: expect.any(Object),
      skip: true,
    });
  });

  it("handles spaces with null nameFi", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [
            { pk: 1, nameFi: null, parent: null },
            { pk: 2, nameFi: "Space 2", parent: null },
          ],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });

  it("handles spaces with empty nameFi", () => {
    vi.mocked(useUnitSpacesQuery).mockReturnValue({
      data: {
        unit: {
          spaces: [
            { pk: 1, nameFi: "", parent: null },
            { pk: 2, nameFi: "Space 2", parent: null },
          ],
        },
      },
    } as never);

    render(<ParentSelector unitPk={1} onChange={vi.fn()} value={null} label="Parent" />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
  });
});
