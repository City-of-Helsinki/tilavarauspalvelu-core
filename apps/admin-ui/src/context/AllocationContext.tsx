import React, { createContext, useContext, useMemo, useState } from "react";

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

type Props = {
  children: React.ReactNode;
};

export const AllocationContextProvider: React.FC<Props> = ({
  children,
}: Props) => {
  const [refreshApplicationEvents, setRefreshApplicationEvents] =
    useState<boolean>(false);

  const allocationContextValues = useMemo(
    () => ({
      refreshApplicationEvents,
      setRefreshApplicationEvents,
    }),
    [refreshApplicationEvents, setRefreshApplicationEvents]
  );

  return (
    <AllocationContext.Provider value={allocationContextValues}>
      {children}
    </AllocationContext.Provider>
  );
};
