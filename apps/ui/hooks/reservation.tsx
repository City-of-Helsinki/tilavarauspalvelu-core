import { useState } from "react";
import { ApolloError, useMutation, useQuery } from "@apollo/client";
import {
  PaymentOrderType,
  Query,
  QueryOrderArgs,
  QueryReservationByPkArgs,
  QueryReservationsArgs,
  RefreshOrderMutationInput,
  RefreshOrderMutationPayload,
  ReservationDeleteMutationInput,
  ReservationDeleteMutationPayload,
  ReservationType,
  ReservationsReservationStateChoices,
  UserType,
} from "common/types/gql-types";
import {
  DELETE_RESERVATION,
  GET_ORDER,
  GET_RESERVATION,
  LIST_RESERVATIONS,
  REFRESH_ORDER,
} from "../modules/queries/reservation";
import { filterNonNullable } from "common/src/helpers";

type UseOrderProps = {
  orderUuid?: string;
};

export const useOrder = ({
  orderUuid,
}: UseOrderProps): {
  order?: PaymentOrderType;
  isError: boolean;
  refreshError?: ApolloError;
  isLoading: boolean;
  refresh: () => void;
  called: boolean;
} => {
  const [data, setData] = useState<PaymentOrderType | undefined>(undefined);
  const [called, setCalled] = useState(false);

  const { error, loading: orderLoading } = useQuery<Query, QueryOrderArgs>(
    GET_ORDER,
    {
      fetchPolicy: "no-cache",
      skip: !orderUuid,
      variables: { orderUuid },
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
    useMutation<
      { refreshOrder: RefreshOrderMutationPayload },
      { input: RefreshOrderMutationInput }
    >(REFRESH_ORDER, {
      fetchPolicy: "no-cache",
      variables: { input: { orderUuid: orderUuid ?? "" } },
      onCompleted: (res) => {
        const newData =
          data != null
            ? { ...data, status: res.refreshOrder.status }
            : undefined;
        setData(newData);
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

export const useReservation = ({
  reservationPk,
}: UseReservationProps): {
  reservation?: ReservationType;
  error?: ApolloError;
  loading: boolean;
  deleteReservation: (
    arg: Record<"variables", Record<"input", Record<"pk", number>>>
  ) => void;
  deleteError?: ApolloError;
  deleteLoading: boolean;
  deleted: boolean;
} => {
  const [deleted, setDeleted] = useState(false);

  const [deleteReservation, { error: deleteError, loading: deleteLoading }] =
    useMutation<
      { deleteReservation: ReservationDeleteMutationPayload },
      { input: ReservationDeleteMutationInput }
    >(DELETE_RESERVATION, {
      onCompleted: (res) => {
        if (res.deleteReservation.deleted) {
          setDeleted(true);
        }
      },
      // catch all thrown errors so we don't crash
      onError: () => {},
    });

  const { data, error, loading } = useQuery<Query, QueryReservationByPkArgs>(
    GET_RESERVATION,
    {
      fetchPolicy: "no-cache",
      variables: { pk: reservationPk },
      skip: !reservationPk,
    }
  );

  const reservation = data?.reservationByPk ?? undefined;

  return {
    reservation,
    error,
    loading,
    deleteReservation,
    deleteError,
    deleteLoading,
    deleted,
  };
};

type UseReservationsProps = {
  currentUser?: UserType;
  states?: ReservationsReservationStateChoices[];
  orderBy?: string;
};

export const useReservations = ({
  currentUser,
  states,
  orderBy,
}: UseReservationsProps): {
  reservations: ReservationType[];
  error?: ApolloError;
  loading: boolean;
} => {
  const { data, error, loading } = useQuery<Query, QueryReservationsArgs>(
    LIST_RESERVATIONS,
    {
      skip: !currentUser?.pk,
      variables: {
        ...(states != null && states?.length > 0 && { state: states }),
        ...(orderBy && { orderBy }),
        user: currentUser?.pk?.toString(),
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
};
