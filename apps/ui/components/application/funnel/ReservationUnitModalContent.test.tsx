import { describe, test, expect, vi, afterEach, beforeEach } from "vitest";
import { render, within } from "@testing-library/react";
import { createGraphQLMocks } from "@test/gql.mocks";
import { createMockApplicationRound } from "@test/application.mocks";
import { type CreateGraphQLMockProps } from "@test/test.gql.utils";
import userEvent from "@testing-library/user-event";
import { ReservationUnitModalContent, type ReservationUnitModalProps } from "./ReservationUnitModalContent";
import { MockedGraphQLProvider } from "@test/test.react.utils";
import { ReservationKind } from "@/gql/gql-types";

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
  const params = vi.fn();
  return {
    useSearchParams: params,
    mockedSearchParams: params,
  };
});

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

vi.mock("next/navigation", () => ({
  useSearchParams,
}));

vi.mock("next/router", () => ({
  useRouter,
}));

interface CustomRenderProps extends CreateGraphQLMockProps {
  handleAdd?: () => void;
  handleRemove?: () => void;
  currentReservationUnits?: ReservationUnitModalProps["currentReservationUnits"];
}

function customRender(
  { handleAdd = vi.fn(), handleRemove = vi.fn(), currentReservationUnits = [], ...mockProps }: CustomRenderProps = {
    handleAdd: vi.fn(),
    handleRemove: vi.fn(),
    currentReservationUnits: [],
    isSearchError: false,
  }
): ReturnType<typeof render> {
  const mocks = createGraphQLMocks({ ...mockProps, reservationKind: ReservationKind.Season });
  const round = createMockApplicationRound();
  const options: ReservationUnitModalProps["options"] = {
    units: [],
    purposes: [],
    reservationUnitTypes: [],
  } as const;
  const props: ReservationUnitModalProps = {
    handleAdd,
    handleRemove,
    currentReservationUnits,
    applicationRound: round,
    options: options,
  };
  return render(
    <MockedGraphQLProvider mocks={mocks}>
      <ReservationUnitModalContent {...props} />
    </MockedGraphQLProvider>
  );
}

beforeEach(() => {
  mockedSearchParams.mockReturnValue(new URLSearchParams());
  // Timezone breaks toISOString for GraphQL query mocks
  vi.stubEnv("TZ", "UTC");
});

afterEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

describe("Modal render", () => {
  test("sanity", async () => {
    const view = customRender();
    await isReady(view);

    const cards = view.getAllByTestId("ModalContent__reservationUnitCard");
    expect(cards).toHaveLength(10);
    for (let i = 0; i < 10; i++) {
      expect(view.getByRole("heading", { name: `ReservationUnit ${i + 1} FI` })).toBeInTheDocument();
    }
  });

  test("should render buttons to all cards", async () => {
    const view = customRender();
    await isReady(view);
    const cards = view.getAllByTestId("ModalContent__reservationUnitCard");
    expect(cards).toHaveLength(10);
    for (const card of cards) {
      expect(
        within(card).getByRole("button", {
          name: "reservationUnitModal:selectReservationUnit",
        })
      ).toBeInTheDocument();
    }
  });

  test("should have an external link in all cards", async () => {
    const view = customRender();
    await isReady(view);
    const cards = view.getAllByTestId("ModalContent__reservationUnitCard");
    expect(cards).toHaveLength(10);
    for (const card of cards) {
      expect(
        within(card).getByRole("link", {
          name: "reservationUnitModal:openLinkToNewTab",
        })
      ).toBeInTheDocument();
    }
  });

  test("should render remove button for all", async () => {
    const currentReservationUnits = Array.from({ length: 10 }, (_, i) => i + 1).map((i) => ({ pk: i }));
    const view = customRender({ currentReservationUnits });
    await isReady(view);
    const cards = view.getAllByTestId("ModalContent__reservationUnitCard");
    expect(cards).toHaveLength(10);
    for (const card of cards) {
      expect(
        within(card).getByRole("button", {
          name: "reservationUnitModal:deselectReservationUnit",
        })
      ).toBeInTheDocument();
    }
  });
});

