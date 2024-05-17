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
import { FilterArguments } from "./Filters";

type Props = {
  filters: FilterArguments;
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

export function ReservationUnitsDataReader({ filters }: Props): JSX.Element {
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
  const { fetchMore, loading, data, previousData } =
    useSearchReservationUnitsQuery({
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

  const { reservationUnits } = data ?? previousData ?? {};
  const resUnits = filterNonNullable(
    reservationUnits?.edges.map((edge) => edge?.node)
  );

  if (loading && resUnits.length === 0) {
    return <Loader />;
  }

  const offset = data?.reservationUnits?.edges.length;
  return (
    <>
      <ReservationUnitsTable
        reservationUnits={resUnits}
        sort={sort}
        sortChanged={onSortChanged}
        isLoading={loading}
      />
      <More
        key={resUnits.length}
        totalCount={data?.reservationUnits?.totalCount ?? 0}
        count={resUnits.length}
        fetchMore={() => fetchMore({ variables: { offset } })}
      />
    </>
  );
}
