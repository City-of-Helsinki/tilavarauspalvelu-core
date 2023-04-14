import React, { useEffect, useMemo, useState } from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { isAfter } from "date-fns";
import { useQuery } from "@apollo/client";
import { Tabs, TabList, Tab, TabPanel } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "next-i18next";
import { useRouter } from "next/router";
import { fontMedium } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import {
  Query,
  QueryReservationsArgs,
  ReservationsReservationStateChoices,
  ReservationType,
} from "common/types/gql-types";
import Container from "../../components/common/Container";
import { LIST_RESERVATIONS } from "../../modules/queries/reservation";
import ReservationCard from "../../components/reservation/ReservationCard";
import Head from "../../components/reservations/Head";
import { CenterSpinner } from "../../components/common/common";
import { CURRENT_USER } from "../../modules/queries/user";
import { Toast } from "../../styles/util";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const Wrapper = styled(Container)``;

const Heading = styled.div`
  margin-bottom: var(--spacing-layout-l);
`;

const StyledTabList = styled(TabList).attrs({
  style: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
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

    padding: 0 var(--spacing-xs) !important;

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

const Reservations = (): JSX.Element => {
  const router = useRouter();
  const { error: routerError } = router.query;

  const [error, setError] = useState(false);
  const { t } = useTranslation();

  const [upcomingReservations, setUpcomingReservations] = useState<
    ReservationType[]
  >([]);
  const [pastReservations, setPastReservations] = useState<ReservationType[]>(
    []
  );
  const [cancelledReservations, setCancelledReservations] = useState<
    ReservationType[]
  >([]);
  const [isLoadingReservations, setIsLoadingReservations] =
    useState<boolean>(true);

  const { data: userData } = useQuery<Query>(CURRENT_USER, {
    fetchPolicy: "no-cache",
  });

  const currentUser = useMemo(() => userData?.currentUser, [userData]);

  const { data: reservationData, error: reservationError } = useQuery<
    Query,
    QueryReservationsArgs
  >(LIST_RESERVATIONS, {
    skip: !currentUser?.pk,
    variables: {
      state: [
        ReservationsReservationStateChoices.Confirmed,
        ReservationsReservationStateChoices.RequiresHandling,
        ReservationsReservationStateChoices.Cancelled,
        ReservationsReservationStateChoices.WaitingForPayment,
        ReservationsReservationStateChoices.Denied,
      ],
      orderBy: "-begin",
      user: currentUser?.pk.toString(),
    },
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    const reservations = reservationData?.reservations?.edges
      ?.map((edge) => edge?.node)
      .reduce(
        (acc, reservation) => {
          if (
            reservation.state === ReservationsReservationStateChoices.Cancelled
          ) {
            acc[2].push(reservation);
          } else if (isAfter(new Date(reservation?.begin), new Date())) {
            acc[0].push(reservation);
          } else {
            acc[1].push(reservation);
          }
          return acc;
        },
        [[], [], []] as ReservationType[][]
      );
    if (reservations?.length > 0) {
      setUpcomingReservations([...reservations[0]].reverse());
      setPastReservations(reservations[1]);
      setCancelledReservations(reservations[2]);
    }
    if (reservationData?.reservations?.edges) {
      setIsLoadingReservations(false);
    }
  }, [reservationData]);

  useEffect(() => {
    if (userData?.currentUser === null || reservationError) {
      setError(true);
    }
  }, [userData, reservationError]);

  return (
    <>
      <Head />
      <Wrapper>
        <Heading>
          <Tabs>
            <StyledTabList>
              <StyledTab>{t("reservations:upcomingReservations")}</StyledTab>
              <StyledTab>{t("reservations:pastReservations")}</StyledTab>
              <StyledTab>{t("reservations:cancelledReservations")}</StyledTab>
            </StyledTabList>
            <StyledTabPanel>
              {error ? null : isLoadingReservations && <CenterSpinner />}
              {upcomingReservations.length > 0
                ? upcomingReservations?.map((reservation) => (
                    <ReservationCard
                      key={reservation.pk}
                      reservation={reservation}
                      type="upcoming"
                    />
                  ))
                : !isLoadingReservations && (
                    <EmptyMessage>
                      {t("reservations:noUpcomingReservations")}
                    </EmptyMessage>
                  )}
            </StyledTabPanel>
            <StyledTabPanel>
              {isLoadingReservations && <CenterSpinner />}
              {pastReservations.length > 0
                ? pastReservations?.map((reservation) => (
                    <ReservationCard
                      key={reservation.pk}
                      reservation={reservation}
                      type="past"
                    />
                  ))
                : !isLoadingReservations && (
                    <EmptyMessage>
                      {t("reservations:noPastReservations")}
                    </EmptyMessage>
                  )}
            </StyledTabPanel>
            <StyledTabPanel>
              {isLoadingReservations && <CenterSpinner />}
              {cancelledReservations.length > 0
                ? cancelledReservations?.map((reservation) => (
                    <ReservationCard
                      key={reservation.pk}
                      reservation={reservation}
                      type="cancelled"
                    />
                  ))
                : !isLoadingReservations && (
                    <EmptyMessage>
                      {t("reservations:noCancelledReservations")}
                    </EmptyMessage>
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
      </Wrapper>
    </>
  );
};

export default Reservations;
