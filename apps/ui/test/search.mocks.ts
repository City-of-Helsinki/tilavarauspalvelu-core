import {
  AccessType,
  ReservationKind,
  ReservationUnitOrderSet,
  SearchReservationUnitsDocument,
  type SearchReservationUnitsQuery,
  type SearchReservationUnitsQueryVariables,
} from "@/gql/gql-types";
import { CreateGraphQLMocksReturn, ICreateGraphQLMock } from "./test.gql.utils";
import { createMockReservationUnit } from "./reservation-unit.mocks";
import { endOfYear, startOfDay } from "date-fns";
import { SEARCH_PAGING_LIMIT } from "@/modules/const";

interface SearchQueryProps extends ICreateGraphQLMock {
  isSearchError: boolean;
  reservationKind?: ReservationKind;
}
export function createSearchQueryMocks({ isSearchError, reservationKind }: SearchQueryProps): CreateGraphQLMocksReturn {
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

  if (reservationKind === ReservationKind.Season) {
    return [
      {
        request: {
          query: SearchReservationUnitsDocument,
          variables: createSearchVariablesMock({ reservationKind }),
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
          variables: createSearchVariablesMock({ reservationKind, date: null }),
        },
        result: {
          data: SearchReservationUnitsQueryMock,
        },
        error: isSearchError ? new Error("Search error") : undefined,
      },
      {
        request: {
          query: SearchReservationUnitsDocument,
          variables: createSearchVariablesMock({ reservationKind, textSearch: "foobar" }),
        },
        result: {
          data: SearchReservationUnitsQueryMockWithParams,
        },
        error: isSearchError ? new Error("Search error") : undefined,
      },
    ];
  }

  // single search specializations
  return [
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null, personsAllowed: 15 }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null, reservableTimeStart: "06:00" }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null, reservableMinimumDurationMinutes: 30 }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null, accessTypes: [AccessType.AccessCode] }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null, reservableTimeEnd: "20:00" }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({
          reservationKind,
          date: null,
          personsAllowed: 15,
          reservableTimeEnd: "20:00",
        }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null, reservationUnitType: [1] }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null, equipments: [1] }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null, unit: [1] }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null, purposes: [1] }),
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    },
    {
      request: {
        query: SearchReservationUnitsDocument,
        variables: createSearchVariablesMock({ reservationKind, date: null, textSearch: "TämäOnHakuArvo" }),
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
  date = new Date(2024, 1, 1),
  reservationKind = ReservationKind.Season,
  personsAllowed,
  reservableTimeEnd,
  reservableTimeStart,
  accessTypes = [],
  reservableMinimumDurationMinutes,
  reservationUnitType = [],
  equipments = [],
  unit = [],
  purposes = [],
}: {
  textSearch?: string | null;
  date?: Date | null;
  reservationKind?: ReservationKind;
  personsAllowed?: number;
  reservableTimeEnd?: string;
  reservableTimeStart?: string;
  accessTypes?: AccessType[];
  reservableMinimumDurationMinutes?: number;
  reservationUnitType?: number[];
  equipments?: number[];
  unit?: number[];
  purposes?: number[];
  // TODO return type issues because all of them are optional (by backend)
  // we'd need to match them to a Required return type that we actully use
  // so what happens:
  // a new query param is added but that is not reflected in the mock
  // -> this is not a lint / type error but a runtime error in the tests
} = {}): Readonly<SearchReservationUnitsQueryVariables> {
  return {
    textSearch,
    ...(accessTypes.length > 0 ? { accessTypes } : {}),
    ...(reservationUnitType.length > 0 ? { reservationUnitType } : {}),
    ...(equipments?.length > 0 ? { equipments } : {}),
    ...(unit.length > 0 ? { unit } : {}),
    ...(purposes.length > 0 ? { purposes } : {}),
    reservableDateStart: date ? date.toISOString() : undefined,
    reservableDateEnd: date ? startOfDay(endOfYear(date)).toISOString() : undefined,
    first: SEARCH_PAGING_LIMIT,
    orderBy: [ReservationUnitOrderSet.NameFiAsc, ReservationUnitOrderSet.PkAsc],
    reservationKind,
    ...(reservationKind === ReservationKind.Season ? { applicationRound: [1] } : {}),
    ...(reservationKind === ReservationKind.Direct
      ? {
          showOnlyReservable: true,
        }
      : {}),
    personsAllowed,
    reservableTimeEnd,
    reservableTimeStart,
    reservableMinimumDurationMinutes,
  } as const;
}
