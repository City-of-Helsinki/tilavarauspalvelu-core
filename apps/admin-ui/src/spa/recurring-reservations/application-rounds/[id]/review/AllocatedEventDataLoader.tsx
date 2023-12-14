import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import type { Query, QueryApplicationEventsArgs } from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import {
  LIST_PAGE_SIZE,
  VALID_ALLOCATED_APPLICATION_STATUSES,
} from "@/common/const";
import { combineResults } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import { APPLICATIONS_EVENTS_QUERY } from "./queries";
import Loader from "@/component/Loader";
import { More } from "@/component/lists/More";
import ApplicationEventsTable from "./ApplicationEventsTable";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  applicationRoundPk: number;
};

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "applicationEvents");
};

const AllocatedEventDataLoader = ({
  applicationRoundPk,
}: Props): JSX.Element => {
  const { notifyError } = useNotification();

  const { fetchMore, loading, data } = useQuery<
    Query,
    QueryApplicationEventsArgs
  >(APPLICATIONS_EVENTS_QUERY, {
    skip: !applicationRoundPk,
    variables: {
      applicationRound: applicationRoundPk,
      applicationStatus: VALID_ALLOCATED_APPLICATION_STATUSES,
      offset: 0,
      first: LIST_PAGE_SIZE,
      // orderBy: sortString,
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return <Loader />;
  }

  const applicationEvents = filterNonNullable(
    data?.applicationEvents?.edges.map((edge) => edge?.node)
  );

  // TODO
  const sort = undefined;
  const handleSortChanged = (field: string) => {
    console.warn("TODO: handleSortChanged", field);
  };

  return (
    <>
      <ApplicationEventsTable
        applicationEvents={applicationEvents}
        sort={sort}
        sortChanged={handleSortChanged}
      />
      <More
        key={applicationEvents.length}
        totalCount={data?.applicationEvents?.totalCount || 0}
        count={applicationEvents.length}
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.applicationEvents?.edges.length,
            },
            updateQuery,
          })
        }
      />
    </>
  );
};

export default AllocatedEventDataLoader;
