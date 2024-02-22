import React, { useMemo, useState } from "react";
import type { GetServerSidePropsContext } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { useQuery } from "@apollo/client";
import { Tabs, TabList, Tab, TabPanel } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { fontMedium } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  type Query,
  type QueryReservationsArgs,
  ReservationsReservationStateChoices,
} from "common/types/gql-types";
import { Container } from "common";
import { filterNonNullable } from "common/src/helpers";
import { useSession } from "@/hooks/auth";
import { Toast } from "@/styles/util";
import { LIST_RESERVATIONS } from "@/modules/queries/reservation";
import ReservationCard from "@/components/reservation/ReservationCard";
import Head from "@/components/reservations/Head";
import { CenterSpinner } from "@/components/common/common";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { toApiDate } from "common/src/common/util";
import { addDays } from "date-fns";

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const { locale } = ctx;

  return {
    props: {
      ...getCommonServerSideProps(),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
};

const Heading = styled.div`
  margin-bottom: var(--spacing-layout-l);
`;

const StyledTabList = styled(TabList).attrs({
  style: {
    "--tablist-border-color": "white",
  } as React.CSSProperties,
})`
  ul {
    width: 100% !important;
    position: relative;
    border-width: 0 !important;
  }
`;

const StyledTab = styled(Tab)`
  ${fontMedium};

  span {
    &:before {
      z-index: 1 !important;
    }

    min-width: unset;
    padding: 0 var(--spacing-s) !important;

    @media (min-width: ${breakpoints.s}) {
      padding: 0 var(--spacing-xl) !important;
    }
  }
`;

const StyledTabPanel = styled(TabPanel)`
  margin-top: var(--spacing-m);
`;

const EmptyMessage = styled.div`
  margin-left: var(--spacing-xl);
`;

const Reservations = (): JSX.Element | null => {
  const router = useRouter();
  const { t } = useTranslation();
  const { isAuthenticated, user: currentUser } = useSession();
  const { error: routerError } = router.query;

  const [tab, setTab] = useState<"upcoming" | "past" | "cancelled">("upcoming");

  const today = useMemo(() => new Date(), []);
  // TODO add pagination
  // TODO also combine with other instances of LIST_RESERVATIONS
  // TODO also should do cache invalidation if the user makes a reservation
  const {
    data,
    loading: isLoading,
    error,
  } = useQuery<Query, QueryReservationsArgs>(LIST_RESERVATIONS, {
    skip: !currentUser?.pk,
    variables: {
      state:
        tab === "cancelled"
          ? [ReservationsReservationStateChoices.Cancelled]
          : [
              ReservationsReservationStateChoices.Confirmed,
              ReservationsReservationStateChoices.RequiresHandling,
              ReservationsReservationStateChoices.WaitingForPayment,
              ReservationsReservationStateChoices.Denied,
            ],
      orderBy: tab === "upcoming" ? "begin" : "-begin",
      user: currentUser?.pk?.toString(),
      // NOTE today's reservations are always shown in upcoming (even when they are in the past)
      beginDate: tab === "upcoming" ? toApiDate(today) : undefined,
      endDate: tab === "past" ? toApiDate(addDays(today, -1)) : undefined,
    },
  });

  // NOTE should never happen since we do an SSR redirect
  if (!isAuthenticated) {
    return <div>{t("common:error.notAuthenticated")}</div>;
  }

  const reservations = filterNonNullable(
    data?.reservations?.edges?.map((edge) => edge?.node)
  );

  return (
    <>
      <Head />
      <Container>
        <Heading>
          <Tabs>
            <StyledTabList>
              <StyledTab onClick={() => setTab("upcoming")}>
                {t("reservations:upcomingReservations")}
              </StyledTab>
              <StyledTab onClick={() => setTab("past")}>
                {t("reservations:pastReservations")}
              </StyledTab>
              <StyledTab onClick={() => setTab("cancelled")}>
                {t("reservations:cancelledReservations")}
              </StyledTab>
            </StyledTabList>
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
        </Heading>
        {error && (
          <Toast
            type="error"
            label={t("common:error.error")}
            position="top-center"
          >
            {t("common:error.dataError")}
          </Toast>
        )}
        {routerError === "order1" && (
          <Toast
            type="error"
            label={t("reservations:confirmationError.heading")}
            position="top-center"
            dismissible
            closeButtonLabelText={t("common:close")}
          >
            {t("reservations:confirmationError.body")}
          </Toast>
        )}
      </Container>
    </>
  );
};

export default Reservations;
