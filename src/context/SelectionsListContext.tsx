import React, { useState, createContext } from 'react';
import { ReservationUnit } from '../common/types';

export type SelectionsListContextType = {
  reservationUnits: ReservationUnit[];
  addReservationUnit: (reservationUnit: ReservationUnit) => void;
  removeReservationUnit: (reservationUnit: ReservationUnit) => void;
  moveUp: (reservationUnit: ReservationUnit) => void;
  moveDown: (reservationUnit: ReservationUnit) => void;
  containsReservationUnit: (reservationUnit: ReservationUnit) => boolean;
};

export const SelectionsListContext = createContext<SelectionsListContextType | null>(
  null
);

const move = (
  reservationUnits: ReservationUnit[],
  from: number,
  to: number
): ReservationUnit[] => {
  const copy = [...reservationUnits];
  const i = reservationUnits[from];
  copy.splice(from, 1);
  copy.splice(to, 0, i);

  return copy;
};

const SelectionsListContextProvider: React.FC = (props) => {
  const [reservationUnits, setReservationUnits] = useState<ReservationUnit[]>(
    []
  );

  const addReservationUnit = (reservationUnit: ReservationUnit) => {
    setReservationUnits([...reservationUnits, reservationUnit]);
  };

  const removeReservationUnit = (reservationUnit: ReservationUnit) => {
    setReservationUnits([
      ...reservationUnits.filter((ru) => ru.id !== reservationUnit.id),
    ]);
  };

  const moveUp = (reservationUnit: ReservationUnit) => {
    const from = reservationUnits.indexOf(reservationUnit);
    const to = from - 1;
    setReservationUnits(move(reservationUnits, from, to));
  };

  const moveDown = (reservationUnit: ReservationUnit) => {
    const from = reservationUnits.indexOf(reservationUnit);
    const to = from + 1;
    setReservationUnits(move(reservationUnits, from, to));
  };

  const containsReservationUnit = (reservationUnit: ReservationUnit): boolean =>
    reservationUnits.find((ru) => ru.id === reservationUnit.id) !== undefined;

  return (
    <SelectionsListContext.Provider
      value={{
        reservationUnits,
        addReservationUnit,
        removeReservationUnit,
        moveUp,
        moveDown,
        containsReservationUnit,
      }}>
      {props.children}
    </SelectionsListContext.Provider>
  );
};

export default SelectionsListContextProvider;
