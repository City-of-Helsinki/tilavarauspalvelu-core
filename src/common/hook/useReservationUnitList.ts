import { useLocalStorage } from 'react-use';
import { ReservationUnit } from '../types';

export type ReservationUnitList = {
  reservationUnits: ReservationUnit[];
  selectReservationUnit: (reservationUnit: ReservationUnit) => void;
  containsReservationUnit: (reservationUnit: ReservationUnit) => boolean;
  clearSelections: () => void;
};

const useReservationUnitsList = (): ReservationUnitList => {
  const [reservationUnits, setReservationUnits] = useLocalStorage(
    'reservationUnitList',
    [] as ReservationUnit[]
  );

  const selectReservationUnit = (reservationUnit: ReservationUnit) => {
    setReservationUnits([
      ...(reservationUnits as ReservationUnit[]),
      reservationUnit,
    ]);
  };

  const clearSelections = () => {
    setReservationUnits([]);
  };

  const containsReservationUnit = (reservationUnit: ReservationUnit): boolean =>
    reservationUnits
      ? reservationUnits.some((ru) => ru.id === reservationUnit.id)
      : false;

  return {
    selectReservationUnit,
    containsReservationUnit,
    clearSelections,
    reservationUnits: reservationUnits || [],
  };
};

export default useReservationUnitsList;
