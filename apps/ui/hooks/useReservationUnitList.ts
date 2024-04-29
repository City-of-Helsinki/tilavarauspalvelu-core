import { useSessionStorage } from "react-use";
import type {
  ApplicationRoundNode,
  ReservationUnitNode,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";

type ReservationUnitList = {
  reservationUnits: ReservationUnitNode[];
  selectReservationUnit: (ru: ReservationUnitNode) => void;
  containsReservationUnit: (ru: ReservationUnitNode) => boolean;
  removeReservationUnit: (ru: ReservationUnitNode) => void;
  clearSelections: () => void;
};

/// @param round filter the reservation units by the application round
/// Problem with this is that the current system is not based on around requiring an application round
/// but the actual use case is, so have to do filtering case by case.
const useReservationUnitsList = (
  round?: ApplicationRoundNode
): ReservationUnitList => {
  const [reservationUnits, setReservationUnits] = useSessionStorage<
    ReservationUnitNode[]
  >("reservationUnitList", []);

  const selectReservationUnit = (reservationUnit: ReservationUnitNode) => {
    setReservationUnits([...reservationUnits, reservationUnit]);
  };

  const removeReservationUnit = (reservationUnit: ReservationUnitNode) => {
    if (!reservationUnits) {
      return;
    }
    setReservationUnits(
      reservationUnits.filter((unit) => unit.pk !== reservationUnit.pk)
    );
  };

  const clearSelections = () => {
    setReservationUnits([]);
  };

  const containsReservationUnit = (
    reservationUnit: ReservationUnitNode
  ): boolean =>
    reservationUnits
      ? reservationUnits.some((ru) => ru.pk === reservationUnit.pk)
      : false;

  const getReservationUnits = () => {
    if (round) {
      const roundRuPks = filterNonNullable(
        round.reservationUnits?.map((ru) => ru.pk)
      );
      return reservationUnits.filter(
        (ru) => ru.pk != null && roundRuPks.find((x) => x === ru.pk) != null
      );
    }
    return reservationUnits;
  };

  return {
    selectReservationUnit,
    containsReservationUnit,
    clearSelections,
    removeReservationUnit,
    reservationUnits: getReservationUnits(),
  };
};

export default useReservationUnitsList;
