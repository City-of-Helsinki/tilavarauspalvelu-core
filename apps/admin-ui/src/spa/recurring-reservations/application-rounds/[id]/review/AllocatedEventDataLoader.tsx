import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import type { Query, QueryApplicationEventSchedulesArgs } from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { LIST_PAGE_SIZE } from "@/common/const";
import { combineResults } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import { APPLICATIONS_EVENTS_SCHEDULE_QUERY } from "./queries";
import Loader from "@/component/Loader";
import { More } from "@/component/lists/More";
import { useTranslation } from "react-i18next";
import { transformApplicantType } from "./utils";
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

const AllocatedEventDataLoader = ({
  applicationRoundPk,
}: Props): JSX.Element => {
  const { notifyError } = useNotification();

  const [searchParams] = useSearchParams();
  const unitFilter = searchParams.getAll("unit");
  const applicantFilter = searchParams.getAll("applicant");
  const nameFilter = searchParams.get("name");

  const { fetchMore, loading, data } = useQuery<
    Query,
    QueryApplicationEventSchedulesArgs
  >(APPLICATIONS_EVENTS_SCHEDULE_QUERY, {
    skip: !applicationRoundPk,
    variables: {
      allocatedUnit: unitFilter.map(Number),
      applicationRound: applicationRoundPk,
      // TODO there is no applicationStatus filter
      // applicationStatus: VALID_ALLOCATED_APPLICATION_STATUSES,
      // applicationStatus: transformApplicationStatuses(statusFilter),
      applicantType: transformApplicantType(applicantFilter),
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

  // FIXME this includes unallocated events (it should not)
  // can we backend filter the unallocated events out of the result?
  const aes = filterNonNullable(
    data?.applicationEventSchedules?.edges.map((edge) => edge?.node)
  );
  const totalCount = data?.applicationEventSchedules?.totalCount ?? 0;

  // TODO
  const sort = undefined;
  const handleSortChanged = (field: string) => {
    console.warn("TODO: handleSortChanged", field);
  };

  return (
    <>
      <span><b>{data?.applicationEvents?.totalCount} {t("ApplicationRound.applicationEventCount")}</b></span>
      {/* TODO ScheduleTable */}
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
};

export default AllocatedEventDataLoader;
