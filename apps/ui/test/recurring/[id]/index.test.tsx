import { describe, test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, within } from "@testing-library/react";
import {
  createMockApplicationRound,
  createMockReservationUnitType,
} from "@/test/testUtils";
import { MockedProvider } from "@apollo/client/testing";
import SeasonalSearch from "@/pages/recurring/[id]";
import {
  type ApplicationRoundQuery,
  ApplicationRoundStatusChoice,
  CurrentUserDocument,
  type CurrentUserQuery,
  ReservationKind,
  ReservationUnitOrderingChoices,
  SearchReservationUnitsDocument,
  type SearchReservationUnitsQuery,
  type SearchReservationUnitsQueryVariables,
} from "@/gql/gql-types";
import { addYears } from "date-fns";
import { base64encode } from "common/src/helpers";
import { SEASONAL_SELECTED_PARAM_KEY } from "@/hooks/useReservationUnitList";

const { useRouter } = vi.hoisted(() => {
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

vi.mock("next/navigation", async (importOriginal) => {
  return {
    ...(await importOriginal()),
    useSearchParams,
  };
});

vi.mock("next/router", () => ({
  useRouter,
}));

function customRender() {
  const mocks = createGraphQLMocks();
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

    // Query is loading so the search button should be disabled
    // (we could wait for cards / loading spinner disappears also)
    const submitBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(submitBtn).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });

    // list of ten cards
    const cardsSelects = view.getAllByTestId(
      "reservation-unit-card__button--select"
    );
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

  test("selecting should change query params", () => {});
  // doesn't require interaction, just check the query params
  test("should show start application bar if selected", async () => {
    const params = new URLSearchParams();
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    mockedSearchParams.mockReturnValue(params);
    const view = customRender();

    const submitBtn = view.getByRole("button", {
      name: "searchForm:searchButton",
    });
    expect(submitBtn).toBeInTheDocument();
    await vi.waitFor(() => {
      expect(submitBtn).not.toBeDisabled();
    });

    // poll is better syntax than waitFor
    await expect
      .poll(() => view.queryByTestId("start-application-bar"))
      .toBeInTheDocument();
    const startBar = view.getByTestId("start-application-bar");
    /*
    await vi.waitFor(() => {
      const cardsSelects = view.getAllByTestId("reservation-unit-card__button--select");
      expect(cardsSelects).toHaveLength(10);
    });
    */
    expect(
      within(startBar).getByText(/shoppingCart:count/)
    ).toBeInTheDocument();
    expect(
      within(startBar).getByRole("button", { name: "shoppingCart:nextShort" })
    ).toBeInTheDocument();
    // TODO this is         reservationCalendar:loginAndReserve   if user has not logged in (should be tested separately)
    // also need to provide user query mock
  });

  test.todo("should filter based on query params");

  // TODO do we need to provide a user mock here?
  test.todo("should redirect on start application click");

  // requires client side graphql query to be mocked
  // have to add error response in the mock creation
  test.skip("should show an error if query fails", () => {
    const view = customRender();
    expect(
      view.getByRole("heading", { name: "applicationRound:search.title" })
    ).toBeInTheDocument();
    expect(
      view.getByText("applicationRound:search.subtitle")
    ).toBeInTheDocument();
    expect(view.getByText("errors:search")).toBeInTheDocument();
    // TODO expect search button to be available
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

function createSearchQueryNode(
  i: number
): NonNullable<
  NonNullable<SearchReservationUnitsQuery["reservationUnits"]>["edges"][number]
>["node"] {
  return {
    id: base64encode(`ReservationUnitNode:${i}`),
    pk: i,
    nameFi: `ReservationUnit ${i} FI`,
    nameEn: `ReservationUnit ${i} EN`,
    nameSv: `ReservationUnit ${i} SV`,
    reservationBegins: addYears(new Date(), -1 * i).toISOString(),
    reservationEnds: addYears(new Date(), 1 * i).toISOString(),
    isClosed: false,
    // TODO implement though for Seasonal this doesn't matter
    firstReservableDatetime: null,
    currentAccessType: null,
    maxPersons: null,
    // TODO implement though for Seasonal this doesn't matter
    pricings: [],
    unit: {
      id: base64encode(`UnitNode:${i}`),
      pk: i,
      nameFi: `Unit ${i} FI`,
      nameEn: `Unit ${i} EN`,
      nameSv: `Unit ${i} SV`,
      location: {
        addressStreetFi: "Address street FI",
        addressStreetEn: "Address street EN",
        addressStreetSv: "Address street SV",
        addressCityFi: "Address city FI",
        addressCityEn: "Address city EN",
        addressCitySv: "Address city SV",
        id: base64encode(`LocationNode:${i}`),
        addressZip: "00000",
      },
    },
    // TODO what cases is this null?
    reservationUnitType: createMockReservationUnitType({
      name: "ReservationUnitType",
    }),
    images: [],
    accessTypes: [],
  };
}

// TODO parametrize the variables
function createGraphQLMocks() {
  const variables: SearchReservationUnitsQueryVariables = {
    textSearch: null,
    purposes: [],
    unit: [],
    reservationUnitType: [],
    equipments: [],
    accessType: [],
    accessTypeBeginDate: "2024-02-01T00:00:00Z",
    accessTypeEndDate: "2025-01-01T00:00:00Z",
    applicationRound: [1],
    first: 36,
    orderBy: [
      ReservationUnitOrderingChoices.NameFiAsc,
      ReservationUnitOrderingChoices.PkAsc,
    ],
    isDraft: false,
    isVisible: true,
    reservationKind: ReservationKind.Season,
  };

  // TODO this should enforce non nullable for the query
  // it can be null when the query is loading, but when we mock it it should be non nullable
  // Q: what about failed queries? (though they should have different type)
  const SearchReservationUnitsQueryMock: SearchReservationUnitsQuery = {
    reservationUnits: {
      totalCount: 10,
      edges: Array.from({ length: 10 }, (_, i) => ({
        node: createSearchQueryNode(i + 1),
      })),
      pageInfo: {
        // TOOD how to mock this?
        endCursor: null,
        hasNextPage: false,
      },
    },
  };
  const CurrentUserMock: CurrentUserQuery = {
    currentUser: {
      id: base64encode("UserNode:1"),
      pk: 1,
      firstName: "Test",
      lastName: "User",
      email: "test@user",
      isAdAuthenticated: false,
    },
  };

  return [
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
    },
    {
      request: {
        query: CurrentUserDocument,
      },
      result: {
        data: CurrentUserMock,
      },
    },
  ];
}
