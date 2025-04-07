import React from "react";
import { gql, type ApolloError } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import { useTranslation } from "next-i18next";
import {
  ApplicationOrderingChoices,
  useApplicationsQuery,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { errorToast } from "common/src/common/toast";
import { More } from "@/component/More";
import { useSort } from "@/hooks/useSort";
import { ApplicationsTable, SORT_KEYS } from "./ApplicationsTable";
import { transformApplicantType, transformApplicationStatuses } from "./utils";
import { CenterSpinner } from "common/styled";

type Props = {
  applicationRoundPk: number;
};

export function ApplicationDataLoader({
  applicationRoundPk,
}: Props): JSX.Element {
  const { t } = useTranslation();
  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);

  const [searchParams] = useSearchParams();
  const unitFilter = searchParams.getAll("unit");
  const statusFilter = searchParams.getAll("status");
  const applicantFilter = searchParams.getAll("applicant");
  const nameFilter = searchParams.get("search");

  const { fetchMore, previousData, loading, data } = useApplicationsQuery({
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
      errorToast({ text: err.message });
    },
    fetchPolicy: "cache-and-network",
    // TODO enable or no?
    nextFetchPolicy: "cache-first",
  });

  const dataToUse = data ?? previousData;
  if (loading && !dataToUse) {
    return <CenterSpinner />;
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
        pageInfo={dataToUse?.applications?.pageInfo}
        fetchMore={(after) => fetchMore({ variables: { after } })}
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

export const APPLICATIONS_QUERY = gql`
  query Applications(
    $applicationRound: Int!
    $unit: [Int]
    $applicantType: [ApplicantTypeChoice]
    $status: [ApplicationStatusChoice]!
    $textSearch: String
    $orderBy: [ApplicationOrderingChoices]
    $first: Int
    $after: String
  ) {
    applications(
      applicationRound: $applicationRound
      unit: $unit
      applicantType: $applicantType
      status: $status
      textSearch: $textSearch
      orderBy: $orderBy
      first: $first
      after: $after
    ) {
      edges {
        node {
          ...ApplicationsTableElement
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;
