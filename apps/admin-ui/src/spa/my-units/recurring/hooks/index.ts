import { useRecurringReservationUnitQuery } from "@gql/gql-types";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";

export { useMultipleReservation } from "./useMultipleReservation";
export { useCreateRecurringReservation } from "./useCreateRecurringReservation";
export { useFilteredReservationList } from "./useFilteredReservationList";

export function useRecurringReservationsUnits(unitId: number) {
  const id = base64encode(`UnitNode:${unitId}`);
  const { loading, data } = useRecurringReservationUnitQuery({
    variables: { id },
    onError: (err) => {
      errorToast({ text: err.message });
    },
  });

  const { unit } = data ?? {};
  const reservationUnits = filterNonNullable(unit?.reservationunitSet);

  return { loading, reservationUnits };
}
