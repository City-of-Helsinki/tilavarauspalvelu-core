import React, { createContext, useContext, useMemo, useState } from "react";
import type { WeekdayInterval } from "@ui/components/WeeklyPatternCalendar/types";

type SelectedSlotsContextProps = {
  selection: WeekdayInterval | null;
  setSelection: (newSelection: WeekdayInterval | null) => void;
};

const SelectedSlotsContext = createContext<SelectedSlotsContextProps>({
  selection: null,
  setSelection: () => undefined,
});

export const useSelectedSlots = (): SelectedSlotsContextProps => useContext(SelectedSlotsContext);

type Props = {
  children: React.ReactNode;
};

/**
 * Holds the Selection, which is one span on one weekday.
 *
 * The span is the calendar's own `WeekdayInterval`, so the grid can read and write it without a translation. Its
 * begin is inclusive and its end is exclusive, both in minutes from midnight, and an end of 1440 means midnight.
 */
export const SelectedSlotsContextProvider: React.FC<Props> = ({ children }: Props) => {
  const [selection, setSelection] = useState<WeekdayInterval | null>(null);

  const value = useMemo(
    () => ({
      selection,
      setSelection: (newSelection: WeekdayInterval | null) => setSelection(newSelection),
    }),
    [selection]
  );

  return <SelectedSlotsContext.Provider value={value}>{children}</SelectedSlotsContext.Provider>;
};
