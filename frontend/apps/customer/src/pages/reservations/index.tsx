import React, { useEffect, useMemo, useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Tabs, TabList, Tab, TabPanel } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { TabWrapper, H1, CenterSpinner } from "ui/src/styled";
import {
  ReservationStateChoice,
  ReservationOrderingChoices,
  useListReservationsQuery,
  ReservationTypeChoice,
} from "@gql/gql-types";
import { filterNonNullable } from "ui/src/modules/helpers";
import { useSession } from "@/hooks";
import { ReservationCard } from "@/lib/reservation";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { formatApiDate } from "ui/src/modules/date-utils";
import { addDays } from "date-fns";
import { errorToast } from "ui/src/components/toast";
import { Breadcrumb } from "@/components/common/Breadcrumb";
import { gql } from "@apollo/client";

const StyledTabPanel = styled(TabPanel)`
  display: flex;
  flex-flow: column nowrap;
  gap: var(--spacing-m);
  margin-top: var(--spacing-m);
`;

const EmptyMessage = styled.div`
  margin-left: var(--spacing-xl);
`;

function Reservations(props: { apiBaseUrl: string }): JSX.Element | null {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user: currentUser } = useSession();
  const { error: routerError } = router.query;

  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");

  const today = useMemo(() => new Date(), []);
  // TODO add pagination
  // TODO also combine with other instances of LIST_RESERVATIONS
  // TODO also should do cache invalidation if the user makes a reservation
  // TODO move the query to SSR (and remove useSession)
  const { data, loading: isLoading } = useListReservationsQuery({
    skip: !currentUser?.pk,
    variables: {
      state:
        tab === "cancelled"
          ? [ReservationStateChoice.Cancelled]
          : [
              ReservationStateChoice.Confirmed,
              ReservationStateChoice.RequiresHandling,
              ReservationStateChoice.WaitingForPayment,
              ReservationStateChoice.Denied,
            ],
      orderBy:
        tab === "upcoming" ? [ReservationOrderingChoices.BeginsAtAsc] : [ReservationOrderingChoices.BeginsAtDesc],
      user: currentUser?.pk ?? 0,
      // NOTE today's reservations are always shown in upcoming (even when they are in the past)
      beginDate: tab === "upcoming" ? formatApiDate(today) : undefined,
      endDate: tab === "past" ? formatApiDate(addDays(today, -1)) : undefined,
      reservationType: ReservationTypeChoice.Normal,
    },
    onError: () => {
      errorToast({ text: t("common:error.dataError") });
    },
  });

  useEffect(() => {
    if (routerError === "order1") {
      errorToast({ text: t("reservations:confirmationError.body") });
    }
  }, [routerError, t]);

  // NOTE should never happen since we do an SSR redirect
  if (!isAuthenticated) {
    return <div>{t("common:error.notAuthenticated")}</div>;
  }

  const reservations = filterNonNullable(data?.reservations?.edges?.map((edge) => edge?.node));

  const routes = [
    {
      title: t("breadcrumb:reservations"),
    },
  ] as const;

  return (
    <>
      <Breadcrumb routes={routes} />
      <H1 $noMargin>{t(`navigation:Item.reservations`)}</H1>
      {/* HDS tabs doesn't support data-testid */}
      <TabWrapper data-testid="Reservations--page__tab_container">
        <Tabs>
          <TabList>
            <Tab onClick={() => setTab("upcoming")}>{t("reservations:upcomingReservations")}</Tab>
            <Tab onClick={() => setTab("past")}>{t("reservations:pastReservations")}</Tab>
            <Tab onClick={() => setTab("cancelled")}>{t("reservations:cancelledReservations")}</Tab>
          </TabList>
          <StyledTabPanel>
            {isLoading ? (
              <CenterSpinner />
            ) : reservations.length === 0 ? (
              <EmptyMessage>{t("reservations:noUpcomingReservations")}</EmptyMessage>
            ) : (
              reservations?.map((reservation) => (
                <ReservationCard
                  key={reservation.pk}
                  reservation={reservation}
                  type="upcoming"
                  apiBaseUrl={props.apiBaseUrl}
                />
              ))
            )}
          </StyledTabPanel>
          <StyledTabPanel>
            {isLoading ? (
              <CenterSpinner />
            ) : reservations.length === 0 ? (
              <EmptyMessage>{t("reservations:noPastReservations")}</EmptyMessage>
            ) : (
              reservations?.map((reservation) => (
                <ReservationCard
                  key={reservation.pk}
                  reservation={reservation}
                  type="past"
                  apiBaseUrl={props.apiBaseUrl}
                />
              ))
            )}
          </StyledTabPanel>
          <StyledTabPanel>
            {isLoading ? (
              <CenterSpinner />
            ) : reservations.length === 0 ? (
              <EmptyMessage>{t("reservations:noCancelledReservations")}</EmptyMessage>
            ) : (
              reservations?.map((reservation) => (
                <ReservationCard
                  key={reservation.pk}
                  reservation={reservation}
                  type="cancelled"
                  apiBaseUrl={props.apiBaseUrl}
                />
              ))
            )}
          </StyledTabPanel>
        </Tabs>
      </TabWrapper>
    </>
  );
}

export async function getServerSideProps(ctx: GetServerSidePropsContext) {
  const { locale } = ctx;

  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

export default Reservations;

// NOTE hard coded NORMAL type so only ment to be used in client ui.
// reservationType valid values: "normal", "behalf", "staff", "blocked"
// even though the ReservationsReservationTypeChoices says they are uppercase
// NOTE bang user ID so this doesn't get abused (don't use it without a user)
export const LIST_RESERVATIONS = gql`
  query ListReservations(
    $beginDate: Date
    $endDate: Date
    $state: [ReservationStateChoice]
    $user: [Int]
    $reservationUnits: [Int]
    $orderBy: [ReservationOrderingChoices]
    $reservationType: [ReservationTypeChoice]!
  ) {
    reservations(
      beginDate: $beginDate
      endDate: $endDate
      state: $state
      user: $user
      reservationUnits: $reservationUnits
      orderBy: $orderBy
      reservationType: $reservationType
    ) {
      edges {
        node {
          ...ReservationCard
        }
      }
    }
  }
`;
