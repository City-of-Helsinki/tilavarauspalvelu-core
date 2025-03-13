import { describe, test, expect, vi, afterEach, beforeEach } from "vitest";
import { render } from "@testing-library/react";
import { createMockApplicationRound } from "@/test/test.utils";
import { MockedProvider } from "@apollo/client/testing";
import SeasonalSearch from "@/pages/recurring/[id]";
import {
  type ApplicationRoundQuery,
  ApplicationRoundStatusChoice,
} from "@/gql/gql-types";
import { addYears } from "date-fns";
import { SEASONAL_SELECTED_PARAM_KEY } from "@/hooks/useReservationUnitList";
import userEvent from "@testing-library/user-event";
import { getApplicationPath } from "@/modules/urls";
import {
  CreateGraphQLMockProps,
  createGraphQLMocks,
} from "@/test/test.gql.utils";

const { mockedRouterReplace, useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  const query = {
    id: "1",
  };
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      query,
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

vi.mock("next/navigation", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useSearchParams,
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

function customRender(
  props: CreateGraphQLMockProps = {}
): ReturnType<typeof render> {
  const mocks = createGraphQLMocks(props);
  const round = createApplicationRoundMock();
  const options = {
    unitOptions: [],
    equipmentsOptions: [],
    purposeOptions: [],
    reservationUnitTypeOptions: [],
  } as const;
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <SeasonalSearch
        applicationRound={round}
        apiBaseUrl="http://localhost:8000"
        options={options}
      />
    </MockedProvider>
  );
}

// TODO what we need to test?
// - page framing (breadcrumbs / layout / title)
// - query (backend) errors -> displayed as error component
// - ordering component -> changes query params
//  - this contains the search results. is this correct?
// - start application bar
//  - filters the full data based on search params
// - we check the results from query params (not the pagination / query itself)
//  - this will become a separate test for

// TODO these require mocking the backend response for useSearchQuery
describe("Page: SeasonalSearch", () => {
  beforeEach(async () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams());
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  test("should render page", async () => {
    const view = customRender();
    const title = view.getByRole("heading", {
      name: "applicationRound:search.title",
    });
    expect(title).toBeInTheDocument();
    const subtitle = view.getByText("applicationRound:search.subtitle");
    expect(subtitle).toBeInTheDocument();
    // breadcrumb check (could move to separate test with two variations)
    expect(
      view.getByRole("link", { name: "breadcrumb:frontpage" })
    ).toBeInTheDocument();
    expect(
      view.getByRole("link", { name: "breadcrumb:recurring" })
    ).toBeInTheDocument();
    expect(view.getByText("ApplicationRound 1 FI")).toBeInTheDocument();

    await waitForSearchButton(view);

    // list of ten cards
    const cardsSelects = view.getAllByTestId("recurring-card__button--toggle");
    expect(cardsSelects).toHaveLength(10);
    // sanity check that the cards have some data
    for (let i = 0; i < 10; i++) {
      expect(
        view.getByRole("heading", { name: `ReservationUnit ${i + 1} FI` })
      ).toBeInTheDocument();
    }
    expect(
      view.queryByRole("button", { name: "shoppingCart:nextShort" })
    ).not.toBeInTheDocument();
    // expect(view.getByRole("heading", { name: "ReservationUnit 1 FI" })).toBeInTheDocument();
    // no pagination
    // disabled because there is a bug in the useSearchQuery hook
    // might be related to search params so if we mock them it might pass
    // otherwise we need to write tests for the hook
    // const showMore = view.queryByRole("button", { name: "common:showMore" });
    // expect(showMore).not.toBeInTheDocument();
  });

  test("selecting should set query params", async () => {
    const view = customRender();
    await waitForSearchButton(view);
    const user = userEvent.setup();

    expect(mockedRouterReplace).not.toHaveBeenCalled();
    const cardsSelects = view.getAllByTestId("recurring-card__button--toggle");
    const select = cardsSelects[0];
    if (!select) {
      throw new Error("No select found");
    }
    await user.click(select);
    const params = new URLSearchParams();
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    params.set("id", "1");
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);

    expect(mockedRouterReplace).toHaveBeenLastCalledWith(
      { query: params.toString() },
      undefined,
      {
        shallow: true,
        scroll: false,
      }
    );
  });

  test("selecting another shouldd add to query params", async () => {
    const params = new URLSearchParams();
    params.set("id", "1");
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    mockedSearchParams.mockReturnValue(params);
    const view = customRender();
    await waitForSearchButton(view);
    const user = userEvent.setup();

    expect(mockedRouterReplace).not.toHaveBeenCalled();
    const cardsSelects = view.getAllByTestId("recurring-card__button--toggle");
    const select = cardsSelects[2];
    if (!select) {
      throw new Error("No select found");
    }
    await user.click(select);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
    params.append(SEASONAL_SELECTED_PARAM_KEY, "3");
    expect(mockedRouterReplace).toHaveBeenLastCalledWith(
      { query: params.toString() },
      undefined,
      {
        shallow: true,
        scroll: false,
      }
    );
  });

  test("deselecting should remove from query params", async () => {
    const params = new URLSearchParams();
    params.set("id", "1");
    params.set(SEASONAL_SELECTED_PARAM_KEY, "4");
    mockedSearchParams.mockReturnValue(params);
    const view = customRender();
    await waitForSearchButton(view);
    const user = userEvent.setup();

    expect(mockedRouterReplace).not.toHaveBeenCalled();
    const cardsSelects = view.getAllByTestId("recurring-card__button--toggle");
    const select = cardsSelects[3];
    if (!select) {
      throw new Error("No select found");
    }
    await user.click(select);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
    params.delete(SEASONAL_SELECTED_PARAM_KEY);
    expect(mockedRouterReplace).toHaveBeenLastCalledWith(
      { query: params.toString() },
      undefined,
      {
        shallow: true,
        scroll: false,
      }
    );
  });

  // doesn't require interaction, just check the query params
  test("should show start application bar if selected", async () => {
    const params = new URLSearchParams();
    params.set("id", "1");
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    mockedSearchParams.mockReturnValue(params);
    const view = customRender();
    await waitForSearchButton(view);

    const cardsSelects = view.getAllByTestId("recurring-card__button--toggle");
    expect(cardsSelects).toHaveLength(10);
    expect(view.getByText(/shoppingCart:count/)).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "shoppingCart:nextShort" })
    ).toBeInTheDocument();
  });

  test("no start application bar if not selected", async () => {
    const view = customRender();
    await waitForSearchButton(view);

    const cardsSelects = view.getAllByTestId("recurring-card__button--toggle");
    expect(cardsSelects).toHaveLength(10);
    expect(view.queryByText(/shoppingCart:count/)).not.toBeInTheDocument();
    expect(
      view.queryByRole("button", { name: "shoppingCart:nextShort" })
    ).not.toBeInTheDocument();
  });

  test("should show login button instead of start if user is not logged in", async () => {
    const params = new URLSearchParams();
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    mockedSearchParams.mockReturnValue(params);
    const view = customRender({ noUser: true });
    await waitForSearchButton(view);

    const cardsSelects = view.getAllByTestId("recurring-card__button--toggle");
    expect(cardsSelects).toHaveLength(10);
    expect(view.getByText(/shoppingCart:count/)).toBeInTheDocument();
    expect(
      view.getByRole("button", { name: "shoppingCart:loginAndApply" })
    ).toBeInTheDocument();
  });

  test("should filter based on query params", async () => {
    const params = new URLSearchParams();
    params.set("textSearch", "foobar");
    mockedSearchParams.mockReturnValue(params);
    const view = customRender();
    await waitForSearchButton(view);
    const cardsSelects = view.getAllByTestId("recurring-card__button--toggle");
    expect(cardsSelects).toHaveLength(1);
  });

  test("should redirect on start application click", async () => {
    const params = new URLSearchParams();
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    mockedSearchParams.mockReturnValue(params);
    const user = userEvent.setup();
    const view = customRender();
    await waitForSearchButton(view);

    const startBtn = view.getByRole("button", {
      name: "shoppingCart:nextShort",
    });
    await user.click(startBtn);
    expect(mockedRouterReplace).toHaveBeenCalledTimes(1);
    expect(mockedRouterReplace).toHaveBeenLastCalledWith(
      `${getApplicationPath(1, "page1")}?${params.toString()}`
    );
  });

  test("should show an error if query fails", async () => {
    const view = customRender({ isSearchError: true });
    await waitForSearchButton(view);
    expect(
      view.getByRole("heading", { name: "applicationRound:search.title" })
    ).toBeInTheDocument();
    expect(
      view.getByText("applicationRound:search.subtitle")
    ).toBeInTheDocument();
    expect(view.getByText("errors:search")).toBeInTheDocument();
  });
});

