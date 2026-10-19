import { render } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { addDays } from "date-fns";
import { describe, test, expect, vi, afterEach, beforeEach } from "vitest";
import { formatDate } from "ui/src/modules/date-utils";
import type { OptionsListT } from "ui/src/modules/search";
import { SingleSearchForm } from "./SingleSearchForm";

const { mockedHandleSearch, useSearchModify } = vi.hoisted(() => {
  const mockedHandleSearch = vi.fn();
  return {
    useSearchModify: () => ({
      handleSearch: mockedHandleSearch,
      handleRemoveTag: vi.fn(),
      handleResetTags: vi.fn(),
    }),
    mockedHandleSearch,
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

vi.mock("@/hooks/useSearchValues", () => ({
  useSearchModify,
}));

const options: OptionsListT = {
  units: [],
  equipments: [],
  intendedUses: [],
  reservationPurposes: [],
  reservationUnitTypes: [],
  ageGroups: [],
  municipalities: [],
};

function renderAndSubmit(params: string) {
  mockedSearchParams.mockReturnValue(new URLSearchParams(params));
  const view = render(<SingleSearchForm options={options} isLoading={false} />);
  const user = userEvent.setup();
  const searchBtn = view.getByRole("button", { name: "searchForm:searchButton" });
  return { view, submit: () => user.click(searchBtn) };
}

beforeEach(() => {
  mockedSearchParams.mockReturnValue(new URLSearchParams());
});

afterEach(() => {
  vi.resetAllMocks();
});

describe("SingleSearchForm", () => {
  test("should search with valid values", async () => {
    const tomorrow = formatDate(addDays(new Date(), 1));
    const { submit } = renderAndSubmit(`timeBegin=10:00&timeEnd=12:00&startDate=${tomorrow}&endDate=${tomorrow}`);
    await submit();
    expect(mockedHandleSearch).toHaveBeenCalledTimes(1);
  });

  test("should not search if the end time is before the begin time", async () => {
    const { view, submit } = renderAndSubmit("timeBegin=12:00&timeEnd=10:00");
    expect(view.getByText("searchForm:beginTimeIsBeforeEndTime")).toBeInTheDocument();
    await submit();
    expect(mockedHandleSearch).not.toHaveBeenCalled();
  });

  test("should not search if the start date is in the past", async () => {
    const { view, submit } = renderAndSubmit("startDate=1.1.2020");
    await submit();
    expect(mockedHandleSearch).not.toHaveBeenCalled();
    expect(view.getByText(/dateSelector:errors.dateIsTooSmall/)).toBeInTheDocument();
  });

  test("should not search if the date is not valid", async () => {
    const { view, submit } = renderAndSubmit("startDate=23..2027");
    await submit();
    expect(mockedHandleSearch).not.toHaveBeenCalled();
    expect(view.getByText(/dateSelector:errors.dateInvalid/)).toBeInTheDocument();
  });

  test("should not search if the end date is before the start date", async () => {
    const start = formatDate(addDays(new Date(), 2));
    const end = formatDate(addDays(new Date(), 1));
    const { view, submit } = renderAndSubmit(`startDate=${start}&endDate=${end}`);
    await submit();
    expect(mockedHandleSearch).not.toHaveBeenCalled();
    expect(view.getByText(/dateSelector:errors.endDateBeforeStartDate/)).toBeInTheDocument();
  });

  test("should only allow positive integers in persons allowed", async () => {
    const { view, submit } = renderAndSubmit("personsAllowed=1");
    const user = userEvent.setup();
    const input = view.getByRole("spinbutton", { name: "searchForm:labels.personsAllowed" });
    await user.clear(input);
    await user.type(input, "-2.5e3");
    expect(input).toHaveValue(253);
    await submit();
    expect(mockedHandleSearch).toHaveBeenCalledWith(expect.objectContaining({ personsAllowed: 253 }), true);
  });
});
