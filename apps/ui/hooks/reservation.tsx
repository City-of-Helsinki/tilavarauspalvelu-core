import { useState } from "react";
import { type ApolloError, useMutation, useQuery } from "@apollo/client";
import {
  type PaymentOrderNode,
  type Query,
  type QueryOrderArgs,
  type QueryReservationArgs,
  type QueryReservationsArgs,
  type RefreshOrderMutationInput,
  type RefreshOrderMutationPayload,
  type ReservationDeleteMutationInput,
  type ReservationDeleteMutationPayload,
  type ReservationNode,
  State,
  type UserNode,
  OrderStatus,
  ReservationOrderingChoices,
} from "common/types/gql-types";
import {
  DELETE_RESERVATION,
  GET_ORDER,
  GET_RESERVATION,
  LIST_RESERVATIONS,
  REFRESH_ORDER,
} from "../modules/queries/reservation";
import { toApiDate } from "common/src/common/util";
import { base64encode, filterNonNullable } from "common/src/helpers";

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
    useMutation<
      { refreshOrder: RefreshOrderMutationPayload },
      { input: RefreshOrderMutationInput }
    >(REFRESH_ORDER, {
      fetchPolicy: "no-cache",
      variables: { input: { orderUuid: orderUuid ?? "" } },
      onCompleted: (res) => {
        // TODO type safe coerse status: string to OrderStatus
        const newData: PaymentOrderNode | undefined =
          data != null && res.refreshOrder != null
            ? { ...data, status: res.refreshOrder.status as OrderStatus }
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

export function useDeleteReservation() {
  const [mutation, { data, error, loading }] = useMutation<
    { deleteReservation: ReservationDeleteMutationPayload },
    { input: ReservationDeleteMutationInput }
  >(DELETE_RESERVATION, {
    // catch all thrown errors so we don't crash
    onError: () => {},
  });

  const deleted = data?.deleteReservation.deleted ?? false;

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
        // TODO should we just pass an array here?
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
