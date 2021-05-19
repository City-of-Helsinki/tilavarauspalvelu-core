import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IconLocation, Notification } from "hds-react";
import get from "lodash/get";
import {
  getApplication,
  getApplicationRound,
  getRecurringReservations,
} from "../../common/api";
import Loader from "../Loader";
import {
  Application as ApplicationType,
  ApplicationEvent,
  ApplicationRound as ApplicationRoundType,
  RecurringReservation,
  Reservation,
  ReservationUnit,
} from "../../common/types";
import { ContentContainer, NarrowContainer } from "../../styles/layout";
import { ContentHeading, H2, H3 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import LinkPrev from "../LinkPrev";
import { Divider, Strong } from "../../styles/util";
import { formatDate, localizedValue } from "../../common/util";

interface IRouteParams {
  applicationId: string;
  applicationEventId: string;
}

const Wrapper = styled.div`
  width: 100%;
  padding-bottom: var(--spacing-5-xl);
`;

const Heading = styled(ContentHeading)`
  margin: var(--spacing-m) 0;
  word-break: break-all;
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

const Subheading = styled(H3)`
  margin-bottom: var(--spacing-l);
`;

const Reservations = styled.table`
  margin-bottom: var(--spacing-3-xl);
  border-spacing: 0;

  th {
    font-family: var(--tilavaraus-admin-font-bold);
    font-weight: 700;
    padding-bottom: var(--spacing-xs);
  }

  th,
  td {
    padding-right: var(--spacing-l);
  }

  td {
    padding-bottom: var(--spacing-2-xs);
  }
`;

function Result(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [recurringReservations, setRecurringReservations] = useState<
    RecurringReservation[]
  >([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { applicationId, applicationEventId } = useParams<IRouteParams>();
  const { t, i18n } = useTranslation();

  const fetchApplication = async (id: number) => {
    try {
      const result = await getApplication(id);

      setApplication(result);
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplication");
      setIsLoading(false);
    }
  };

  const fetchApplicationRound = async (app: ApplicationType) => {
    try {
      const applicationRoundResult = await getApplicationRound({
        id: app.applicationRoundId,
      });
      setApplicationRound(applicationRoundResult);
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplicationRound");
      setIsLoading(false);
    }
  };

  const fetchRecurringReservations = async (aeId: number) => {
    try {
      const result = await getRecurringReservations({
        applicationEvent: aeId,
      });
      setRecurringReservations(result);
    } catch (error) {
      setErrorMsg("errors.errorFetchingReservations");
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication(Number(applicationId));
  }, [applicationId]);

  useEffect(() => {
    if (application?.applicationRoundId) {
      fetchApplicationRound(application);
    }
  }, [application]);

  useEffect(() => {
    if (applicationEventId) {
      fetchRecurringReservations(Number(applicationEventId));
    }
  }, [applicationEventId]);

  useEffect(() => {
    if (application && applicationRound && recurringReservations) {
      setIsLoading(false);
    }
  }, [application, applicationRound, recurringReservations]);

  if (isLoading) {
    return <Loader />;
  }

  const customerName =
    application?.applicantType === "individual"
      ? application?.applicantName
      : application?.organisation?.name;

  const applicationEvent:
    | ApplicationEvent
    | undefined = application?.applicationEvents.find(
    (n: ApplicationEvent) =>
      n.id === get(recurringReservations, "0.applicationEventId")
  );

  const reservationUnit: ReservationUnit | undefined = get(
    recurringReservations,
    "0.reservations.0.reservationUnit.0"
  );

  const reservations: Reservation[] = get(
    recurringReservations,
    "0.reservations"
  );

  const allocatedReservations = reservations.filter(
    (n) => !["declined"].includes(n.state)
  );
  const declinedReservations = reservations.filter((n) =>
    ["declined"].includes(n.state)
  );

  return (
    <Wrapper>
      {application &&
        applicationRound &&
        applicationEvent &&
        reservationUnit &&
        reservations && (
          <>
            <ContentContainer style={{ marginBottom: "var(--spacing-xl)" }}>
              <LinkPrev route={`/application/${applicationId}`} />
            </ContentContainer>
            <NarrowContainer>
              <p>{customerName}</p>
              <Heading>{applicationEvent.name}</Heading>
              <p>
                <Strong>{t("Application.allocatedReservations")}</Strong>
              </p>
              <div>{applicationRound.name}</div>
              <Divider />
              <Location>
                <IconLocation />
                <H2>{reservationUnit.building.name}</H2>
                <span>
                  {localizedValue(reservationUnit.name, i18n.language)}
                </span>
              </Location>
              <Subheading>
                {t("Application.allocatedForGroupX", {
                  group: applicationEvent.name,
                })}
              </Subheading>
              {allocatedReservations && allocatedReservations.length > 0 ? (
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
              )}
              <Subheading>{t("Application.declinedReservations")}</Subheading>
              {declinedReservations && declinedReservations.length > 0 ? (
                <Reservations>
                  <tbody>
                    {declinedReservations.map((reservation: Reservation) => (
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
                            {formatDate(reservation.begin, "H:mm")}—
                            {formatDate(reservation.end, "H:mm")}
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                  </tbody>
                </Reservations>
              ) : (
                <div>-</div>
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

export default withMainMenu(Result);
