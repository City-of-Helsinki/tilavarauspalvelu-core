import { useState } from "react";
import { ApolloError, useMutation, useQuery } from "@apollo/client";
import {
  PaymentOrderType,
  Query,
  QueryOrderArgs,
  QueryReservationByPkArgs,
  RefreshOrderMutationInput,
  RefreshOrderMutationPayload,
  ReservationDeleteMutationInput,
  ReservationDeleteMutationPayload,
  ReservationType,
} from "common/types/gql-types";
import {
  DELETE_RESERVATION,
  GET_ORDER,
  GET_RESERVATION,
  REFRESH_ORDER,
} from "../modules/queries/reservation";

export const useOrder = (
  orderUuid: string
): {
  order: PaymentOrderType | null;
  error: boolean;
  refreshError: ApolloError;
  loading: boolean;
  refresh: () => void;
  deleteReservation: (
    arg: Record<"variables", Record<"input", Record<"pk", number>>>
  ) => void;
  deleteError: ApolloError;
  deleteLoading: boolean;
  called: boolean;
  deleted: boolean;
} => {
  const [data, setData] = useState<PaymentOrderType | null>(null);
  const [called, setCalled] = useState(false);
  const [deleted, setDeleted] = useState(false);

  const { error, loading: orderLoading } = useQuery<Query, QueryOrderArgs>(
    GET_ORDER,
    {
      fetchPolicy: "no-cache",
      skip: !orderUuid,
      variables: { orderUuid },
      onCompleted: (res) => {
        setCalled(true);
        setData(res.order);
      },
      onError: () => {
        setCalled(true);
      },
    }
  );

  const [refresh, { error: refreshError, loading: refreshLoading }] =
    useMutation<
      { refreshOrder: RefreshOrderMutationPayload },
      { input: RefreshOrderMutationInput }
    >(REFRESH_ORDER, {
      fetchPolicy: "no-cache",
      variables: { input: { orderUuid } },
      onCompleted: (res) => {
        setData({ ...data, status: res.refreshOrder.status });
      },
      onError: () => {},
    });

  const [deleteReservation, { error: deleteError, loading: deleteLoading }] =
    useMutation<
      { deleteReservation: ReservationDeleteMutationPayload },
      { input: ReservationDeleteMutationInput }
    >(DELETE_RESERVATION, {
      fetchPolicy: "no-cache",
      onCompleted: (res) => {
        if (res.deleteReservation.deleted) {
          setDeleted(true);
        }
      },
      onError: () => {},
    });

  return {
    order: data,
    error: error != null,
    refreshError,
    loading: orderLoading || refreshLoading,
    refresh,
    deleteReservation,
    deleteError,
    deleteLoading,
    called,
    deleted,
  };
};

export const useReservation = (
  reservationPk: number
): { reservation: ReservationType; error: ApolloError; loading: boolean } => {
  const { data, error, loading } = useQuery<Query, QueryReservationByPkArgs>(
    GET_RESERVATION,
    {
      fetchPolicy: "no-cache",
      variables: { pk: reservationPk },
      skip: !reservationPk,
    }
  );

  return { reservation: data?.reservationByPk, error, loading };
};
