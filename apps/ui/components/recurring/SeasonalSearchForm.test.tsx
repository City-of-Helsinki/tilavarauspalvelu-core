import { describe, test, expect, vi, afterEach, beforeEach } from "vitest";
import { SearchFormProps, SeasonalSearchForm } from "./SeasonalSearchForm";
import { render, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { selectOption } from "@/test/test.utils";

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

// - changes search params when form is submitted
// - does nothing if form is not submitted
// - preselects based on query params
//
// so need query selectors for HDS components that are present in the search form
// - we are only concerned with the form part of the search form
const options: SearchFormProps["options"] = {
  reservationUnitTypeOptions: [1, 2, 3, 4, 5, 6].map((i) => ({
    value: i,
    label: `type ${i}`,
  })),
  purposeOptions: [1, 2, 3, 4, 5].map((i) => ({
    value: i,
    label: `purpose ${i}`,
  })),
  unitOptions: [1, 2, 3, 4, 5, 6, 7, 8].map((i) => ({
    value: i,
    label: `unit ${i}`,
  })),
} as const;

const props: SearchFormProps = {
  options,
  isLoading: false,
} as const;

describe("SeasonalSearchForm", () => {
  beforeEach(async () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("should render empty search form", async () => {
    const view = render(<SeasonalSearchForm {...props} />);
    // TODO check that all selects exist and are empty
    expect(
      view.getByRole("button", { name: "searchForm:searchButton" })
    ).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "searchForm:searchButton" })
    ).not.toBeDisabled();
  });

  test("should be disabled while loading", () => {
    const view = render(<SeasonalSearchForm {...props} isLoading />);
    const searchBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(searchBtn).toBeDisabled();
  });

  test("should search (update query params) on submit", async () => {
    const view = render(<SeasonalSearchForm {...props} />);
    const user = userEvent.setup();
    const selected = options.purposeOptions[0] ?? { label: "", value: 0 };
    await selectOption(view, "searchForm:purposesFilter", selected.label);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(0);
    const searchBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(searchBtn).toBeInTheDocument();
    await user.click(searchBtn);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
  });

  test("should disable unit select if no units are available", () => {
    const options = { ...props.options };
    options.unitOptions = [];
    const view = render(
      <SeasonalSearchForm options={options} isLoading={false} />
    );
    const btn = view.getByLabelText("searchForm:unitFilter", {
      selector: "button",
    });
    expect(btn).toBeInTheDocument();
    // HDS doesn't actually disable the select in DOM, but sets aria-disabled
    expect(btn).toHaveAttribute("aria-disabled", "true");
  });

  test("should disable purpose select if no purposes are available", () => {
    const options = { ...props.options };
    options.purposeOptions = [];
    const view = render(
      <SeasonalSearchForm options={options} isLoading={false} />
    );
    const btn = view.getByLabelText("searchForm:purposesFilter", {
      selector: "button",
    });
    expect(btn).toBeInTheDocument();
    // HDS doesn't actually disable the select in DOM, but sets aria-disabled
    expect(btn).toHaveAttribute("aria-disabled", "true");
  });

  test("should disable type select if no types are available", () => {
    const options = { ...props.options };
    options.reservationUnitTypeOptions = [];
    const view = render(
      <SeasonalSearchForm options={options} isLoading={false} />
    );
    const btn = view.getByLabelText("searchForm:typeLabel", {
      selector: "button",
    });
    expect(btn).toBeInTheDocument();
    // HDS doesn't actually disable the select in DOM, but sets aria-disabled
    expect(btn).toHaveAttribute("aria-disabled", "true");
  });

  test("should preselect based on query params", async () => {
    const selected = options.purposeOptions[0] ?? { label: "", value: 0 };
    const params = new URLSearchParams();
    params.set("purposes", selected.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(<SeasonalSearchForm {...props} />);
    const minPersonLabel = "searchForm:purposesFilter";
    const minPersonSelect = selected.label;
    const btn = view.getByLabelText(minPersonLabel, {
      selector: "button",
    });
    expect(within(btn).getByText(minPersonSelect)).toBeInTheDocument();
  });

  // TODO check tags here per field also
  // searchForm:textSearchLabel (text search)
  test.todo("allow input text search but dont search automatically");

  // multiselects i.e. select multiple options
  // check that we get multiple params and multiple tags also

  // searchForm:typeLabel (reservationUnitTypes) - multiselect
  test("allow select reservation unit type but dont search automatically", async () => {
    const user = userEvent.setup();
    const view = render(<SeasonalSearchForm {...props} />);
    const listboxLabel = "searchForm:typeLabel";
    const optionLabel = "type 1";
    await selectOption(view, listboxLabel, optionLabel);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(0);
    // TODO select another option
    const searchBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(searchBtn).toBeInTheDocument();
    await user.click(searchBtn);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
    // TODO check that the tag is present
    // TODO check that the query param is present
  });
  // searchForm:unitFilter (unit) - multiselect
  test.todo("allow select unit but dont search automatically");
  // searchForm:purposesFilter (purposes) - multiselect
  test.todo("allow select purpose but dont search automatically");
  test.todo("selecting participant count, waiting for refactor");

  // combine this test with the previous one? if we gonna check all of them individually
  // test.todo("tags should be visible");
  test.todo("tags should be removable");
  test.todo("all tags should be clearable at once");
});
