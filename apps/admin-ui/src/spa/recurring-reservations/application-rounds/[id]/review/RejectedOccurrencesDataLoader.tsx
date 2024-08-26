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
import Loader from "@/component/Loader";
import { filterNonNullable } from "common/src/helpers";

type Props = {
  applicationRoundPk: number;
};

function RejectedOccurrencesDataLoader({
  applicationRoundPk,
}: Props): JSX.Element {
  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);
  const [searchParams] = useSearchParams();
  const unitFilter = searchParams.getAll("unit");
  const reservationUnitFilter = searchParams.getAll("reservationUnit");
  const nameFilter = searchParams.get("search");

  const { data, previousData, loading, fetchMore } =
    useRejectedOccurrencesQuery({
      variables: {
        applicationRound: applicationRoundPk,
        unit: unitFilter.map(Number).filter(Number.isFinite),
        reservationUnit: reservationUnitFilter
          .map(Number)
          .filter(Number.isFinite),
        orderBy: transformOrderBy(orderBy),
        textSearch: nameFilter,
      },
      onError: (err: ApolloError) => {
        errorToast({ text: err.message });
      },
      fetchPolicy: "cache-and-network",
      // TODO enable or no?
      nextFetchPolicy: "cache-first",
    });

  const dataToUse = data ?? previousData;

  if (loading && !dataToUse) {
    return <Loader />;
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
    case "rejected_reservation_unit_name_fi":
      return desc
        ? [RejectedOccurrenceOrderingChoices.ReservationUnitPkDesc]
        : [RejectedOccurrenceOrderingChoices.ReservationUnitPkAsc];
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
