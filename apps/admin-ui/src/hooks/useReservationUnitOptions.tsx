import { useEffect } from "react";
import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import {
  ReservationUnitOrderingChoices,
  useReservationUnitsFilterParamsQuery,
} from "@gql/gql-types";

export const RESERVATION_UNITS_FILTER_PARAMS_QUERY = gql`
  query ReservationUnitsFilterParams(
    $after: String
    $unit: [Int]
    $orderBy: [ReservationUnitOrderingChoices]
  ) {
    reservationUnits(
      after: $after
      onlyWithPermission: true
      unit: $unit
      orderBy: $orderBy
    ) {
      edges {
        node {
          id
          nameFi
          pk
        }
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
`;

export function useReservationUnitOptions() {
  const { data, loading, fetchMore } = useReservationUnitsFilterParamsQuery({
    variables: {
      orderBy: [ReservationUnitOrderingChoices.NameFiAsc],
    },
  });

  // auto fetch more (there is no limit, expect number of them would be a few hundred, but in theory this might cause problems)
  // NOTE have to useEffect, onComplete stops at 200 items
  useEffect(() => {
    const { pageInfo } = data?.reservationUnits ?? {};
    if (pageInfo?.hasNextPage) {
      fetchMore({
        variables: {
          after: pageInfo.endCursor,
        },
      });
    }
  }, [data, fetchMore]);

  const resUnits = filterNonNullable(
    data?.reservationUnits?.edges.map((x) => x?.node)
  );

  const options = resUnits.map((reservationUnit) => ({
    label: reservationUnit?.nameFi ?? "",
    value: reservationUnit?.pk ?? 0,
  }));

  return { options, loading };
}
