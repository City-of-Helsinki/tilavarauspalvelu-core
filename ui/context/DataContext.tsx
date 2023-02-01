import React, { Dispatch, SetStateAction, useContext, useMemo } from "react";

export type DataContextProps = {
  reservation: ReservationProps | null;
  setReservation: Dispatch<SetStateAction<ReservationProps>>;
};

export type ReservationProps = {
  pk?: number | null;
  begin: string | null;
  end: string | null;
  price: number | null;
};

export const DataContext = React.createContext<DataContextProps>({
  reservation: null,
  setReservation: async () => {},
});

export const useDataContext = (): DataContextProps => useContext(DataContext);

type Props = { children: React.ReactNode };

const DataContextProvider: React.FC<Props> = ({ children }: Props) => {
  const [reservation, setReservation] = React.useState<ReservationProps>(null);
  const dataContextValues = useMemo(
    () => ({ reservation, setReservation }),
    [reservation, setReservation]
  );

  return (
    <DataContext.Provider value={dataContextValues}>
      {children}
    </DataContext.Provider>
  );
};

export { DataContextProvider };
