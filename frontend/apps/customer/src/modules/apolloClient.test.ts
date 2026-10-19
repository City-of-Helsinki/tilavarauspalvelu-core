import { gql } from "@apollo/client";
import { describe, expect, test } from "vitest";
import { createApolloClient } from "./apolloClient";

const QUERY = gql`
  query TestReservationUnits($textSearch: String, $first: Int, $after: String) {
    reservationUnits(textSearch: $textSearch, first: $first, after: $after) {
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
  reservationUnits: {
    edges: Array<{ node: { id: string; pk: number } }>;
    pageInfo: { endCursor: string | null; hasNextPage: boolean };
  };
};

function createPage(start: number, length: number, hasNextPage: boolean) {
  const pks = Array.from({ length }, (_, i) => start + i);
  return {
    reservationUnits: {
      __typename: "ReservationUnitNodeConnection",
      edges: pks.map((pk) => ({
        __typename: "ReservationUnitNodeEdge",
        node: { __typename: "ReservationUnitNode", id: `id-${pk}`, pk },
      })),
      pageInfo: {
        __typename: "PageInfo",
        endCursor: length > 0 ? `cursor-${start + length - 1}` : null,
        hasNextPage,
      },
    },
  };
}

function readPks(cache: ReturnType<typeof createApolloClient>["cache"], textSearch: string) {
  const data = cache.readQuery<QueryData>({ query: QUERY, variables: { textSearch, first: 2 } });
  return data?.reservationUnits.edges.map((edge) => edge.node.pk) ?? null;
}

describe("reservationUnits cache policy", () => {
  test("keeps a separate list for each filter", () => {
    const { cache } = createApolloClient("http://localhost");
    cache.writeQuery({ query: QUERY, variables: { textSearch: "a", first: 2 }, data: createPage(0, 2, true) });

    expect(readPks(cache, "b")).toBeNull();

    cache.writeQuery({ query: QUERY, variables: { textSearch: "b", first: 2 }, data: createPage(10, 1, false) });

    expect(readPks(cache, "a")).toEqual([0, 1]);
    expect(readPks(cache, "b")).toEqual([10]);
  });

  test("adds the next page to the same list", () => {
    const { cache } = createApolloClient("http://localhost");
    cache.writeQuery({ query: QUERY, variables: { textSearch: "a", first: 2 }, data: createPage(0, 2, true) });
    cache.writeQuery({
      query: QUERY,
      variables: { textSearch: "a", first: 2, after: "cursor-1" },
      data: createPage(2, 2, true),
    });

    expect(readPks(cache, "a")).toEqual([0, 1, 2, 3]);
  });

  test("sets hasNextPage to false when fetchMore returns no edges", () => {
    const { cache } = createApolloClient("http://localhost");
    cache.writeQuery({ query: QUERY, variables: { textSearch: "a", first: 2 }, data: createPage(0, 2, true) });
    cache.writeQuery({
      query: QUERY,
      variables: { textSearch: "a", first: 2, after: "cursor-1" },
      data: createPage(2, 0, true),
    });

    const data = cache.readQuery<QueryData>({ query: QUERY, variables: { textSearch: "a", first: 2 } });
    expect(data?.reservationUnits.edges).toHaveLength(2);
    expect(data?.reservationUnits.pageInfo.hasNextPage).toBe(false);
  });

  test("ignores the backend hasNextPage", () => {
    const { cache } = createApolloClient("http://localhost");
    cache.writeQuery({ query: QUERY, variables: { textSearch: "a", first: 2 }, data: createPage(0, 2, false) });

    const full = cache.readQuery<QueryData>({ query: QUERY, variables: { textSearch: "a", first: 2 } });
    expect(full?.reservationUnits.pageInfo.hasNextPage).toBe(true);

    cache.writeQuery({
      query: QUERY,
      variables: { textSearch: "a", first: 2, after: "cursor-1" },
      data: createPage(2, 1, true),
    });

    const short = cache.readQuery<QueryData>({ query: QUERY, variables: { textSearch: "a", first: 2 } });
    expect(short?.reservationUnits.pageInfo.hasNextPage).toBe(false);
  });

  test("keeps the loaded pages when the same first page is fetched again", () => {
    const { cache } = createApolloClient("http://localhost");
    cache.writeQuery({ query: QUERY, variables: { textSearch: "a", first: 2 }, data: createPage(0, 2, true) });
    cache.writeQuery({
      query: QUERY,
      variables: { textSearch: "a", first: 2, after: "cursor-1" },
      data: createPage(2, 1, false),
    });

    // The first page is fetched again on mount, for example after navigating back to the search
    cache.writeQuery({ query: QUERY, variables: { textSearch: "a", first: 2 }, data: createPage(0, 2, true) });

    const data = cache.readQuery<QueryData>({ query: QUERY, variables: { textSearch: "a", first: 2 } });
    expect(data?.reservationUnits.edges.map((edge) => edge.node.pk)).toEqual([0, 1, 2]);
    expect(data?.reservationUnits.pageInfo.endCursor).toBe("cursor-2");
    expect(data?.reservationUnits.pageInfo.hasNextPage).toBe(false);
  });

  test("shows only the new first page when the first page has changed", () => {
    const { cache } = createApolloClient("http://localhost");
    cache.writeQuery({ query: QUERY, variables: { textSearch: "a", first: 2 }, data: createPage(0, 2, true) });
    cache.writeQuery({
      query: QUERY,
      variables: { textSearch: "a", first: 2, after: "cursor-1" },
      data: createPage(2, 2, true),
    });

    cache.writeQuery({ query: QUERY, variables: { textSearch: "a", first: 2 }, data: createPage(1, 2, true) });

    const data = cache.readQuery<QueryData>({ query: QUERY, variables: { textSearch: "a", first: 2 } });
    expect(data?.reservationUnits.edges.map((edge) => edge.node.pk)).toEqual([1, 2]);
    expect(data?.reservationUnits.pageInfo.endCursor).toBe("cursor-2");
  });
});
