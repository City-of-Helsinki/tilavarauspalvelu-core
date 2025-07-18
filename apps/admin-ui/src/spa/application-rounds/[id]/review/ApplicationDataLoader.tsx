import React from "react";
import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { ApplicationOrderingChoices, useApplicationsQuery } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { errorToast } from "common/src/common/toast";
import { More } from "@/component/More";
import { useSort } from "@/hooks/useSort";
import { ApplicationsTable, SORT_KEYS } from "./ApplicationsTable";
import { useGetFilterSearchParams } from "./utils";
import { CenterSpinner } from "common/styled";

type Props = {
  applicationRoundPk: number;
};

export function ApplicationDataLoader({ applicationRoundPk }: Props): JSX.Element {
  const { t } = useTranslation();
  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);

  const { textFilter, unitFilter, unitGroupFilter, statusFilter, applicantTypeFilter } = useGetFilterSearchParams();

  const { fetchMore, previousData, loading, data } = useApplicationsQuery({
    skip: !applicationRoundPk,
    variables: {
      first: LIST_PAGE_SIZE,
      applicationRound: applicationRoundPk,
      orderBy: transformOrderBy(orderBy),
      textSearch: textFilter,
      unit: unitFilter,
      unitGroup: unitGroupFilter,
      status: statusFilter,
      applicantType: applicantTypeFilter,
    },
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
    fetchPolicy: "cache-and-network",
    // TODO enable or no?
    nextFetchPolicy: "cache-first",
  });

  const dataToUse = data ?? previousData;
  if (loading && !dataToUse) {
    return <CenterSpinner />;
  }

  const applications = filterNonNullable(dataToUse?.applications?.edges?.map((edge) => edge?.node));
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

function transformOrderBy(orderBy: string | null): ApplicationOrderingChoices[] {
  if (orderBy == null) {
    return [];
  }
  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  switch (rest) {
    case "applicantType":
      return desc ? [ApplicationOrderingChoices.ApplicantTypeDesc] : [ApplicationOrderingChoices.ApplicantTypeAsc];
    case "applicant":
      return desc ? [ApplicationOrderingChoices.ApplicantDesc] : [ApplicationOrderingChoices.ApplicantAsc];
    case "pk":
      return desc ? [ApplicationOrderingChoices.PkDesc] : [ApplicationOrderingChoices.PkAsc];
    case "preferredUnitNameFi":
      return desc
        ? [ApplicationOrderingChoices.PreferredUnitNameFiDesc]
        : [ApplicationOrderingChoices.PreferredUnitNameFiAsc];
    case "application_status":
      return desc ? [ApplicationOrderingChoices.StatusDesc] : [ApplicationOrderingChoices.StatusAsc];
    default:
      return [];
  }
}

export const APPLICATIONS_QUERY = gql`
  query Applications(
    $applicationRound: Int!
    $unit: [Int]
    $unitGroup: [Int]
    $applicantType: [ReserveeType]
    $status: [ApplicationStatusChoice]!
    $textSearch: String
    $orderBy: [ApplicationOrderingChoices]
    $first: Int
    $after: String
  ) {
    applications(
      applicationRound: $applicationRound
      unit: $unit
      unitGroup: $unitGroup
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
