import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "next-i18next";
import { type Query, type QueryApplicationsArgs } from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { combineResults } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import Loader from "@/component/Loader";
import { More } from "@/component/lists/More";
import { useSort } from "@/hooks/useSort";
import { APPLICATIONS_QUERY } from "./queries";
import { ApplicationsTable, SORT_KEYS } from "./ApplicationsTable";
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
  const { t } = useTranslation();
  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);

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
        orderBy,
      },
      onError: (err: ApolloError) => {
        notifyError(err.message);
      },
      // TODO cache-and-network doesn't work because it appends the network-results on top of the cache
      // need to add custom caching merge with uniq before changing this
      fetchPolicy: "network-only",
    }
  );

  if (loading && !data) {
    return <Loader />;
  }

  const applications = filterNonNullable(
    data?.applications?.edges?.map((edge) => edge?.node)
  );
  const totalCount = data?.applications?.totalCount ?? 0;

  return (
    <>
      <span>
        <b>
          {totalCount} {t("ApplicationRound.applicationCount")}
        </b>
      </span>
      <ApplicationsTable
        applications={applications}
        sort={orderBy}
        sortChanged={handleSortChanged}
      />
      <More
        totalCount={totalCount}
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
