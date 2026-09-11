import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RejectedOccurrencesDocument } from "@gql/gql-types";
import type { RejectedOccurrencesTableElementFragment } from "@gql/gql-types";
import { RejectedOccurrencesDataLoader } from "./RejectedOccurrencesDataLoader";

vi.mock("next-i18next", () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/router", () => ({
  useRouter: () => ({ push: vi.fn(), asPath: "/" }),
}));

const mockErrorToast = vi.fn();
vi.mock("ui/src/components/toast", () => ({
  errorToast: (...args: unknown[]) => mockErrorToast(...args),
}));

vi.mock("@ui/modules/apollo/helpers", () => ({
  getPermissionErrors: () => [],
}));

function createRejectedOccurrence(
  overrides: Partial<RejectedOccurrencesTableElementFragment> = {}
): RejectedOccurrencesTableElementFragment {
  return {
    __typename: "RejectedOccurrenceNode",
    pk: 1,
    applicationId: 100,
    applicationSectionId: 10,
    applicant: "Applicant Name",
    applicationSectionNameFi: "Section Name",
    unitNameFi: "Unit Name",
    reservationUnitNameFi: "Reservation Unit Name",
    beginDatetime: "2024-06-15T09:00:00Z",
    rejectionReason: "RESERVATION_UNIT_NOT_AVAILABLE",
    ...overrides,
  } as RejectedOccurrencesTableElementFragment;
}

function listMock(
  rejectedOccurrences: RejectedOccurrencesTableElementFragment[],
  totalCount: number,
  hasNextPage = false
): MockedResponse {
  return {
    request: { query: RejectedOccurrencesDocument },
    variableMatcher: () => true,
    result: {
      data: {
        rejectedOccurrences: {
          __typename: "RejectedOccurrenceNodeConnection",
          edges: rejectedOccurrences.map((node) => ({
            __typename: "RejectedOccurrenceNodeEdge",
            node,
          })),
          pageInfo: { __typename: "PageInfo", endCursor: "cursor-1", hasNextPage },
          totalCount,
        },
      },
    },
  };
}

function errorMock(): MockedResponse {
  return {
    request: { query: RejectedOccurrencesDocument },
    variableMatcher: () => true,
    result: { errors: [new GraphQLError("Error")] },
  };
}

function renderLoader(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <RejectedOccurrencesDataLoader applicationRoundPk={1} unitOptions={[]} />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockErrorToast.mockReset();
});

describe("RejectedOccurrencesDataLoader", () => {
  it("shows the loading spinner until the query resolves", () => {
    renderLoader([listMock([createRejectedOccurrence()], 1)]);
    expect(screen.queryByTestId("hds-table-sorting-header-applicant")).not.toBeInTheDocument();
  });

  it("renders the rejected occurrences table once the query resolves", async () => {
    renderLoader([listMock([createRejectedOccurrence()], 1)]);
    expect(await screen.findByTestId("hds-table-sorting-header-applicant")).toBeInTheDocument();
  });

  it("shows the empty state when there are no rejected occurrences", async () => {
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
      listMock([createRejectedOccurrence()], 2, true),
      listMock([createRejectedOccurrence(), createRejectedOccurrence({ pk: 2 })], 2),
    ]);

    expect(await screen.findByRole("button", { name: "common:showMore" })).toBeInTheDocument();
    const moreButton = screen.getByRole("button", { name: "common:showMore" });

    await user.click(moreButton);

    await waitFor(() => expect(moreButton).not.toBeDisabled());
  });

  it("shows the all-results message when every rejected occurrence has been loaded", async () => {
    renderLoader([listMock([createRejectedOccurrence()], 1, false)]);
    expect(await screen.findByText("translation:paging.allResults")).toBeInTheDocument();
  });
});
