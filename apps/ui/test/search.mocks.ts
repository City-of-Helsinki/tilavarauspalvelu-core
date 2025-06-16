import {
  ReservationKind,
  ReservationUnitOrderingChoices,
  SearchReservationUnitsDocument,
  type SearchReservationUnitsQuery,
  type SearchReservationUnitsQueryVariables,
} from "@/gql/gql-types";
import { CreateGraphQLMocksReturn, ICreateGraphQLMock } from "./test.gql.utils";
import { createMockReservationUnit } from "./reservation-unit.mocks";
import { addYears } from "date-fns";

interface SearchQueryProps extends ICreateGraphQLMock {
  isSearchError: boolean;
}
export function createSearchQueryMocks({ isSearchError }: SearchQueryProps): CreateGraphQLMocksReturn {
  // TODO this should enforce non nullable for the query
  // it can be null when the query is loading, but when we mock it it should be non nullable
  // Q: what about failed queries? (though they should have different type)
  const SearchReservationUnitsQueryMock: SearchReservationUnitsQuery = {
    reservationUnits: {
      totalCount: 10,
      edges: Array.from({ length: 10 }, (_, i) => i + 1).map((pk) => ({
        node: createMockReservationUnit({ pk }),
      })),
      pageInfo: {
        // TOOD how to mock this?
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
        // TOOD how to mock this?
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
        variables: createSearchVariablesMock({ date: null }),
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
  textSearch = null,
  date = new Date(2024, 1, 1),
}: {
  textSearch?: string | null;
  date?: Date | null;
  // TODO return type issues because all of them are optional (by backend)
  // we'd need to match them to a Required return type that we actully use
  // so what happens:
  // a new query param is added but that is not reflected in the mock
  // -> this is not a lint / type error but a runtime error in the tests
} = {}): Readonly<SearchReservationUnitsQueryVariables> {
  return {
    textSearch,
    purposes: [],
    unit: [],
    reservationUnitType: [],
    equipments: [],
    accessType: [],
    accessTypeBeginDate: date ? date.toISOString() : null,
    accessTypeEndDate: date ? addYears(date, 1).toISOString() : null,
    reservableDateStart: date ? date.toISOString() : null,
    reservableDateEnd: null,
    reservableTimeStart: null,
    reservableTimeEnd: null,
    reservableMinimumDurationMinutes: null,
    applicationRound: [1],
    personsAllowed: null,
    first: 36,
    orderBy: [ReservationUnitOrderingChoices.NameFiAsc, ReservationUnitOrderingChoices.PkAsc],
    isDraft: false,
    isVisible: true,
    reservationKind: ReservationKind.Season,
  } as const;
}
