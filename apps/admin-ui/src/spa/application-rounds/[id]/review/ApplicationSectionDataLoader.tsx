import React from "react";
import { gql } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import { ApplicationSectionOrderingChoices, useApplicationSectionsQuery } from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE, VALID_ALLOCATION_APPLICATION_STATUSES } from "@/common/const";
import { errorToast } from "common/src/common/toast";
import { More } from "@/component/More";
import { useSort } from "@/hooks/useSort";
import { ApplicationSectionsTable, SORT_KEYS } from "./ApplicationSectionsTable";
import { transformApplicantType, transformApplicationSectionStatus } from "./utils";
import { CenterSpinner } from "common/styled";

type Props = {
  applicationRoundPk: number;
};

export function ApplicationSectionDataLoader({ applicationRoundPk }: Props): JSX.Element {
  const { t } = useTranslation();
  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);
  const [searchParams] = useSearchParams();
  const unitFilter = searchParams.getAll("unit");
  const applicantFilter = searchParams.getAll("applicant");
  const nameFilter = searchParams.get("search");
  const eventStatusFilter = searchParams.getAll("eventStatus");

  const query = useApplicationSectionsQuery({
    skip: !applicationRoundPk,
    variables: {
      first: LIST_PAGE_SIZE,
      unit: unitFilter.map(Number).filter(Number.isFinite),
      applicationRound: applicationRoundPk,
      applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
      status: transformApplicationSectionStatus(eventStatusFilter),
      applicantType: transformApplicantType(applicantFilter),
      textSearch: nameFilter,
      orderBy: transformOrderBy(orderBy),
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

  const applicationSections = filterNonNullable(dataToUse?.applicationSections?.edges.map((edge) => edge?.node));
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

function transformOrderBy(orderBy: string | null): ApplicationSectionOrderingChoices[] {
  if (orderBy == null) {
    return [];
  }
  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  switch (rest) {
    case "nameFi":
      return desc ? [ApplicationSectionOrderingChoices.NameDesc] : [ApplicationSectionOrderingChoices.NameAsc];
    case "preferredUnitNameFi":
      return desc
        ? [ApplicationSectionOrderingChoices.PreferredUnitNameFiDesc]
        : [ApplicationSectionOrderingChoices.PreferredUnitNameFiAsc];
    case "status":
      return desc ? [ApplicationSectionOrderingChoices.StatusDesc] : [ApplicationSectionOrderingChoices.StatusAsc];
    case "applicant":
      return desc
        ? [ApplicationSectionOrderingChoices.ApplicantDesc]
        : [ApplicationSectionOrderingChoices.ApplicantAsc];
    case "application_id,pk":
    case "application_id,-pk":
      return desc
        ? [ApplicationSectionOrderingChoices.ApplicationPkDesc, ApplicationSectionOrderingChoices.PkDesc]
        : [ApplicationSectionOrderingChoices.ApplicationPkAsc, ApplicationSectionOrderingChoices.PkAsc];
    default:
      return [];
  }
}

/// NOTE might have some cache issues (because it collides with the other sections query)
export const APPLICATION_SECTIONS_QUERY = gql`
  query ApplicationSections(
    $applicationRound: Int!
    $applicationStatus: [ApplicationStatusChoice]!
    $status: [ApplicationSectionStatusChoice]
    $unit: [Int]
    $applicantType: [ReserveeType]
    $preferredOrder: [Int]
    $textSearch: String
    $priority: [Priority]
    $purpose: [Int]
    $reservationUnit: [Int]
    $ageGroup: [Int]
    $municipality: [MunicipalityChoice]
    $includePreferredOrder10OrHigher: Boolean
    $orderBy: [ApplicationSectionOrderingChoices]
    $first: Int
    $after: String
  ) {
    applicationSections(
      applicationRound: $applicationRound
      applicationStatus: $applicationStatus
      status: $status
      unit: $unit
      applicantType: $applicantType
      preferredOrder: $preferredOrder
      textSearch: $textSearch
      priority: $priority
      purpose: $purpose
      reservationUnit: $reservationUnit
      ageGroup: $ageGroup
      municipality: $municipality
      includePreferredOrder10OrHigher: $includePreferredOrder10OrHigher
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
