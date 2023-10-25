import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import type {
  ApplicationEventNode,
  ApplicationRoundNode,
  Query,
  QueryApplicationEventsArgs,
} from "common/types/gql-types";
import { LIST_PAGE_SIZE } from "@/common/const";
import { combineResults } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import { APPLICATIONS_EVENTS_QUERY } from "./queries";
import { FilterArguments } from "./Filters";
import Loader from "../../Loader";
import { More } from "../../lists/More";
import ApplicationEventsTable from "./ApplicationEventsTable";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  applicationRound: ApplicationRoundNode;
  filters: FilterArguments;
  sort?: Sort;
  sortChanged: (field: string) => void;
};

const mapFilterParams = (params: FilterArguments) => ({
  ...params,
  unit: params.unit?.map((u) => u.value as string).map(Number),
});

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "applicationEvents");
};

const ApplicationEventDataLoader = ({
  applicationRound,
  filters,
  sort,
  sortChanged: onSortChanged,
}: Props): JSX.Element => {
  const { notifyError } = useNotification();

  let sortString;
  if (sort) {
    sortString = (sort?.sort ? "" : "-") + sort.field;
  }

  const { fetchMore, loading, data } = useQuery<
    Query,
    QueryApplicationEventsArgs
  >(APPLICATIONS_EVENTS_QUERY, {
    skip: !applicationRound.pk,
    variables: {
      ...mapFilterParams(filters),
      applicationRound: applicationRound.pk ?? 0,
      offset: 0,
      first: LIST_PAGE_SIZE,
      orderBy: sortString,
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return <Loader />;
  }

  const applicationEvents =
    data?.applicationEvents?.edges
      .map((edge) => edge?.node)
      .filter((n): n is ApplicationEventNode => n != null) ?? [];

  return (
    <>
      <ApplicationEventsTable
        applicationEvents={applicationEvents}
        sort={sort}
        sortChanged={onSortChanged}
      />
      <More
        key={applicationEvents.length}
        totalCount={data?.applicationEvents?.totalCount || 0}
        count={applicationEvents.length}
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.applicationEvents?.edges.length,
            },
            updateQuery,
          })
        }
      />
    </>
  );
};

export default ApplicationEventDataLoader;
