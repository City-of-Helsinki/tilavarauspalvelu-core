import React, { useEffect, useMemo, useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { Tabs, TabList, Tab, TabPanel } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { H1 } from "common/src/common/typography";
import {
  ReservationStateChoice,
  ReservationOrderingChoices,
  useListReservationsQuery,
  ReservationTypeChoice,
} from "@gql/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { useSession } from "@/hooks/auth";
import ReservationCard from "@/components/reservation/ReservationCard";
import { CenterSpinner } from "@/components/common/common";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { toApiDate } from "common/src/common/util";
import { addDays } from "date-fns";
import { errorToast } from "common/src/common/toast";
import { TabWrapper } from "common/styles/util";
import { Breadcrumb } from "@/components/common/Breadcrumb";

const StyledTabPanel = styled(TabPanel)`
  display: flex;
  flex-flow: column nowrap;
  gap: var(--spacing-m);
  margin-top: var(--spacing-m);
`;

const EmptyMessage = styled.div`
  margin-left: var(--spacing-xl);
`;

function Reservations(): JSX.Element | null {
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
  const {
    data,
    loading: isLoading,
    error,
  } = useListReservationsQuery({
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
        tab === "upcoming"
          ? [ReservationOrderingChoices.BeginAsc]
          : [ReservationOrderingChoices.BeginDesc],
      user: currentUser?.pk ?? 0,
      // NOTE today's reservations are always shown in upcoming (even when they are in the past)
      beginDate: tab === "upcoming" ? toApiDate(today) : undefined,
      endDate: tab === "past" ? toApiDate(addDays(today, -1)) : undefined,
      reservationType: ReservationTypeChoice.Normal,
    },
  });

  useEffect(() => {
    if (error) {
      errorToast({ text: t("common:error.dataError") });
    }
  }, [error, t]);

  useEffect(() => {
    if (routerError === "order1") {
      errorToast({ text: t("reservations:confirmationError.body") });
    }
  }, [routerError, t]);

  // NOTE should never happen since we do an SSR redirect
  if (!isAuthenticated) {
    return <div>{t("common:error.notAuthenticated")}</div>;
  }

  const reservations = filterNonNullable(
    data?.reservations?.edges?.map((edge) => edge?.node)
  );

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
            <Tab onClick={() => setTab("upcoming")}>
              {t("reservations:upcomingReservations")}
            </Tab>
            <Tab onClick={() => setTab("past")}>
              {t("reservations:pastReservations")}
            </Tab>
            <Tab onClick={() => setTab("cancelled")}>
              {t("reservations:cancelledReservations")}
            </Tab>
          </TabList>
          <StyledTabPanel>
            {isLoading ? (
              <CenterSpinner />
            ) : reservations.length === 0 ? (
              <EmptyMessage>
                {t("reservations:noUpcomingReservations")}
              </EmptyMessage>
            ) : (
              reservations?.map((reservation) => (
                <ReservationCard
                  key={reservation.pk}
                  reservation={reservation}
                  type="upcoming"
                />
              ))
            )}
          </StyledTabPanel>
          <StyledTabPanel>
            {isLoading ? (
              <CenterSpinner />
            ) : reservations.length === 0 ? (
              <EmptyMessage>
                {t("reservations:noPastReservations")}
              </EmptyMessage>
            ) : (
              reservations?.map((reservation) => (
                <ReservationCard
                  key={reservation.pk}
                  reservation={reservation}
                  type="past"
                />
              ))
            )}
          </StyledTabPanel>
          <StyledTabPanel>
            {isLoading ? (
              <CenterSpinner />
            ) : reservations.length === 0 ? (
              <EmptyMessage>
                {t("reservations:noCancelledReservations")}
              </EmptyMessage>
            ) : (
              reservations?.map((reservation) => (
                <ReservationCard
                  key={reservation.pk}
                  reservation={reservation}
                  type="cancelled"
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
