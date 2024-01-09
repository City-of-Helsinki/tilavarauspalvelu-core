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
  const appEventStatusFilter = searchParams.getAll("event_status");

  const aesFilter = transformApplicationEventStatus(appEventStatusFilter);
  const POSSIBLE_EVENT_STATUSES = [
    ApplicationEventStatusChoice.Approved,
    ApplicationEventStatusChoice.Declined,
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
      allocatedUnit: unitFilter.map(Number),
      applicationRound: applicationRoundPk,
      applicantType: transformApplicantType(applicantFilter),
      applicationEventStatus:
        filteredAes.length === 0 ? POSSIBLE_EVENT_STATUSES : filteredAes,
      textSearch: nameFilter,
      offset: 0,
      first: LIST_PAGE_SIZE,
      // orderBy: sortString,
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
    fetchPolicy: "cache-and-network",
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

  const count = data?.applicationEventSchedules?.totalCount ?? 0;
  return (
    <>
      <span>
        <b>
          {count} {t("ApplicationRound.applicationEventCount")}
        </b>
      </span>
      <AllocatedEventsTable
        schedules={aes}
        sort={sort}
        sortChanged={handleSortChanged}
      />
      <More
        key={aes.length}
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
