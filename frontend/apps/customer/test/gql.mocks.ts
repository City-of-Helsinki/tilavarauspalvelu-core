import { createNodeId } from "ui/src/modules/helpers";
import {
  CurrentUserDocument,
  OptionsDocument,
  OptionsQuery,
  ReservationPurposeOrderingChoices,
  ReservationUnitTypeOrderingChoices,
} from "@gql/gql-types";
import type { CurrentUserQuery } from "@gql/gql-types";
import { createApplicationMutationMocks } from "./application.mocks";
import { createSearchQueryMocks } from "./search.mocks";
import { createOptionQueryMock } from "./test.gql.utils";
import type { ICreateGraphQLMock, CreateGraphQLMockProps, CreateGraphQLMocksReturn } from "./test.gql.utils";

export function createGraphQLMocks({
  noUser = false,
  isSearchError = false,
}: CreateGraphQLMockProps = {}): CreateGraphQLMocksReturn {
  return [
    ...createSearchQueryMocks({ isSearchError }),
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
          reservationUnitTypesOrderBy: ReservationUnitTypeOrderingChoices.RankAsc,
          reservationPurposesOrderBy: ReservationPurposeOrderingChoices.RankAsc,
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
