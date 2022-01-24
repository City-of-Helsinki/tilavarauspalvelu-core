import { useQuery } from "@apollo/client";

import React, { useContext } from "react";
import { Query, QueryReservationsArgs } from "../common/gql-types";
import { HANDLING_COUNT_QUERY } from "../common/queries";

export type DataContextProps = {
  handlingCount: number;
  updateHandlingCount: () => void;
};

export const DataContext = React.createContext<DataContextProps>({
  handlingCount: 0,
  updateHandlingCount: () => undefined,
});

export const useData = (): DataContextProps => useContext(DataContext);

export const DataContextProvider: React.FC = ({ children }) => {
  const [handlingCount, setHandlingCount] = React.useState(0);

  const { refetch } = useQuery<Query, QueryReservationsArgs>(
    HANDLING_COUNT_QUERY,
    {
      onCompleted: ({ reservations }) => {
        setHandlingCount(reservations?.edges?.length || 0);
      },
    }
  );

  return (
    <DataContext.Provider
      value={{
        handlingCount,
        updateHandlingCount: refetch,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
