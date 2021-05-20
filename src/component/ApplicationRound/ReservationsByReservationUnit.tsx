import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IconLocation, Notification } from "hds-react";
import get from "lodash/get";
import {
  getApplicationRound,
  getRecurringReservations,
  getReservationUnit,
} from "../../common/api";
import Loader from "../Loader";
import {
  ApplicationRound as ApplicationRoundType,
  RecurringReservation,
  Reservation,
  ReservationUnit,
} from "../../common/types";
import { ContentContainer, NarrowContainer } from "../../styles/layout";
import { H2 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import LinkPrev from "../LinkPrev";
import { Divider, Strong } from "../../styles/util";
import { localizedValue } from "../../common/util";

interface IRouteParams {
  applicationRoundId: string;
  reservationUnitId: string;
}

const Wrapper = styled.div`
  width: 100%;
  padding-bottom: var(--spacing-5-xl);
`;

const Location = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--spacing-m);
  font-size: var(--fontsize-heading-s);
  margin-bottom: var(--spacing-xl);

  svg {
    position: relative;
    top: var(--spacing-3-xs);
  }
`;

function ReservationsByReservationUnit(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [
    reservationUnit,
    setReservationUnit,
  ] = useState<ReservationUnit | null>(null);
  const [recurringReservations, setRecurringReservations] = useState<
    RecurringReservation[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { applicationRoundId, reservationUnitId } = useParams<IRouteParams>();
  const { t, i18n } = useTranslation();

  const fetchApplicationRound = async (arId: number) => {
    try {
      const applicationRoundResult = await getApplicationRound({
        id: arId,
      });
      setApplicationRound(applicationRoundResult);
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplicationRound");
      setIsLoading(false);
    }
  };

  const fetchRecurringReservations = async (ruId: number) => {
    try {
      console.log("should be a reservation unit filter", ruId);
      const result = await getRecurringReservations({});
      setRecurringReservations(result);
    } catch (error) {
      setErrorMsg("errors.errorFetchingReservations");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchReservationUnit = async (ruId: number) => {
      try {
        const result = await getReservationUnit(ruId);
        setReservationUnit(result);
      } catch (error) {
        setErrorMsg("errors.errorFetchingApplications");
        setIsLoading(false);
      }
    };

    fetchReservationUnit(Number(reservationUnitId));
  }, [reservationUnitId]);

  useEffect(() => {
    fetchApplicationRound(Number(applicationRoundId));
  }, [applicationRoundId]);

  useEffect(() => {
    fetchRecurringReservations(Number(reservationUnitId));
  }, [reservationUnitId]);

  useEffect(() => {
    if (applicationRound && recurringReservations) {
      setIsLoading(false);
    }
  }, [applicationRound, recurringReservations, reservationUnit]);

  if (isLoading) {
    return <Loader />;
  }

  const reservations: Reservation[] = get(
    recurringReservations,
    "0.reservations"
  );

  return (
    <Wrapper>
      {applicationRound && reservationUnit && reservations && (
        <>
          <ContentContainer style={{ marginBottom: "var(--spacing-xl)" }}>
            <LinkPrev
              route={`/applicationRound/${applicationRoundId}/reservationUnit/${reservationUnitId}`}
            />
          </ContentContainer>
          <NarrowContainer>
            <p>{applicationRound.name}</p>
            <div>
              <Strong>
                {t("Reservation.allocatedReservationsForReservationUnit")}
              </Strong>
            </div>
            <Location>
              <IconLocation />
              <H2>{reservationUnit.building.name}</H2>
              <span>{localizedValue(reservationUnit.name, i18n.language)}</span>
            </Location>
            <Divider />
            {/* {allocatedReservations && allocatedReservations.length > 0 ? (
              <Reservations>
                <tbody>
                  {allocatedReservations.map((reservation: Reservation) => (
                    <React.Fragment key={reservation.id}>
                      <tr>
                        <th>{t("common.weekday")}</th>
                        <th>{t("common.date")}</th>
                        <th>{t("common.time")}</th>
                      </tr>
                      <tr>
                        <td>TODO</td>
                        <td>
                          <Strong>{formatDate(reservation.begin)}</Strong>
                        </td>
                        <td>
                          {formatDate(reservation.begin, "H:mm")} -{" "}
                          {formatDate(reservation.end, "H:mm")}
                        </td>
                      </tr>
                    </React.Fragment>
                  ))}
                </tbody>
              </Reservations>
            ) : (
              <div>-</div>
            )} */}
          </NarrowContainer>
          {errorMsg && (
            <Notification
              type="error"
              label={t("errors.functionFailed")}
              position="top-center"
              autoClose={false}
              dismissible
              closeButtonLabelText={t("common.close")}
              displayAutoCloseProgress={false}
              onClose={() => setErrorMsg(null)}
            >
              {t(errorMsg)}
            </Notification>
          )}
        </>
      )}
    </Wrapper>
  );
}

export default withMainMenu(ReservationsByReservationUnit);
