import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import {
  type Query,
  type QueryApplicationEventsArgs,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { combineResults } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import Loader from "@/component/Loader";
import { More } from "@/component/lists/More";
import { APPLICATIONS_EVENTS_QUERY } from "./queries";
import ApplicationEventsTable from "./ApplicationEventsTable";
import { transformApplicantType, transformApplicationStatuses } from "./utils";

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "applicationEvents");
};

type Props = {
  applicationRoundPk: number;
};

export function ApplicationEventDataLoader({
  applicationRoundPk,
}: Props): JSX.Element {
  const { notifyError } = useNotification();

  const [searchParams] = useSearchParams();
  const unitFilter = searchParams.getAll("unit");
  const statusFilter = searchParams.getAll("status");
  const applicantFilter = searchParams.getAll("applicant");

  const { fetchMore, loading, data } = useQuery<
    Query,
    QueryApplicationEventsArgs
  >(APPLICATIONS_EVENTS_QUERY, {
    skip: !applicationRoundPk,
    variables: {
      unit: unitFilter.map(Number),
      applicationRound: applicationRoundPk,
      applicationStatus: transformApplicationStatuses(statusFilter),
      applicantType: transformApplicantType(applicantFilter),
      offset: 0,
      first: LIST_PAGE_SIZE,
      // TODO query params for filters
      /* TODO query params
      orderBy:
        sort?.sort != null
          ? sort?.sort
            ? sort.field
            : `-${sort?.field}`
          : undefined,
      */
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
    fetchPolicy: "cache-and-network",
  });

  if (loading && !data) {
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
}
