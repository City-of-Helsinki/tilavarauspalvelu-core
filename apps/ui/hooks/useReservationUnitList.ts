import { useSessionStorage } from "react-use";
import type { ReservationUnitNode } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";

type NodeList = Pick<ReservationUnitNode, "pk">[];
type Node = NonNullable<NodeList>[0];
type ReservationUnitList = {
  reservationUnits: Node[];
  selectReservationUnit: (ru: Node) => void;
  containsReservationUnit: (ru: Node) => boolean;
  removeReservationUnit: (ru: Node) => void;
  clearSelections: () => void;
};

type HookVars = {
  reservationUnits?: NodeList;
};

/// @param round filter the reservation units by the application round
/// Problem with this is that the current system is not based on around requiring an application round
/// but the actual use case is, so have to do filtering case by case.
function useReservationUnitsList(
  round: HookVars | undefined
): ReservationUnitList {
  const [list, setList] = useSessionStorage<NodeList>(
    "reservationUnitList",
    []
  );

  const selectReservationUnit = (ru: Node) => {
    setList([...list, ru]);
  };

  const removeReservationUnit = (ru: Node) => {
    if (!list) {
      return;
    }
    setList(list.filter((x) => x.pk !== ru.pk));
  };

  const clearSelections = () => {
    setList([]);
  };

  const containsReservationUnit = (ru: Node): boolean => {
    if (!list) {
      return false;
    }
    return list.some((x) => x.pk === ru.pk);
  };

  const getReservationUnits = () => {
    if (round) {
      const roundRuPks = filterNonNullable(
        round.reservationUnits?.map((ru) => ru.pk)
      );
      return list.filter(
        (ru) => ru.pk != null && roundRuPks.find((x) => x === ru.pk) != null
      );
    }
    return list;
  };

  return {
    selectReservationUnit,
    containsReservationUnit,
    clearSelections,
    removeReservationUnit,
    reservationUnits: getReservationUnits(),
  };
}

export default useReservationUnitsList;
