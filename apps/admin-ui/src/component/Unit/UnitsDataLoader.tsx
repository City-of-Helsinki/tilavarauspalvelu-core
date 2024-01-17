import React from "react";
import { type ApolloError, useQuery } from "@apollo/client";
import type { Query, QueryUnitsArgs } from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { useNotification } from "@/context/NotificationContext";
import { LARGE_LIST_PAGE_SIZE } from "@/common/const";
import { combineResults } from "@/common/util";
import { More } from "@/component/More";
import { FilterArguments } from "./Filters";
import Loader from "../Loader";
import UnitsTable from "./UnitsTable";
import { UNITS_QUERY } from "./queries";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  filters: FilterArguments;
  sort?: Sort;
  onSortChanged: (field: string) => void;
  isMyUnits?: boolean;
};

const mapFilterParams = (params: FilterArguments) => ({
  nameFi: params.nameFi,
  serviceSector:
    params.serviceSector?.value != null
      ? String(params.serviceSector?.value)
      : undefined,
});

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "units");
};

const UnitsDataLoader = ({
  filters,
  sort,
  onSortChanged,
  isMyUnits,
}: Props): JSX.Element => {
  const { notifyError } = useNotification();

  let sortString;
  if (sort) {
    sortString = (sort?.sort ? "" : "-") + sort.field;
  }

  const { fetchMore, loading, data } = useQuery<Query, QueryUnitsArgs>(
    UNITS_QUERY,
    {
      variables: {
        orderBy: sortString,
        offset: 0,
        first: LARGE_LIST_PAGE_SIZE,
        ...mapFilterParams(filters),
      },
      onError: (err: ApolloError) => {
        notifyError(err.message);
      },
      fetchPolicy: "cache-and-network",
    }
  );

  if (loading && !data) {
    return <Loader />;
  }

  const units = filterNonNullable(
    data?.units?.edges?.map((edge) => edge?.node)
  );

  return (
    <>
      <UnitsTable
        units={units}
        sort={sort}
        sortChanged={onSortChanged}
        isMyUnits={isMyUnits}
      />
      <More
        key={units.length}
        totalCount={data?.units?.totalCount || 0}
        count={units.length}
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.units?.edges.length || 0,
            },
            updateQuery,
          })
        }
      />
    </>
  );
};

export default UnitsDataLoader;
