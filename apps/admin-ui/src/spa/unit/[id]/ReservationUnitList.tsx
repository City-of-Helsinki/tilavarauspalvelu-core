import React from "react";
import type { ReservationUnitCardFragment } from "@gql/gql-types";
import { ReservationUnitCard } from "./ReservationUnitCard";

interface IProps {
  reservationUnits: Readonly<ReservationUnitCardFragment[]>;
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
