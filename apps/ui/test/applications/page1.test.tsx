import {
  OptionsDocument,
  type OptionsQuery,
  ReservationPurposeOrderingChoices,
  ReservationUnitTypeOrderingChoices,
  SearchFormParamsUnitDocument,
  type SearchFormParamsUnitQuery,
  UpdateApplicationDocument,
  type UpdateApplicationMutation,
} from "@/gql/gql-types";
import Page1 from "@/pages/applications/[id]/page1";
import { MockedProvider } from "@apollo/client/testing";
import { render, screen, within } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import {
  createMockApplicationFragment,
  CreateMockApplicationFragmentProps,
  createOptionQueryMock,
  mockAgeGroupOptions,
  mockDurationOptions,
  mockReservationPurposesOptions,
  type CreateGraphQLMocksReturn,
} from "@/test/test.gql.utils";
import userEvent from "@testing-library/user-event";
import { selectOption } from "../test.utils";
import { SEASONAL_SELECTED_PARAM_KEY } from "@/hooks/useReservationUnitList";

const { mockedRouterPush, useRouter } = vi.hoisted(() => {
  const mockedRouterReplace = vi.fn();
  const mockedRouterPush = vi.fn();
  const query = {
    id: "1",
  };
  return {
    useRouter: () => ({
      replace: mockedRouterReplace,
      push: mockedRouterPush,
      query,
      asPath: "/applications/1/page1",
      pathname: "/applications/[id]/[page]",
    }),
    mockedRouterReplace,
    mockedRouterPush,
  };
});

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
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

  const SearchFormParamsUnitQueryMock: SearchFormParamsUnitQuery = {
    unitsAll: [],
  };

  const OptionsMock: OptionsQuery = createOptionQueryMock();

  return [
    {
      request: {
        query: UpdateApplicationDocument,
      },
      variableMatcher: () => true,
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
    // TODO check notes when applying
  });

  // special case requiring custom mocks
  // happens when application doesn't contain any sections
  test("empty application should not allow submitting", async () => {
    const view = customRender();
    const submitBtn = view.getByRole("button", { name: "common:next" });
    const user = userEvent.setup();
    const removeBtn = view.getByRole("button", {
      name: "application:Page1.deleteEvent",
    });
    expect(removeBtn).not.toBeDisabled();
    await user.click(removeBtn);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    const confirmBtn = within(dialog).getByRole("button", {
      name: "application:Page1.deleteEvent",
    });
    expect(confirmBtn).not.toBeDisabled();
    await user.click(confirmBtn);
    expect(submitBtn).toBeDisabled();
  });

  test("empty form should display error on submit", async () => {
    const view = customRender();
    const user = userEvent.setup();
    const submitBtn = view.getByRole("button", { name: "common:next" });
    expect(submitBtn).not.toBeDisabled();
    expect(view.queryAllByText("application:validation.Required")).toHaveLength(
      0
    );
    await user.click(submitBtn);
    expect(
      view.queryAllByText("application:validation.Required")
    ).not.toHaveLength(0);
  });

  test("should preselect reservation units based on query params", async () => {
    const params = new URLSearchParams();
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    mockedSearchParams.mockReturnValue(params);

    const view = customRender();
    const user = userEvent.setup();

    const submitBtn = view.getByRole("button", { name: "common:next" });
    await user.click(submitBtn);
    expect(
      view.queryAllByText("application:validation.noReservationUnits")
    ).toHaveLength(0);
  });

  // clicking should fill the
  // "application:Page1.periodEndDate" and "application:Page1.periodStartDate"
  // checking these here is not necessary -> should write separate tests for these
  test.todo("checking default period should fill the dates");
  test.todo("changing dates should remove default period check");

  test("should allow filling the form", async () => {
    const params = new URLSearchParams();
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    mockedSearchParams.mockReturnValue(params);

    const view = customRender();
    const user = userEvent.setup();

    const section = view.getByTestId("application__applicationSection_0");
    expect(section).toBeInTheDocument();
    const name = within(section).getByLabelText(/application:Page1.name/);
    expect(name).toBeInTheDocument();
    await user.type(name, "Test section name");
    const ageGroupOpt = mockAgeGroupOptions[0];
    if (ageGroupOpt == null) {
      throw new Error("expected age group option");
    }
    const ageGroupOptLabel = `${ageGroupOpt.minimum} - ${ageGroupOpt.maximum}`;
    await selectOption(
      within(section),
      /application:Page1.ageGroup/,
      ageGroupOptLabel
    );
    const purposeOpt = mockReservationPurposesOptions[0];
    if (purposeOpt == null) {
      throw new Error("expected purpose option");
    }
    const purposeOptLabel = purposeOpt.label;
    await selectOption(
      within(section),
      /application:Page1.purpose/,
      purposeOptLabel
    );
    const groupSize = within(section).getByLabelText(
      /application:Page1.groupSize/,
      { selector: "input" }
    );
    expect(groupSize).toBeInTheDocument();
    await user.type(groupSize, "1");

    const checkDefaultPeriod = within(section).getByRole("checkbox", {
      name: /application:Page1.defaultPeriodPrefix/,
    });
    expect(checkDefaultPeriod).toBeInTheDocument();
    await user.click(checkDefaultPeriod);

    const dur = mockDurationOptions[0];
    if (dur == null) {
      throw new Error("expected duration option");
    }
    await selectOption(
      within(section),
      /application:Page1.minDuration/,
      dur.label
    );
    await selectOption(
      within(section),
      /application:Page1.maxDuration/,
      dur.label
    );

    const submitBtn = view.getByRole("button", { name: "common:next" });
    await user.click(submitBtn);
    expect(view.queryAllByText(/application:validation/)).toHaveLength(0);
    expect(mockedRouterPush).toHaveBeenCalled();
  });

  test("applied events over 7 should be invalid", async () => {
    const view = customRender();
    const user = userEvent.setup();

    const section = view.getByTestId("application__applicationSection_0");
    expect(section).toBeInTheDocument();
    const eventsPerWeek = within(section).getByLabelText(
      /application:Page1.eventsPerWeek/,
      { selector: "input" }
    );
    expect(eventsPerWeek).toBeInTheDocument();
    await user.clear(eventsPerWeek);
    await user.type(eventsPerWeek, "11");
    const submitBtn = view.getByRole("button", { name: "common:next" });
    await user.click(submitBtn);
    expect(
      view.queryAllByText(
        "application:validation.Number must be less than or equal to 7"
      )
    ).toHaveLength(1);
  });

  // TODO should these be schema tests
  test.todo("applied events less than 1 should be invalid");

  // it's an error not to select all fields, but what if we have no options?
  // due to temporary backend error or a software bug?
  test.todo("What should happen if options are not available?");

  test.todo("should allow adding new application section");
  test.todo("should not allow navigation by default");
  test.todo("should update application on submit");
  test.todo("should not allow saving for invalid form");
  test.todo("mutation should toast on error");
});
