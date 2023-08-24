import { useSessionStorage } from "react-use";
import {
  ReservationUnitByPkType,
  ReservationUnitType,
} from "common/types/gql-types";

export type ReservationUnitList = {
  reservationUnits: ReservationUnitType[] | ReservationUnitByPkType[];
  selectReservationUnit: (
    reservationUnit: ReservationUnitType | ReservationUnitByPkType
  ) => void;
  containsReservationUnit: (
    reservationUnit: ReservationUnitType | ReservationUnitByPkType
  ) => boolean;
  removeReservationUnit: (
    reservationUnit: ReservationUnitType | ReservationUnitByPkType
  ) => void;
  clearSelections: () => void;
};

const useReservationUnitsList = (): ReservationUnitList => {
  const [reservationUnits, setReservationUnits] = useSessionStorage(
    "reservationUnitList",
    [] as ReservationUnitType[]
  );

  const selectReservationUnit = (reservationUnit: ReservationUnitType) => {
    setReservationUnits([
      ...(reservationUnits as ReservationUnitType[]),
      reservationUnit,
    ]);
  };

  const removeReservationUnit = (reservationUnit: ReservationUnitType) => {
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
    reservationUnit: ReservationUnitType
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
