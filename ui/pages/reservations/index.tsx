import React from "react";
import { GetServerSideProps } from "next";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { isAfter } from "date-fns";
import { Tabs, TabList, Tab, TabPanel } from "hds-react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import Container from "../../components/common/Container";
import {
  Query,
  QueryReservationsArgs,
  ReservationType,
} from "../../modules/gql-types";
import apolloClient from "../../modules/apolloClient";
import { LIST_RESERVATIONS } from "../../modules/queries/reservation";
import ReservationCard from "../../components/reservation/ReservationCard";
import { fontMedium } from "../../modules/style/typography";
import { breakpoint } from "../../modules/style";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const { data } = await apolloClient.query<Query, QueryReservationsArgs>({
    query: LIST_RESERVATIONS,
  });

  return {
    props: {
      reservations: data?.reservations?.edges
        ?.map((edge) => edge?.node)
        .filter((node) =>
          ["CONFIRMED", "REQUIRES_HANDLING"].includes(node?.state)
        ),
      ...(await serverSideTranslations(locale)),
    },
  };
};

type Props = {
  reservations: ReservationType[];
};

const Wrapper = styled(Container)``;

const Heading = styled.div`
  margin: var(--spacing-l) 0 var(--spacing-layout-l);
`;

const StyledTabList = styled(TabList)`
  ul {
    &:after {
      content: "";
      display: block;
      border-bottom: 1px solid var(--color-black-20);
      position: absolute;
      bottom: 2px;
      width: 100%;
    }

    width: 100% !important;
    position: relative;
  }
`;

const StyledTab = styled(Tab)`
  color: greenyellow;
  ${fontMedium};

  span {
    padding: 0 var(--spacing-xs) !important;

    @media (min-width: ${breakpoint.s}) {
      padding: 0 var(--spacing-xl) !important;
    }
  }
`;

const StyledTabPanel = styled(TabPanel)`
  margin-top: var(--spacing-layout-l);
`;

const EmptyMessage = styled.div`
  margin-left: var(--spacing-xl);
`;

const Reservations = ({ reservations }: Props): JSX.Element => {
  const { t } = useTranslation();

  const [upcomingReservations, pastReservations] = reservations?.reduce(
    (acc, reservation) => {
      if (isAfter(new Date(reservation?.begin), new Date())) {
        acc[0].push(reservation);
      } else {
        acc[1].push(reservation);
      }
      return acc;
    },
    [[], []] as ReservationType[][]
  );

  return (
    <Wrapper>
      <Heading>
        <Tabs>
          <StyledTabList>
            <StyledTab>
              {t("reservations:upcomingReservations")} (
              {upcomingReservations.length})
            </StyledTab>
            <StyledTab>
              {t("reservations:pastReservations")} ({pastReservations.length})
            </StyledTab>
          </StyledTabList>
          <StyledTabPanel>
            {upcomingReservations.length > 0 ? (
              upcomingReservations?.map((reservation) => (
                <ReservationCard
                  key={reservation.pk}
                  reservation={reservation}
                  type={
                    reservation.state === "REQUIRES_HANDLING"
                      ? "requiresHandling"
                      : "upcoming"
                  }
                />
              ))
            ) : (
              <EmptyMessage>
                {t("reservations:noUpcomingReservations")}
              </EmptyMessage>
            )}
          </StyledTabPanel>
          <StyledTabPanel>
            {pastReservations.length > 0 ? (
              pastReservations?.map((reservation) => (
                <ReservationCard
                  key={reservation.pk}
                  reservation={reservation}
                  type="past"
                />
              ))
            ) : (
              <EmptyMessage>
                {t("reservations:noPastReservations")}
              </EmptyMessage>
            )}
          </StyledTabPanel>
        </Tabs>
      </Heading>
    </Wrapper>
  );
};

export default Reservations;
