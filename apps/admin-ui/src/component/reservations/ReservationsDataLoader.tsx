import React, { useState } from "react";
import { type ApolloError } from "@apollo/client";
import { values } from "lodash";
import {
  type QueryReservationsArgs,
  ReservationOrderingChoices,
  useReservationsQuery,
} from "@gql/gql-types";
import { More } from "@/component/More";
import { LIST_PAGE_SIZE } from "@/common/const";
import { useNotification } from "@/context/NotificationContext";
import Loader from "../Loader";
import { FilterArguments } from "./Filters";
import { ReservationsTable } from "./ReservationsTable";
import { fromUIDate, toApiDate } from "common/src/common/util";
import { filterNonNullable } from "common/src/helpers";

type Props = {
  filters: FilterArguments;
  defaultFiltering: QueryReservationsArgs;
};

function mapFilterParams(
  params: FilterArguments,
  defaultParams: QueryReservationsArgs
): QueryReservationsArgs {
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
    unit: filterNonNullable(params.unit?.map((u) => u.value?.toString())),
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
}

function useReservations(
  filters: FilterArguments,
  defaultFiltering: QueryReservationsArgs,
  sort: string
) {
  const { notifyError } = useNotification();

  const orderBy = transformSortString(sort);
  const { fetchMore, loading, data, previousData } = useReservationsQuery({
    fetchPolicy: "cache-and-network",
    nextFetchPolicy: "cache-first",
    errorPolicy: "all",
    variables: {
      orderBy,
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
}

export function ReservationsDataLoader({
  filters,
  defaultFiltering,
}: Props): JSX.Element {
  const [sort, setSort] = useState<string>("-state");
  const onSortChanged = (sortField: string) => {
    if (sort === sortField) {
      setSort(`-${sortField}`);
    } else {
      setSort(sortField);
    }
  };

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
}

function transformOrderBy(
  orderBy: string,
  desc: boolean
): ReservationOrderingChoices | null {
  switch (orderBy) {
    case "pk":
      return desc
        ? ReservationOrderingChoices.PkDesc
        : ReservationOrderingChoices.PkAsc;
    case "begin":
      return desc
        ? ReservationOrderingChoices.BeginDesc
        : ReservationOrderingChoices.BeginAsc;
    case "end":
      return desc
        ? ReservationOrderingChoices.EndDesc
        : ReservationOrderingChoices.EndAsc;
    case "created_at":
      return desc
        ? ReservationOrderingChoices.CreatedAtDesc
        : ReservationOrderingChoices.CreatedAtAsc;
    case "reservee_name":
      return desc
        ? ReservationOrderingChoices.ReserveeNameDesc
        : ReservationOrderingChoices.ReserveeNameAsc;
    case "reservation_unit_name_fi":
      return desc
        ? ReservationOrderingChoices.ReservationUnitNameFiDesc
        : ReservationOrderingChoices.ReservationUnitNameFiAsc;
    case "unit_name_fi":
      return desc
        ? ReservationOrderingChoices.UnitNameFiDesc
        : ReservationOrderingChoices.UnitNameFiAsc;
    // NOTE inconsistent naming
    case "orderStatus":
      return desc
        ? ReservationOrderingChoices.OrderStatusDesc
        : ReservationOrderingChoices.OrderStatusAsc;
    case "state":
      return desc
        ? ReservationOrderingChoices.StateDesc
        : ReservationOrderingChoices.StateAsc;
    default:
      return null;
  }
}

function transformSortString(
  orderBy: string | null
): ReservationOrderingChoices[] {
  const defaultSort = [
    ReservationOrderingChoices.StateDesc,
    ReservationOrderingChoices.BeginAsc,
    ReservationOrderingChoices.EndAsc,
  ];
  if (!orderBy) {
    return defaultSort;
  }

  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  const transformed = transformOrderBy(rest, desc);
  if (transformed == null) {
    return defaultSort;
  }

  if (transformed === ReservationOrderingChoices.BeginAsc) {
    return [transformed, ReservationOrderingChoices.EndAsc];
  }
  if (transformed === ReservationOrderingChoices.BeginDesc) {
    return [transformed, ReservationOrderingChoices.EndDesc];
  }
  return [
    transformed,
    ReservationOrderingChoices.BeginAsc,
    ReservationOrderingChoices.EndAsc,
  ];
}
