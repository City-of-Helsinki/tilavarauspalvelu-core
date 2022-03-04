import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IconLocation, Notification } from "hds-react";
import get from "lodash/get";
import trim from "lodash/trim";
import differenceInSeconds from "date-fns/differenceInSeconds";
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
import { H2, H3 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import LinkPrev from "../LinkPrev";
import { BasicLink, breakpoints, Divider, Strong } from "../../styles/util";
import {
  formatDate,
  localizedValue,
  parseAgeGroups,
  parseDuration,
} from "../../common/util";
import { ReactComponent as IconBulletList } from "../../images/icon_list-bullet.svg";
import RecommendedSlot from "./RecommendedSlot";
import { applicationRoundUrl } from "../../common/urls";

interface IRouteParams {
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

const ApplicationEventName = styled(H2)`
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
  const [isLoading, setIsLoading] = useState(true);
  const [applicationRound, setApplicationRound] =
    useState<ApplicationRoundType | null>(null);
  const [reservationUnit, setReservationUnit] =
    useState<ReservationUnit | null>(null);
  const [recurringReservations, setRecurringReservations] = useState<
    RecurringReservation[] | null
  >(null);
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
      const result = await getRecurringReservations({ reservationUnit: ruId });
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
    fetchReservations(reservationUnitId);
  }, [reservationUnitId]);

  useEffect(() => {
    if (applicationRound && recurringReservations && reservationUnit) {
      setIsLoading(false);
    }
  }, [applicationRound, recurringReservations, reservationUnit]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      {applicationRound && reservationUnit && recurringReservations && (
        <>
          <ContentContainer style={{ marginBottom: "var(--spacing-xl)" }}>
            <LinkPrev
              route={`${applicationRoundUrl(
                applicationRoundId
              )}/reservationUnit/${reservationUnitId}`}
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
                <IconLocation aria-hidden />
                <div>
                  <H2>{reservationUnit.building.name}</H2>
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
                  const reservationUser: string | null = get(
                    recurringReservation,
                    "reservations.0.reservationUser"
                  );

                  const beginDate: string | null =
                    recurringReservation.firstReservationBegin;

                  const endDate: string | null =
                    recurringReservation.lastReservationEnd;

                  const weekday: number | null = get(
                    recurringReservation,
                    "reservations.0.beginWeekday"
                  );

                  const applicationEventName: string | null = get(
                    recurringReservation,
                    "reservations.0.applicationEventName"
                  );

                  const duration: number = Math.abs(
                    differenceInSeconds(
                      new Date(
                        get(recurringReservation, "reservations.0.begin")
                      ),
                      new Date(get(recurringReservation, "reservations.0.end"))
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
                          durationStr={parseDuration(duration)}
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

export default withMainMenu(ReservationSummariesByReservationUnit);
