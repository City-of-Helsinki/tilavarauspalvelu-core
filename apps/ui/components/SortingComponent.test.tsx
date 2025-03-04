import { render } from "@testing-library/react";
import { SortingComponent } from "./SortingComponent";
import { vi, describe, test, expect, afterEach, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { selectOption } from "@/test/testUtils";

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
describe("SortingComponent", async () => {
  beforeEach(async () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("should render sorting component", async () => {
    const view = render(<SortingComponent />);
    const btnLabel = view.getByText("searchResultList:sortButtonLabel");
    expect(btnLabel).toBeInTheDocument();
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

  test("should respond respect order query param", async () => {
    const params = new URLSearchParams();
    params.set("order", "desc");
    mockedSearchParams.mockReturnValue(params);
    const view = render(<SortingComponent />);
    const orderBtn = view.getByRole("button", {
      name: "search:sorting.action.ascending",
    });
    expect(orderBtn).toBeInTheDocument();
  });

  test("sorting component should respond to order type select", async () => {
    const view = render(<SortingComponent />);
    const optionLabel = /sorting.label.type/;
    const listLabel = /searchResultList:sortButtonLabel/;
    expect(mockedRouterReplace).toHaveBeenCalledTimes(0);
    await selectOption(view, listLabel, optionLabel);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
  });

  test("sorting component should respond to order unit select", async () => {
    const view = render(<SortingComponent />);
    const optionLabel = /sorting.label.unit/;
    const listLabel = /searchResultList:sortButtonLabel/;
    expect(mockedRouterReplace).toHaveBeenCalledTimes(0);
    await selectOption(view, listLabel, optionLabel);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
  });

  test("sorting component should respond to order name select", async () => {
    const view = render(<SortingComponent />);
    const optionLabel = /sorting.label.name/;
    const listLabel = /searchResultList:sortButtonLabel/;
    await selectOption(view, listLabel, /sorting.label.type/);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
    await selectOption(view, listLabel, optionLabel);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(2);
  });
});
