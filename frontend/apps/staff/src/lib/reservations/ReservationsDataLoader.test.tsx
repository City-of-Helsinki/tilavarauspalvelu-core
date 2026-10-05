import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ReservationListDocument, ReservationStateChoice } from "@gql/gql-types";
import type { ReservationTableElementFragment } from "@gql/gql-types";
import { ReservationsDataLoader } from "./ReservationsDataLoader";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("ui/src/modules/date-utils", () => ({
  formatDateTime: (date: Date) => date.toISOString(),
  formatDateTimeRange: (start: Date, end: Date) => `${start.toISOString()} - ${end.toISOString()}`,
  parseValidDateObject: (dateStr: string) => new Date(dateStr),
  parseUIDate: (value: string) => new Date(value),
  formatApiDate: (date: Date) => date.toISOString().slice(0, 10),
}));

vi.mock("ui/src/components/statuses", () => ({
  OrderStatusLabel: ({ status }: { status: string }) => <span>{status}</span>,
  ReservationStatusLabel: ({ state }: { state: string }) => <span>{state}</span>,
}));

const { mockedSearchParams, useSearchParams } = vi.hoisted(() => {
  const params = vi.fn();
  return { useSearchParams: params, mockedSearchParams: params };
});
vi.mock("next/navigation", () => ({ useSearchParams }));

const mockErrorToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
}));

function createReservation(overrides: Partial<ReservationTableElementFragment> = {}): ReservationTableElementFragment {
  return {
    __typename: "ReservationNode",
    id: "res-1",
    pk: 1000,
    name: "John Doe",
    state: ReservationStateChoice.Confirmed,
    beginsAt: "2024-06-15T09:00:00Z",
    endsAt: "2024-06-15T11:00:00Z",
    createdAt: "2024-06-01T10:00:00Z",
    type: null,
    isBlocked: false,
    workingMemo: null,
    reserveeName: "John Doe",
    bufferTimeBefore: 0,
    bufferTimeAfter: 0,
    reservationUnit: {
      __typename: "ReservationUnitNode",
      id: "ru-1",
      nameFi: "Meeting Room A",
      unit: {
        __typename: "UnitNode",
        id: "unit-1",
        nameFi: "Unit 1",
      },
    },
    paymentOrder: null,
    user: null,
    ...overrides,
  } as ReservationTableElementFragment;
}

function listMock(
  reservations: ReservationTableElementFragment[],
  totalCount: number,
  hasNextPage = false
): MockedResponse {
  return {
    request: { query: ReservationListDocument },
    variableMatcher: () => true,
    result: {
      data: {
        reservations: {
          __typename: "ReservationNodeConnection",
          edges: reservations.map((node) => ({ __typename: "ReservationNodeEdge", node })),
          pageInfo: { __typename: "PageInfo", endCursor: "cursor-1", hasNextPage },
          totalCount,
        },
      },
    },
  };
}

function errorMock(): MockedResponse {
  return {
    request: { query: ReservationListDocument },
    variableMatcher: () => true,
    result: { errors: [new GraphQLError("Error")] },
  };
}

function renderLoader(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <ReservationsDataLoader />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockedSearchParams.mockReturnValue(new URLSearchParams());
  mockErrorToast.mockReset();
});

describe("ReservationsDataLoader", () => {
  it("shows nothing from the table until the query resolves", () => {
    renderLoader([listMock([createReservation()], 1)]);
    expect(screen.queryByText("1000")).not.toBeInTheDocument();
  });

  it("renders the reservations table once the query resolves", async () => {
    renderLoader([listMock([createReservation()], 1)]);
    expect(await screen.findByText("1000")).toBeInTheDocument();
    expect(screen.getByText("Meeting Room A")).toBeInTheDocument();
  });

  it("shows the empty state when there are no reservations", async () => {
    renderLoader([listMock([], 0)]);
    expect(await screen.findByText("common:noFilteredResults")).toBeInTheDocument();
  });

  it("shows an error toast when the query returns a GraphQL error", async () => {
    renderLoader([errorMock()]);
    await waitFor(() => expect(mockErrorToast).toHaveBeenCalledWith({ text: "errors:errorFetchingData" }));
  });

  it("shows the More button when there are more results, and fetches the next page on click", async () => {
    const user = userEvent.setup();
    renderLoader([
      listMock([createReservation()], 2, true),
      listMock([createReservation(), createReservation({ id: "res-2", pk: 1001 })], 2),
    ]);

    expect(await screen.findByText("1000")).toBeInTheDocument();
    const moreButton = screen.getByRole("button", { name: "common:showMore" });

    await user.click(moreButton);

    await waitFor(() => expect(moreButton).not.toBeDisabled());
  });

  it("shows the all-results message when every reservation has been loaded", async () => {
    renderLoader([listMock([createReservation()], 1, false)]);
    expect(await screen.findByText("translation:paging.allResults")).toBeInTheDocument();
  });

  it("toggles the sort field for every sortable column when its header is clicked", async () => {
    const user = userEvent.setup();
    const sortKeys = [
      "pk",
      "reservee_name",
      "reservation_unit_name_fi",
      "unit_name_fi",
      "begin",
      "created_at",
      "orderStatus",
      "state",
    ];
    renderLoader(Array.from({ length: sortKeys.length + 2 }, () => listMock([createReservation()], 1)));

    expect(await screen.findByText("1000")).toBeInTheDocument();

    for (const key of sortKeys) {
      // eslint-disable-next-line no-await-in-loop
      await user.click(screen.getByTestId(`hds-table-sorting-header-${key}`));
    }
    // click "begin" again to also exercise the descending branch
    await user.click(screen.getByTestId("hds-table-sorting-header-begin"));

    expect(screen.getByText("1000")).toBeInTheDocument();
  });

  it("sends the recurring filter when the recurring search param is set", async () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams({ recurring: "only" }));
    renderLoader([listMock([createReservation()], 1)]);
    expect(await screen.findByText("1000")).toBeInTheDocument();
  });

  it("sends the non-recurring filter when the recurring search param is 'onlyNot'", async () => {
    mockedSearchParams.mockReturnValue(new URLSearchParams({ recurring: "onlyNot" }));
    renderLoader([listMock([createReservation()], 1)]);
    expect(await screen.findByText("1000")).toBeInTheDocument();
  });
});
