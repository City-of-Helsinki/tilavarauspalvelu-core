import { useTranslation } from "next-i18next";
import { useReservationDenyReasonsQuery, ReservationDenyReasonOrderSet } from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/components/toast";
import { gql } from "@apollo/client";

export function useDenyReasonOptions() {
  const { t } = useTranslation();

  const { data, loading } = useReservationDenyReasonsQuery({
    variables: {
      orderBy: [ReservationDenyReasonOrderSet.RankAsc],
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });
  const { allReservationDenyReasons } = data ?? {};
  const denyReasonOptions = filterNonNullable(allReservationDenyReasons).map((dr) => ({
    value: dr?.pk ?? 0,
    label: dr?.reasonFi ?? "",
  }));

  return { options: denyReasonOptions, loading };
}

export const RESERVATION_DENY_REASONS_QUERY = gql`
  query ReservationDenyReasons($orderBy: [ReservationDenyReasonOrderSet!]) {
    allReservationDenyReasons(orderBy: $orderBy) {
      id
      pk
      reasonFi
    }
  }
`;
