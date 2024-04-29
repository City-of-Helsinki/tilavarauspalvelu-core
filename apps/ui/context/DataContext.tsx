import React, { Dispatch, SetStateAction, useMemo } from "react";

type DataContextProps = {
  reservation: ReservationProps | null;
  setReservation: Dispatch<SetStateAction<ReservationProps>>;
};

export type ReservationProps = {
  pk?: number | null;
  begin: string | null;
  end: string | null;
  price: number | null;
  reservationUnitPk: number | null;
};

const DataContext = React.createContext<DataContextProps>({
  reservation: null,
  setReservation: async () => {},
});

type Props = { children: React.ReactNode };

const DataContextProvider: React.FC<Props> = ({ children }: Props) => {
  const [reservation, setReservation] = React.useState<ReservationProps>({
    pk: null,
    begin: null,
    end: null,
    price: null,
    reservationUnitPk: null,
  });
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
