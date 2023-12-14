import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import { type Query, type QueryApplicationsArgs } from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { combineResults } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import Loader from "@/component/Loader";
import { More } from "@/component/lists/More";
import { APPLICATIONS_QUERY } from "./queries";
import { ApplicationsTable } from "./ApplicationsTable";
import { transformApplicantType, transformApplicationStatuses } from "./utils";

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "applications");
};

type Props = {
  applicationRoundPk: number;
};

export function ApplicationDataLoader({
  applicationRoundPk,
}: Props): JSX.Element {
  const { notifyError } = useNotification();

  const [searchParams] = useSearchParams();
  const unitFilter = searchParams.getAll("unit");
  const statusFilter = searchParams.getAll("status");
  const applicantFilter = searchParams.getAll("applicant");

  const { fetchMore, loading, data } = useQuery<Query, QueryApplicationsArgs>(
    APPLICATIONS_QUERY,
    {
      skip: !applicationRoundPk,
      variables: {
        unit: unitFilter.map(Number),
        applicationRound: applicationRoundPk,
        offset: 0,
        first: LIST_PAGE_SIZE,
        status: transformApplicationStatuses(statusFilter),
        applicantType: transformApplicantType(applicantFilter),
        // TODO order by doesn't work
        /*
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
    }
  );

  if (loading && !data) {
    return <Loader />;
  }

  const applications = filterNonNullable(
    data?.applications?.edges?.map((edge) => edge?.node)
  );

  // TODO use query params for sort
  const sort = undefined;
  const handleSortChanged = (field: string) => {
    console.warn("TODO: sort changed", field);
  };

  return (
    <>
      <ApplicationsTable
        applications={applications}
        sort={sort}
        sortChanged={handleSortChanged}
      />
      <More
        key={applications.length}
        totalCount={data?.applications?.totalCount || 0}
        count={applications.length}
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.applications?.edges.length,
            },
            updateQuery,
          })
        }
      />
    </>
  );
}
