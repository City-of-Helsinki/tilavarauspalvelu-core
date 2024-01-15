import React from "react";
import { type ApolloError, useQuery } from "@apollo/client";
import type { Query, QueryReservationUnitsArgs } from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { SEARCH_RESERVATION_UNITS_QUERY } from "./queries";
import { FilterArguments } from "./Filters";
import { useNotification } from "../../context/NotificationContext";
import Loader from "../Loader";
import ReservationUnitsTable from "./ReservationUnitsTable";
import { More } from "../lists/More";
import { LARGE_LIST_PAGE_SIZE } from "../../common/const";
import { combineResults } from "../../common/util";

export type Sort = {
  field: string;
  sort: boolean;
};

type Props = {
  filters: FilterArguments;
  sort?: Sort;
  sortChanged: (field: string) => void;
};

const mapFilterParams = ({
  reservationUnitStates,
  ...params
}: FilterArguments) => ({
  ...params,
  maxPersonsLte: params.maxPersonsLte,
  maxPersonsGte: params.maxPersonsGte,
  surfaceAreaLte: params.surfaceAreaLte,
  surfaceAreaGte: params.surfaceAreaGte,
  unit: params.unit.map((u) => u.value).map(Number),
  state: reservationUnitStates.map((u) => u.value).map(String),
  reservationUnitType: params.reservationUnitType
    .map((u) => u.value)
    .map(Number),
});

const updateQuery = (
  previousResult: Query,
  { fetchMoreResult }: { fetchMoreResult: Query }
): Query => {
  if (!fetchMoreResult) {
    return previousResult;
  }

  return combineResults(previousResult, fetchMoreResult, "reservationUnits");
};

const ReservationUnitsDataReader = ({
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
    QueryReservationUnitsArgs
  >(SEARCH_RESERVATION_UNITS_QUERY, {
    variables: {
      orderBy: sortString,
      first: LARGE_LIST_PAGE_SIZE,
      ...mapFilterParams(filters),
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
    fetchPolicy: "cache-and-network",
  });

  if (loading) {
    return <Loader />;
  }

  const reservationUnits = filterNonNullable(
    data?.reservationUnits?.edges.map((edge) => edge?.node)
  );

  return (
    <>
      <ReservationUnitsTable
        reservationUnits={reservationUnits}
        sort={sort}
        sortChanged={onSortChanged}
      />
      <More
        key={reservationUnits.length}
        totalCount={data?.reservationUnits?.totalCount || 0}
        count={reservationUnits.length}
        fetchMore={() =>
          fetchMore({
            variables: {
              offset: data?.reservationUnits?.edges.length,
            },
            updateQuery,
          })
        }
      />
    </>
  );
};

export default ReservationUnitsDataReader;
