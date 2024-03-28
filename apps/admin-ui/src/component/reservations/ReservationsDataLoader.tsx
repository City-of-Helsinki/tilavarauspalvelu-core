import React from "react";
import { ApolloError, useQuery } from "@apollo/client";
import { values } from "lodash";
import { Query, QueryReservationsArgs } from "common/types/gql-types";
import { More } from "@/component/More";
import { LIST_PAGE_SIZE } from "@/common/const";
import { useNotification } from "@/context/NotificationContext";
import Loader from "../Loader";
import { FilterArguments } from "./Filters";
import { RESERVATIONS_QUERY } from "./queries";
import ReservationsTable from "./ReservationsTable";
import { fromUIDate, toApiDate } from "common/src/common/util";
import { filterNonNullable } from "common/src/helpers";

export type Sort = {
  field: string;
  asc: boolean;
};

type Props = {
  filters: FilterArguments;
  sort?: Sort;
  sortChanged: (field: string) => void;
  defaultFiltering: QueryReservationsArgs;
};

const mapFilterParams = (
  params: FilterArguments,
  defaultParams: QueryReservationsArgs
): QueryReservationsArgs => {
  const emptySearch =
    values(params).filter((v) => !(v === "" || v.length === 0)).length === 0;

  // only use defaults if search is "empty"
  const defaults = emptySearch ? defaultParams : {};

  const states = filterNonNullable(
    params.reservationState.map((ru) => ru.value?.toString())
  );
  const state = states.length > 0 ? states : defaults.state;

  const begin = fromUIDate(params.begin);
  const end = fromUIDate(params.end);
  const beginDate = begin ? toApiDate(begin) : defaults.beginDate;
  const endDate = end ? toApiDate(end) : defaults.endDate;

  return {
    unit: params.unit?.map((u) => u.value as string),
    reservationUnitType: filterNonNullable(
      params.reservationUnitType?.map((u) => u.value?.toString())
    ),
    reservationUnit: filterNonNullable(
      params.reservationUnit?.map((ru) => ru.value?.toString())
    ),
    state,
    textSearch: params.textSearch || undefined,
    beginDate,
    endDate,
    priceGte: params.minPrice !== "" ? params.minPrice : undefined,
    priceLte: params.maxPrice !== "" ? params.maxPrice : undefined,
    orderStatus: filterNonNullable(
      params.paymentStatuses?.map((status) => status.value?.toString())
    ),
  };
};

const useReservations = (
  filters: FilterArguments,
  defaultFiltering: QueryReservationsArgs,
  _sort?: Sort
) => {
  const { notifyError } = useNotification();

  /*
  let sortString;
  if (sort) {
    if (sort.field === "begin") {
      if (sort.asc) {
        sortString = "begin,end";
      } else {
        sortString = "-begin,-end";
      }
    } else {
      sortString = `${(sort?.asc ? "" : "-") + sort.field},begin,end`;
    }
  } else {
    sortString = "state";
  }
  */

  const { fetchMore, loading, data, previousData } = useQuery<
    Query,
    QueryReservationsArgs
  >(RESERVATIONS_QUERY, {
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    variables: {
      // FIXME
      // orderBy: sortString,
      first: LIST_PAGE_SIZE,
      ...mapFilterParams(filters, defaultFiltering),
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
  });

  const currData = data ?? previousData;
  const reservations = filterNonNullable(
    currData?.reservations?.edges.map((edge) => edge?.node)
  );

  return {
    fetchMore,
    loading,
    data: reservations,
    totalCount: data?.reservations?.totalCount,
    offset: data?.reservations?.edges?.length,
  };
};

const ReservationsDataLoader = ({
  filters,
  sort,
  sortChanged: onSortChanged,
  defaultFiltering,
}: Props): JSX.Element => {
  const { fetchMore, loading, data, totalCount, offset } = useReservations(
    filters,
    defaultFiltering,
    sort
  );

  if (loading && data.length === 0) {
    return <Loader />;
  }

  return (
    <>
      <ReservationsTable
        reservations={data}
        sort={sort}
        sortChanged={onSortChanged}
        isLoading={loading}
      />
      <More
        totalCount={totalCount ?? 0}
        count={data.length}
        fetchMore={() => fetchMore({ variables: { offset } })}
      />
    </>
  );
};

export default ReservationsDataLoader;
