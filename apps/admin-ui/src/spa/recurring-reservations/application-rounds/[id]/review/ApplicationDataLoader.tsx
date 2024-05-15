import React from "react";
import { type ApolloError, useQuery } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "next-i18next";
import {
  ApplicationOrderingChoices,
  type Query,
  type QueryApplicationsArgs,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { useNotification } from "@/context/NotificationContext";
import Loader from "@/component/Loader";
import { More } from "@/component/More";
import { useSort } from "@/hooks/useSort";
import { APPLICATIONS_QUERY } from "./queries";
import { ApplicationsTable, SORT_KEYS } from "./ApplicationsTable";
import { transformApplicantType, transformApplicationStatuses } from "./utils";

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
  const nameFilter = searchParams.get("search");

  const { fetchMore, previousData, loading, data } = useQuery<
    Query,
    QueryApplicationsArgs
  >(APPLICATIONS_QUERY, {
    skip: !applicationRoundPk,
    variables: {
      first: LIST_PAGE_SIZE,
      applicationRound: applicationRoundPk,
      unit: unitFilter.map(Number).filter(Number.isFinite),
      status: transformApplicationStatuses(statusFilter),
      applicantType: transformApplicantType(applicantFilter),
      textSearch: nameFilter,
      orderBy: transformOrderBy(orderBy),
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const dataToUse = data ?? previousData;
  if (loading && !dataToUse) {
    return <Loader />;
  }

  const applications = filterNonNullable(
    dataToUse?.applications?.edges?.map((edge) => edge?.node)
  );
  const totalCount = dataToUse?.applications?.totalCount ?? 0;

  return (
    <>
      <span>
        <b>
          {totalCount} {t("ApplicationRound.applicationCount")}
        </b>
      </span>
      <ApplicationsTable
        isLoading={loading}
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
          })
        }
      />
    </>
  );
}

function transformOrderBy(
  orderBy: string | null
): ApplicationOrderingChoices[] {
  if (orderBy == null) {
    return [];
  }
  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  switch (rest) {
    case "applicantType":
      return desc
        ? [ApplicationOrderingChoices.ApplicantTypeDesc]
        : [ApplicationOrderingChoices.ApplicantTypeAsc];
    case "applicant":
      return desc
        ? [ApplicationOrderingChoices.ApplicantDesc]
        : [ApplicationOrderingChoices.ApplicantAsc];
    case "pk":
      return desc
        ? [ApplicationOrderingChoices.PkDesc]
        : [ApplicationOrderingChoices.PkAsc];
    case "preferredUnitNameFi":
      return desc
        ? [ApplicationOrderingChoices.PreferredUnitNameFiDesc]
        : [ApplicationOrderingChoices.PreferredUnitNameFiAsc];
    case "application_status":
      return desc
        ? [ApplicationOrderingChoices.StatusDesc]
        : [ApplicationOrderingChoices.StatusAsc];
    default:
      return [];
  }
}
