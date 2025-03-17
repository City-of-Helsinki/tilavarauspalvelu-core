import {
  OptionsDocument,
  type OptionsQuery,
  ReservationPurposeOrderingChoices,
  ReservationUnitTypeOrderingChoices,
  SearchFormParamsUnitDocument,
  type SearchFormParamsUnitQuery,
  UpdateApplicationDocument,
  type UpdateApplicationMutation,
  type UpdateApplicationMutationVariables,
} from "@/gql/gql-types";
import Page1 from "@/pages/applications/[id]/page1";
import { MockedProvider } from "@apollo/client/testing";
import { render } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import {
  createMockApplicationFragment,
  CreateMockApplicationFragmentProps,
  type CreateGraphQLMocksReturn,
} from "@/test/test.gql.utils";
import userEvent from "@testing-library/user-event";

const { useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  const query = {
    id: "1",
  };
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      query,
      asPath: "/applications/1/page1",
      pathname: "/applications/[id]/[page]",
    }),
    mockedRouterReplace,
  };
});

const { useSearchParams } = vi.hoisted(() => {
  const mockedSearchParams = vi.fn();
  const params = new URLSearchParams();
  mockedSearchParams.mockReturnValue(params);
  return {
    useSearchParams: mockedSearchParams,
    mockedSearchParams,
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

// TODO add gql mock params (for mutations / option queries)
function customRender(
  props: CreateMockApplicationFragmentProps = {}
): ReturnType<typeof render> {
  const mocks = createGraphQLMocks();
  const application = createMockApplicationFragment(props);
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Page1 application={application} />
    </MockedProvider>
  );
}

type CreateGraphQLMockProps = never;
function createGraphQLMocks(
  _props?: CreateGraphQLMockProps
): CreateGraphQLMocksReturn {
  const UpdateApplicationMutationMock: UpdateApplicationMutation = {
    updateApplication: {
      pk: 1,
    },
  };
  const mutationVars: UpdateApplicationMutationVariables = {
    input: {
      pk: 1,
      additionalInformation: "",
    },
  };

  const SearchFormParamsUnitQueryMock: SearchFormParamsUnitQuery = {
    unitsAll: [],
  };
  const OptionsMock: OptionsQuery = {
    reservationPurposes: {
      edges: [],
    },
    reservationUnitTypes: {
      edges: [],
    },
    purposes: {
      edges: [],
    },
    ageGroups: {
      edges: [],
    },
    cities: {
      edges: [],
    },
    equipmentsAll: [],
    unitsAll: [],
  };

  return [
    {
      request: {
        query: UpdateApplicationDocument,
        variables: mutationVars,
      },
      result: {
        data: UpdateApplicationMutationMock,
      },
    },
    {
      request: {
        query: SearchFormParamsUnitDocument,
      },
      result: {
        data: SearchFormParamsUnitQueryMock,
      },
    },
    {
      request: {
        query: OptionsDocument,
        variables: {
          reservationUnitTypesOrderBy:
            ReservationUnitTypeOrderingChoices.RankAsc,
          reservationPurposesOrderBy: ReservationPurposeOrderingChoices.RankAsc,
        },
      },
      result: {
        data: OptionsMock,
      },
    },
  ];
}

describe("Page1", () => {
  test("should render empty application page", async () => {
    const view = customRender();
    expect(
      await view.findByRole("heading", { name: "application:Page1.heading" })
    ).toBeInTheDocument();
    expect(view.getByText("ApplicationRoundNode FI")).toBeInTheDocument();
    expect(view.getByRole("button", { name: "application:Page1.createNew" }));
    expect(view.getByRole("button", { name: "common:next" }));
    expect(
      view.getByRole("link", { name: "breadcrumb:applications" })
    ).toBeInTheDocument();
    expect(view.getByText("breadcrumb:application")).toBeInTheDocument();
    // TODO check that no other than first step is clickable
    // TODO check notes when applying
  });

  // special case requiring custom mocks
  // happens when application doesn't contain any sections
  test.todo("empty application should not allow navigation");

  test("should allow filling the form", async () => {
    const view = customRender();
    const user = userEvent.setup();
    const submitBtn = view.getByRole("button", { name: "common:next" });
    expect(submitBtn).not.toBeDisabled();
    user.click(submitBtn);

    // TODO Expect errors and no redirect / mutation
  });

  test.todo("should allow adding new application section");
  test.todo("should not allow navigation by default");
  test.todo("should update application on submit");
  test.todo("should not allow saving for invalid form");
  test.todo("mutation should toast on error");
});
