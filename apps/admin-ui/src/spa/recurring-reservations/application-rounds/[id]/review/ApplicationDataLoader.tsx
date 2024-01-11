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
import { useTranslation } from "react-i18next";

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
  const nameFilter = searchParams.get("name");

  const { fetchMore, loading, data } = useQuery<Query, QueryApplicationsArgs>(
    APPLICATIONS_QUERY,
    {
      skip: !applicationRoundPk,
      variables: {
        unit: unitFilter.map(Number).filter(Number.isFinite),
        applicationRound: applicationRoundPk,
        offset: 0,
        first: LIST_PAGE_SIZE,
        status: transformApplicationStatuses(statusFilter),
        applicantType: transformApplicantType(applicantFilter),
        textSearch: nameFilter,
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
      // TODO cache-and-network doesn't work because it appends the network-results on top of the cache
      // need to add custom caching merge with uniq before changing this
      fetchPolicy: "network-only",
    }
  );

  const { t } = useTranslation();

  if (loading && !data) {
    return <Loader />;
  }

  const applications = filterNonNullable(
    data?.applications?.edges?.map((edge) => edge?.node)
  );

  const sort = undefined;
  const handleSortChanged = (field: string) => {
    // eslint-disable-next-line no-console
    console.warn("TODO: sort changed", field);
  };

  return (
    <>
      <span>
        <b>
          {data?.applications?.totalCount}{" "}
          {t("ApplicationRound.applicationCount")}
        </b>
      </span>
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
