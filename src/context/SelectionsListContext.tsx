import React, { useState, createContext } from 'react';
import { ReservationUnit } from '../common/types';

export type SelectionsListContextType = {
  reservationUnits: ReservationUnit[];
  addReservationUnit: (reservationUnit: ReservationUnit) => void;
  containsReservationUnit: (reservationUnit: ReservationUnit) => boolean;
};

export const SelectionsListContext = createContext<SelectionsListContextType | null>(
  null
);

const SelectionsListContextProvider: React.FC = (props) => {
  const [reservationUnits, setReservationUnits] = useState<ReservationUnit[]>(
    []
  );

  const addReservationUnit = (reservationUnit: ReservationUnit) => {
    setReservationUnits([...reservationUnits, reservationUnit]);
  };

  const containsReservationUnit = (reservationUnit: ReservationUnit): boolean =>
    reservationUnits.some((ru) => ru.id === reservationUnit.id);

  return (
    <SelectionsListContext.Provider
      value={{
        reservationUnits,
        addReservationUnit,
        containsReservationUnit,
      }}>
      {props.children}
    </SelectionsListContext.Provider>
  );
};

export default SelectionsListContextProvider;
