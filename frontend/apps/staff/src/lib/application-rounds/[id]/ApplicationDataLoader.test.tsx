import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationsDocument } from "@gql/gql-types";
import type { ApplicationsTableElementFragment } from "@gql/gql-types";
import { ApplicationDataLoader } from "./ApplicationDataLoader";

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

function listMock(totalCount: number = 0, hasNextPage = false): MockedResponse {
  const applications: ApplicationsTableElementFragment[] = Array.from({ length: totalCount }, (_, i) => ({
    __typename: "ApplicationNode",
    pk: 100 + i,
  })) as unknown as ApplicationsTableElementFragment[];

  return {
    request: { query: ApplicationsDocument },
    variableMatcher: () => true,
    result: {
      data: {
        applications: {
          __typename: "ApplicationNodeConnection",
          edges: applications.map((node) => ({
            __typename: "ApplicationNodeEdge",
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
    request: { query: ApplicationsDocument },
    variableMatcher: () => true,
    result: { errors: [new GraphQLError("Error")] },
  };
}

function renderLoader(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <ApplicationDataLoader applicationRoundPk={1} />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockErrorToast.mockReset();
});

describe("ApplicationDataLoader", () => {
  it("shows the empty state when there are no applications", async () => {
    renderLoader([listMock(0)]);
    expect(await screen.findByText("common:noFilteredResults")).toBeInTheDocument();
  });

  it("shows an error toast when the query returns a GraphQL error", async () => {
    renderLoader([errorMock()]);
    await waitFor(() => expect(mockErrorToast).toHaveBeenCalledWith({ text: "errors:errorFetchingData" }));
  });
});
