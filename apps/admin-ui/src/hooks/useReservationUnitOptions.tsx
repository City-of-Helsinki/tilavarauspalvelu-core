import { gql } from "@apollo/client";
import { filterNonNullable } from "common/src/helpers";
import {
  ReservationUnitOrderingChoices,
  useReservationUnitsFilterParamsQuery,
} from "@gql/gql-types";
import { useSearchParams } from "react-router-dom";

export const RESERVATION_UNITS_FILTER_PARAMS_QUERY = gql`
  query ReservationUnitsFilterParams(
    $unit: [Int]
    $orderBy: [ReservationUnitOrderingChoices]
  ) {
    reservationUnitsAll(
      onlyWithPermission: true
      unit: $unit
      orderBy: $orderBy
    ) {
      id
      nameFi
      pk
    }
  }
`;

export function useReservationUnitOptions() {
  const [params] = useSearchParams();
  const { data, loading } = useReservationUnitsFilterParamsQuery({
    variables: {
      unit: params.getAll("unit").map(Number).filter(Number.isFinite),
      orderBy: [ReservationUnitOrderingChoices.NameFiAsc],
    },
  });

  const options = filterNonNullable(data?.reservationUnitsAll).map(
    (reservationUnit) => ({
      label: reservationUnit?.nameFi ?? "",
      value: reservationUnit?.pk ?? 0,
    })
  );

  return { options, loading };
}
