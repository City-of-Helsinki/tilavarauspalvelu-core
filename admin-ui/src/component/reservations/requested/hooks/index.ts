import {
  type Query,
  type ReservationType,
  type QueryReservationsArgs,
  ReservationsReservationStateChoices,
  type ReservationDenyReasonType,
  type QueryReservationDenyReasonsArgs,
} from "common/types/gql-types";
import { useTranslation } from "react-i18next";
import { useQuery } from "@apollo/client";
import { useState } from "react";
import {
  RESERVATIONS_BY_RESERVATIONUNIT,
  RECURRING_RESERVATION_QUERY,
} from "./queries";
import { useNotification } from "../../../../context/NotificationContext";
import { RESERVATION_DENY_REASONS } from "../queries";
import { OptionType } from "../../../../common/types";
import { GQL_MAX_RESULTS_PER_QUERY } from "../../../../common/const";

/// NOTE only fetches 100 reservations => use pageInfo and fetchMore
export const useReservationData = (
  begin: Date,
  end: Date,
  reservationUnitPk: string,
  reservationPk?: number
) => {
  const { notifyError } = useNotification();

  const { data, ...rest } = useQuery<Query, QueryReservationsArgs>(
    RESERVATIONS_BY_RESERVATIONUNIT,
    {
      variables: {
        reservationUnit: [reservationUnitPk],
        begin: begin.toISOString(),
        end: end.toISOString(),
      },
      onError: () => {
        notifyError("Varauksia ei voitu hakea");
      },
    }
  );

  const events =
    data?.reservations?.edges
      .map((e) => e?.node)
      .filter((r): r is ReservationType => r != null)
      .filter(
        (r) =>
          [
            ReservationsReservationStateChoices.Confirmed,
            ReservationsReservationStateChoices.RequiresHandling,
          ].includes(r.state) || r.pk === reservationPk
      )
      .map((r) => ({
        title: `${
          r.reserveeOrganisationName ||
          `${r.reserveeFirstName || ""} ${r.reserveeLastName || ""}`
        }`,
        event: r,
        // TODO use zod for datetime conversions
        start: new Date(r.begin),
        end: new Date(r.end),
      }))
      .map((x) => ({
        ...x,
        title:
          x.event.type === "blocked"
            ? "Suljettu"
            : x.title.trim() !== ""
            ? x.title
            : "No title",
        event: {
          ...x.event,
          name: x.event.name?.trim() !== "" ? x.event.name : "No name",
        },
      })) ?? [];

  return { ...rest, events };
};

type OptionsType = {
  limit: number;
};
const defaultOptions = {
  limit: GQL_MAX_RESULTS_PER_QUERY,
};

type CustomQueryParams = {
  pk: number;
  count: number;
  offset: number;
  state: ReservationsReservationStateChoices[];
  begin?: Date;
  end?: Date;
};

/// @param recurringPk fetch reservations related to this pk
/// @param state optionally only fetch some reservation states
/// @param limit allows to over fetch: 100 is the limit per query, larger amounts are done with multiple fetches
///
/// NOTE on cache
/// refetching this query is a super bad idea
/// use cache invalidation in the mutation instead
/// The two solutions are either to queryInvalidate / refetch if you REALLY REALLY must do it (it's super slow)
/// or use the update callback in the mutation to update the cache manually with cache.modify
export const useRecurringReservations = (
  recurringPk?: number,
  options?: Partial<OptionsType>
) => {
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const states = [
    ReservationsReservationStateChoices.Confirmed,
    ReservationsReservationStateChoices.Denied,
  ];
  const { limit } = { ...defaultOptions, ...options };
  const { data, loading, fetchMore } = useQuery<Query, CustomQueryParams>(
    RECURRING_RESERVATION_QUERY,
    {
      skip: !recurringPk,
      fetchPolicy: "cache-and-network",
      nextFetchPolicy: "cache-first",
      errorPolicy: "all",
      variables: {
        pk: recurringPk ?? 0,
        offset: 0,
        count: Math.min(limit, defaultOptions.limit),
        state: states,
      },
      // do automatic fetching and let the cache manage merging
      onCompleted: (d: Query) => {
        const allCount = d?.reservations?.totalCount ?? 0;
        const edgeCount = d?.reservations?.edges.length ?? 0;

        if (
          limit > defaultOptions.limit && // user wanted over fetching
          edgeCount > 0 && // don't fetch if last fetch had no data
          edgeCount < allCount // backend has more data available
        ) {
          fetchMore({ variables: { offset: edgeCount } });
        }
      },
      onError: () => {
        notifyError(t("RequestedReservation.errorFetchingData"));
      },
    }
  );

  const reservations =
    data?.reservations?.edges
      ?.map((x) => x?.node)
      .filter((x): x is ReservationType => x != null) ?? [];

  const edgeCount = data?.reservations?.edges?.length ?? 0;
  const totalCount = data?.reservations?.totalCount ?? 0;
  const hasDataToLoad = edgeCount < totalCount;

  return {
    loading: loading || hasDataToLoad,
    reservations,
    fetchMore,
    pageInfo: data?.reservations?.pageInfo,
    totalCount: data?.reservations?.totalCount,
  };
};

// TODO this has the same useState being local problems as useRecurringReservations
// used to have but it's not obvious because we don't mutate / refetch this.
// Cache it in Apollo InMemory cache instead.
export const useDenyReasonOptions = () => {
  const [denyReasonOptions, setDenyReasonOptions] = useState<OptionType[]>([]);
  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const { loading } = useQuery<Query, QueryReservationDenyReasonsArgs>(
    RESERVATION_DENY_REASONS,
    {
      onCompleted: ({ reservationDenyReasons }) => {
        if (reservationDenyReasons) {
          setDenyReasonOptions(
            reservationDenyReasons.edges
              .map((x) => x?.node)
              .filter((x): x is ReservationDenyReasonType => x != null)
              .map(
                (dr): OptionType => ({
                  value: dr?.pk ?? 0,
                  label: dr?.reasonFi ?? "",
                })
              )
          );
        }
      },
      onError: () => {
        notifyError(t("RequestedReservation.errorFetchingData"));
      },
    }
  );

  return { options: denyReasonOptions, loading };
};
