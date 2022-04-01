import React, { useEffect, useState } from "react";
import { IconLocation } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { useRouter } from "next/router";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { GetServerSideProps } from "next";
import {
  getApplication,
  getApplicationRound,
  getRecurringReservations,
} from "../../modules/api";
import Back from "../../components/common/Back";
import { breakpoint } from "../../modules/style";
import { Strong } from "../../modules/style/typography";
import { CenterSpinner, HorisontalRule } from "../../components/common/common";
import IconWithText from "../../components/common/IconWithText";
import { localizedValue } from "../../modules/util";
import ReservationList from "../../components/applications/ReservationList";
import { isBrowser } from "../../modules/const";
import {
  Application,
  ApplicationRound,
  RecurringReservation,
} from "../../modules/types";

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale)),
    },
  };
};

const EventName = styled.h1`
  font-size: var(--fontsize-heading-l);
  font-family: var(--font-bold);
`;

const Container = styled.div`
  padding: var(--spacing-l) var(--spacing-m) var(--spacing-m);
  max-width: var(--container-width-xl);
  margin: 0 auto var(--spacing-2-xl) auto;
  height: 100%;

  @media (max-width: ${breakpoint.m}) {
    padding: var(--spacing-s);
  }
`;

const RoundName = styled.div`
  margin-top: var(--spacing-s);
  font-size: var(--fontsize-body-m);
`;

const BuildingName = styled(Strong)`
  font-size: var(--fontsize-heading-m);
  margin-right: var(--spacing-s);
`;

const ReservationUnitName = styled.span`
  font-size: var(--fontsize-heading-s);
`;

const EventReservationUnitDetails = (): JSX.Element | null => {
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<Application | null>(null);
  // eslint-disable-next-line prettier/prettier
  const [
    applicationRound,
    setApplicationRound,
    // eslint-disable-next-line prettier/prettier
  ] = useState<ApplicationRound | null>(null);
  const [reservations, setReservations] = useState<
    RecurringReservation[] | null
  >(null);

  const router = useRouter();
  const {
    query: { params },
  } = router;

  const { t, i18n } = useTranslation();

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [path, applicationId, eventId, reservationUnitId] = params as string[];

  const fetchData = async (appId: number) => {
    try {
      const applicationResult = await getApplication(appId);
      const applicationRoundResult = await getApplicationRound({
        id: applicationResult.applicationRoundId,
      });
      const reservationsResult = await getRecurringReservations(appId);

      setApplication(applicationResult);
      setApplicationRound(applicationRoundResult);
      setReservations(reservationsResult);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (applicationId) {
      fetchData(Number(applicationId));
    }
  }, [applicationId]);

  if (!params) return <CenterSpinner />;

  if (!isBrowser) return null;

  if (isLoading) return <CenterSpinner />;

  const unitReservations = reservations
    ?.filter((recurring) => recurring.applicationEventId === Number(eventId))
    .flatMap((recurringreservations) => recurringreservations.reservations)
    .filter((reservation) =>
      Boolean(
        reservation.reservationUnit.find(
          (unit) => unit.id === Number(reservationUnitId)
        )
      )
    );

  const applicationEvent = application?.applicationEvents?.find(
    (event) => event.id === Number(eventId)
  );

  const reservationUnit = unitReservations
    ?.flatMap((reservation) => reservation.reservationUnit)
    .find((ru) => ru.id === Number(reservationUnitId));

  return (
    <Container>
      <Back label="eventReservationUnitDetails:back" />
      <EventName>{applicationEvent?.name}</EventName>
      <Strong>{t("eventReservationUnitDetails:reservations")}</Strong>
      <RoundName>{applicationRound?.name}</RoundName>
      <HorisontalRule />
      <IconWithText
        icon={<IconLocation size="s" aria-hidden />}
        text={
          <div>
            <BuildingName>{reservationUnit?.building.name}</BuildingName>
            <ReservationUnitName>
              {localizedValue(reservationUnit?.name, i18n.language)}
            </ReservationUnitName>
          </div>
        }
      />
      <ReservationList
        groupName={applicationEvent?.name as string}
        reservations={unitReservations}
      />
    </Container>
  );
};

export default EventReservationUnitDetails;
