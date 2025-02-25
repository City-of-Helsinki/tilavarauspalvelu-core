import { render } from "@testing-library/react";
import { SortingComponent } from "./SortingComponent";
import { vi, describe, test, expect } from "vitest";

// TODO move the router mocks to general setup
// problem with that is we lose the control of the mock
// unless we wrap it in a function so we can't read the number of calls
// or what values it was called with
// also we'd have to manage local state for the mock if we want to inspect
// the values it was called with
vi.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "",
      query: "",
      asPath: "",
      push: vi.fn(),
      events: {
        on: vi.fn(),
        off: vi.fn(),
      },
      beforePopState: vi.fn(() => null),
      prefetch: vi.fn(() => null),
    };
  },
}));

vi.mock("next/navigation", () => ({
  useSearchParams() {
    const vals: URLSearchParams = new URLSearchParams();
    return vals;
  },
}));

describe("SortingComponent", () => {
  test("should render sorting component", () => {
    const view = render(<SortingComponent />);
    expect(
      view.getByText("searchResultList:sortButtonLabel")
    ).toBeInTheDocument();
    // TODO get by aria-label (button)
    // expect(view.getByText("search:sorting.action.ascending")).toBeInTheDocument();
    // TODO check that there is an option preselected in the select
  });
  test.todo("sorting component should respond to order asc/desc");
  test.todo("sorting component should respond to order type select");
});
