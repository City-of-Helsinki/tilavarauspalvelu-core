import {
  AccessType,
  ReservationKind,
  ReservationUnitOrderingChoices,
  SearchReservationUnitsDocument,
} from "@gql/gql-types";
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

  const directBase = createDirectSearchVariablesMock();
  const directTextSearch = createDirectSearchVariablesMock({ textSearch: "TämäOnHakuArvo" });
  const directUnits = createDirectSearchVariablesMock({ unit: [1] });
  const directEquipments = createDirectSearchVariablesMock({ equipments: [1] });
  const directIntendedUses = createDirectSearchVariablesMock({ intendedUses: [1] });
  const directReservationUnitTypes = createDirectSearchVariablesMock({ reservationUnitType: [1] });
  const directTimeBegin = createDirectSearchVariablesMock({ reservableTimeStart: "06:00" });
  const directTimeEnd = createDirectSearchVariablesMock({ reservableTimeEnd: "20:00" });
  const directDuration = createDirectSearchVariablesMock({ reservableMinimumDurationMinutes: 30 });
  const directPersonsAllowed = createDirectSearchVariablesMock({ personsAllowed: 15 });
  const directAccessTypes = createDirectSearchVariablesMock({ accessType: [AccessType.AccessCode] });
  const directStartDate = createDirectSearchVariablesMock({
    accessTypeBeginDate: "2025-01-01",
    reservableDateStart: "2025-01-01",
  });
  const directEndDate = createDirectSearchVariablesMock({
    accessTypeEndDate: "2025-12-31",
    reservableDateEnd: "2025-12-31",
  });
  const seasonBase = createSeasonSearchVariablesMock();
  const seasonFoobar = createSeasonSearchVariablesMock({ textSearch: "foobar" });

  return [
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directBase,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directTextSearch,
      },
      result: {
        data: SearchReservationUnitsQueryMockWithParams,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directUnits,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directEquipments,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directIntendedUses,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directReservationUnitTypes,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directTimeBegin,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directTimeEnd,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directDuration,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directPersonsAllowed,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directAccessTypes,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directStartDate,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 2 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: directEndDate,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 6 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: seasonBase,
      },
      result: {
        data: SearchReservationUnitsQueryMock,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
    ...Array.from({ length: 4 }, () => ({
      request: {
        query: SearchReservationUnitsDocument,
        variables: seasonFoobar,
      },
      result: {
        data: SearchReservationUnitsQueryMockWithParams,
      },
      error: isSearchError ? new Error("Search error") : undefined,
    })),
  ];
}

function createDirectSearchVariablesMock({
  textSearch,
  unit,
  reservationUnitType,
  intendedUses,
  equipments,
  accessType,
  accessTypeBeginDate,
  accessTypeEndDate,
  reservableDateStart,
  reservableDateEnd,
  reservableTimeStart,
  reservableTimeEnd,
  reservableMinimumDurationMinutes,
  personsAllowed,
}: {
  textSearch?: string;
  unit?: number[];
  reservationUnitType?: number[];
  intendedUses?: number[];
  equipments?: number[];
  accessType?: AccessType[];
  accessTypeBeginDate?: string;
  accessTypeEndDate?: string;
  reservableDateStart?: string;
  reservableDateEnd?: string;
  reservableTimeStart?: string;
  reservableTimeEnd?: string;
  reservableMinimumDurationMinutes?: number;
  personsAllowed?: number;
} = {}): Readonly<SearchReservationUnitsQueryVariables> {
  const variables: SearchReservationUnitsQueryVariables = {
    showOnlyReservable: true,
    first: 36,
    orderBy: [ReservationUnitOrderingChoices.NameFiAsc, ReservationUnitOrderingChoices.PkAsc],
    reservationKind: ReservationKind.Direct,
  };

  if (textSearch != null) variables.textSearch = textSearch;
  if (unit != null) variables.unit = unit;
  if (reservationUnitType != null) variables.reservationUnitType = reservationUnitType;
  if (intendedUses != null) variables.intendedUses = intendedUses;
  if (equipments != null) variables.equipments = equipments;
  if (accessType != null) variables.accessType = accessType;
  if (accessTypeBeginDate != null) variables.accessTypeBeginDate = accessTypeBeginDate;
  if (accessTypeEndDate != null) variables.accessTypeEndDate = accessTypeEndDate;
  if (reservableDateStart != null) variables.reservableDateStart = reservableDateStart;
  if (reservableDateEnd != null) variables.reservableDateEnd = reservableDateEnd;
  if (reservableTimeStart != null) variables.reservableTimeStart = reservableTimeStart;
  if (reservableTimeEnd != null) variables.reservableTimeEnd = reservableTimeEnd;
  if (reservableMinimumDurationMinutes != null)
    variables.reservableMinimumDurationMinutes = reservableMinimumDurationMinutes;
  if (personsAllowed != null) variables.personsAllowed = personsAllowed;

  return variables;
}

function createSeasonSearchVariablesMock({
  textSearch,
}: {
  textSearch?: string;
} = {}): Readonly<SearchReservationUnitsQueryVariables> {
  const variables: SearchReservationUnitsQueryVariables = {
    applicationRound: [1],
    first: 36,
    orderBy: [ReservationUnitOrderingChoices.NameFiAsc, ReservationUnitOrderingChoices.PkAsc],
    reservationKind: ReservationKind.Season,
  };
  if (textSearch != null) variables.textSearch = textSearch;
  return variables;
}
