import React, { createContext, useContext, useState } from "react";

export type AllocationContextProps = {
  refreshApplicationEvents: boolean;
  setRefreshApplicationEvents: (val: boolean) => void;
};

export const AllocationContext = createContext<AllocationContextProps>({
  refreshApplicationEvents: false,
  setRefreshApplicationEvents: (val: boolean) => val,
});

export const useAllocationContext = (): AllocationContextProps =>
  useContext(AllocationContext);

export const AllocationContextProvider: React.FC = ({ children }) => {
  const [refreshApplicationEvents, setRefreshApplicationEvents] =
    useState<boolean>(false);

  return (
    <AllocationContext.Provider
      value={{
        refreshApplicationEvents,
        setRefreshApplicationEvents,
      }}
    >
      {children}
    </AllocationContext.Provider>
  );
};
