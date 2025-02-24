import { render } from "@testing-library/react";
import { SortingComponent } from "./SortingComponent";

// TODO move the router mocks to general setup
// problem with that is we lose the control of the mock
// unless we wrap it in a function so we can't read the number of calls
// or what values it was called with
// also we'd have to manage local state for the mock if we want to inspect
// the values it was called with
jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "",
      query: "",
      asPath: "",
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => null),
    };
  },
}));

jest.mock("next/navigation", () => ({
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
