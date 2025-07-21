import React from "react";
import { type ApolloError, gql } from "@apollo/client";
import {
  AllocatedTimeSlotOrderingChoices,
  ApplicationSectionStatusChoice,
  useAllocatedTimeSlotsQuery,
} from "@gql/gql-types";
import { useTranslation } from "next-i18next";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { errorToast } from "common/src/common/toast";
import { More } from "@/component/More";
import { useSort } from "@/hooks/useSort";
import { useGetFilterSearchParams } from "./utils";
import { AllocatedSectionsTable, SORT_KEYS } from "./AllocatedSectionsTable";
import { getPermissionErrors } from "common/src/apolloUtils";
import { CenterSpinner } from "common/styled";

type Props = {
  applicationRoundPk: number;
  unitOptions: { label: string; value: number }[];
};

export function TimeSlotDataLoader({ unitOptions, applicationRoundPk }: Props): JSX.Element {
  const { t } = useTranslation();

  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);

  const {
    textFilter,
    unitFilter,
    unitGroupFilter,
    reservationUnitFilter,
    applicantTypeFilter,
    accessCodeStateFilter,
    weekDayFilter,
  } = useGetFilterSearchParams({ unitOptions: unitOptions });

  const query = useAllocatedTimeSlotsQuery({
    skip: !applicationRoundPk,
    variables: {
      first: LIST_PAGE_SIZE,
      applicationRound: applicationRoundPk,
      orderBy: transformOrderBy(orderBy),
      textSearch: textFilter,
      allocatedUnit: unitFilter,
      unitGroup: unitGroupFilter,
      allocatedReservationUnit: reservationUnitFilter,
      applicantType: applicantTypeFilter,
      applicationSectionStatus: [ApplicationSectionStatusChoice.Handled, ApplicationSectionStatusChoice.InAllocation],
      accessCodeState: accessCodeStateFilter,
      dayOfTheWeek: weekDayFilter,
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

  const { fetchMore, previousData, loading, data } = query;

  const dataToUse = data ?? previousData;
  if (loading && !dataToUse) {
    return <CenterSpinner />;
  }

  const totalCount = dataToUse?.allocatedTimeSlots?.totalCount ?? 0;
  const aes = filterNonNullable(dataToUse?.allocatedTimeSlots?.edges.map((edge) => edge?.node));

  return (
    <>
      <span>
        <b>
          {totalCount} {t("applicationRound:applicationEventCount")}
        </b>
      </span>
      <AllocatedSectionsTable schedules={aes} sort={orderBy} sortChanged={handleSortChanged} isLoading={loading} />
      <More
        totalCount={totalCount}
        count={aes.length}
        pageInfo={dataToUse?.allocatedTimeSlots?.pageInfo}
        fetchMore={(after) => fetchMore({ variables: { after } })}
      />
    </>
  );
}

function transformOrderBy(orderBy: string | null): AllocatedTimeSlotOrderingChoices[] {
  if (orderBy == null) {
    return [];
  }
  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  switch (rest) {
    case "allocated_reservation_unit_name_fi":
      return desc
        ? [AllocatedTimeSlotOrderingChoices.AllocatedReservationUnitNameFiDesc]
        : [AllocatedTimeSlotOrderingChoices.AllocatedReservationUnitNameFiAsc];
    case "allocated_unit_name_fi":
      return desc
        ? [AllocatedTimeSlotOrderingChoices.AllocatedUnitNameFiDesc]
        : [AllocatedTimeSlotOrderingChoices.AllocatedUnitNameFiAsc];
    case "application_event_name_fi":
      return desc
        ? [AllocatedTimeSlotOrderingChoices.ApplicationSectionNameDesc]
        : [AllocatedTimeSlotOrderingChoices.ApplicationSectionNameAsc];
    case "applicant":
      return desc ? [AllocatedTimeSlotOrderingChoices.ApplicantDesc] : [AllocatedTimeSlotOrderingChoices.ApplicantAsc];
    case "application_id,application_section_id":
    case "application_id,-application_section_id":
      return desc
        ? [
            AllocatedTimeSlotOrderingChoices.ApplicationPkDesc,
            AllocatedTimeSlotOrderingChoices.ApplicationSectionPkDesc,
          ]
        : [AllocatedTimeSlotOrderingChoices.ApplicationPkAsc, AllocatedTimeSlotOrderingChoices.ApplicationSectionPkAsc];
    case "allocated_time_of_week":
      return desc
        ? [AllocatedTimeSlotOrderingChoices.AllocatedTimeOfWeekDesc]
        : [AllocatedTimeSlotOrderingChoices.AllocatedTimeOfWeekAsc];
    default:
      return [];
  }
}

export const ALLOCATED_TIME_SLOTS_QUERY = gql`
  query AllocatedTimeSlots(
    $applicationRound: Int!
    $allocatedUnit: [Int]
    $unitGroup: [Int]
    $applicantType: [ReserveeType]
    $applicationSectionStatus: [ApplicationSectionStatusChoice]
    $allocatedReservationUnit: [Int]
    $dayOfTheWeek: [Weekday]
    $textSearch: String
    $accessCodeState: [AccessCodeState]
    $orderBy: [AllocatedTimeSlotOrderingChoices]
    $after: String
    $first: Int
  ) {
    allocatedTimeSlots(
      after: $after
      first: $first
      applicationRound: $applicationRound
      allocatedUnit: $allocatedUnit
      unitGroup: $unitGroup
      applicantType: $applicantType
      applicationSectionStatus: $applicationSectionStatus
      allocatedReservationUnit: $allocatedReservationUnit
      accessCodeState: $accessCodeState
      dayOfTheWeek: $dayOfTheWeek
      textSearch: $textSearch
      orderBy: $orderBy
    ) {
      edges {
        node {
          ...AllocatedSectionsTableElement
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
