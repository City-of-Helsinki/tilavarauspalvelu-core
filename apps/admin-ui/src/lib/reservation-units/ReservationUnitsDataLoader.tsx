import type { SelectedRow } from "@/lib/reservation-units";
import React, { type Dispatch, type SetStateAction, useState } from "react";
import { gql } from "@apollo/client";
import { ReservationUnitOrderSet, useSearchReservationUnitsQuery } from "@gql/gql-types";
import { filterEmptyArray, filterNonNullable } from "common/src/helpers";
import { LARGE_LIST_PAGE_SIZE } from "@/common/const";
import { More } from "@/component/More";
import { ReservationUnitsTable } from "./ReservationUnitsTable";
import { errorToast } from "common/src/components/toast";
import { CenterSpinner } from "common/styled";
import { useTranslation } from "next-i18next";
import { useGetFilterSearchParams } from "@/hooks";

type Props = {
  selectedRows: SelectedRow[];
  setSelectedRows: Dispatch<SetStateAction<SelectedRow[]>>;
  apiBaseUrl: string;
};

function transformOrderBy(orderBy: string, desc: boolean): ReservationUnitOrderSet | null {
  switch (orderBy) {
    case "nameFi":
      return desc ? ReservationUnitOrderSet.NameFiDesc : ReservationUnitOrderSet.NameFiAsc;
    case "unitNameFi":
      return desc ? ReservationUnitOrderSet.UnitNameFiDesc : ReservationUnitOrderSet.UnitNameFiAsc;
    case "typeFi":
      return desc ? ReservationUnitOrderSet.TypeFiDesc : ReservationUnitOrderSet.TypeFiAsc;
    case "maxPersons":
      return desc ? ReservationUnitOrderSet.MaxPersonsDesc : ReservationUnitOrderSet.MaxPersonsAsc;
    case "surfaceArea":
      return desc ? ReservationUnitOrderSet.SurfaceAreaDesc : ReservationUnitOrderSet.SurfaceAreaAsc;
    default:
      return null;
  }
}

function transformSortString(orderBy: string | null): ReservationUnitOrderSet[] {
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

export function ReservationUnitsDataReader({ selectedRows, setSelectedRows, apiBaseUrl }: Props): JSX.Element {
  const [sort, setSort] = useState<string>("");
  const onSortChanged = (sortField: string) => {
    if (sort === sortField) {
      setSort(`-${sortField}`);
    } else {
      setSort(sortField);
    }
  };

  const orderBy = filterEmptyArray(transformSortString(sort));

  const {
    unitFilter,
    unitGroupFilter,
    reservationUnitTypeFilter,
    reservationUnitStateFilter,
    textFilter,
    maxPersonsLteFilter,
    maxPersonsGteFilter,
    surfaceAreaGteFilter,
    surfaceAreaLteFilter,
  } = useGetFilterSearchParams();

  const { t } = useTranslation();

  const query = useSearchReservationUnitsQuery({
    variables: {
      orderBy,
      first: LARGE_LIST_PAGE_SIZE,
      maxPersonsLte: maxPersonsLteFilter,
      maxPersonsGte: maxPersonsGteFilter,
      surfaceAreaLte: surfaceAreaLteFilter,
      surfaceAreaGte: surfaceAreaGteFilter,
      textSearch: textFilter,
      unit: unitFilter,
      unitGroup: unitGroupFilter,
      publishingState: reservationUnitStateFilter,
      reservationUnitType: reservationUnitTypeFilter,
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
  const resUnits = filterNonNullable(reservationUnits?.edges?.map((edge) => edge?.node));

  if (loading && resUnits.length === 0) {
    return <CenterSpinner />;
  }

  return (
    <>
      <ReservationUnitsTable
        reservationUnits={resUnits}
        sort={sort}
        sortChanged={onSortChanged}
        isLoading={loading}
        selectedRows={selectedRows}
        setSelectedRows={setSelectedRows}
        apiBaseUrl={apiBaseUrl}
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

export const SEARCH_RESERVATION_UNITS_QUERY = gql`
  query SearchReservationUnits(
    $first: Int
    $after: String
    $orderBy: [ReservationUnitOrderSet!]
    # Filter
    $maxPersonsGte: Int
    $maxPersonsLte: Int
    $publishingState: [ReservationUnitPublishingState!]
    $reservationUnitType: [Int!]
    $surfaceAreaGte: Int
    $surfaceAreaLte: Int
    $textSearch: String
    $unit: [Int!]
    $unitGroup: [Int!]
  ) {
    reservationUnits(
      first: $first
      after: $after
      orderBy: $orderBy
      filter: {
        maxPersonsGte: $maxPersonsGte
        maxPersonsLte: $maxPersonsLte
        minPersonsGte: $maxPersonsGte
        minPersonsLte: $maxPersonsLte
        onlyWithManagePermission: true
        publishingState: $publishingState
        reservationUnitType: $reservationUnitType
        surfaceAreaGte: $surfaceAreaGte
        surfaceAreaLte: $surfaceAreaLte
        textSearch: $textSearch
        unit: $unit
        unitGroup: $unitGroup
      }
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
