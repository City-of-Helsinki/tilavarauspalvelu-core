import React from "react";
import { MockedProvider } from "@apollo/client/testing";
import type { MockedResponse } from "@apollo/client/testing";
import { render, screen, waitFor } from "@testing-library/react";
import { GraphQLError } from "graphql";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AllocatedTimeSlotsDocument } from "@gql/gql-types";
import type { AllocatedSectionsTableElementFragment } from "@gql/gql-types";
import { TimeSlotDataLoader } from "./AllocatedSectionDataLoader";

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

function listMock(totalCount: number = 0, hasNextPage = false): MockedResponse {
  const allocatedTimeSlots: AllocatedSectionsTableElementFragment[] = Array.from({ length: totalCount }, (_, i) => ({
    __typename: "AllocatedTimeSlotNode",
    pk: i + 1,
  })) as unknown as AllocatedSectionsTableElementFragment[];

  return {
    request: { query: AllocatedTimeSlotsDocument },
    variableMatcher: () => true,
    result: {
      data: {
        allocatedTimeSlots: {
          __typename: "AllocatedTimeSlotNodeConnection",
          edges: allocatedTimeSlots.map((node) => ({
            __typename: "AllocatedTimeSlotNodeEdge",
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
    request: { query: AllocatedTimeSlotsDocument },
    variableMatcher: () => true,
    result: { errors: [new GraphQLError("Error")] },
  };
}

function renderLoader(mocks: MockedResponse[]) {
  return render(
    <MockedProvider mocks={mocks}>
      <TimeSlotDataLoader applicationRoundPk={1} unitOptions={[]} />
    </MockedProvider>
  );
}

beforeEach(() => {
  mockErrorToast.mockReset();
});

describe("TimeSlotDataLoader", () => {
  it("shows the empty state when there are no allocated time slots", async () => {
    renderLoader([listMock(0)]);
    expect(await screen.findByText("common:noFilteredResults")).toBeInTheDocument();
  });

  it("shows an error toast when the query returns a GraphQL error", async () => {
    renderLoader([errorMock()]);
    await waitFor(() => expect(mockErrorToast).toHaveBeenCalledWith({ text: "errors:errorFetchingData" }));
  });
});
