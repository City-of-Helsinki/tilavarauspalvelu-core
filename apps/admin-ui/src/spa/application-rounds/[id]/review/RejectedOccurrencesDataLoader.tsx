import { errorToast } from "common/src/common/toast";
import { useSort } from "@/hooks/useSort";
import {
  RejectedOccurrencesTable,
  SORT_KEYS,
} from "./RejectedOccurrencesTable";
import { useSearchParams } from "react-router-dom";
import { type ApolloError, gql } from "@apollo/client";
import {
  RejectedOccurrenceOrderingChoices,
  useRejectedOccurrencesQuery,
} from "@gql/gql-types";
import { More } from "@/component/More";
import React from "react";
import { filterNonNullable } from "common/src/helpers";
import { getPermissionErrors } from "common/src/apolloUtils";
import { useTranslation } from "next-i18next";
import { getFilteredUnits } from "./utils";
import { LIST_PAGE_SIZE } from "@/common/const";
import { CenterSpinner } from "common/styles/util";

type Props = {
  applicationRoundPk: number;
  unitOptions: { nameFi: string; pk: number }[];
};

function RejectedOccurrencesDataLoader({
  applicationRoundPk,
  unitOptions,
}: Props): JSX.Element {
  const { t } = useTranslation();

  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);
  const [searchParams] = useSearchParams();
  const unitFilter = searchParams.getAll("unit");
  const reservationUnitFilter = searchParams.getAll("reservationUnit");
  const nameFilter = searchParams.get("search");

  const { data, previousData, loading, fetchMore } =
    useRejectedOccurrencesQuery({
      variables: {
        first: LIST_PAGE_SIZE,
        applicationRound: applicationRoundPk,
        unit: getFilteredUnits(unitFilter, unitOptions),
        reservationUnit: reservationUnitFilter
          .map(Number)
          .filter(Number.isFinite),
        orderBy: transformOrderBy(orderBy),
        textSearch: nameFilter,
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

  const totalCount = dataToUse?.rejectedOccurrences?.edges.length ?? 0;
  const rejectedOccurrences = filterNonNullable(
    dataToUse?.rejectedOccurrences?.edges.map((edge) => edge?.node)
  );

  return (
    <>
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

function transformOrderBy(
  orderBy: string | null
): RejectedOccurrenceOrderingChoices[] {
  if (orderBy == null) {
    return [];
  }
  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  switch (rest) {
    case "application_id,application_event_id":
    case "application_id,-application_event_id":
      return desc
        ? [
            RejectedOccurrenceOrderingChoices.ApplicationPkDesc,
            RejectedOccurrenceOrderingChoices.PkDesc,
          ]
        : [
            RejectedOccurrenceOrderingChoices.ApplicationPkAsc,
            RejectedOccurrenceOrderingChoices.PkAsc,
          ];
    case "applicant":
      return desc
        ? [RejectedOccurrenceOrderingChoices.ApplicantDesc]
        : [RejectedOccurrenceOrderingChoices.ApplicantAsc];
    case "rejected_event_name_fi":
      return desc
        ? [RejectedOccurrenceOrderingChoices.ApplicationSectionNameDesc]
        : [RejectedOccurrenceOrderingChoices.ApplicationSectionNameAsc];
    case "rejected_unit_name_fi":
      return desc
        ? [RejectedOccurrenceOrderingChoices.UnitNameDesc]
        : [RejectedOccurrenceOrderingChoices.UnitNameAsc];
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

export default RejectedOccurrencesDataLoader;

export const REJECTED_OCCURRENCES_QUERY = gql`
  query RejectedOccurrences(
    $applicationRound: Int
    $unit: [Int]
    $reservationUnit: [Int]
    $orderBy: [RejectedOccurrenceOrderingChoices]
    $textSearch: String
    $after: String
    $first: Int
  ) {
    rejectedOccurrences(
      applicationRound: $applicationRound
      unit: $unit
      reservationUnit: $reservationUnit
      orderBy: $orderBy
      textSearch: $textSearch
      after: $after
      first: $first
    ) {
      pageInfo {
        hasNextPage
        endCursor
      }
      edges {
        node {
          id
          pk
          beginDatetime
          endDatetime
          rejectionReason
          recurringReservation {
            id
            allocatedTimeSlot {
              id
              pk
              dayOfTheWeek
              beginTime
              endTime
              reservationUnitOption {
                id
                applicationSection {
                  id
                  name
                  application {
                    id
                    pk
                    applicantType
                    contactPerson {
                      id
                      firstName
                      lastName
                    }
                    organisation {
                      id
                      nameFi
                    }
                  }
                }
                reservationUnit {
                  id
                  nameFi
                  pk
                  unit {
                    id
                    nameFi
                  }
                }
              }
            }
            reservations {
              id
              pk
            }
          }
        }
      }
    }
  }
`;
