import { errorToast } from "common/src/common/toast";
import { useSort } from "@/hooks/useSort";
import { RejectedOccurrencesTable, SORT_KEYS } from "./RejectedOccurrencesTable";
import { type ApolloError, gql } from "@apollo/client";
import { RejectedOccurrenceOrderingChoices, useRejectedOccurrencesQuery } from "@gql/gql-types";
import { More } from "@/component/More";
import React from "react";
import { filterNonNullable } from "common/src/helpers";
import { getPermissionErrors } from "common/src/apolloUtils";
import { useTranslation } from "next-i18next";
import { useGetFilterSearchParams } from "./utils";
import { LIST_PAGE_SIZE } from "@/common/const";
import { CenterSpinner } from "common/styled";

type Props = {
  applicationRoundPk: number;
  unitOptions: { nameFi: string; pk: number }[];
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
      orderBy: transformOrderBy(orderBy),
      textSearch: textFilter,
      unit: unitFilter,
      unitGroup: unitGroupFilter,
      reservationUnit: reservationUnitFilter,
    },
    onError: (err: ApolloError) => {
      const permErrors = getPermissionErrors(err);
      if (permErrors.length > 0) {
        errorToast({ text: t("errors.noPermission") });
      } else {
        errorToast({ text: t("errors.errorFetchingData") });
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
          {totalCount} {t("ApplicationRound.rejectedOccurrencesCount")}
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
