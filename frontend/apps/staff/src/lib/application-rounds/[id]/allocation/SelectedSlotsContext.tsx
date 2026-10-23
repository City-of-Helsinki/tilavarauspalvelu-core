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

const SelectionState: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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

type Props = {
  /** The reservation unit the view shows. Every unit gets its own Selection. */
  reservationUnitPk: number | null;
  children: React.ReactNode;
};

/**
 * Holds the Selection, which is one span on one weekday.
 *
 * The span is the calendar's own `WeekdayInterval`, so the grid can read and write it without a translation. Its
 * begin is inclusive and its end is exclusive, both in minutes from midnight, and an end of 1440 means midnight.
 *
 * A Selection means "this time on this reservation unit", so it cannot outlive the unit it was made on. The key
 * gives every unit its own state, so no code path can carry a Selection over to the next unit. The filters are
 * not in the key, so a filter change keeps the Selection.
 */
export const SelectedSlotsContextProvider: React.FC<Props> = ({ reservationUnitPk, children }: Props) => (
  <SelectionState key={reservationUnitPk ?? "none"}>{children}</SelectionState>
);
