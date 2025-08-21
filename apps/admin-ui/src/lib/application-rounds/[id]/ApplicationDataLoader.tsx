import React from "react";
import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { ApplicationOrderSet, useApplicationsQuery } from "@gql/gql-types";
import { filterEmptyArray, filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { errorToast } from "common/src/components/toast";
import { More } from "@/component/More";
import { useSort } from "@/hooks/useSort";
import { ApplicationsTable, SORT_KEYS } from "./ApplicationsTable";
import { useGetFilterSearchParams } from "@/hooks";
import { CenterSpinner } from "common/styled";

type Props = {
  applicationRoundPk: number;
};

export function ApplicationDataLoader({ applicationRoundPk }: Props): JSX.Element {
  const { t } = useTranslation();
  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);

  const { textFilter, unitFilter, unitGroupFilter, applicationStatusFilter, applicantTypeFilter } =
    useGetFilterSearchParams();

  const { fetchMore, previousData, loading, data } = useApplicationsQuery({
    skip: !applicationRoundPk,
    variables: {
      first: LIST_PAGE_SIZE,
      applicationRound: applicationRoundPk,
      orderBy: filterEmptyArray(transformOrderBy(orderBy)),
      textSearch: textFilter,
      unit: unitFilter,
      unitGroup: unitGroupFilter,
      // Hack for the old graphql API
      status: applicationStatusFilter ?? [],
      applicantType: applicantTypeFilter,
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
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
          {totalCount} {t("applicationRound:applicationCount")}
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

function transformOrderBy(orderBy: string | null): ApplicationOrderSet[] {
  if (orderBy == null) {
    return [];
  }
  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  switch (rest) {
    case "applicantType":
      return desc ? [ApplicationOrderSet.ApplicantTypeDesc] : [ApplicationOrderSet.ApplicantTypeAsc];
    case "applicant":
      return desc ? [ApplicationOrderSet.ApplicantDesc] : [ApplicationOrderSet.ApplicantAsc];
    case "pk":
      return desc ? [ApplicationOrderSet.PkDesc] : [ApplicationOrderSet.PkAsc];
    case "preferredUnitNameFi":
      return desc ? [ApplicationOrderSet.PreferredUnitNameFiDesc] : [ApplicationOrderSet.PreferredUnitNameFiAsc];
    case "application_status":
      return desc ? [ApplicationOrderSet.StatusDesc] : [ApplicationOrderSet.StatusAsc];
    default:
      return [];
  }
}

export const APPLICATIONS_QUERY = gql`
  query Applications(
    $first: Int
    $after: String
    $orderBy: [ApplicationOrderSet!]
    # Filter
    $applicantType: [ReserveeType!]
    $applicationRound: Int!
    $status: [ApplicationStatusChoice!]!
    $textSearch: String
    $unit: [Int!]
    $unitGroup: [Int!]
  ) {
    applications(
      first: $first
      after: $after
      orderBy: $orderBy
      filter: {
        applicantType: $applicantType
        applicationRound: $applicationRound
        status: $status
        textSearch: $textSearch
        unit: $unit
        unitGroup: $unitGroup
      }
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
