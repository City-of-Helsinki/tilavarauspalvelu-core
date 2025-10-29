import { useTranslation } from "next-i18next";
import { useReservationDenyReasonsQuery, ReservationDenyReasonOrderingChoices } from "@gql/gql-types";
import { filterNonNullable } from "common/src/modules/helpers";
import { errorToast } from "common/src/components/toast";
import { gql } from "@apollo/client";

export function useDenyReasonOptions() {
  const { t } = useTranslation();

  const { data, loading } = useReservationDenyReasonsQuery({
    variables: {
      orderBy: [ReservationDenyReasonOrderingChoices.RankAsc],
    },
    onError: () => {
      errorToast({ text: t("errors:errorFetchingData") });
    },
  });
  const { reservationDenyReasons } = data ?? {};
  const denyReasonOptions = filterNonNullable(reservationDenyReasons?.edges.map((x) => x?.node)).map((dr) => ({
    value: dr?.pk ?? 0,
    label: dr?.reasonFi ?? "",
  }));

  return { options: denyReasonOptions, loading };
}

export const RESERVATION_DENY_REASONS_QUERY = gql`
  query ReservationDenyReasons($orderBy: [ReservationDenyReasonOrderingChoices]) {
    reservationDenyReasons(orderBy: $orderBy) {
      edges {
        node {
          id
          pk
          reasonFi
        }
      }
    }
  }
`;
