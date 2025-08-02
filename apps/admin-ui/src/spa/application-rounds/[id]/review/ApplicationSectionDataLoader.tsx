import React from "react";
import { gql } from "@apollo/client";
import { ApplicationSectionOrderSet, useApplicationSectionsQuery } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE, VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { errorToast } from "common/src/common/toast";
import { More } from "@/component/More";
import { useSort } from "@/hooks/useSort";
import { ApplicationSectionsTable, SORT_KEYS } from "./ApplicationSectionsTable";
import { useGetFilterSearchParams } from "./utils";
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
      orderBy: transformOrderBy(orderBy),
      textSearch: textFilter,
      unit: unitFilter,
      unitGroup: unitGroupFilter,
      reservationUnit: reservationUnitFilter,
      applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
      status: sectionStatusFilter,
      applicantType: applicantTypeFilter,
    },
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
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

  const applicationSections = filterNonNullable(dataToUse?.applicationSections?.edges?.map((edge) => edge?.node));
  const totalCount = dataToUse?.applicationSections?.totalCount ?? 0;

  return (
    <>
      <span>
        <b>
          {totalCount} {t("ApplicationRound.applicationEventCount")}
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
      return desc
        ? [ApplicationSectionOrderSet.ApplicantDesc]
        : [ApplicationSectionOrderSet.ApplicantAsc];
    case "application_id,pk":
    case "application_id,-pk":
      return desc
        ? [ApplicationSectionOrderSet.ApplicationDesc, ApplicationSectionOrderSet.PkDesc]
        : [ApplicationSectionOrderSet.ApplicationAsc, ApplicationSectionOrderSet.PkAsc];
    default:
      return [];
  }
}

/// NOTE might have some cache issues (because it collides with the other sections query)
export const APPLICATION_SECTIONS_QUERY = gql`
  query ApplicationSections(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice!]!
    $status: [ApplicationSectionStatusChoice!]
    $unit: [Int!]
    $unitGroup: [Int!]
    $applicantType: [ReserveeType!]
    $preferredOrder: PreferredOrderFilterInput
    $textSearch: String
    $priority: [Priority!]
    $purpose: [Int!]
    $reservationUnit: [Int!]
    $ageGroup: [Int!]
    $municipality: [MunicipalityChoice!]
    $orderBy: [ApplicationSectionOrderSet!]
    $first: Int
    $after: String
  ) {
    applicationSections(
filter: {
      applicationRound: $applicationRound
      applicationStatus: $applicationStatus
      status: $status
      unit: $unit
      unitGroup: $unitGroup
      applicantType: $applicantType
      preferredOrder: $preferredOrder
      textSearch: $textSearch
      priority: $priority
      purpose: $purpose
      reservationUnit: $reservationUnit
      ageGroup: $ageGroup
      municipality: $municipality
}
      orderBy: $orderBy
      first: $first
      after: $after
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
