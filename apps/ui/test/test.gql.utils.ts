import {
  CreateApplicationDocument,
  CreateApplicationMutationResult,
  CreateApplicationMutationVariables,
  CurrentUserDocument,
  CurrentUserQuery,
  ReservationKind,
  ReservationUnitOrderingChoices,
  SearchReservationUnitsDocument,
  SearchReservationUnitsQuery,
  SearchReservationUnitsQueryVariables,
} from "@/gql/gql-types";
import { base64encode } from "common/src/helpers";
import { addYears } from "date-fns";
import { DocumentNode } from "graphql";
import { createMockReservationUnitType } from "./test.utils";

export type CreateGraphQLMockProps = {
  noUser?: boolean;
  isSearchError?: boolean;
};

export type CreateGraphQLMocksReturn = Array<{
  request: {
    query: DocumentNode;
    variables?: Record<string, unknown>;
  };
  result: {
    data: Record<string, unknown>;
  };
  error?: Error | undefined;
}>;
// TODO parametrize the variables
// we need at least the following:
// - no user
// - query var version
// - error version
export function createGraphQLMocks({
  noUser = false,
  isSearchError = false,
}: CreateGraphQLMockProps = {}): CreateGraphQLMocksReturn {
  // TODO this should enforce non nullable for the query
  // it can be null when the query is loading, but when we mock it it should be non nullable
  // Q: what about failed queries? (though they should have different type)
  const SearchReservationUnitsQueryMock: SearchReservationUnitsQuery = {
    reservationUnits: {
      totalCount: 10,
      edges: Array.from({ length: 10 }, (_, i) => ({
        node: createSearchQueryNode(i + 1),
      })),
      pageInfo: {
        // TOOD how to mock this?
        endCursor: null,
        hasNextPage: false,
      },
    },
  };
  const SearchReservationUnitsQueryMockWithParams: SearchReservationUnitsQuery =
    {
      reservationUnits: {
        totalCount: 1,
        edges: [
          {
            node: createSearchQueryNode(1),
          },
        ],
        pageInfo: {
          // TOOD how to mock this?
          endCursor: null,
          hasNextPage: false,
        },
      },
    };
  const CurrentUserMock: CurrentUserQuery = {
    currentUser: !noUser
      ? {
          id: base64encode("UserNode:1"),
          pk: 1,
          firstName: "Test",
          lastName: "User",
          email: "test@user",
          isAdAuthenticated: false,
        }
      : null,
  };
  const CreateApplicationMutationMock: CreateApplicationMutationResult["data"] =
    {
      createApplication: {
        pk: 1,
      },
    };
  const CreateApplicationMutationMockVariables: CreateApplicationMutationVariables =
    {
      input: {
        applicationRound: 1,
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
        variables: createSearchVariablesMock({ textSearch: "foobar" }),
      },
      result: {
        data: SearchReservationUnitsQueryMockWithParams,
      },
    },
    {
      request: {
        query: CreateApplicationDocument,
        variables: CreateApplicationMutationMockVariables,
      },
      result: {
        data: CreateApplicationMutationMock,
      },
    },
    {
      request: {
        query: CurrentUserDocument,
      },
      result: {
        data: CurrentUserMock,
      },
    },
  ];
}

function createSearchQueryNode(
  i: number
): NonNullable<
  NonNullable<SearchReservationUnitsQuery["reservationUnits"]>["edges"][number]
>["node"] {
  return {
    id: base64encode(`ReservationUnitNode:${i}`),
    pk: i,
    nameFi: `ReservationUnit ${i} FI`,
    nameEn: `ReservationUnit ${i} EN`,
    nameSv: `ReservationUnit ${i} SV`,
    reservationBegins: addYears(new Date(), -1 * i).toISOString(),
    reservationEnds: addYears(new Date(), 1 * i).toISOString(),
    isClosed: false,
    // TODO implement though for Seasonal this doesn't matter
    firstReservableDatetime: null,
    currentAccessType: null,
    maxPersons: null,
    // TODO implement though for Seasonal this doesn't matter
    pricings: [],
    unit: {
      id: base64encode(`UnitNode:${i}`),
      pk: i,
      nameFi: `Unit ${i} FI`,
      nameEn: `Unit ${i} EN`,
      nameSv: `Unit ${i} SV`,
      location: {
        addressStreetFi: "Address street FI",
        addressStreetEn: "Address street EN",
        addressStreetSv: "Address street SV",
        addressCityFi: "Address city FI",
        addressCityEn: "Address city EN",
        addressCitySv: "Address city SV",
        id: base64encode(`LocationNode:${i}`),
        addressZip: "00000",
      },
    },
    reservationUnitType: createMockReservationUnitType({
      name: "ReservationUnitType",
    }),
    images: [],
    accessTypes: [],
  };
}

function createSearchVariablesMock({
  textSearch = null,
}: {
  textSearch?: string | null;
} = {}): SearchReservationUnitsQueryVariables {
  return {
    textSearch,
    purposes: [],
    unit: [],
    reservationUnitType: [],
    equipments: [],
    accessType: [],
    accessTypeBeginDate: "2024-02-01T00:00:00Z",
    accessTypeEndDate: "2025-01-01T00:00:00Z",
    applicationRound: [1],
    first: 36,
    orderBy: [
      ReservationUnitOrderingChoices.NameFiAsc,
      ReservationUnitOrderingChoices.PkAsc,
    ],
    isDraft: false,
    isVisible: true,
    reservationKind: ReservationKind.Season,
  };
}
