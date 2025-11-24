import React, { createContext, useContext, useMemo, useState } from "react";
import type { DayT } from "ui/src/modules/const";

type SelectedSlotsContextProps = {
  selection: TimeSlotRange | null;
  setSelection: (newSelection: TimeSlotRange | null) => void;
};

export type TimeSlotRange = {
  day: DayT;
  begins: number;
  ends: number;
};

const SelectedSlotsContext = createContext<SelectedSlotsContextProps>({
  selection: null,
  setSelection: () => undefined,
});

export const useSelectedSlots = (): SelectedSlotsContextProps => useContext(SelectedSlotsContext);

type Props = {
  children: React.ReactNode;
};

export const SelectedSlotsContextProvider: React.FC<Props> = ({ children }: Props) => {
  const [selection, setSelection] = useState<TimeSlotRange | null>(null);

  const value = useMemo(
    () => ({
      selection,
      setSelection: (newSelection: TimeSlotRange | null) => setSelection(newSelection),
    }),
    [selection]
  );

  return <SelectedSlotsContext.Provider value={value}>{children}</SelectedSlotsContext.Provider>;
};
