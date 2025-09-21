import { errorToast } from "common/src/components/toast";
import { useSort } from "@/hooks/useSort";
import { RejectedOccurrencesTable, SORT_KEYS } from "./RejectedOccurrencesTable";
import { gql } from "@apollo/client";
import type { ApolloError } from "@apollo/client";
import { RejectedOccurrenceOrderSet, useRejectedOccurrencesQuery } from "@gql/gql-types";
import { More } from "@/component/More";
import React from "react";
import { filterEmptyArray, filterNonNullable } from "common/src/helpers";
import { getPermissionErrors } from "common/src/apolloUtils";
import { useTranslation } from "next-i18next";
import { useGetFilterSearchParams } from "@/hooks";
import { LIST_PAGE_SIZE } from "@/common/const";
import { CenterSpinner } from "common/styled";

type Props = {
  applicationRoundPk: number;
  unitOptions: Array<{ label: string; value: number }>;
};

export function RejectedOccurrencesDataLoader({ applicationRoundPk, unitOptions }: Props): JSX.Element {
  const { t } = useTranslation();

  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);

  const { textFilter, unitFilter, unitGroupFilter, reservationUnitFilter } = useGetFilterSearchParams({
    unitOptions: unitOptions,
  });

  const { data, previousData, loading, fetchMore } = useRejectedOccurrencesQuery({
    variables: {
      first: LIST_PAGE_SIZE,
      applicationRound: applicationRoundPk,
      orderBy: filterEmptyArray(transformOrderBy(orderBy)),
      textSearch: textFilter,
      unit: unitFilter,
      unitGroup: unitGroupFilter,
      reservationUnit: reservationUnitFilter,
    },
    onError: (err: ApolloError) => {
      const permErrors = getPermissionErrors(err);
      if (permErrors.length > 0) {
        errorToast({ text: t("errors:noPermission") });
      } else {
        errorToast({ text: t("errors:errorFetchingData") });
      }
    },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const dataToUse = data ?? previousData;
  if (loading && !dataToUse) {
    return <CenterSpinner />;
  }

  const totalCount = dataToUse?.rejectedOccurrences?.totalCount ?? 0;
  const rejectedOccurrences = filterNonNullable(dataToUse?.rejectedOccurrences?.edges?.map((edge) => edge?.node));

  return (
    <>
      <span>
        <b>
          {totalCount} {t("applicationRound:rejectedOccurrencesCount")}
        </b>
      </span>
      <RejectedOccurrencesTable
        rejectedOccurrences={rejectedOccurrences}
        isLoading={loading}
        sort={orderBy}
        sortChanged={handleSortChanged}
      />
      <More
        totalCount={totalCount}
        count={rejectedOccurrences.length}
        pageInfo={dataToUse?.rejectedOccurrences?.pageInfo}
        fetchMore={(after) => fetchMore({ variables: { after } })}
      />
    </>
  );
}

function transformOrderBy(orderBy: string | null): RejectedOccurrenceOrderSet[] {
  if (orderBy == null) {
    return [];
  }
  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  switch (rest) {
    case "application_id,application_section_id":
    case "application_id,-application_section_id":
      return desc
        ? [RejectedOccurrenceOrderSet.ApplicationPkDesc, RejectedOccurrenceOrderSet.PkDesc]
        : [RejectedOccurrenceOrderSet.ApplicationPkAsc, RejectedOccurrenceOrderSet.PkAsc];
    case "applicant":
      return desc ? [RejectedOccurrenceOrderSet.ApplicantDesc] : [RejectedOccurrenceOrderSet.ApplicantAsc];
    case "rejected_event_name_fi":
      return desc
        ? [RejectedOccurrenceOrderSet.ApplicationSectionNameDesc]
        : [RejectedOccurrenceOrderSet.ApplicationSectionNameAsc];
    case "rejected_unit_name_fi":
      return desc ? [RejectedOccurrenceOrderSet.UnitNameDesc] : [RejectedOccurrenceOrderSet.UnitNameAsc];
    case "rejected_reservation_unit_name_fi":
      return desc
        ? [RejectedOccurrenceOrderSet.ReservationUnitNameDesc]
        : [RejectedOccurrenceOrderSet.ReservationUnitNameAsc];
    case "time_of_occurrence":
      return desc ? [RejectedOccurrenceOrderSet.BeginDatetimeDesc] : [RejectedOccurrenceOrderSet.BeginDatetimeAsc];
    case "rejection_reason":
      return desc ? [RejectedOccurrenceOrderSet.RejectionReasonDesc] : [RejectedOccurrenceOrderSet.RejectionReasonAsc];
    default:
      return [];
  }
}

export const REJECTED_OCCURRENCES_QUERY = gql`
  query RejectedOccurrences(
    $first: Int
    $after: String
    $orderBy: [RejectedOccurrenceOrderSet!]
    # Filter
    $applicationRound: Int!
    $reservationUnit: [Int!]
    $textSearch: String
    $unit: [Int!]
    $unitGroup: [Int!]
  ) {
    rejectedOccurrences(
      first: $first
      after: $after
      orderBy: $orderBy
      filter: {
        applicationRound: $applicationRound
        reservationUnit: $reservationUnit
        textSearch: $textSearch
        unit: $unit
        unitGroup: $unitGroup
      }
    ) {
      totalCount
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          ...RejectedOccurrencesTableElement
        }
      }
    }
  }
`;
