import React, { type Dispatch, type SetStateAction, useState } from "react";
import type { SelectedRow } from "@/lib/reservation-units";
import { gql } from "@apollo/client";
import { ReservationUnitOrderingChoices, useSearchReservationUnitsQuery } from "@gql/gql-types";
import { filterEmptyArray, filterNonNullable } from "common/src/modules/helpers";
import { LARGE_LIST_PAGE_SIZE } from "@/modules/const";
import { More } from "@/components/More";
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
  const resUnits = filterNonNullable(reservationUnits?.edges.map((edge) => edge?.node));

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
      onlyWithManagePermission: true
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
