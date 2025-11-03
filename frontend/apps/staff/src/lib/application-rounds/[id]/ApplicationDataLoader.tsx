import React from "react";
import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { errorToast } from "ui/src/components/toast";
import { filterEmptyArray, filterNonNullable } from "ui/src/modules/helpers";
import { CenterSpinner } from "ui/src/styled";
import { More } from "@/components/More";
import { useGetFilterSearchParams } from "@/hooks";
import { useSort } from "@/hooks/useSort";
import { LIST_PAGE_SIZE } from "@/modules/const";
import { ApplicationOrderingChoices, useApplicationsQuery } from "@gql/gql-types";
import { ApplicationsTable, SORT_KEYS } from "./ApplicationsTable";

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
