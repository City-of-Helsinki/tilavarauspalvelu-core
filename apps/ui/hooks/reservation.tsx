import { useState } from "react";
import { type ApolloError, useQuery } from "@apollo/client";
import {
  type PaymentOrderNode,
  type Query,
  type QueryOrderArgs,
  type QueryReservationArgs,
  type QueryReservationsArgs,
  type ReservationNode,
  State,
  type UserNode,
  OrderStatus,
  ReservationOrderingChoices,
  useDeleteReservationMutation,
  useRefreshOrderMutation,
} from "@gql/gql-types";
import {
  GET_ORDER,
  GET_RESERVATION,
  LIST_RESERVATIONS,
} from "../modules/queries/reservation";
import { toApiDate } from "common/src/common/util";
import { base64encode, filterNonNullable } from "common/src/helpers";

function convertOrderStatus(status: string): OrderStatus | undefined {
  switch (status) {
    case OrderStatus.Cancelled:
      return OrderStatus.Cancelled;
    case OrderStatus.Draft:
      return OrderStatus.Draft;
    case OrderStatus.Expired:
      return OrderStatus.Expired;
    case OrderStatus.Paid:
      return OrderStatus.Paid;
    case OrderStatus.PaidManually:
      return OrderStatus.PaidManually;
    case OrderStatus.Refunded:
      return OrderStatus.Refunded;
    default:
      return undefined;
  }
}

type UseOrderProps = {
  orderUuid?: string;
};

export const useOrder = ({
  orderUuid,
}: UseOrderProps): {
  order?: PaymentOrderNode;
  isError: boolean;
  refreshError?: ApolloError;
  isLoading: boolean;
  refresh: () => void;
  called: boolean;
} => {
  const [data, setData] = useState<PaymentOrderNode | undefined>(undefined);
  const [called, setCalled] = useState(false);

  const { error, loading: orderLoading } = useQuery<Query, QueryOrderArgs>(
    GET_ORDER,
    {
      fetchPolicy: "no-cache",
      skip: !orderUuid,
      variables: { orderUuid: orderUuid ?? "" },
      onCompleted: (res) => {
        setCalled(true);
        setData(res?.order ?? undefined);
      },
      onError: () => {
        setCalled(true);
      },
    }
  );

  const [refresh, { error: refreshError, loading: refreshLoading }] =
    useRefreshOrderMutation({
      fetchPolicy: "no-cache",
      variables: { input: { orderUuid: orderUuid ?? "" } },
      onCompleted: (res) => {
        if (data != null && res.refreshOrder?.status != null) {
          const status = convertOrderStatus(res.refreshOrder.status);
          setData({ ...data, status });
        } else {
          setData(undefined);
        }
      },
      // catch all thrown errors so we don't crash
      // particularly there is an EXTERNAL_SERVICE_ERROR that happens occasionally
      onError: () => {},
    });

  return {
    order: data ?? undefined,
    isError: error != null,
    refreshError,
    isLoading: orderLoading || refreshLoading,
    refresh,
    called,
  };
};

type UseReservationProps = {
  reservationPk: number;
};

export function useDeleteReservation() {
  const [mutation, { data, error, loading }] = useDeleteReservationMutation();

  const deleted = data?.deleteReservation?.deleted ?? false;

  return {
    mutation,
    error,
    isLoading: loading,
    deleted,
  };
}

export function useReservation({ reservationPk }: UseReservationProps): {
  reservation?: ReservationNode;
  error?: ApolloError;
  loading: boolean;
} {
  // TODO typesafe way to get typename
  const typename = "ReservationNode";
  const id = base64encode(`${typename}:${reservationPk}`);
  const { data, error, loading } = useQuery<Query, QueryReservationArgs>(
    GET_RESERVATION,
    {
      fetchPolicy: "no-cache",
      variables: { id },
      skip: !reservationPk,
    }
  );

  const reservation = data?.reservation ?? undefined;

  return {
    reservation,
    error,
    loading,
  };
}

type UseReservationsProps = {
  currentUser?: UserNode;
  states?: State[];
  orderBy?: ReservationOrderingChoices;
};

// Only used by InProgressReservationNotification
export function useReservations({
  currentUser,
  states,
  orderBy,
}: UseReservationsProps): {
  reservations: ReservationNode[];
  error?: ApolloError;
  loading: boolean;
} {
  const { data, error, loading } = useQuery<Query, QueryReservationsArgs>(
    LIST_RESERVATIONS,
    {
      skip: !currentUser?.pk,
      variables: {
        ...(states != null && states?.length > 0 && { state: states }),
        ...(orderBy && { orderBy: [orderBy] }),
        user: currentUser?.pk?.toString(),
        beginDate: toApiDate(new Date()),
      },
      fetchPolicy: "no-cache",
    }
  );

  const reservations = filterNonNullable(
    data?.reservations?.edges.map((e) => e?.node)
  );

  return {
    reservations,
    error,
    loading,
  };
}
