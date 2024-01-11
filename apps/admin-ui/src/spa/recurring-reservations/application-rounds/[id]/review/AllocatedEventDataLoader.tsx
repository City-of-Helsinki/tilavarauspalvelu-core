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
  // accepted and declined are mutually exclusive
  const onlyAccepted =
    aesFilter.length === 1 &&
    aesFilter[0] === ApplicationEventStatusChoice.Approved;
  const onlyDeclined =
    aesFilter.length === 1 &&
    aesFilter[0] === ApplicationEventStatusChoice.Declined;

  const { fetchMore, loading, data } = useQuery<
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

  const aes = filterNonNullable(
    data?.applicationEventSchedules?.edges.map((edge) => edge?.node)
  );

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
        schedules={aes}
        sort={sort}
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
            updateQuery,
          })
        }
      />
    </>
  );
}