describe("Modal search", () => {
  test.todo("sanity: should render search form");
  test.todo("should render search form with no results");

  test("should show an error if query fails", async () => {
    const view = customRender({ isSearchError: true });
    await isReady(view);
    expect(view.getByText("errors:search")).toBeInTheDocument();
  });

  test.todo("should search on button press");
  test.todo("should allow setting search filters");

  // TODO do we need to add this here? yes because the query is made from this component
  // if we move the query somewhere else e.g. reuse it in a component shared by both the modal and recurring/[id] page
  // we only need to test it once
  test.todo("pagination should work");
});

describe("modal card actions", () => {
  test.for(Array.from({ length: 10 }).map((_, i) => i))("should add correct %s reservation units", async (index) => {
    const addCb = vi.fn();
    const view = customRender({ handleAdd: addCb });
    await isReady(view);
    const user = userEvent.setup();

    const cards = view.getAllByTestId("ModalContent__reservationUnitCard");
    expect(cards).toHaveLength(10);
    const card = cards[index];
    if (!card) {
      throw new Error("No card found");
    }
    const select = within(card).getByRole("button", {
      name: "reservationUnitModal:selectReservationUnit",
    });
    if (!select) {
      throw new Error("No select found");
    }
    await user.click(select);
    expect(addCb).toHaveBeenCalledTimes(1);
    expect(addCb).toHaveBeenLastCalledWith({
      pk: index + 1,
    });
    // button value is not changed since it is not a controlled component
    expect(
      within(card).getByRole("button", {
        name: "reservationUnitModal:selectReservationUnit",
      })
    ).toBeInTheDocument();
    expect(
      within(card).queryByRole("button", {
        name: "reservationUnitModal:deselectReservationUnit",
      })
    ).not.toBeInTheDocument();
  });

  test.for(Array.from({ length: 10 }).map((_, i) => i))("should remove selected %s reservation unit", async (index) => {
    const addCb = vi.fn();
    const removeCb = vi.fn();
    const view = customRender({
      handleAdd: addCb,
      handleRemove: removeCb,
      // select all we expect the correct one to be deselected
      currentReservationUnits: Array.from({ length: 10 })
        .map((_, i) => i + 1)
        .map((pk) => ({ pk })),
    });
    await isReady(view);
    const user = userEvent.setup();

    const cards = view.getAllByTestId("ModalContent__reservationUnitCard");
    expect(cards).toHaveLength(10);
    const card = cards[index];
    if (!card) {
      throw new Error("No card found");
    }
    const select = within(card).queryByRole("button", {
      name: "reservationUnitModal:deselectReservationUnit",
    });
    expect(
      within(card).queryByRole("button", {
        name: "reservationUnitModal:selectReservationUnit",
      })
    ).not.toBeInTheDocument();
    if (!select) {
      throw new Error("No select found");
    }
    await user.click(select);
    expect(removeCb).toHaveBeenCalledTimes(1);
    expect(removeCb).toHaveBeenLastCalledWith({
      pk: index + 1,
    });
    expect(addCb).toHaveBeenCalledTimes(0);
  });
});

describe("modal actions", () => {
  test.todo("should have a close modal");
  test.todo("should have leave modal button");
});

// Client side query will return loading on first render
// submit button in this case works as a proxy for the query loading state
// TODO should create a utility that waits for loading-spinner to be hidden instead
// this is too specific for search forms and is brittle in case we disable
// submit for other reasons (like errors)
async function isReady(view: ReturnType<typeof customRender>): Promise<HTMLElement> {
  const submitBtn = view.getByRole("button", {
    name: "searchForm:searchButton",
  });
  expect(submitBtn).toBeInTheDocument();
  await expect.poll(() => submitBtn).not.toBeDisabled();
  return submitBtn;
}
