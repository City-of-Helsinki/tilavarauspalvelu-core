import React from "react";
import type { ReservationUnitNode } from "@gql/gql-types";
import { ReservationUnitCard } from "./ReservationUnitCard";

interface IProps {
  reservationUnits: ReservationUnitNode[];
  unitId: number;
}

export function ReservationUnitList({
  reservationUnits,
  unitId,
}: IProps): JSX.Element {
  return (
    <>
      {reservationUnits.map((resUnit) => (
        <ReservationUnitCard
          reservationUnit={resUnit}
          unitId={unitId}
          key={resUnit.pk}
        />
      ))}
    </>
  );
}
