import { useTranslation } from "next-i18next";
import {
  useReservationDenyReasonsQuery,
  ReservationDenyReasonOrderingChoices,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { errorToast } from "common/src/common/toast";
import { gql } from "@apollo/client";

export const RESERVATION_DENY_REASONS = gql`
  query ReservationDenyReasons(
    $orderBy: [ReservationDenyReasonOrderingChoices]
  ) {
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

export function useDenyReasonOptions() {
  const { t } = useTranslation();

  const { data, loading } = useReservationDenyReasonsQuery({
    variables: {
      orderBy: [ReservationDenyReasonOrderingChoices.RankAsc],
    },
    onError: () => {
      errorToast({ text: t("errors.errorFetchingData") });
    },
  });
  const { reservationDenyReasons } = data ?? {};
  const denyReasonOptions = filterNonNullable(
    reservationDenyReasons?.edges.map((x) => x?.node)
  ).map((dr) => ({
    value: dr?.pk ?? 0,
    label: dr?.reasonFi ?? "",
  }));

  return { options: denyReasonOptions, loading };
}
