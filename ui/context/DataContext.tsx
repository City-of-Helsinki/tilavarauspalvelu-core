import React, { Dispatch, SetStateAction, useContext } from "react";

export type DataContextProps = {
  reservation: ReservationProps | null;
  setReservation: Dispatch<SetStateAction<ReservationProps>>;
};

export type ReservationProps = {
  pk?: number | null;
  begin: string | null;
  end: string | null;
};

export const DataContext = React.createContext<DataContextProps>({
  reservation: null,
  setReservation: async () => {},
});

export const useDataContext = (): DataContextProps => useContext(DataContext);

export const DataContextProvider: React.FC = ({ children }) => {
  const [reservation, setReservation] = React.useState<ReservationProps>(null);

  return (
    <DataContext.Provider value={{ reservation, setReservation }}>
      {children}
    </DataContext.Provider>
  );
};
