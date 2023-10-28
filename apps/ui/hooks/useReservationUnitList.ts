import { useSessionStorage } from "react-use";
import {
  ReservationUnitByPkType,
  ReservationUnitType,
} from "common/types/gql-types";

export type ReservationUnitUnion = ReservationUnitType | ReservationUnitByPkType
export type ReservationUnitList = {
  reservationUnits: ReservationUnitUnion[];
  selectReservationUnit: (ru: ReservationUnitUnion) => void;
  containsReservationUnit: (ru: ReservationUnitUnion) => boolean;
  removeReservationUnit: (ru: ReservationUnitUnion) => void;
  clearSelections: () => void;
};

const useReservationUnitsList = (): ReservationUnitList => {
  const [reservationUnits, setReservationUnits] = useSessionStorage<ReservationUnitUnion[]>(
    "reservationUnitList",
    []
  );

  const selectReservationUnit = (reservationUnit: ReservationUnitUnion) => {
    setReservationUnits([
      ...(reservationUnits),
      reservationUnit,
    ]);
  };

  const removeReservationUnit = (reservationUnit: ReservationUnitUnion) => {
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
    reservationUnit: ReservationUnitUnion
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
