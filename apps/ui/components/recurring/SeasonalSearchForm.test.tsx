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
  handleSearch: vi.fn(),
  options,
  isLoading: false,
} as const;

beforeEach(async () => {
  mockedSearchParams.mockReturnValue(new URLSearchParams());
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("SeasonalSearchForm", () => {
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
    const handleSearch = vi.fn();
    const view = render(
      <SeasonalSearchForm {...props} handleSearch={handleSearch} />
    );
    const user = userEvent.setup();
    const selected = options.purposeOptions[0] ?? { label: "", value: 0 };
    await selectOption(view, "searchForm:purposesFilter", selected.label);
    expect(handleSearch).toHaveBeenCalledTimes(0);
    const searchBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(searchBtn).toBeInTheDocument();
    await user.click(searchBtn);
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  test("should disable unit select if no units are available", () => {
    const options = { ...props.options };
    options.unitOptions = [];
    const view = render(<SeasonalSearchForm {...props} options={options} />);
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
    const view = render(<SeasonalSearchForm {...props} options={options} />);
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
    const view = render(<SeasonalSearchForm {...props} options={options} />);
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

  test("allow input text search but dont search automatically", async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    const view = render(
      <SeasonalSearchForm {...props} handleSearch={handleSearch} />
    );
    const searchLabel = "searchForm:textSearchLabel";
    const searchValue = "foobar";
    expect(view.getByLabelText(searchLabel)).toBeInTheDocument();
    await user.type(view.getByLabelText(searchLabel), searchValue);
    expect(handleSearch).toHaveBeenCalledTimes(0);
    const searchBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(searchBtn).toBeInTheDocument();
    await user.click(searchBtn);
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  // multiselects i.e. select multiple options
  // check that we get multiple params and multiple tags also

  // searchForm:typeLabel (reservationUnitTypes) - multiselect
  test("allow select reservation unit type but dont search automatically", async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    const view = render(
      <SeasonalSearchForm {...props} handleSearch={handleSearch} />
    );
    const listboxLabel = "searchForm:typeLabel";
    const optionLabel = "type 1";
    await selectOption(view, listboxLabel, optionLabel);
    expect(handleSearch).toHaveBeenCalledTimes(0);
    // TODO select another option
    const searchBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(searchBtn).toBeInTheDocument();
    await user.click(searchBtn);
    // TODO check the selected options
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  // searchForm:unitFilter (unit) - multiselect
  test.todo("allow select unit but dont search automatically");
  // searchForm:purposesFilter (purposes) - multiselect
  test.todo("allow select purpose but dont search automatically");
  test.todo("selecting participant count, waiting for refactor");
});

// Tags are based on the search params, but submit search operates on a callback
describe("Tags should modify search params", () => {
  test("no tags should be visible by default", () => {
    const handleSearch = vi.fn();
    const view = render(
      <SeasonalSearchForm {...props} handleSearch={handleSearch} />
    );
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    expect(tags.children).toHaveLength(0);
  });

  test("tags should be visible", () => {
    const handleSearch = vi.fn();
    const params = new URLSearchParams();
    const selected = options.purposeOptions[0] ?? { label: "", value: 0 };
    params.set("purposes", selected.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(
      <SeasonalSearchForm {...props} handleSearch={handleSearch} />
    );
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    // check that we have one tag + the clear all button
    expect(tags.children).toHaveLength(2);
    expect(within(tags).getByText("searchForm:resetForm")).toBeInTheDocument();
    expect(within(tags).getByText(`purpose ${selected.value}`)).toBeInTheDocument();
  });

  test("multiple tags for same option should be visible", () => {
    const handleSearch = vi.fn();
    const params = new URLSearchParams();
    const selected1 = options.purposeOptions[0] ?? { label: "", value: 0 };
    const selected2 = options.purposeOptions[1] ?? { label: "", value: 0 };
    params.append("purposes", selected1.value.toString());
    params.append("purposes", selected2.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(
      <SeasonalSearchForm {...props} handleSearch={handleSearch} />
    );
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    // check that we have one tag + the clear all button
    expect(tags.children).toHaveLength(3);
    expect(within(tags).getByText("searchForm:resetForm")).toBeInTheDocument();
    expect(within(tags).getByText(`purpose ${selected1.value}`)).toBeInTheDocument();
    expect(within(tags).getByText(`purpose ${selected2.value}`)).toBeInTheDocument();
  });

  test("multiple tags for different options should be visible", () => {
    const handleSearch = vi.fn();
    const params = new URLSearchParams();
    const selected1 = options.purposeOptions[0] ?? { label: "", value: 0 };
    const selected2 = options.reservationUnitTypeOptions[1] ?? { label: "", value: 0 };
    params.append("purposes", selected1.value.toString());
    params.append("reservationUnitTypes", selected2.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(
      <SeasonalSearchForm {...props} handleSearch={handleSearch} />
    );
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    // check that we have one tag + the clear all button
    expect(tags.children).toHaveLength(3);
    expect(within(tags).getByText("searchForm:resetForm")).toBeInTheDocument();
    expect(within(tags).getByText(`purpose ${selected1.value}`)).toBeInTheDocument();
    expect(within(tags).getByText(`type ${selected2.value}`)).toBeInTheDocument();
  });

  test("tags should be removable", async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    const params = new URLSearchParams();
    const selected = options.purposeOptions[0] ?? { label: "", value: 0 };
    params.set("purposes", selected.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(
      <SeasonalSearchForm {...props} handleSearch={handleSearch} />
    );
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    // check that we have one tag + the clear all button
    expect(tags.children).toHaveLength(2);
    expect(within(tags).getByText("searchForm:resetForm")).toBeInTheDocument();
    const removeBtn = within(tags).getByRole("button", {
      // NOTE problematic because we can't search by the inner <span> but only by the aria-label
      // the aria-label is the same for all tags because of our mocked TFunction
      name: "searchForm:removeFilter"
    });
    expect(removeBtn).toBeInTheDocument();
    expect(removeBtn).toHaveTextContent(`purpose ${selected.value}`);
    await user.click(removeBtn);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
    // TODO should have more values and we should expect them not to be removed
  });

  test("all tags should be clearable at once", async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    // TODO add more tags
    const params = new URLSearchParams();
    const selected = options.purposeOptions[0] ?? { label: "", value: 0 };
    params.set("purposes", selected.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(
      <SeasonalSearchForm {...props} handleSearch={handleSearch} />
    );
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    const resetBtn = within(tags).getByRole("button", {
      name: "searchForm:resetForm",
    });
    expect(resetBtn).toBeInTheDocument();
    await user.click(resetBtn);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
  });
});
