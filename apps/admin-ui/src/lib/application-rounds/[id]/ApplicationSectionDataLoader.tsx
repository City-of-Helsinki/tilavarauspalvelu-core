import React from "react";
import { gql } from "@apollo/client";
import { ApplicationSectionOrderSet, useApplicationSectionsQuery } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { filterEmptyArray, filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE, VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { errorToast } from "common/src/components/toast";
import { More } from "@/component/More";
import { useSort } from "@/hooks/useSort";
import { ApplicationSectionsTable, SORT_KEYS } from "./ApplicationSectionsTable";
import { useGetFilterSearchParams } from "@/hooks";
import { CenterSpinner } from "common/styled";

type Props = {
  applicationRoundPk: number;
};

export function ApplicationSectionDataLoader({ applicationRoundPk }: Props): JSX.Element {
  const { t } = useTranslation();

  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);

  const { textFilter, unitFilter, unitGroupFilter, reservationUnitFilter, applicantTypeFilter, sectionStatusFilter } =
    useGetFilterSearchParams();

  const query = useApplicationSectionsQuery({
    skip: !applicationRoundPk,
    variables: {
      first: LIST_PAGE_SIZE,
      applicationRound: applicationRoundPk,
      orderBy: filterEmptyArray(transformOrderBy(orderBy)),
      textSearch: textFilter,
      unit: unitFilter,
      unitGroup: unitGroupFilter,
      reservationUnit: reservationUnitFilter,
      applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
      status: sectionStatusFilter,
      applicantType: applicantTypeFilter,
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
    fetchPolicy: "cache-and-network",
    // TODO enable or no?
    nextFetchPolicy: "cache-first",
  });

  const { fetchMore, previousData, loading, data } = query;

  const dataToUse = data ?? previousData;
  if (loading && !dataToUse) {
    return <CenterSpinner />;
  }

  const applicationSections = filterNonNullable(dataToUse?.applicationSections?.edges.map((edge) => edge?.node));
  const totalCount = dataToUse?.applicationSections?.totalCount ?? 0;

  return (
    <>
      <span>
        <b>
          {totalCount} {t("applicationRound:applicationEventCount")}
        </b>
      </span>
      <ApplicationSectionsTable
        applicationSections={applicationSections}
        sort={orderBy}
        sortChanged={handleSortChanged}
        isLoading={loading}
      />
      <More
        totalCount={totalCount}
        count={applicationSections.length}
        pageInfo={dataToUse?.applicationSections?.pageInfo}
        fetchMore={(after) => fetchMore({ variables: { after } })}
      />
    </>
  );
}

function transformOrderBy(orderBy: string | null): ApplicationSectionOrderSet[] {
  if (orderBy == null) {
    return [];
  }
  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  switch (rest) {
    case "nameFi":
      return desc ? [ApplicationSectionOrderSet.NameDesc] : [ApplicationSectionOrderSet.NameAsc];
    case "preferredUnitNameFi":
      return desc
        ? [ApplicationSectionOrderSet.PreferredUnitNameFiDesc]
        : [ApplicationSectionOrderSet.PreferredUnitNameFiAsc];
    case "status":
      return desc ? [ApplicationSectionOrderSet.StatusDesc] : [ApplicationSectionOrderSet.StatusAsc];
    case "applicant":
      return desc ? [ApplicationSectionOrderSet.ApplicantDesc] : [ApplicationSectionOrderSet.ApplicantAsc];
    case "application_id,pk":
    case "application_id,-pk":
      return desc
        ? [ApplicationSectionOrderSet.ApplicationPkDesc, ApplicationSectionOrderSet.PkDesc]
        : [ApplicationSectionOrderSet.ApplicationPkAsc, ApplicationSectionOrderSet.PkAsc];
    default:
      return [];
  }
}

/// NOTE might have some cache issues (because it collides with the other sections query)
export const APPLICATION_SECTIONS_QUERY = gql`
  query ApplicationSections(
    $first: Int
    $after: String
    $orderBy: [ApplicationSectionOrderSet!]
    # Filter
    $ageGroup: [Int!]
    $applicantType: [ReserveeType!]
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice!]!
    $includePreferredOrder10OrHigher: Boolean!
    $municipality: [MunicipalityChoice!]
    $preferredOrder: [Int!]!
    $priority: [Priority!]
    $purpose: [Int!]
    $reservationUnit: [Int!]
    $status: [ApplicationSectionStatusChoice!]
    $textSearch: String
    $unit: [Int!]
    $unitGroup: [Int!]
  ) {
    applicationSections(
      first: $first
      after: $after
      orderBy: $orderBy
      filter: {
        ageGroup: $ageGroup
        applicantType: $applicantType
        applicationRound: $applicationRound
        applicationStatus: $applicationStatus
        municipality: $municipality
        preferredOrder: { values: $preferredOrder, allHigherThan10: $includePreferredOrder10OrHigher }
        priority: $priority
        purpose: $purpose
        reservationUnit: $reservationUnit
        status: $status
        textSearch: $textSearch
        unit: $unit
        unitGroup: $unitGroup
      }
    ) {
      edges {
        node {
          ...ApplicationSectionTableElement
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
