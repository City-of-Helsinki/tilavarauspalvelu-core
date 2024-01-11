import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import {
  ApplicationEventStatusChoice,
  type Query,
  type QueryApplicationEventSchedulesArgs,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { combineResults } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import { APPLICATIONS_EVENTS_SCHEDULE_QUERY } from "./queries";
import Loader from "@/component/Loader";
import { More } from "@/component/lists/More";
import { useTranslation } from "react-i18next";
import {
  transformApplicantType,
  transformApplicationEventStatus,
} from "./utils";
import { useSearchParams } from "react-router-dom";
import { AllocatedEventsTable } from "./AllocatedEventsTable";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  applicationRoundPk: number;
};

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "applicationEvents");
};

export function AllocatedEventDataLoader({
  applicationRoundPk,
}: Props): JSX.Element {
  const { notifyError } = useNotification();

  const [searchParams] = useSearchParams();
  const unitFilter = searchParams.getAll("unit");
  const applicantFilter = searchParams.getAll("applicant");
  const nameFilter = searchParams.get("name");
  const appEventStatusFilter = searchParams.getAll("eventStatus");
  const weekDayFilter = searchParams.getAll("weekday");
  const reservationUnitFilter = searchParams.getAll("reservationUnit");

  const aesFilter = transformApplicationEventStatus(appEventStatusFilter);
  // Unallocated should be never shown in this table
  const POSSIBLE_EVENT_STATUSES = [
    ApplicationEventStatusChoice.Approved,
    ApplicationEventStatusChoice.Declined,
    ApplicationEventStatusChoice.Failed,
    ApplicationEventStatusChoice.Reserved,
  ];
  const filteredAes = POSSIBLE_EVENT_STATUSES.filter(
    (s) => aesFilter.filter((aes) => aes === s).length > 0
  );
  const { fetchMore, loading, data } = useQuery<
    Query,
    QueryApplicationEventSchedulesArgs
  >(APPLICATIONS_EVENTS_SCHEDULE_QUERY, {
    skip: !applicationRoundPk,
    variables: {
      allocatedUnit: unitFilter.map(Number).filter(Number.isFinite),
      applicationRound: applicationRoundPk,
      applicantType: transformApplicantType(applicantFilter),
      applicationEventStatus:
        filteredAes.length === 0 ? POSSIBLE_EVENT_STATUSES : filteredAes,
      allocatedDay: weekDayFilter
        .map(Number)
        .filter(Number.isFinite)
        .filter((n) => n >= 0 && n <= 6),
      allocatedReservationUnit: reservationUnitFilter
        .map(Number)
        .filter(Number.isFinite),
      textSearch: nameFilter,
      offset: 0,
      first: LIST_PAGE_SIZE,
      // orderBy: sortString,
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
    // TODO cache-and-network doesn't work because it appends the network-results on top of the cache
    // need to add custom caching merge with uniq before changing this
    fetchPolicy: "network-only",
  });

  const { t } = useTranslation();

  if (loading) {
    return <Loader />;
  }

  // eventSchedule returns based on if the event is allocated or not
  // so there are schedules that are not allocated but the event itself is allocated
  // requires new backend filter to remove the array.filter
  const aeSchedules = filterNonNullable(
    data?.applicationEventSchedules?.edges.map((edge) => edge?.node)
  ).filter((aes) => aes.allocatedDay != null || aes.declined);
  // TODO totalCount is not correct because of frontend filtering
  const totalCount = data?.applicationEventSchedules?.totalCount ?? 0;

  const sort = undefined;
  const handleSortChanged = (field: string) => {
    // eslint-disable-next-line no-console
    console.warn("TODO: handleSortChanged", field);
  };

  return (
    <>
      <span>
        <b>
          {totalCount} {t("ApplicationRound.applicationEventCount")}
        </b>
      </span>
      <AllocatedEventsTable
        schedules={aeSchedules}
        sort={sort}
        sortChanged={handleSortChanged}
      />
      <More
        // TODO why does this need a key?
        // key={aeSchedules.length}
        totalCount={totalCount}
        count={aeSchedules.length}
        // TODO this throws
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.applicationEventSchedules?.edges.length ?? 0,
            },
            updateQuery,
          })
        }
      />
    </>
  );
}
