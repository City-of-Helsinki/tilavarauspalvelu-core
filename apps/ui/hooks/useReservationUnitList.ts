import type { ReservationUnitNode } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { useSearchParams } from "next/navigation";
import { useSearchModify } from "./useSearchValues";

type NodeList = Pick<ReservationUnitNode, "pk">[];
type Node = NonNullable<NodeList>[0];
type ReservationUnitList = {
  getReservationUnits: () => number[];
  // TODO refactor to use pk instead of Node
  selectReservationUnit: (ru: Node) => void;
  containsReservationUnit: (ru: Node) => boolean;
  removeReservationUnit: (ru: Node) => void;
  clearSelections: () => void;
  PARAM_NAME: string;
};

type HookVars = {
  reservationUnits?: Readonly<NodeList>;
};

export const SEASONAL_SELECTED_PARAM_KEY = "selectedReservationUnits";

/// @param round filter the reservation units by the application round
/// Problem with this is that the current system is not based on around requiring an application round
/// but the actual use case is, so have to do filtering case by case.
export function useReservationUnitList(
  round: HookVars | undefined
): ReservationUnitList {
  const searchValues = useSearchParams();
  const { handleRouteChange } = useSearchModify();

  const selectReservationUnit = (ru: Node) => {
    if (ru.pk == null) {
      return;
    }
    const vals = new URLSearchParams(searchValues);
    vals.append(SEASONAL_SELECTED_PARAM_KEY, ru.pk.toString());
    handleRouteChange(vals);
  };

  const removeReservationUnit = (ru: Node) => {
    if (!ru.pk) {
      return;
    }
    const vals = new URLSearchParams(searchValues);
    vals.delete(SEASONAL_SELECTED_PARAM_KEY, ru.pk.toString());
    handleRouteChange(vals);
  };

  const clearSelections = () => {
    const vals = new URLSearchParams(searchValues);
    vals.delete(SEASONAL_SELECTED_PARAM_KEY);
    handleRouteChange(vals);
  };

  const containsReservationUnit = (ru: Node): boolean => {
    if (ru.pk == null) {
      return false;
    }
    return searchValues.has(SEASONAL_SELECTED_PARAM_KEY, ru.pk.toString());
  };

  const getReservationUnits = (): number[] => {
    const pks = searchValues
      .getAll(SEASONAL_SELECTED_PARAM_KEY)
      .map(Number)
      .filter(Number.isInteger);
    if (round) {
      const roundRuPks = filterNonNullable(
        round.reservationUnits?.map((ru) => ru.pk)
      );
      return pks.filter((pk) => roundRuPks.includes(pk));
    }
    return pks;
  };

  return {
    selectReservationUnit,
    containsReservationUnit,
    clearSelections,
    removeReservationUnit,
    getReservationUnits,
    PARAM_NAME: SEASONAL_SELECTED_PARAM_KEY,
  };
}
