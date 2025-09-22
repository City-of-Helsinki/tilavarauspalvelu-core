import React from "react";
import type { ReservationUnitCardFragment } from "@gql/gql-types";
import { ReservationUnitCard } from "./ReservationUnitCard";

interface IProps {
  reservationUnits: ReadonlyArray<ReservationUnitCardFragment>;
  unitPk: number;
}

export function ReservationUnitList({ reservationUnits, unitPk }: IProps): JSX.Element {
  return (
    <>
      {reservationUnits.map((resUnit) => (
        <ReservationUnitCard reservationUnit={resUnit} unitPk={unitPk} key={resUnit.pk} />
      ))}
    </>
  );
}
