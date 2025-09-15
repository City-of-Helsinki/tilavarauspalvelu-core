import { describe, test, expect, vi, afterEach, beforeEach } from "vitest";
import { type SearchFormProps, SeasonalSearchForm } from "./SeasonalSearchForm";
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

function constructOption(label: string, n: number) {
  return [...Array(n)]
    .map((_, i) => i + 1)
    .map((i) => ({
      value: i,
      label: `${label} ${i}`,
    }));
}
function constructOptions({
  nReservationUnitTypeOptions = 6,
  nPurposeOptions = 5,
  nUnitOptions = 8,
} = {}): SearchFormProps["options"] {
  return {
    reservationUnitTypes: constructOption("reservationUnitTypes", nReservationUnitTypeOptions),
    purposes: constructOption("purposes", nPurposeOptions),
    units: constructOption("units", nUnitOptions),
  } as const;
}

function constructProps({
  options = constructOptions(),
}: {
  options?: SearchFormProps["options"];
} = {}): SearchFormProps {
  return {
    handleSearch: vi.fn(),
    options,
    isLoading: false,
  } as const;
}

beforeEach(() => {
  mockedSearchParams.mockReturnValue(new URLSearchParams());
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("SeasonalSearchForm", () => {
  test("should render empty search form", () => {
    const view = render(<SeasonalSearchForm {...constructProps()} />);
    // TODO check that all selects exist and are empty
    const searchBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(searchBtn).toBeInTheDocument();
    expect(searchBtn).not.toBeDisabled();
  });

  test("should be disabled while loading", () => {
    const view = render(<SeasonalSearchForm {...constructProps()} isLoading />);
    const searchBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(searchBtn).toBeDisabled();
  });

  test("should search (update query params) on submit", async () => {
    const handleSearch = vi.fn();
    const options = constructOptions();
    const view = render(<SeasonalSearchForm {...constructProps({ options })} handleSearch={handleSearch} />);
    const user = userEvent.setup();
    const selected = options.purposes[0] ?? { label: "", value: 0 };
    await selectOption(view, "searchForm:labels.purposes", selected.label);
    expect(handleSearch).toHaveBeenCalledTimes(0);
    const searchBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(searchBtn).toBeInTheDocument();
    await user.click(searchBtn);
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  test.for([{ key: "purposes" }, { key: "reservationUnitTypes" }, { key: "units" }] as const)(
    "should disable %key select if no options are available",
    ({ key }) => {
      const options = { ...constructOptions() };
      options[key] = [];
      const view = render(<SeasonalSearchForm {...constructProps({ options })} />);
      // const view = render(<SeasonalSearchForm {...props} options={options} />);
      const btn = view.getByLabelText(`searchForm:labels.${key}`, {
        selector: "button",
      });
      expect(btn).toBeInTheDocument();
      // HDS doesn't actually disable the select in DOM, but sets aria-disabled
      expect(btn).toHaveAttribute("aria-disabled", "true");
    }
  );

  test("should preselect based on query params", () => {
    const options = constructOptions();
    const selected = options.purposes[0] ?? { label: "", value: 0 };
    const params = new URLSearchParams();
    params.set("purposes", selected.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(<SeasonalSearchForm {...constructProps({ options })} />);
    const label = "searchForm:labels.purposes";
    const btn = view.getByLabelText(label, {
      selector: "button",
    });
    expect(within(btn).getByText(selected.label)).toBeInTheDocument();
  });

  test("allow input text search but dont search automatically", async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    const view = render(<SeasonalSearchForm {...constructProps()} handleSearch={handleSearch} />);
    const searchLabel = "searchForm:labels.textSearch";
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

  test("allow select reservation unit type but dont search automatically", async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    const view = render(<SeasonalSearchForm {...constructProps()} handleSearch={handleSearch} />);
    const listboxLabel = "searchForm:labels.reservationUnitTypes";
    const optionLabel = "reservationUnitTypes 1";
    await selectOption(view, listboxLabel, optionLabel);
    expect(handleSearch).toHaveBeenCalledTimes(0);
    const searchBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(searchBtn).toBeInTheDocument();
    await user.click(searchBtn);
    expect(handleSearch).toHaveBeenCalledTimes(1);
  });

  test.todo("selecting participant count, waiting for refactor");
});

// Tags are based on the search params, but submit search operates on a callback
describe("Tags should modify search params", () => {
  test("no tags should be visible by default", () => {
    const handleSearch = vi.fn();
    const props = constructProps();
    const view = render(<SeasonalSearchForm {...props} handleSearch={handleSearch} />);
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    expect(tags.children).toHaveLength(0);
  });

  test("query params should be shown as tags", () => {
    const handleSearch = vi.fn();
    const params = new URLSearchParams();
    const options = constructOptions();
    const selected = options.purposes[0] ?? { label: "", value: 0 };
    params.set("purposes", selected.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(<SeasonalSearchForm {...constructProps({ options })} handleSearch={handleSearch} />);
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    // check that we have one tag + the clear all button
    expect(tags.children).toHaveLength(2);
    expect(within(tags).getByText("common:clear")).toBeInTheDocument();
    expect(within(tags).getByText(`purposes ${selected.value}`)).toBeInTheDocument();
  });

  test.for([{ key: "purposes" }, { key: "reservationUnitTypes" }, { key: "units" }] as const)(
    "multiple tags for same option should be visible $key",
    ({ key }) => {
      const handleSearch = vi.fn();
      const options = constructOptions();
      const list = options[key];
      const params = new URLSearchParams();
      const selected1 = list[0];
      const selected2 = list[1];
      if (selected1 == null || selected2 == null) {
        throw new Error("No second option found");
      }
      params.append(key, selected1.value.toString());
      params.append(key, selected2.value.toString());
      mockedSearchParams.mockReturnValue(params);
      const view = render(<SeasonalSearchForm {...constructProps({ options })} handleSearch={handleSearch} />);
      const tags = view.getByTestId("search-form__filter--tags");
      expect(tags).toBeInTheDocument();
      // check that we have one tag + the clear all button
      expect(within(tags).getByText("common:clear")).toBeInTheDocument();
      expect(within(tags).getByText(`${key} ${selected1.value}`)).toBeInTheDocument();
      expect(within(tags).getByText(`${key} ${selected2.value}`)).toBeInTheDocument();
    }
  );

  test("multiple tags for different options should be visible", () => {
    const handleSearch = vi.fn();
    const params = new URLSearchParams();
    const options = constructOptions();
    const selected1 = options.purposes[0];
    const selected2 = options.reservationUnitTypes[1];
    if (selected1 == null || selected2 == null) {
      throw new Error("No option found");
    }
    params.append("purposes", selected1.value.toString());
    params.append("reservationUnitTypes", selected2.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(<SeasonalSearchForm {...constructProps({ options })} handleSearch={handleSearch} />);
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    // check that we have one tag + the clear all button
    expect(tags.children).toHaveLength(3);
    expect(within(tags).getByText("common:clear")).toBeInTheDocument();
    expect(within(tags).getByText(`purposes ${selected1.value}`)).toBeInTheDocument();
    expect(within(tags).getByText(`reservationUnitTypes ${selected2.value}`)).toBeInTheDocument();
  });

  // TODO should test all multi select options in single for loop
  test("tags should be removable", async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    const params = new URLSearchParams();
    const options = constructOptions();
    const selected = options.purposes[0];
    const selected2 = options.purposes[1];
    if (selected == null || selected2 == null) {
      throw new Error("No option found");
    }
    params.append("purposes", selected.value.toString());
    params.append("purposes", selected2.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(<SeasonalSearchForm {...constructProps({ options })} handleSearch={handleSearch} />);
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    // check that we have one tag + the clear all button
    expect(tags.children).toHaveLength(3);
    expect(within(tags).getByText("common:clear")).toBeInTheDocument();
    const tagBtns = within(tags).getAllByRole("button", {
      name: 'searchForm:removeFilter {"value":"purposes 1"}',
    });
    const removeBtn = tagBtns[0];
    if (!removeBtn) {
      throw new Error("No remove button found");
    }
    expect(removeBtn).toBeInTheDocument();
    expect(removeBtn).toHaveTextContent(`purposes ${selected.value}`);
    await user.click(removeBtn);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
    // check we only removed the first tag
    expect(mockedRouterReplace).toHaveBeenCalledWith({ query: "purposes=2" }, undefined, {
      scroll: false,
      shallow: true,
    });
  });

  test("all tags should be clearable at once", async () => {
    const user = userEvent.setup();
    const handleSearch = vi.fn();
    // TODO add more tags
    const params = new URLSearchParams();
    const options = constructOptions();
    const selected = options.purposes[0] ?? { label: "", value: 0 };
    const selected2 = options.purposes[1] ?? { label: "", value: 0 };
    params.append("purposes", selected.value.toString());
    params.append("purposes", selected2.value.toString());
    mockedSearchParams.mockReturnValue(params);
    const view = render(<SeasonalSearchForm {...constructProps({ options })} handleSearch={handleSearch} />);
    const tags = view.getByTestId("search-form__filter--tags");
    expect(tags).toBeInTheDocument();
    const resetBtn = within(tags).getByRole("button", {
      name: "common:clear",
    });
    expect(resetBtn).toBeInTheDocument();
    await user.click(resetBtn);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
    expect(mockedRouterReplace).toHaveBeenCalledWith({ query: "" }, undefined, {
      scroll: false,
      shallow: true,
    });
  });
});
