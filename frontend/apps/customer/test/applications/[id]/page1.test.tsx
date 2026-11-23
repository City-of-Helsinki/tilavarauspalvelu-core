import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, expect, test, describe, beforeEach } from "vitest";
import { createNodeId } from "ui/src/modules/helpers";
import type { OptionsListT, OptionT } from "ui/src/modules/search";
import { SEASONAL_SELECTED_PARAM_KEY } from "@/hooks/useReservationUnitList";
import Page1 from "@/pages/applications/[id]/page1";
import { createMockApplicationFragment } from "@test/application.mocks";
import type { CreateMockApplicationFragmentProps } from "@test/application.mocks";
import { createGraphQLMocks } from "@test/gql.mocks";
import { createOptionMock } from "@test/test.gql.utils";
import { MockedGraphQLProvider } from "@test/test.react.utils";
import { selectFirstOption } from "@test/test.utils";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((_resolve, _reject) => {
    resolve = _resolve;
    reject = _reject;
  });
  return { promise, resolve, reject };
}

const { isSavingRef, mutateFn } = vi.hoisted(() => {
  const isSavingRef = { current: false };
  const mutateFn = vi.fn().mockResolvedValue({ data: { updateApplication: { pk: 1 } } });
  return { isSavingRef, mutateFn };
});

vi.mock("@gql/gql-types", async (importOriginal) => {
  const mod: unknown = await importOriginal();
  return {
    ...(mod as Record<string, unknown>),
    useUpdateApplicationMutation: () => [
      mutateFn,
      {
        get loading() {
          return isSavingRef.current;
        },
      },
    ],
  };
});

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

type PriceOptionRenderProps = {
  priceOptionList?: OptionT[];
  savedPriceOptionPk?: number;
};

function customRender(
  props: CreateMockApplicationFragmentProps = {},
  { priceOptionList = [], savedPriceOptionPk }: PriceOptionRenderProps = {}
): ReturnType<typeof render> {
  const mocks = createGraphQLMocks();
  const mockApplication = createMockApplicationFragment(props);
  const application =
    savedPriceOptionPk == null
      ? mockApplication
      : {
          ...mockApplication,
          applicationSections:
            mockApplication.applicationSections?.map((section) => ({
              ...section,
              priceOption: {
                id: createNodeId("PriceOptionNode", savedPriceOptionPk),
                pk: savedPriceOptionPk,
                nameFi: "Poistettu asiakasryhmä",
                nameEn: null,
                nameSv: null,
              },
            })) ?? null,
        };
  const options: OptionsListT = createOptionMock();
  const offeredPriceOptionPkList = priceOptionList.map((priceOption) => priceOption.value);
  return render(
    <MockedGraphQLProvider mocks={mocks}>
      <Page1
        application={application}
        options={options}
        priceOptionList={priceOptionList}
        offeredPriceOptionPkList={offeredPriceOptionPkList}
      />
    </MockedGraphQLProvider>
  );
}

async function fillSectionWithoutPriceOption(section: HTMLElement): Promise<void> {
  const user = userEvent.setup();
  await user.type(within(section).getByLabelText(/application:Page1.name/), "Test section name");
  await selectFirstOption(within(section), /application:Page1.ageGroup/);
  await selectFirstOption(within(section), /application:Page1.purpose/);
  await user.type(within(section).getByLabelText(/application:Page1.groupSize/, { selector: "input" }), "1");
  await user.click(within(section).getByRole("checkbox", { name: /application:Page1.defaultPeriodPrefix/ }));
  await selectFirstOption(within(section), /application:Page1.minDuration/);
  await selectFirstOption(within(section), /application:Page1.maxDuration/);
  const eventsPerWeek = within(section).getByLabelText(/application:Page1.eventsPerWeek/, { selector: "input" });
  await user.clear(eventsPerWeek);
  await user.type(eventsPerWeek, "1");
}

beforeEach(() => {
  isSavingRef.current = false;
  mutateFn.mockClear();
});

