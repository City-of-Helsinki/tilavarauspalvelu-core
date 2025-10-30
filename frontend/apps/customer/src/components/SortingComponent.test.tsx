import { render } from "@testing-library/react";
import { SORTING_OPTIONS, SortingComponent } from "./SortingComponent";
import { vi, describe, test, expect, afterEach, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { selectOption } from "@test/test.utils";

// Reusing mocks is ridiculously difficult because of hoisted imports
const { mockedRouterReplace, useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      query: "",
    }),
    mockedRouterReplace,
  };
});

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
  const params = vi.fn();
  return {
    useSearchParams: params,
    mockedSearchParams: params,
  };
});

vi.mock("next/navigation", () => ({
  useSearchParams,
}));

vi.mock("next/router", () => ({
  useRouter,
}));

// everything should respond to query params
// -> separate tests for fetching (they are based only on query params)
describe("SortingComponent", () => {
  beforeEach(() => {
    mockedSearchParams.mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("should render sorting component", () => {
    const view = render(<SortingComponent />);
    const btnLabel = view.getByText("searchResultList:sortButtonLabel");
    expect(btnLabel).toBeInTheDocument();
  });

  test("sort component should default to by name", () => {
    const view = render(<SortingComponent />);
    const nameLabel = /sorting.label.name/;
    expect(view.getByText(nameLabel)).toBeInTheDocument();
  });

  test("should respond to order asc/desc", async () => {
    const view = render(<SortingComponent />);
    const orderBtn = view.getByRole("button", {
      name: "search:sorting.action.descending",
    });
    expect(orderBtn).toBeInTheDocument();
    const user = userEvent.setup();
    expect(mockedRouterReplace).toHaveBeenCalledTimes(0);
    await user.click(orderBtn);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
  });

  test("should order by query param", () => {
    const params = new URLSearchParams();
    params.set("order", "desc");
    mockedSearchParams.mockReturnValue(params);
    const view = render(<SortingComponent />);
    const orderBtn = view.getByRole("button", {
      name: "search:sorting.action.ascending",
    });
    expect(orderBtn).toBeInTheDocument();
  });

  test.for(SORTING_OPTIONS)("should select sort by query param $value", ({ value, label }) => {
    const params = new URLSearchParams();
    params.set("sort", value);
    mockedSearchParams.mockReturnValue(params);
    const view = render(<SortingComponent />);
    expect(view.getByText(label)).toBeInTheDocument();
  });

  test.for(
    SORTING_OPTIONS.map((option, i) => ({
      ...option,
      next: i < SORTING_OPTIONS.length - 1 ? SORTING_OPTIONS[i + 1] : SORTING_OPTIONS[0],
    }))
  )("should change sort value on select from $value to $next.value", async ({ value, label, next }) => {
    if (next == null) {
      throw new Error("select is null");
    }
    const params = new URLSearchParams();
    params.set("sort", value);
    mockedSearchParams.mockReturnValue(params);
    const view = render(<SortingComponent />);
    expect(view.getByText(label)).toBeInTheDocument();
    const optionLabel = next.label;
    const listLabel = /searchResultList:sortButtonLabel/;
    expect(mockedRouterReplace).toHaveBeenCalledTimes(0);
    await selectOption(view, listLabel, optionLabel);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
  });
});
