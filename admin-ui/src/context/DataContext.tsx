import { useQuery } from "@apollo/client";

import React, { useContext, useEffect } from "react";
import { getCurrentUser } from "../common/api";
import { assertApiAccessTokenIsAvailable } from "../common/auth/util";
import { Query, QueryReservationsArgs } from "../common/gql-types";
import { HANDLING_COUNT_QUERY } from "../common/queries";

export type DataContextProps = {
  handlingCount: number;
  updateHandlingCount: () => void;
  hasAnyPermissions: () => boolean | undefined;
};

export const DataContext = React.createContext<DataContextProps>({
  handlingCount: 0,
  updateHandlingCount: () => undefined,
  hasAnyPermissions: () => false,
});

export const useData = (): DataContextProps => useContext(DataContext);

export const DataContextProvider: React.FC = ({ children }) => {
  const [handlingCount, setHandlingCount] = React.useState(0);
  const [permissions, setPermissions] = React.useState<boolean>();

  const { refetch } = useQuery<Query, QueryReservationsArgs>(
    HANDLING_COUNT_QUERY,

    {
      skip: !permissions,
      fetchPolicy: "no-cache",
      onCompleted: ({ reservations }) => {
        setHandlingCount(reservations?.edges?.length || 0);
      },
    }
  );

  useEffect(() => {
    const check = async () => {
      try {
        await assertApiAccessTokenIsAvailable();
        const cu = await getCurrentUser();

        const hasSomePermissions =
          cu.generalRoles.length > 0 ||
          cu.serviceSectorRoles.length > 0 ||
          cu.unitRoles.length > 0 ||
          cu.isSuperuser;
        setPermissions(hasSomePermissions);
      } catch (e) {
        setPermissions(false);
      }
    };
    check();
  }, []);

  useEffect(() => {
    if (permissions) {
      const timer = setInterval(() => {
        refetch();
      }, 5 * 60000); // 5 min
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [permissions, refetch]);

  if (permissions === undefined) {
    return null;
  }

  return (
    <DataContext.Provider
      value={{
        handlingCount,
        updateHandlingCount: refetch,
        hasAnyPermissions: () => permissions,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
