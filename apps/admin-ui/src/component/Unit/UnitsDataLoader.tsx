import React, { useState } from "react";
import { type ApolloError, useQuery } from "@apollo/client";
import {
  type Query,
  type QueryUnitsArgs,
  UnitOrderingChoices,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { useNotification } from "@/context/NotificationContext";
import { LARGE_LIST_PAGE_SIZE } from "@/common/const";
import { combineResults } from "@/common/util";
import { More } from "@/component/More";
import { FilterArguments } from "./Filters";
import Loader from "../Loader";
import { UnitsTable } from "./UnitsTable";
import { UNITS_QUERY } from "./queries";

type Props = {
  filters: FilterArguments;
  isMyUnits?: boolean;
};

const mapFilterParams = (params: FilterArguments) => ({
  nameFi: params.nameFi,
});

function updateQuery(
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "units");
}

export function UnitsDataLoader({ filters, isMyUnits }: Props): JSX.Element {
  const { notifyError } = useNotification();

  const [sort, setSort] = useState<string>("nameFi");
  const handleSortChanged = (sortField: string) => {
    if (sort === sortField) {
      setSort(`-${sortField}`);
    } else {
      setSort(sortField);
    }
  };

  const orderBy = transformSortString(sort);

  const { fetchMore, loading, data, previousData } = useQuery<
    Query,
    QueryUnitsArgs
  >(UNITS_QUERY, {
    variables: {
      orderBy,
      first: LARGE_LIST_PAGE_SIZE,
      ...mapFilterParams(filters),
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
    fetchPolicy: "cache-and-network",
  });

  const { units } = data ?? previousData ?? {};
  const unitsArr = filterNonNullable(units?.edges?.map((e) => e?.node));

  if (loading && unitsArr.length === 0) {
    return <Loader />;
  }

  const offset = data?.units?.edges.length;

  return (
    <>
      <UnitsTable
        units={unitsArr}
        sort={sort}
        sortChanged={handleSortChanged}
        isMyUnits={isMyUnits}
        isLoading={loading}
      />
      <More
        totalCount={data?.units?.totalCount ?? 0}
        count={unitsArr.length}
        fetchMore={() =>
          fetchMore({
            variables: { offset },
            updateQuery,
          })
        }
      />
    </>
  );
}

function transformSortString(orderBy: string | null): UnitOrderingChoices[] {
  if (!orderBy) {
    return [];
  }
  switch (orderBy) {
    case "nameFi":
      return [UnitOrderingChoices.NameFiAsc];
    case "-nameFi":
      return [UnitOrderingChoices.NameFiDesc];
    default:
      return [];
  }
}
