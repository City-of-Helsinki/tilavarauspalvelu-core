import { useQuery } from "@apollo/client";

import React, { useContext, useEffect, useMemo } from "react";
import { Query, QueryReservationsArgs } from "common/types/gql-types";
import { HANDLING_COUNT_QUERY } from "../common/queries";
// import { useAuthState } from "./AuthStateContext";

export type DataContextProps = {
  handlingCount: number;
  hasOwnUnits: boolean;
  updateHandlingCount: () => void;
};

export const DataContext = React.createContext<DataContextProps>({
  handlingCount: 0,
  hasOwnUnits: false,
  updateHandlingCount: () => undefined,
});

export const useData = (): DataContextProps => useContext(DataContext);

type Props = {
  children: React.ReactNode;
};

export const DataContextProvider: React.FC<Props> = ({ children }: Props) => {
  const [handlingCount, setHandlingCount] = React.useState(0);
  const [hasOwnUnits, setHasOwnUnits] = React.useState(false);

  // const { authState } = useAuthState();

  const { refetch } = useQuery<Query, QueryReservationsArgs>(
    HANDLING_COUNT_QUERY,

    {
      // skip: authState.state !== "HasPermissions",
      fetchPolicy: "no-cache",
      onCompleted: ({ reservations, units }) => {
        setHandlingCount(reservations?.edges?.length || 0);
        setHasOwnUnits((units?.totalCount as number) > 0);
      },
    }
  );

  const notificationContextValues = useMemo(
    () => ({
      handlingCount,
      hasOwnUnits,
      updateHandlingCount: refetch,
    }),
    [handlingCount, hasOwnUnits, refetch]
  );

  /*
  useEffect(() => {
    if (authState.state === "HasPermissions") {
      const timer = setInterval(() => {
        refetch();
      }, 5 * 60000); // 5 min
      return () => clearTimeout(timer);
    }
    return undefined;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  */

  return (
    <DataContext.Provider value={notificationContextValues}>
      {children}
    </DataContext.Provider>
  );
};
