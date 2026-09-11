import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApplicationSectionsDocument } from "@gql/gql-types";
import type { ApplicationSectionTableElementFragment } from "@gql/gql-types";
import { ApplicationSectionDataLoader } from "./ApplicationSectionDataLoader";

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
  const applicationSections: ApplicationSectionTableElementFragment[] = Array.from({ length: totalCount }, (_, i) => ({
    __typename: "ApplicationSectionNode",
    pk: i + 1,
  })) as unknown as ApplicationSectionTableElementFragment[];

  return {
    request: { query: ApplicationSectionsDocument },
    variableMatcher: () => true,
    result: {
      data: {
        applicationSections: {
          __typename: "ApplicationSectionNodeConnection",
          edges: applicationSections.map((node) => ({
            __typename: "ApplicationSectionNodeEdge",
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
    request: { query: ApplicationSectionsDocument },
    variableMatcher: () => true,
    result: { errors: [new GraphQLError("Error")] },
  };
}

function renderLoader(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <ApplicationSectionDataLoader applicationRoundPk={1} />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockErrorToast.mockReset();
});

describe("ApplicationSectionDataLoader", () => {
  it("shows the empty state when there are no application sections", async () => {
    renderLoader([listMock(0)]);
    expect(await screen.findByText("common:noFilteredResults")).toBeInTheDocument();
  });

  it("shows an error toast when the query returns a GraphQL error", async () => {
    renderLoader([errorMock()]);
    await waitFor(() => expect(mockErrorToast).toHaveBeenCalledWith({ text: "errors:errorFetchingData" }));
  });
});
