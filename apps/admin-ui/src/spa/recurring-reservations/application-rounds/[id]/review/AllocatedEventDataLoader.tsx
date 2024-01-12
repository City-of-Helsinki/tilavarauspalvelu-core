import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import {
  ApplicationEventStatusChoice,
  type Query,
  type QueryApplicationEventSchedulesArgs,
} from "common/types/gql-types";
import { useTranslation } from "next-i18next";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { useNotification } from "@/context/NotificationContext";
import { APPLICATIONS_EVENTS_SCHEDULE_QUERY } from "./queries";
import Loader from "@/component/Loader";
import { More } from "@/component/lists/More";
import { useSort } from "@/hooks/useSort";
import {
  transformApplicantType,
  transformApplicationEventStatus,
} from "./utils";
import { useSearchParams } from "react-router-dom";
import { AllocatedEventsTable, SORT_KEYS } from "./AllocatedEventsTable";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  applicationRoundPk: number;
};

export function AllocatedEventDataLoader({
  applicationRoundPk,
}: Props): JSX.Element {
  const { notifyError } = useNotification();
  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);

  const [searchParams] = useSearchParams();
  const unitFilter = searchParams.getAll("unit");
  const applicantFilter = searchParams.getAll("applicant");
  const nameFilter = searchParams.get("name");
  const appEventStatusFilter = searchParams.getAll("eventStatus");
  const weekDayFilter = searchParams.getAll("weekday");
  const reservationUnitFilter = searchParams.getAll("reservationUnit");

  const aesFilter = transformApplicationEventStatus(appEventStatusFilter);
  // accepted and declined are mutually exclusive
  const onlyAccepted =
    aesFilter.length === 1 &&
    aesFilter[0] === ApplicationEventStatusChoice.Approved;
  const onlyDeclined =
    aesFilter.length === 1 &&
    aesFilter[0] === ApplicationEventStatusChoice.Declined;

  const { fetchMore, previousData, loading, data } = useQuery<
    Query,
    QueryApplicationEventSchedulesArgs
  >(APPLICATIONS_EVENTS_SCHEDULE_QUERY, {
    skip: !applicationRoundPk,
    variables: {
      allocatedUnit: unitFilter.map(Number).filter(Number.isFinite),
      applicationRound: applicationRoundPk,
      applicantType: transformApplicantType(applicantFilter),
      allocatedDay: weekDayFilter
        .map(Number)
        .filter(Number.isFinite)
        .filter((n) => n >= 0 && n <= 6),
      allocatedReservationUnit: reservationUnitFilter
        .map(Number)
        .filter(Number.isFinite),
      unallocated: false,
      accepted: onlyAccepted ? true : undefined,
      declined: onlyDeclined ? true : undefined,
      textSearch: nameFilter,
      offset: 0,
      first: LIST_PAGE_SIZE,
      orderBy,
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
  });

  const { t } = useTranslation();

  const dataToUse = data ?? previousData;
  if (loading && !dataToUse) {
    return <Loader />;
  }

  const totalCount = dataToUse?.applicationEventSchedules?.totalCount ?? 0;
  const aes = filterNonNullable(
    dataToUse?.applicationEventSchedules?.edges.map((edge) => edge?.node)
  );

  // TODO add subtle loading indicator when using the previousData
  // something that doesn't cause Page Layout changes e.g. overlay on top of the table
  return (
    <>
      <span>
        <b>
          {totalCount} {t("ApplicationRound.applicationEventCount")}
        </b>
      </span>
      <AllocatedEventsTable
        schedules={aes}
        sort={orderBy}
        sortChanged={handleSortChanged}
      />
      <More
        totalCount={totalCount}
        count={aes.length}
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.applicationEventSchedules?.edges.length ?? 0,
            },
          })
        }
      />
    </>
  );
}
