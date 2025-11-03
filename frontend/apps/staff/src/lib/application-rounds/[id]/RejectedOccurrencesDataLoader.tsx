import React from "react";
import { type ApolloError, gql } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { errorToast } from "ui/src/components/toast";
import { getPermissionErrors } from "ui/src/modules/apolloUtils";
import { filterEmptyArray, filterNonNullable } from "ui/src/modules/helpers";
import { CenterSpinner } from "ui/src/styled";
import { More } from "@/components/More";
import { useGetFilterSearchParams } from "@/hooks";
import { useSort } from "@/hooks/useSort";
import { LIST_PAGE_SIZE } from "@/modules/const";
import { RejectedOccurrenceOrderingChoices, useRejectedOccurrencesQuery } from "@gql/gql-types";
import { RejectedOccurrencesTable, SORT_KEYS } from "./RejectedOccurrencesTable";

type Props = {
  applicationRoundPk: number;
  unitOptions: { label: string; value: number }[];
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
  const rejectedOccurrences = filterNonNullable(dataToUse?.rejectedOccurrences?.edges.map((edge) => edge?.node));

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

function transformOrderBy(orderBy: string | null): RejectedOccurrenceOrderingChoices[] {
  if (orderBy == null) {
    return [];
  }
  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  switch (rest) {
    case "application_id,application_section_id":
    case "application_id,-application_section_id":
      return desc
        ? [RejectedOccurrenceOrderingChoices.ApplicationPkDesc, RejectedOccurrenceOrderingChoices.PkDesc]
        : [RejectedOccurrenceOrderingChoices.ApplicationPkAsc, RejectedOccurrenceOrderingChoices.PkAsc];
    case "applicant":
      return desc
        ? [RejectedOccurrenceOrderingChoices.ApplicantDesc]
        : [RejectedOccurrenceOrderingChoices.ApplicantAsc];
    case "rejected_event_name_fi":
      return desc
        ? [RejectedOccurrenceOrderingChoices.ApplicationSectionNameDesc]
        : [RejectedOccurrenceOrderingChoices.ApplicationSectionNameAsc];
    case "rejected_unit_name_fi":
      return desc ? [RejectedOccurrenceOrderingChoices.UnitNameDesc] : [RejectedOccurrenceOrderingChoices.UnitNameAsc];
    case "rejected_reservation_unit_name_fi":
      return desc
        ? [RejectedOccurrenceOrderingChoices.ReservationUnitNameDesc]
        : [RejectedOccurrenceOrderingChoices.ReservationUnitNameAsc];
    case "time_of_occurrence":
      return desc
        ? [RejectedOccurrenceOrderingChoices.BeginDatetimeDesc]
        : [RejectedOccurrenceOrderingChoices.BeginDatetimeAsc];
    case "rejection_reason":
      return desc
        ? [RejectedOccurrenceOrderingChoices.RejectionReasonDesc]
        : [RejectedOccurrenceOrderingChoices.RejectionReasonAsc];
    default:
      return [];
  }
}

export const REJECTED_OCCURRENCES_QUERY = gql`
  query RejectedOccurrences(
    $applicationRound: Int
    $unit: [Int]
    $unitGroup: [Int]
    $reservationUnit: [Int]
    $orderBy: [RejectedOccurrenceOrderingChoices]
    $textSearch: String
    $after: String
    $first: Int
  ) {
    rejectedOccurrences(
      applicationRound: $applicationRound
      unit: $unit
      unitGroup: $unitGroup
      reservationUnit: $reservationUnit
      orderBy: $orderBy
      textSearch: $textSearch
      after: $after
      first: $first
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