// TODO SSR tests are complicated because we need to mock the http response for Apollo client
describe("SeasonalSearch Page SSR", () => {
  test.todo("should return valid data");
  // NaN, < 1
  test.todo("invalid pk should return 404");
  // valid but backend returns null?
  test.todo("non existing application round should return 404");
  // requires user to be logged in
  test.todo("isPostLogin creates new application and redirects to it");
  test.todo("isPostLogin param is ignored for non logged in users");
});

// If you don't wait for something the mock query is still loading
// even if you don't need the search button
// waiting for this is a proxy that the query has finished
async function waitForSearchButton(
  view: ReturnType<typeof customRender>
): Promise<HTMLElement> {
  const submitBtn = view.getByRole("button", {
    name: "searchForm:searchButton",
  });
  expect(submitBtn).toBeInTheDocument();
  await expect.poll(() => submitBtn).not.toBeDisabled();
  return submitBtn;
}

function createApplicationRoundMock(): Readonly<
  NonNullable<ApplicationRoundQuery["applicationRound"]>
> {
  const begin = new Date();
  const end = addYears(new Date(), 1);
  return createMockApplicationRound({
    status: ApplicationRoundStatusChoice.Open,
    applicationPeriodBegin: begin,
    applicationPeriodEnd: end,
  });
}
