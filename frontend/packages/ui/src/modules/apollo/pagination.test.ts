import { gql, InMemoryCache } from "@apollo/client";
import { relayStylePagination } from "@apollo/client/utilities";
import { describe, expect, test } from "vitest";
import { keepLoadedPages, keyArgsWithoutPaging } from "./pagination";

const QUERY = gql`
  query TestReservations($state: String, $first: Int, $after: String) {
    reservations(state: $state, first: $first, after: $after) {
      edges {
        node {
          id
          pk
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
    }
  }
`;

type QueryData = {
  reservations: {
    edges: Array<{ node: { id: string; pk: number } }>;
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
  };
};

function createCache() {
  return new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          reservations: keepLoadedPages(relayStylePagination(keyArgsWithoutPaging)),
        },
      },
    },
  });
}

function createPage(start: number, length: number, hasNextPage: boolean) {
  const pks = Array.from({ length }, (_, i) => start + i);
  return {
    reservations: {
      __typename: "ReservationNodeConnection",
      edges: pks.map((pk) => ({
        __typename: "ReservationNodeEdge",
        node: { __typename: "ReservationNode", id: `id-${pk}`, pk },
      })),
      pageInfo: {
        __typename: "PageInfo",
        endCursor: length > 0 ? `cursor-${start + length - 1}` : null,
        hasNextPage,
      },
    },
  };
}

function writeTwoPages(cache: InMemoryCache) {
  cache.writeQuery({ query: QUERY, variables: { state: "a", first: 2 }, data: createPage(0, 2, true) });
  cache.writeQuery({
    query: QUERY,
    variables: { state: "a", first: 2, after: "cursor-1" },
    data: createPage(2, 2, true),
  });
}

function readPks(cache: InMemoryCache) {
  const data = cache.readQuery<QueryData>({ query: QUERY, variables: { state: "a", first: 2 } });
  return data?.reservations.edges.map((edge) => edge.node.pk) ?? null;
}

describe("keepLoadedPages", () => {
  test("keeps the loaded pages when the same first page has a next page", () => {
    const cache = createCache();
    writeTwoPages(cache);

    cache.writeQuery({ query: QUERY, variables: { state: "a", first: 2 }, data: createPage(0, 2, true) });

    expect(readPks(cache)).toEqual([0, 1, 2, 3]);
  });

  test("shows only the first page when the backend says it is the end of the list", () => {
    const cache = createCache();
    writeTwoPages(cache);

    cache.writeQuery({ query: QUERY, variables: { state: "a", first: 2 }, data: createPage(0, 2, false) });

    expect(readPks(cache)).toEqual([0, 1]);
  });
});
