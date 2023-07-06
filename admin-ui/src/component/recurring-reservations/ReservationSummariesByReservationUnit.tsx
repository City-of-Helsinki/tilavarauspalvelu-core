import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IconLocation } from "hds-react";
import trim from "lodash/trim";
import differenceInSeconds from "date-fns/differenceInSeconds";
import { H2, H3, Strong } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
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
import {
  ContentContainer,
  DataGrid,
  GridCol,
  NarrowContainer,
} from "../../styles/layout";
import LinkPrev from "../LinkPrev";
import { BasicLink, Divider } from "../../styles/util";
import {
  formatDate,
  localizedValue,
  parseAgeGroups,
  formatDuration,
} from "../../common/util";
import IconBulletList from "../../images/icon_list-bullet.svg";
import RecommendedSlot from "./RecommendedSlot";
import { applicationRoundUrl } from "../../common/urls";
import { useNotification } from "../../context/NotificationContext";

interface IRouteParams {
  [key: string]: string;
  applicationRoundId: string;
  reservationUnitId: string;
}

const Wrapper = styled.div`
  width: 100%;
  padding-bottom: var(--spacing-5-xl);
`;

const TitleContainer = styled.div`
  margin-bottom: var(--spacing-xl);

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

const ReservationWrapper = styled.div`
  padding-top: var(--spacing-layout-m);
  padding-bottom: var(--spacing-layout-m);
  border-top: 1px solid var(--color-silver);

  th,
  td {
    padding-bottom: 0;
  }
`;

const ReservationUser = styled.div`
  font-size: var(--fontsize-heading-m);
`;

const ApplicationEventName = styled(H2).attrs({ $legacy: true })`
  margin-top: var(--spacing-2-xs);
`;

const DeclinedReservations = styled.div`
  h3 {
    margin-top: var(--spacing-l);
    margin-bottom: var(--spacing-xs);
    display: block;
  }
