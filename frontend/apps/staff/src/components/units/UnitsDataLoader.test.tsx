import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { UnitListDocument } from "@gql/gql-types";
import type { UnitTableElementFragment } from "@gql/gql-types";
import { UnitsDataLoader } from "./UnitsDataLoader";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

const mockErrorToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
}));

function createUnit(overrides: Partial<UnitTableElementFragment> = {}): UnitTableElementFragment {
  return {
    __typename: "UnitNode",
    id: "unit-1",
    pk: 1,
    nameFi: "Unit Name",
    nameSv: "Enhet",
    nameEn: "Unit",
    reservationunitsCount: 5,
    unitGroup: {
      __typename: "UnitGroupNode",
      id: "ug-1",
      nameFi: "Group Name",
    },
    ...overrides,
  } as UnitTableElementFragment;
}

function listMock(units: UnitTableElementFragment[], totalCount: number, hasNextPage = false): MockedResponse {
  return {
    request: { query: UnitListDocument },
    variableMatcher: () => true,
    result: {
      data: {
        units: {
          __typename: "UnitNodeConnection",
          edges: units.map((node) => ({ __typename: "UnitNodeEdge", node })),
          pageInfo: { __typename: "PageInfo", endCursor: "cursor-1", hasNextPage },
          totalCount,
        },
      },
    },
  };
}

function errorMock(): MockedResponse {
  return {
    request: { query: UnitListDocument },
    variableMatcher: () => true,
    result: { errors: [new GraphQLError("Error")] },
  };
}

function renderLoader(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <UnitsDataLoader />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockErrorToast.mockReset();
});

describe("UnitsDataLoader", () => {
  it("shows the loading spinner until the query resolves", () => {
    renderLoader([listMock([createUnit()], 1)]);
    expect(screen.queryByTestId("hds-table-sorting-header-nameFi")).not.toBeInTheDocument();
  });

  it("renders the units table once the query resolves", async () => {
    renderLoader([listMock([createUnit()], 1)]);
    expect(await screen.findByTestId("hds-table-sorting-header-nameFi")).toBeInTheDocument();
  });

  it("shows the empty state when there are no units", async () => {
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
      listMock([createUnit()], 2, true),
      listMock([createUnit(), createUnit({ pk: 2, id: "unit-2", nameFi: "Unit Two" })], 2),
    ]);

    expect(await screen.findByRole("button", { name: "common:showMore" })).toBeInTheDocument();
    const moreButton = screen.getByRole("button", { name: "common:showMore" });

    await user.click(moreButton);

    await waitFor(() => expect(moreButton).not.toBeDisabled());
  });

  it("shows the all-results message when every unit has been loaded", async () => {
    renderLoader([listMock([createUnit()], 1, false)]);
    expect(await screen.findByText("translation:paging.allResults")).toBeInTheDocument();
  });
});
