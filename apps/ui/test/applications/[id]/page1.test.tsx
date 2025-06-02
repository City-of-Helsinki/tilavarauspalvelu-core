import Page1 from "@/pages/applications/[id]/page1";
import { render, screen, within } from "@testing-library/react";
import { vi, expect, test, describe } from "vitest";
import {
  createGraphQLApplicationIdMock,
  createMockApplicationFragment,
  type CreateMockApplicationFragmentProps,
} from "@test/application.mocks";
import {
  mockAgeGroupOptions,
  mockDurationOptions,
  mockReservationPurposesOptions,
  type CreateGraphQLMocksReturn,
} from "@test/test.gql.utils";
import userEvent from "@testing-library/user-event";
import { selectOption } from "@test/test.utils";
import { SEASONAL_SELECTED_PARAM_KEY } from "@/hooks/useReservationUnitList";
import { MockedGraphQLProvider } from "@test/test.react.utils";

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

function createGraphQLMocks(): CreateGraphQLMocksReturn {
  return createGraphQLApplicationIdMock();
}
function customRender(
  props: CreateMockApplicationFragmentProps = {}
): ReturnType<typeof render> {
  const mocks = createGraphQLMocks();
  const application = createMockApplicationFragment(props);
  return render(
    <MockedGraphQLProvider mocks={mocks}>
      <Page1 application={application} unitsAll={[]} />
    </MockedGraphQLProvider>
  );
}

describe("Page1 common to all funnel pages", () => {
  test("should render empty application page", () => {
    // TODO all of this is common to all application funnel pages
    const view = customRender();
    expect(
      view.getByRole("heading", { name: "application:Page1.subHeading" })
    ).toBeInTheDocument();
    expect(view.getByRole("button", { name: "application:Page1.createNew" }));
    expect(view.getByRole("button", { name: "common:next" }));
    expect(
      view.getByRole("link", { name: "breadcrumb:applications" })
    ).toBeInTheDocument();
    expect(view.getByText("breadcrumb:application")).toBeInTheDocument();
  });

  test("should render notes when applying", () => {
    const view = customRender();
    expect(
      view.getByRole("heading", { name: "applicationRound:notesWhenApplying" })
    ).toBeInTheDocument();
    expect(view.getByText("Notes when applying FI")).toBeInTheDocument();
  });
  test.todo("should not render notes if they are empty or null");
});

describe("Page1", () => {
  // this case only happens if user manually removes the last section
  test("empty application should not allow submitting", async () => {
    const view = customRender();
    const submitBtn = view.getByRole("button", { name: "common:next" });
    const user = userEvent.setup();
    const removeBtn = view.getByRole("button", {
      name: "common:remove",
    });
    expect(removeBtn).not.toBeDisabled();
    await user.click(removeBtn);
    const dialog = screen.getByRole("dialog");
    expect(dialog).toBeInTheDocument();
    const confirmBtn = within(dialog).getByRole("button", {
      name: "common:remove",
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

    // don't expect a default value for eventsPerWeek
    const eventsPerWeek = within(section).getByLabelText(
      /application:Page1.eventsPerWeek/,
      { selector: "input" }
    );
    expect(eventsPerWeek).toBeInTheDocument();
    await user.clear(eventsPerWeek);
    await user.type(eventsPerWeek, "1");

    const submitBtn = view.getByRole("button", { name: "common:next" });
    await user.click(submitBtn);
    expect(view.queryAllByText(/application:validation/)).toStrictEqual([]);
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

  // requires form context because schema validators are for the full form only
  test("should show an error message for no reservation units", async () => {
    const params = new URLSearchParams();
    mockedSearchParams.mockReturnValue(params);
    const view = customRender();
    const user = userEvent.setup();
    const submitBtn = view.getByRole("button", { name: "common:next" });
    expect(submitBtn).not.toBeDisabled();
    await user.click(submitBtn);
    const section = view.getByTestId("application__applicationSection_0");
    expect(
      within(section).getAllByText("application:validation.noReservationUnits")
    ).toHaveLength(2);
  });

  // it's an error not to select all fields, but what if we have no options?
  // due to temporary backend error or a software bug?
  test.todo("What should happen if options are not available?");

  test.todo("should not allow navigation by default");
  test.todo("should update application on submit");
  test.todo("should not allow saving for invalid form");
  test.todo("mutation should toast on error");
});

describe("Page1: multiple sections", () => {
  test("should allow adding new application section", async () => {
    const view = customRender();
    const user = userEvent.setup();

    const headingsStart = view.getAllByRole("heading", {
      name: "application:Page1.basicInformationSubHeading",
    });
    expect(headingsStart).toHaveLength(1);
    const addSectionBtn = view.getByRole("button", {
      name: "application:Page1.createNew",
    });
    expect(addSectionBtn).toBeInTheDocument();
    await user.click(addSectionBtn);
    const headings = view.getAllByRole("heading", {
      name: "application:Page1.basicInformationSubHeading",
    });
    expect(headings).toHaveLength(2);
  });

  // the select modal should only modify the section it was opened for
  test.todo("adding reservation units should not affect other sections");
});