`;

function ReservationSummariesByReservationUnit(): JSX.Element | null {
  const { notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [applicationRound, setApplicationRound] =
    useState<ApplicationRoundType | null>(null);
  const [reservationUnit, setReservationUnit] =
    useState<ReservationUnit | null>(null);
  const [recurringReservations, setRecurringReservations] = useState<
    RecurringReservation[] | null
  >(null);

  const { applicationRoundId, reservationUnitId } = useParams<IRouteParams>();
  const { t, i18n } = useTranslation();

  const fetchApplicationRound = async (arId: number) => {
    try {
      const applicationRoundResult = await getApplicationRound({
        id: arId,
      });
      setApplicationRound(applicationRoundResult);
    } catch (error) {
      notifyError(t("errors.errorFetchingApplicationRound"));
      setIsLoading(false);
    }
  };

  const fetchReservations = async (ruId: string) => {
    try {
      const result = await getRecurringReservations({ reservationUnit: ruId });
      setRecurringReservations(result);
    } catch (error) {
      notifyError(t("errors.errorFetchingReservations"));
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const fetchReservationUnit = async (ruId: number) => {
      try {
        const result = await getReservationUnit(ruId);
        setReservationUnit(result);
      } catch (error) {
        notifyError(t("errors.errorFetchingApplications"));
        setIsLoading(false);
      }
    };

    fetchReservationUnit(Number(reservationUnitId));
  }, [notifyError, reservationUnitId, t]);

  useEffect(() => {
    fetchApplicationRound(Number(applicationRoundId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationRoundId]);

  useEffect(() => {
    if (reservationUnitId) {
      fetchReservations(reservationUnitId);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reservationUnitId]);

  useEffect(() => {
    if (applicationRound && recurringReservations && reservationUnit) {
      setIsLoading(false);
    }
  }, [applicationRound, recurringReservations, reservationUnit]);

  if (isLoading || !applicationRoundId) {
    return <Loader />;
  }

  return (
    <Wrapper>
      {applicationRound && reservationUnit && recurringReservations && (
        <>
          {applicationRoundId ? (
            <ContentContainer style={{ marginBottom: "var(--spacing-xl)" }}>
              <LinkPrev
                route={`${applicationRoundUrl(
                  applicationRoundId
                )}/reservationUnit/${reservationUnitId}`}
              />
            </ContentContainer>
          ) : null}
          <NarrowContainer>
            <p>{applicationRound.name}</p>
            <div>
              <Strong>
                {t("Reservation.allocatedReservationsForReservationUnit")}
              </Strong>
            </div>
            <TitleContainer>
              <Location>
                <IconLocation aria-hidden />
                <div>
                  <H2 $legacy>{reservationUnit.unit?.name.fi}</H2>
                  <Space>
                    {localizedValue(reservationUnit.name, i18n.language)}
                  </Space>
                </div>
              </Location>
              <BasicLink
                to={`${applicationRoundUrl(
                  applicationRoundId
                )}/reservationUnit/${reservationUnitId}/reservations`}
              >
                <IconBulletList aria-hidden />{" "}
                {t("Reservation.showReservations")}
              </BasicLink>
            </TitleContainer>
            {recurringReservations && recurringReservations.length > 0 ? (
              recurringReservations.map(
                (recurringReservation: RecurringReservation) => {
                  const reservationUser: string | null | undefined =
                    recurringReservation.reservations[0]?.reservationUser;

                  const beginDate: string | null =
                    recurringReservation.firstReservationBegin;

                  const endDate: string | null =
                    recurringReservation.lastReservationEnd;

                  const weekday: number | null | undefined =
                    recurringReservation.reservations?.[0].beginWeekday;

                  const applicationEventName: string | null | undefined =
                    recurringReservation.reservations[0]?.applicationEventName;

                  const duration: number = Math.abs(
                    differenceInSeconds(
                      new Date(recurringReservation.reservations?.[0].begin),
                      new Date(recurringReservation.reservations?.[0].end)
                    )
                  );

                  return (
                    <ReservationWrapper key="1">
                      <ReservationUser>{reservationUser}</ReservationUser>
                      <ApplicationEventName>
                        {applicationEventName}
                      </ApplicationEventName>
                      <DataGrid
                        style={{
                          borderTop: 0,
                          paddingTop: 0,
                          marginBottom: "var(--spacing-layout-s)",
                        }}
                      >
                        <GridCol>
                          <table>
                            <tbody>
                              <tr>
                                <th>{t("Recommendation.labelAgeGroup")}</th>
                                <td>
                                  {parseAgeGroups(
                                    recurringReservation.ageGroup
                                  )}
                                </td>
                              </tr>
                              <tr>
                                <th>{t("ApplicationEvent.groupSize")}</th>
                                <td>
                                  {t("common.personUnit", {
                                    count: recurringReservation.groupSize || 0,
                                  })}
                                </td>
                              </tr>
                              <tr>
                                <th>{t("Application.headings.purpose")}</th>
                                <td>{recurringReservation.purposeName}</td>
                              </tr>
                            </tbody>
                          </table>
                        </GridCol>
                        <GridCol />
                      </DataGrid>
                      <table>
                        <RecommendedSlot
                          id={recurringReservation.applicationEventId}
                          start={beginDate}
                          end={endDate}
                          weekday={weekday}
                          biweekly={recurringReservation.biweekly} // TODO
                          durationStr={formatDuration(duration)}
                          timeStart={formatDate(beginDate || "", "H:mm:ss")}
                          timeEnd={formatDate(endDate || "", "H:mm:ss")}
                        />
                      </table>
                      {recurringReservation.deniedReservations?.length > 0 && (
                        <DeclinedReservations>
                          <H3>{t("Application.declinedReservations")}</H3>
                          <div>
                            {trim(
                              recurringReservation.deniedReservations
                                .map((n: Reservation) => formatDate(n.begin))
                                .reverse()
                                .join(", "),
                              ", "
                            )}
                          </div>
                        </DeclinedReservations>
                      )}
                    </ReservationWrapper>
                  );
                }
              )
            ) : (
              <>
                <Divider />
                <div>{t("Reservation.noReservations")}</div>
              </>
            )}
          </NarrowContainer>
        </>
      )}
    </Wrapper>
  );
}

export default ReservationSummariesByReservationUnit;
