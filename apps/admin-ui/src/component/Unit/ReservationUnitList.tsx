import React from "react";
import type { UnitQuery } from "@gql/gql-types";
import { ReservationUnitCard } from "./ReservationUnitCard";

type UnitType = NonNullable<UnitQuery["unit"]>;
type ReservationUnitType = NonNullable<UnitType["reservationunitSet"]>[0];
interface IProps {
  reservationUnits: ReservationUnitType[];
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
