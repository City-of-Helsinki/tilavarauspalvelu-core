import { useRecurringReservationUnitQuery } from "@gql/gql-types";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { gql } from "@apollo/client";
import { useTranslation } from "react-i18next";
export { useMultipleReservation } from "./useMultipleReservation";
export { useCreateRecurringReservation } from "./useCreateRecurringReservation";
export { useFilteredReservationList } from "./useFilteredReservationList";

export function useRecurringReservationsUnits(unitId: number) {
  const { t } = useTranslation();
  const id = base64encode(`UnitNode:${unitId}`);
  const { loading, data } = useRecurringReservationUnitQuery({
    variables: { id },
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });

  const { unit } = data ?? {};
  const reservationUnits = filterNonNullable(unit?.reservationUnits);

  return { loading, reservationUnits };
}

export const RECURRING_RESERVATION_UNIT_QUERY = gql`
  query RecurringReservationUnit($id: ID!) {
    unit(id: $id) {
      id
      nameTranslations {
        fi
      }
      pk
      reservationUnits {
        id
        pk
        nameTranslations {
          fi
        }
        reservationStartInterval
        bufferTimeBefore
        bufferTimeAfter
      }
    }
  }
`;