describe("Page1 common to all funnel pages", () => {
  test("should render empty application page", () => {
    const view = customRender();
    expect(view.getByRole("heading", { name: "application:Page1.subHeading" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "application:Page1.createNew" })).toBeInTheDocument();
    expect(view.getByRole("button", { name: "common:next" })).toBeInTheDocument();
    expect(view.getByRole("link", { name: "breadcrumb:applications" })).toBeInTheDocument();
    expect(view.getByText("breadcrumb:application")).toBeInTheDocument();
  });

  test("should render notes when applying", () => {
    const view = customRender();
    expect(view.getByRole("heading", { name: "applicationRound:notesWhenApplying" })).toBeInTheDocument();
    expect(view.getByText("Notes when applying FI")).toBeInTheDocument();
  });
  test.todo("should not render notes if they are empty or null");
});

describe("Page1", () => {
  test("disables next and add-section while saving", () => {
    isSavingRef.current = true;
    const view = customRender();
    expect(view.getByRole("button", { name: "common:next" })).toBeDisabled();
    expect(view.getByRole("button", { name: "application:Page1.createNew" })).toBeDisabled();
  });

  test("keeps buttons disabled until navigation completes", async () => {
    const params = new URLSearchParams();
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    mockedSearchParams.mockReturnValue(params);
    const nav = deferred<boolean>();
    mockedRouterPush.mockReturnValueOnce(nav.promise);

    const view = customRender();
    const user = userEvent.setup();

    const section = view.getByTestId("application__applicationSection_0");
    const name = within(section).getByLabelText(/application:Page1.name/);
    await user.type(name, "Test section name");
    await selectFirstOption(within(section), /application:Page1.ageGroup/);
    await selectFirstOption(within(section), /application:Page1.purpose/);
    const groupSize = within(section).getByLabelText(/application:Page1.groupSize/, { selector: "input" });
    await user.type(groupSize, "1");
    const checkDefaultPeriod = within(section).getByRole("checkbox", {
      name: /application:Page1.defaultPeriodPrefix/,
    });
    await user.click(checkDefaultPeriod);
    await selectFirstOption(within(section), /application:Page1.minDuration/);
    await selectFirstOption(within(section), /application:Page1.maxDuration/);
    const eventsPerWeek = within(section).getByLabelText(/application:Page1.eventsPerWeek/, { selector: "input" });
    await user.clear(eventsPerWeek);
    await user.type(eventsPerWeek, "1");

    const addSectionBtn = view.getByRole("button", { name: "application:Page1.createNew" });
    const submitBtn = view.getByRole("button", { name: "common:next" });
    expect(addSectionBtn).not.toBeDisabled();
    expect(submitBtn).not.toBeDisabled();

    await user.click(submitBtn);

    expect(submitBtn).toBeDisabled();
    expect(addSectionBtn).toBeDisabled();

    nav.resolve(true);
    await nav.promise;
  }, 20_000);

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
    expect(view.queryAllByText("application:validation.Required")).toHaveLength(0);
    await user.click(submitBtn);
    expect(view.queryAllByText("application:validation.Required")).not.toHaveLength(0);
  });

  test("should preselect reservation units based on query params", async () => {
    const params = new URLSearchParams();
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    mockedSearchParams.mockReturnValue(params);

    const view = customRender();
    const user = userEvent.setup();

    const submitBtn = view.getByRole("button", { name: "common:next" });
    await user.click(submitBtn);
    expect(view.queryAllByText("application:validation.noReservationUnits")).toHaveLength(0);
  });

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
    await selectFirstOption(within(section), /application:Page1.ageGroup/);
    await selectFirstOption(within(section), /application:Page1.purpose/);
    const groupSize = within(section).getByLabelText(/application:Page1.groupSize/, { selector: "input" });
    expect(groupSize).toBeInTheDocument();
    await user.type(groupSize, "1");

    const checkDefaultPeriod = within(section).getByRole("checkbox", {
      name: /application:Page1.defaultPeriodPrefix/,
    });
    expect(checkDefaultPeriod).toBeInTheDocument();
    await user.click(checkDefaultPeriod);

    await selectFirstOption(within(section), /application:Page1.minDuration/);
    await selectFirstOption(within(section), /application:Page1.maxDuration/);

    // don't expect a default value for eventsPerWeek
    const eventsPerWeek = within(section).getByLabelText(/application:Page1.eventsPerWeek/, { selector: "input" });
    expect(eventsPerWeek).toBeInTheDocument();
    await user.clear(eventsPerWeek);
    await user.type(eventsPerWeek, "1");

    const submitBtn = view.getByRole("button", { name: "common:next" });
    await user.click(submitBtn);
    expect(view.queryAllByText(/application:validation/)).toStrictEqual([]);
    expect(mockedRouterPush).toHaveBeenCalled();
  }, 20_000);

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
    expect(within(section).getAllByText("application:validation.noReservationUnits")).toHaveLength(2);
  });

  // it's an error not to select all fields, but what if we have no options?
  // due to temporary backend error or a software bug?
  test.todo("What should happen if options are not available?");

  test.todo("should not allow navigation by default");
  test.todo("should update application on submit");
  test.todo("should not allow saving for invalid form");
  test.todo("mutation should toast on error");
});

