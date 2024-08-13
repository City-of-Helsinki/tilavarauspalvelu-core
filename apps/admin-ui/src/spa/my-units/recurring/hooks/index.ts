import { useRecurringReservationUnitQuery } from "@gql/gql-types";
import { useNotification } from "@/context/NotificationContext";
import { base64encode, filterNonNullable } from "common/src/helpers";

export { useMultipleReservation } from "./useMultipleReservation";
export { useCreateRecurringReservation } from "./useCreateRecurringReservation";
export { useFilteredReservationList } from "./useFilteredReservationList";

export function useRecurringReservationsUnits(unitId: number) {
  const { notifyError } = useNotification();

  const id = base64encode(`UnitNode:${unitId}`);
  const { loading, data } = useRecurringReservationUnitQuery({
    variables: { id },
    onError: (err) => {
      notifyError(err.message);
    },
  });

  const { unit } = data ?? {};
  const reservationUnits = filterNonNullable(unit?.reservationunitSet);

  return { loading, reservationUnits };
}
