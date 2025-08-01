import React, { useState } from "react";
import { gql } from "@apollo/client";
import { ReservationUnitOrderingChoices, useSearchReservationUnitsQuery } from "@gql/gql-types";
import { filterNonNullable, mapParamToInterger, toInteger } from "common/src/helpers";
import { LARGE_LIST_PAGE_SIZE } from "@/common/const";
import { More } from "@/component/More";
import { ReservationUnitsTable } from "./ReservationUnitsTable";
import { errorToast } from "common/src/components/toast";
import { CenterSpinner } from "common/styled";
import { useTranslation } from "next-i18next";
import { useSearchParams } from "next/navigation";
import { transformReservationUnitState } from "common/src/conversion";

function transformOrderBy(orderBy: string, desc: boolean): ReservationUnitOrderingChoices | null {
  switch (orderBy) {
    case "nameFi":
      return desc ? ReservationUnitOrderingChoices.NameFiDesc : ReservationUnitOrderingChoices.NameFiAsc;
    case "unitNameFi":
      return desc ? ReservationUnitOrderingChoices.UnitNameFiDesc : ReservationUnitOrderingChoices.UnitNameFiAsc;
    case "typeFi":
      return desc ? ReservationUnitOrderingChoices.TypeFiDesc : ReservationUnitOrderingChoices.TypeFiAsc;
    case "maxPersons":
      return desc ? ReservationUnitOrderingChoices.MaxPersonsDesc : ReservationUnitOrderingChoices.MaxPersonsAsc;
    case "surfaceArea":
      return desc ? ReservationUnitOrderingChoices.SurfaceAreaDesc : ReservationUnitOrderingChoices.SurfaceAreaAsc;
    default:
      return null;
  }
}

function transformSortString(orderBy: string | null): ReservationUnitOrderingChoices[] {
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
  const [sort, setSort] = useState<string>("");
  const onSortChanged = (sortField: string) => {
    if (sort === sortField) {
      setSort(`-${sortField}`);
    } else {
      setSort(sortField);
    }
  };

  const orderBy = transformSortString(sort);

  const searchParams = useSearchParams();
  const reservationUnitTypes = searchParams.getAll("reservationUnitType").map(Number).filter(Number.isInteger);

  const reservationUnitStates = searchParams.getAll("reservationUnitState");

  const unit = mapParamToInterger(searchParams.getAll("unit"), 1);
  const unitGroupFilter = mapParamToInterger(searchParams.getAll("unitGroup"), 1);

  const searchFilter = searchParams.get("search");
  // backend error if these are floats
  // could show validation errors for these but since it's not that important just clip the values to integers
  const maxPersonsLte = toInteger(searchParams.get("maxPersonsLte"));
  const maxPersonsGte = toInteger(searchParams.get("maxPersonsGte"));
  const surfaceAreaLte = toInteger(searchParams.get("surfaceAreaLte"));
  const surfaceAreaGte = toInteger(searchParams.get("surfaceAreaGte"));

  const { t } = useTranslation();

  const query = useSearchReservationUnitsQuery({
    variables: {
      orderBy,
      first: LARGE_LIST_PAGE_SIZE,
      maxPersonsLte: maxPersonsLte,
      maxPersonsGte: maxPersonsGte,
      surfaceAreaLte: surfaceAreaLte,
      surfaceAreaGte: surfaceAreaGte,
      textSearch: searchFilter,
      unit,
      unitGroup: unitGroupFilter,
      publishingState: reservationUnitStates.map((state) => transformReservationUnitState(state)),
      reservationUnitType: reservationUnitTypes,
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
    fetchPolicy: "cache-and-network",
    // TODO enable or no?
    nextFetchPolicy: "cache-first",
  });
  const { fetchMore, loading, data, previousData } = query;

  const { reservationUnits } = data ?? previousData ?? {};
  const resUnits = filterNonNullable(reservationUnits?.edges.map((edge) => edge?.node));

  if (loading && resUnits.length === 0) {
    return <CenterSpinner />;
  }

  return (
    <>
      <ReservationUnitsTable reservationUnits={resUnits} sort={sort} sortChanged={onSortChanged} isLoading={loading} />
      <More
        totalCount={data?.reservationUnits?.totalCount ?? 0}
        pageInfo={data?.reservationUnits?.pageInfo}
        count={resUnits.length}
        fetchMore={(after) => fetchMore({ variables: { after } })}
      />
    </>
  );
}

export const SEARCH_RESERVATION_UNITS_QUERY = gql`
  query SearchReservationUnits(
    $after: String
    $first: Int
    $textSearch: String
    $maxPersonsGte: Int
    $maxPersonsLte: Int
    $surfaceAreaGte: Int
    $surfaceAreaLte: Int
    $unit: [Int]
    $unitGroup: [Int]
    $reservationUnitType: [Int]
    $orderBy: [ReservationUnitOrderingChoices]
    $publishingState: [ReservationUnitPublishingState]
  ) {
    reservationUnits(
      first: $first
      after: $after
      orderBy: $orderBy
      textSearch: $textSearch
      maxPersonsGte: $maxPersonsGte
      minPersonsGte: $maxPersonsGte
      maxPersonsLte: $maxPersonsLte
      minPersonsLte: $maxPersonsLte
      surfaceAreaGte: $surfaceAreaGte
      surfaceAreaLte: $surfaceAreaLte
      unit: $unit
      unitGroup: $unitGroup
      reservationUnitType: $reservationUnitType
      publishingState: $publishingState
      onlyWithPermission: true
    ) {
      edges {
        node {
          ...ReservationUnitTableElement
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
      totalCount
    }
  }
`;
