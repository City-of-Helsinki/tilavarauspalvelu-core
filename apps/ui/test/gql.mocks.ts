import {
  CurrentUserDocument,
  OptionsDocument,
  ReservationKind,
  ReservationPurposeOrderSet,
  ReservationUnitTypeOrderSet,
} from "@/gql/gql-types";
import type { CurrentUserQuery, OptionsQuery } from "@/gql/gql-types";
import { createApplicationMutationMocks } from "./application.mocks";
import { createSearchQueryMocks } from "./search.mocks";
import { createOptionQueryMock } from "./test.gql.utils";
import type { ICreateGraphQLMock, CreateGraphQLMockProps, CreateGraphQLMocksReturn } from "./test.gql.utils";
import { createNodeId } from "common/src/helpers";

export function createGraphQLMocks({
  noUser = false,
  isSearchError = false,
  reservationKind = ReservationKind.Direct,
}: CreateGraphQLMockProps = {}): CreateGraphQLMocksReturn {
  return [
    ...createSearchQueryMocks({ isSearchError, reservationKind }),
    ...createOptionsQueryMocks(),
    ...createCurrentUserQueryMocks({ noUser }),
    ...createApplicationMutationMocks(),
  ];
}

interface CurrentUserQueryMocksProps extends ICreateGraphQLMock {
  noUser: boolean;
}

function createCurrentUserQueryMocks({ noUser }: CurrentUserQueryMocksProps): CreateGraphQLMocksReturn {
  const CurrentUserMock: CurrentUserQuery = {
    currentUser: !noUser
      ? {
          id: createNodeId("UserNode", 1),
          pk: 1,
          firstName: "Test",
          lastName: "User",
          email: "test@user",
          isAdAuthenticated: false,
        }
      : null,
  };

  return [
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

function createOptionsQueryMocks(): CreateGraphQLMocksReturn {
  const OptionsMock: OptionsQuery = createOptionQueryMock();
  return [
    {
      request: {
        query: OptionsDocument,
        variables: {
          reservationUnitTypesOrderBy: ReservationUnitTypeOrderSet.RankAsc,
          reservationPurposesOrderBy: ReservationPurposeOrderSet.RankAsc,
          unitsOrderBy: [],
          equipmentsOrderBy: [],
          purposesOrderBy: [],
        },
      },
      result: {
        data: OptionsMock,
      },
    },
  ];
}
