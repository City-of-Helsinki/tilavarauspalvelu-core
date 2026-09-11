import React, { useState } from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchReservationUnitsDocument } from "@gql/gql-types";
import type { ReservationUnitTableElementFragment } from "@gql/gql-types";
import { ReservationUnitsDataReader } from "./ReservationUnitsDataLoader";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("@/context/EnvContext", () => ({
  useEnvContext: () => ({
    env: {
      apiBaseUrl: "http://api.example.com",
    },
  }),
}));

vi.mock("ui/src/components/statuses", () => ({
  ReservationUnitPublishingStatusLabel: ({ state }: { state: string }) => <span>{state}</span>,
  ReservationUnitReservationStatusLabel: ({ state }: { state: string }) => <span>{state}</span>,
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

function createReservationUnit(
  overrides: Partial<ReservationUnitTableElementFragment> = {}
): ReservationUnitTableElementFragment {
  return {
    __typename: "ReservationUnitNode",
    id: "ru-1",
    pk: 1,
    nameFi: "Reservation Unit 1",
    publishingState: "PUBLISHED",
    reservationState: "RESERVABLE",
    maxPersons: 10,
    surfaceArea: 25.5,
    unit: {
      __typename: "UnitNode",
      id: "unit-1",
      nameFi: "Unit 1",
    },
    reservationUnitType: {
      __typename: "ReservationUnitTypeNode",
      id: "type-1",
      nameFi: "Meeting Room",
    },
    ...overrides,
  } as ReservationUnitTableElementFragment;
}

function listMock(
  reservationUnits: ReservationUnitTableElementFragment[],
  totalCount: number,
  hasNextPage = false
): MockedResponse {
  return {
    request: { query: SearchReservationUnitsDocument },
    variableMatcher: () => true,
    result: {
      data: {
        reservationUnits: {
          __typename: "ReservationUnitNodeConnection",
          edges: reservationUnits.map((node) => ({ __typename: "ReservationUnitNodeEdge", node })),
          pageInfo: { __typename: "PageInfo", endCursor: "cursor-1", hasNextPage },
          totalCount,
        },
      },
    },
  };
}

function errorMock(): MockedResponse {
  return {
    request: { query: SearchReservationUnitsDocument },
    variableMatcher: () => true,
    result: { errors: [new GraphQLError("Error")] },
  };
}

function Wrapper() {
  const [selectedRows, setSelectedRows] = useState<Array<number | string>>([]);
  return <ReservationUnitsDataReader selectedRows={selectedRows} setSelectedRows={setSelectedRows} />;
}

function renderLoader(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <Wrapper />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockedSearchParams.mockReturnValue(new URLSearchParams());
  mockErrorToast.mockReset();
});

describe("ReservationUnitsDataReader", () => {
  it("shows nothing from the table until the query resolves", () => {
    renderLoader([listMock([createReservationUnit()], 1)]);
    expect(screen.queryByText("Reservation Unit 1")).not.toBeInTheDocument();
  });

  it("renders the reservation units table once the query resolves", async () => {
    renderLoader([listMock([createReservationUnit()], 1)]);
    expect(await screen.findByText("Reservation Unit 1")).toBeInTheDocument();
    expect(screen.getByText("Unit 1")).toBeInTheDocument();
  });

  it("shows the empty state when there are no reservation units", async () => {
    renderLoader([listMock([], 0)]);
    expect(await screen.findByText("common:noFilteredResults")).toBeInTheDocument();
  });

  it("shows an error toast when the query returns a GraphQL error", async () => {
    renderLoader([errorMock()]);
    await waitFor(() => expect(mockErrorToast).toHaveBeenCalledWith({ text: "errors:errorFetchingData" }));
  });

  it("shows the More button when there are more results, and fetches the next page on click", async () => {
    const user = userEvent.setup();
    renderLoader([listMock([createReservationUnit()], 2, true), listMock([createReservationUnit()], 2)]);

    expect(await screen.findByText("Reservation Unit 1")).toBeInTheDocument();
    const moreButton = screen.getByRole("button", { name: "common:showMore" });

    await user.click(moreButton);

    await waitFor(() => expect(moreButton).not.toBeDisabled());
  });

  it("shows the all-results message when every reservation unit has been loaded", async () => {
    renderLoader([listMock([createReservationUnit()], 1, false)]);
    expect(await screen.findByText("translation:paging.allResults")).toBeInTheDocument();
  });

  it("toggles the sort field for every sortable column when its header is clicked", async () => {
    const user = userEvent.setup();
    const sortKeys = ["nameFi", "unitNameFi", "typeFi", "maxPersons", "surfaceArea"];
    renderLoader(Array.from({ length: sortKeys.length + 1 }, () => listMock([createReservationUnit()], 1)));

    expect(await screen.findByText("Reservation Unit 1")).toBeInTheDocument();

    for (const key of sortKeys) {
      // eslint-disable-next-line no-await-in-loop
      await user.click(screen.getByTestId(`hds-table-sorting-header-${key}`));
    }

    expect(screen.getByText("Reservation Unit 1")).toBeInTheDocument();
  });
});
