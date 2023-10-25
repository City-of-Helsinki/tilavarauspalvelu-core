import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import {
  type ApplicationRoundNode,
  type ApplicationNode,
  type Query,
  type QueryApplicationsArgs,
} from "common/types/gql-types";
import { LIST_PAGE_SIZE } from "@/common/const";
import { combineResults } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import Loader from "@/component/Loader";
import { More } from "@/component/lists/More";
import { APPLICATIONS_QUERY } from "./queries";
import { FilterArguments } from "./Filters";
import ApplicationsTable from "./ApplicationsTable";

export type Sort = {
  field: string;
  sort: boolean;
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

  return combineResults(previousResult, fetchMoreResult, "applications");
};

type Props = {
  applicationRound: ApplicationRoundNode;
  filters: FilterArguments;
  sort?: Sort;
  sortChanged: (field: string) => void;
};

const ApplicationDataLoader = ({
  applicationRound,
  filters,
  sort,
  sortChanged: onSortChanged,
}: Props): JSX.Element => {
  const { notifyError } = useNotification();

  let sortString = "";
  if (sort) {
    sortString = (sort?.sort ? "" : "-") + sort.field;
  }

  const { fetchMore, loading, data } = useQuery<Query, QueryApplicationsArgs>(
    APPLICATIONS_QUERY,
    {
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
    }
  );

  if (loading) {
    return <Loader />;
  }

  const applications = (data?.applications?.edges || [])
    .map((edge) => edge?.node)
    .filter((node): node is ApplicationNode => node != null);

  return (
    <>
      <ApplicationsTable
        applications={applications}
        sort={sort}
        sortChanged={onSortChanged}
      />
      <More
        key={applications.length}
        totalCount={data?.applications?.totalCount || 0}
        count={applications.length}
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.applications?.edges.length,
            },
            updateQuery,
          })
        }
      />
    </>
  );
};

export default ApplicationDataLoader;
