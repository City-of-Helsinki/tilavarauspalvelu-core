import { useSeriesReservationUnitQuery } from "@gql/gql-types";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { gql } from "@apollo/client";
import { useTranslation } from "next-i18next";

export function useSeriesReservationsUnits(unitId: number) {
  const { t } = useTranslation();
  const id = base64encode(`UnitNode:${unitId}`);
  const { loading, data } = useSeriesReservationUnitQuery({
    variables: { id },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });

  const { unit } = data ?? {};
  const reservationUnits = filterNonNullable(unit?.reservationUnits);

  return { loading, reservationUnits };
}

export const SERIES_RESERVATION_UNIT_QUERY = gql`
  query SeriesReservationUnit($id: ID!) {
    unit(id: $id) {
      id
      nameFi
      pk
      reservationUnits {
        id
        pk
        nameFi
        reservationStartInterval
        bufferTimeBefore
        bufferTimeAfter
      }
    }
  }
`;
