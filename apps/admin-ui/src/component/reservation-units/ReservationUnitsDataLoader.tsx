import React, { useState } from "react";
import { type ApolloError } from "@apollo/client";
import {
  ReservationUnitOrderingChoices,
  useSearchReservationUnitsQuery,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { LARGE_LIST_PAGE_SIZE } from "@/common/const";
import { useNotification } from "@/context/NotificationContext";
import Loader from "@/component/Loader";
import { More } from "@/component/More";
import { ReservationUnitsTable } from "./ReservationUnitsTable";
import { useSearchParams } from "react-router-dom";

function transformOrderBy(
  orderBy: string,
  desc: boolean
): ReservationUnitOrderingChoices | null {
  switch (orderBy) {
    case "nameFi":
      return desc
        ? ReservationUnitOrderingChoices.NameFiDesc
        : ReservationUnitOrderingChoices.NameFiAsc;
    case "unitNameFi":
      return desc
        ? ReservationUnitOrderingChoices.UnitNameFiDesc
        : ReservationUnitOrderingChoices.UnitNameFiAsc;
    case "typeFi":
      return desc
        ? ReservationUnitOrderingChoices.TypeFiDesc
        : ReservationUnitOrderingChoices.TypeFiAsc;
    case "maxPersons":
      return desc
        ? ReservationUnitOrderingChoices.MaxPersonsDesc
        : ReservationUnitOrderingChoices.MaxPersonsAsc;
    case "surfaceArea":
      return desc
        ? ReservationUnitOrderingChoices.SurfaceAreaDesc
        : ReservationUnitOrderingChoices.SurfaceAreaAsc;
    default:
      return null;
  }
}

function transformSortString(
  orderBy: string | null
): ReservationUnitOrderingChoices[] {
  if (!orderBy) {
    return [];
  }

  const desc = orderBy.startsWith("-");
  const rest = desc ? orderBy.slice(1) : orderBy;
  const transformed = transformOrderBy(rest, desc);
  if (transformed) {
    return [transformed];
  }

  return [];
}

export function ReservationUnitsDataReader(): JSX.Element {
  const { notifyError } = useNotification();

  const [sort, setSort] = useState<string>("");
  const onSortChanged = (sortField: string) => {
    if (sort === sortField) {
      setSort(`-${sortField}`);
    } else {
      setSort(sortField);
    }
  };

  const orderBy = transformSortString(sort);

  const [searchParams] = useSearchParams();
  const reservationUnitTypes = searchParams
    .getAll("reservationUnitType")
    .map(Number)
    .filter(Number.isInteger);

  const reservationUnitStates = searchParams
    .getAll("reservationUnitStates")
    .map(Number)
    .filter(Number.isInteger);

  const unit = searchParams.getAll("unit").map(Number).filter(Number.isInteger);

  const searchFilter = searchParams.get("search");
  const maxPersonsLte = searchParams.get("maxPersonsLte");
  const maxPersonsGte = searchParams.get("maxPersonsGte");
  const surfaceAreaLte = searchParams.get("surfaceAreaLte");
  const surfaceAreaGte = searchParams.get("surfaceAreaGte");

  const query = useSearchReservationUnitsQuery({
    variables: {
      orderBy,
      first: LARGE_LIST_PAGE_SIZE,
      maxPersonsLte,
      maxPersonsGte,
      surfaceAreaLte,
      surfaceAreaGte,
      nameFi: searchFilter,
      unit,
      state: reservationUnitStates.map(String),
      reservationUnitType: reservationUnitTypes,
    },
    onError: (err: ApolloError) => {
      notifyError(err.message);
    },
    fetchPolicy: "cache-and-network",
    // TODO enable or no?
    nextFetchPolicy: "cache-first",
  });
  const { fetchMore, loading, data, previousData } = query;

  const { reservationUnits } = data ?? previousData ?? {};
  const resUnits = filterNonNullable(
    reservationUnits?.edges.map((edge) => edge?.node)
  );

  if (loading && resUnits.length === 0) {
    return <Loader />;
  }

  return (
    <>
      <ReservationUnitsTable
        reservationUnits={resUnits}
        sort={sort}
        sortChanged={onSortChanged}
        isLoading={loading}
      />
      <More
        totalCount={data?.reservationUnits?.totalCount ?? 0}
        pageInfo={data?.reservationUnits?.pageInfo}
        count={resUnits.length}
        fetchMore={(after) => fetchMore({ variables: { after } })}
      />
    </>
  );
}