describe("Page1: price option", () => {
  const priceOptionList: OptionT[] = [
    { label: "Aikuiset", value: 11 },
    { label: "Lapset ja nuoret", value: 12 },
  ];

  beforeEach(() => {
    const params = new URLSearchParams();
    params.set(SEASONAL_SELECTED_PARAM_KEY, "1");
    mockedSearchParams.mockReturnValue(params);
  });

  test("does not render the select when the round offers no price options", () => {
    const view = customRender();
    const section = view.getByTestId("application__applicationSection_0");
    expect(within(section).queryByLabelText(/application:Page1.priceOption/, { selector: "button" })).toBeNull();
  });

  test("renders the select with the offered price options", async () => {
    const view = customRender({}, { priceOptionList });
    const user = userEvent.setup();
    const section = view.getByTestId("application__applicationSection_0");
    await user.click(within(section).getByLabelText(/application:Page1.priceOption/, { selector: "button" }));
    const optionList = within(view.getByRole("listbox")).getAllByRole("option");
    expect(optionList.map((option) => option.textContent)).toStrictEqual(["Aikuiset", "Lapset ja nuoret"]);
  });

  test("requires a price option before saving", async () => {
    const view = customRender({}, { priceOptionList });
    const user = userEvent.setup();
    const section = view.getByTestId("application__applicationSection_0");
    await fillSectionWithoutPriceOption(section);

    await user.click(view.getByRole("button", { name: "common:next" }));

    // every other field is filled, so the only missing value is the price option
    expect(within(section).queryAllByText("application:validation.Required")).not.toHaveLength(0);
    expect(mutateFn).not.toHaveBeenCalled();
  }, 20_000);

  test("sends the selected price option in the mutation input", async () => {
    const view = customRender({}, { priceOptionList });
    const user = userEvent.setup();
    const section = view.getByTestId("application__applicationSection_0");
    await fillSectionWithoutPriceOption(section);
    await selectFirstOption(within(section), /application:Page1.priceOption/);

    await user.click(view.getByRole("button", { name: "common:next" }));

    expect(view.queryAllByText(/application:validation/)).toStrictEqual([]);
    expect(mutateFn).toHaveBeenCalledTimes(1);
    expect(mutateFn.mock.calls[0]?.[0].variables.input.applicationSections[0].priceOption).toBe(11);
  }, 20_000);

  test("shows at once that a saved price option is no longer offered", async () => {
    const view = customRender({ page: "page1" }, { priceOptionList, savedPriceOptionPk: 99 });
    const section = view.getByTestId("application__applicationSection_0");
    expect(await within(section).findAllByText("application:validation.priceOptionNotOffered")).not.toHaveLength(0);
  });
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
}, 10_000);
