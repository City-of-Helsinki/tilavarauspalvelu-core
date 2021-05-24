import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IconLocation, Notification } from "hds-react";
import {
  getApplicationRound,
  getReservations,
  getReservationUnit,
} from "../../common/api";
import Loader from "../Loader";
import {
  ApplicationRound as ApplicationRoundType,
  Reservation,
  ReservationUnit,
} from "../../common/types";
import { ContentContainer, NarrowContainer } from "../../styles/layout";
import { H2 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import LinkPrev from "../LinkPrev";
import { BasicLink, breakpoints, Divider, Strong } from "../../styles/util";
import { formatDate, localizedValue } from "../../common/util";
import { weekdays } from "../../common/const";
import { ReactComponent as IconBulletList } from "../../images/icon_list-bullet.svg";

interface IRouteParams {
  applicationRoundId: string;
  reservationUnitId: string;
}

const Wrapper = styled.div`
  width: 100%;
  padding-bottom: var(--spacing-5-xl);
`;

const TitleContainer = styled.div`
  @media (min-width: ${breakpoints.l}) {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
  }

  a {
    margin-top: var(--spacing-l);
  }
`;

const Location = styled.div`
  display: flex;
  align-items: baseline;
  gap: var(--spacing-m);
  font-size: var(--fontsize-heading-s);
  margin-top: var(--spacing-xl);

  h2 {
    margin-bottom: var(--spacing-s);
  }

  svg {
    position: relative;
    top: var(--spacing-3-xs);
  }
`;

const Space = styled.div`
  font-size: var(--fontsize-heading-m);
`;

const TableWrapper = styled.div`
  overflow-x: auto;
  position: relative;
  width: 100%;
`;

const Reservations = styled.table`
  width: 100%;
  border-spacing: 0;
  min-width: ${breakpoints.m};

  th {
    text-align: left;
    padding-bottom: var(--spacing-m);
  }

  tbody {
    tr:last-of-type td {
      border: 0;
    }

    td {
      padding-top: var(--spacing-m);
      padding-bottom: var(--spacing-m);
      border-bottom: 1px solid var(--color-black);
    }
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
  const [reservations, setReservations] = useState<Reservation[] | null>(null);
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

  const fetchReservations = async (ruId: string) => {
    try {
      const result = await getReservations({ reservationUnit: ruId });
      setReservations(result);
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
    fetchReservations(reservationUnitId);
  }, [reservationUnitId]);

  useEffect(() => {
    if (applicationRound && reservations && reservationUnit) {
      setIsLoading(false);
    }
  }, [applicationRound, reservations, reservationUnit]);

  if (isLoading) {
    return <Loader />;
  }

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
            <TitleContainer>
              <Location>
                <IconLocation />
                <div>
                  <H2>{reservationUnit.building.name}</H2>
                  <Space>
                    {localizedValue(reservationUnit.name, i18n.language)}
                  </Space>
                </div>
              </Location>
              <BasicLink
                to={`/applicationRound/${applicationRoundId}/reservationUnit/${reservationUnitId}/reservations/summary`}
              >
                <IconBulletList /> {t("Reservation.showSummaryOfReservations")}
              </BasicLink>
            </TitleContainer>
            <Divider />
            {reservations && reservations.length > 0 ? (
              <TableWrapper>
                <Reservations>
                  <thead>
                    <tr>
                      <th>{t("common.date")}</th>
                      <th>{t("common.weekday")}</th>
                      <th>{t("common.time")}</th>
                      <th>{t("Reservation.headings.applicant")}</th>
                      <th>{t("Reservation.headings.schedule")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reservations.map((reservation: Reservation) => (
                      <tr key={reservation.id}>
                        <td>
                          <Strong>
                            {formatDate(reservation.begin) || "-"}
                          </Strong>
                        </td>
                        <td>
                          {reservation.beginWeekday
                            ? t(
                                `calendar.${
                                  weekdays[Number(reservation.beginWeekday)]
                                }`
                              )
                            : "-"}
                        </td>
                        <td>
                          {formatDate(reservation.begin, "H:mm")} -{" "}
                          {formatDate(reservation.end, "H:mm")}
                        </td>
                        <td>{reservation.reservationUser || "-"}</td>
                        <td>{reservation.applicationEventName || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </Reservations>
              </TableWrapper>
            ) : (
              <div>{t("Reservation.noReservations")}</div>
            )}
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
