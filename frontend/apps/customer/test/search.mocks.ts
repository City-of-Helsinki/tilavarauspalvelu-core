import { ReservationKind, ReservationUnitOrderingChoices, SearchReservationUnitsDocument } from "@gql/gql-types";
import type { SearchReservationUnitsQuery, SearchReservationUnitsQueryVariables } from "@gql/gql-types";
import { createMockReservationUnit } from "./reservation-unit.mocks";
import type { CreateGraphQLMocksReturn, ICreateGraphQLMock } from "./test.gql.utils";

interface SearchQueryProps extends ICreateGraphQLMock {
  isSearchError: boolean;
}
export function createSearchQueryMocks({ isSearchError }: SearchQueryProps): CreateGraphQLMocksReturn {
  const SearchReservationUnitsQueryMock: SearchReservationUnitsQuery = {
    reservationUnits: {
      totalCount: 10,
      edges: Array.from({ length: 10 }, (_, i) => i + 1).map((pk) => ({
        node: createMockReservationUnit({ pk }),
      })),
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
      },
    },
  };
  const SearchReservationUnitsQueryMockWithParams: SearchReservationUnitsQuery = {
    reservationUnits: {
      totalCount: 1,
      edges: [
        {
          node: createMockReservationUnit({ pk: 1 }),
        },
      ],
      pageInfo: {
        endCursor: null,
        hasNextPage: false,
      },
    },
  };

  return [
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock(),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      // There are no different errors for this query result (just default error text)
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock(),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ textSearch: "foobar" }),
      },
      result: {
        data: SearchReservationUnitsQueryMockWithParams,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
  ];
}

function createSearchVariablesMock({
  textSearch = undefined,
}: {
  textSearch?: string | null;
} = {}): Readonly<SearchReservationUnitsQueryVariables> {
  return {
    textSearch,
    applicationRound: [1],
    first: 36,
    orderBy: [ReservationUnitOrderingChoices.NameFiAsc, ReservationUnitOrderingChoices.PkAsc],
    reservationKind: ReservationKind.Season,
  } as const;
}
