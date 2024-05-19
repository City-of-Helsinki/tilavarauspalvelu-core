import { useState } from "react";
import { type ApolloError } from "@apollo/client";
import {
  type PaymentOrderNode,
  OrderStatus,
  useDeleteReservationMutation,
  useRefreshOrderMutation,
  useOrderQuery,
} from "@gql/gql-types";

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

export function useOrder({ orderUuid }: UseOrderProps): {
  order?: PaymentOrderNode;
  isError: boolean;
  refreshError?: ApolloError;
  isLoading: boolean;
  refresh: () => void;
  called: boolean;
} {
  const [data, setData] = useState<PaymentOrderNode | undefined>(undefined);
  const [called, setCalled] = useState(false);

  const { error, loading: orderLoading } = useOrderQuery({
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
  });

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
}

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
