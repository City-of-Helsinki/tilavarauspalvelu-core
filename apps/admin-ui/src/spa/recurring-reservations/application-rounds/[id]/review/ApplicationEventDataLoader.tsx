import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import { useSearchParams } from "react-router-dom";
import {
  type Query,
  type QueryApplicationEventsArgs,
} from "common/types/gql-types";
import { useTranslation } from "next-i18next";
import { filterNonNullable } from "common/src/helpers";
import {
  LIST_PAGE_SIZE,
  VALID_ALLOCATION_APPLICATION_STATUSES,
} from "@/common/const";
import { useNotification } from "@/context/NotificationContext";
import Loader from "@/component/Loader";
import { More } from "@/component/lists/More";
import { useSort } from "@/hooks/useSort";
import { APPLICATIONS_EVENTS_QUERY } from "./queries";
import { ApplicationEventsTable, SORT_KEYS } from "./ApplicationEventsTable";
import {
  transformApplicantType,
  transformApplicationEventStatus,
} from "./utils";

type Props = {
  applicationRoundPk: number;
};

export function ApplicationEventDataLoader({
  applicationRoundPk,
}: Props): JSX.Element {
  const { notifyError } = useNotification();

  const [orderBy, handleSortChanged] = useSort(SORT_KEYS);
  const [searchParams] = useSearchParams();
  const unitFilter = searchParams.getAll("unit");
  const applicantFilter = searchParams.getAll("applicant");
  const nameFilter = searchParams.get("name");
  const eventStatusFilter = searchParams.getAll("eventStatus");

  const { fetchMore, previousData, loading, data } = useQuery<
    Query,
    QueryApplicationEventsArgs
  >(APPLICATIONS_EVENTS_QUERY, {
    skip: !applicationRoundPk,
    variables: {
      offset: 0,
      first: LIST_PAGE_SIZE,
      unit: unitFilter.map(Number).filter(Number.isFinite),
      applicationRound: applicationRoundPk,
      applicationStatus: VALID_ALLOCATION_APPLICATION_STATUSES,
      status: transformApplicationEventStatus(eventStatusFilter),
      applicantType: transformApplicantType(applicantFilter),
      textSearch: nameFilter,
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

  const applicationEvents = filterNonNullable(
    dataToUse?.applicationEvents?.edges.map((edge) => edge?.node)
  );
  const totalCount = dataToUse?.applicationEvents?.totalCount ?? 0;

  // TODO add subtle loading indicator when using the previousData
  // something that doesn't cause Page Layout changes e.g. overlay on top of the table
  return (
    <>
      <span>
        <b>
          {totalCount} {t("ApplicationRound.applicationEventCount")}
        </b>
      </span>
      <ApplicationEventsTable
        applicationEvents={applicationEvents}
        sort={orderBy}
        sortChanged={handleSortChanged}
      />
      <More
        totalCount={totalCount}
        count={applicationEvents.length}
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.applicationEvents?.edges.length,
            },
          })
        }
      />
    </>
  );
}
