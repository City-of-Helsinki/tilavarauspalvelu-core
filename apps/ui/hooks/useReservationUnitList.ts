import { useSessionStorage } from "react-use";
import type { ReservationUnitNode } from "common";

// export type ReservationUnitUnion = ReservationUnitType | ReservationUnitByPkType
export type ReservationUnitList = {
  reservationUnits: ReservationUnitNode[];
  selectReservationUnit: (ru: ReservationUnitNode) => void;
  containsReservationUnit: (ru: ReservationUnitNode) => boolean;
  removeReservationUnit: (ru: ReservationUnitNode) => void;
  clearSelections: () => void;
};

const useReservationUnitsList = (): ReservationUnitList => {
  const [reservationUnits, setReservationUnits] = useSessionStorage<ReservationUnitNode[]>(
    "reservationUnitList",
    []
  );

  const selectReservationUnit = (reservationUnit: ReservationUnitNode) => {
    setReservationUnits([
      ...(reservationUnits),
      reservationUnit,
    ]);
  };

  const removeReservationUnit = (reservationUnit: ReservationUnitNode) => {
    if (!reservationUnits) {
      return;
    }
    setReservationUnits(
      reservationUnits.filter((unit) => unit.pk !== reservationUnit.pk)
    );
  };

  const clearSelections = () => {
    setReservationUnits([]);
  };

  const containsReservationUnit = (
    reservationUnit: ReservationUnitNode
  ): boolean =>
    reservationUnits
      ? reservationUnits.some((ru) => ru.pk === reservationUnit.pk)
      : false;

  return {
    selectReservationUnit,
    containsReservationUnit,
    clearSelections,
    removeReservationUnit,
    reservationUnits: reservationUnits || [],
  };
};

export default useReservationUnitsList;
