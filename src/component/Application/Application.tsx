import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  Button,
  Notification,
  IconFaceSmile,
  IconDownload,
  IconCalendar,
  IconArrowRight,
} from "hds-react";
import trim from "lodash/trim";
import get from "lodash/get";
import differenceInSeconds from "date-fns/differenceInSeconds";
import {
  getApplication,
  getApplicationRound,
  getRecurringReservations,
  patchApplicationStatus,
} from "../../common/api";
import Loader from "../Loader";
import {
  Application as ApplicationType,
  ApplicationEvent,
  ApplicationRound as ApplicationRoundType,
  ApplicationStatus,
  RecurringReservation,
  Reservation,
  ReservationUnit,
} from "../../common/types";
import {
  ContentContainer,
  DataGrid,
  GridCol,
  NarrowContainer,
  WideContainer,
} from "../../styles/layout";
import { BasicLink, breakpoints, Strong } from "../../styles/util";
import { ContentHeading, H2, H3 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import LinkPrev from "../LinkPrev";
import { ReactComponent as IconCustomers } from "../../images/icon_customers.svg";
import {
  formatDate,
  formatNumber,
  getNormalizedApplicationStatus,
  localizedValue,
  parseDuration,
} from "../../common/util";
import ApplicationStatusBlock from "./ApplicationStatusBlock";
import Accordion from "../Accordion";
import RecommendedSlot from "../ApplicationRound/RecommendedSlot";

interface IRouteParams {
  applicationId: string;
}

const Wrapper = styled.div`
  width: 100%;
  padding-bottom: var(--spacing-5-xl);
`;

const TopLinkContainer = styled.div`
  display: grid;
  grid-template-columns: 1fr;

  @media (min-width: ${breakpoints.l}) {
    display: flex;
    justify-content: space-between;
  }
`;

const StyledLink = styled(BasicLink)`
  display: inline-block;
  margin-top: var(--spacing-s);
  font-size: var(--fontsize-body-s);
`;

const Heading = styled(ContentHeading)`
  margin: var(--spacing-l) 0 var(--spacing-xl);
  display: grid;
  grid-template-columns: calc(48px + var(--spacing-s)) auto;
  word-break: break-all;

  @media (min-width: ${breakpoints.xl}) {
    position: relative;
    left: calc(var(--spacing-4-xl) * -1);
  }
`;

const CustomerIcon = styled.div`
  background-color: var(--color-silver-medium-light);
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--spacing-s);

  svg {
    transform: scale(1.3);
  }
`;

const ApplicantType = styled.dl`
  font-size: var(--fontsize-body-s);
  margin-bottom: var(--spacing-3-xl);

  dt {
    font-family: var(--tilavaraus-admin-font-bold);
    font-weight: bold;
    display: inline-block;
  }

  dd {
    display: inline-block;
    margin: 0 0 0 var(--spacing-3-xs);
  }
`;

const Subheading = styled(H2)``;

const StyledNotification = styled(Notification)`
  margin-bottom: var(--spacing-3-xl);
  padding: var(--spacing-s) var(--spacing-l) var(--spacing-l);

  div[role="heading"] {
    display: none;
  }

  h3 {
    display: inline-flex;
    align-items: center;
    gap: var(--spacing-xs);
  }
`;

const ResolutionContainer = styled.div`
  font-size: var(--fontsize-body-s);

  p {
    margin-bottom: var(--spacing-m);
  }
`;

const DownloadResolutionBtn = styled(Button).attrs({
  style: {
    "--color-bus": "var(--color-black)",
  } as React.CSSProperties,
  variant: "secondary",
  iconLeft: <IconDownload />,
})`
  font-size: var(--fontsize-body-s);
  text-align: left;
  align-items: flex-start;
  margin-top: var(--spacing-xl);
  padding-right: var(--spacing-2-xl);

  svg {
    margin-top: var(--spacing-3-xs);
  }

  div {
    margin-top: var(--spacing-2-xs);
  }

  @media (min-width: ${breakpoints.l}) {
    margin-top: var(--spacing-layout-l);
  }
`;

const StyledAccordion = styled(Accordion).attrs({
  style: {
    "--header-font-size": "var(--fontsize-heading-m)",
  },
})``;

const ReservationWrapper = styled.div`
  padding-bottom: var(--spacing-layout-m);
  border-bottom: 1px solid var(--color-silver);

  th,
  td {
    padding-bottom: 0;
  }
`;

const ReservationListLinkWrapper = styled.div`
  display: block;
  position: relative;
  padding: var(--spacing-xl) 0;
`;

const DeclinedReservations = styled.div`
  h3 {
    margin-top: var(--spacing-l);
    margin-bottom: var(--spacing-xs);
    display: block;
  }
`;

const ReservationListLink = styled(BasicLink)`
  position: absolute;
  right: 0;
`;

const MarkAsResolutionSentBtn = styled(Button)``;

const MarkAsResolutionNotSentBtn = styled(Button).attrs({
  variant: "secondary",
})``;

const ActionButtonContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: var(--spacing-layout-xl);
  margin-bottom: var(--spacing-layout-xl);
`;

const ActionButton = styled(Button)`
  position: absolute;
  right: var(--spacing-layout-xl);
`;

function Application(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [
    applicationRound,
    setApplicationRound,
  ] = useState<ApplicationRoundType | null>(null);
  const [recurringReservations, setRecurringReservations] = useState<
    RecurringReservation[] | null
  >(null);
  const [
    statusNotification,
    setStatusNotification,
  ] = useState<ApplicationStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { applicationId } = useParams<IRouteParams>();
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

  const fetchAllRecurringReservations = async (
    applicationEventsIds: number[]
  ): Promise<RecurringReservation[]> => {
    const recRes = await Promise.all(
      applicationEventsIds.map((applicationEventId) =>
        getRecurringReservations({
          applicationEvent: applicationEventId,
        })
      )
    );

    return recRes.flat();
  };

  const fetchApplicationRound = async (app: ApplicationType) => {
    try {
      const applicationRoundResult = await getApplicationRound({
        id: app.applicationRoundId,
      });
      setApplicationRound(applicationRoundResult);
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplicationRound");
    }
  };

  const fetchRecurringReservations = async (app: ApplicationType) => {
    try {
      const applicationEventIds = app.applicationEvents.map((n) => n.id);
      const recurringReservationsResult = await fetchAllRecurringReservations(
        applicationEventIds
      );

      setRecurringReservations(
        recurringReservationsResult.length > 0
          ? recurringReservationsResult
          : []
      );
    } catch (error) {
      setErrorMsg("errors.errorFetchingReservations");
    }
  };

  useEffect(() => {
    fetchApplication(Number(applicationId));
  }, [applicationId]);

  useEffect(() => {
    if (application?.applicationRoundId) {
      fetchApplicationRound(application);
    }
  }, [application]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (
      application &&
      applicationRound &&
      ["approved", "sent"].includes(applicationRound.status)
    )
      fetchRecurringReservations(application);
  }, [application, applicationRound]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (application && applicationRound && recurringReservations) {
      setIsLoading(false);
    }
  }, [application, applicationRound, recurringReservations]);

  const setApplicationStatus = async (
    app: ApplicationType,
    status: ApplicationStatus,
    useNotification = false
  ) => {
    if (!app) return;
    try {
      setIsSaving(true);
      const result = await patchApplicationStatus(app.id, status);
      fetchApplication(result.id);
      if (useNotification) {
        setStatusNotification(status);
      }
      setErrorMsg(null);
    } catch (error) {
      setErrorMsg("errors.errorSavingApplication");
    } finally {
      setTimeout(() => setIsSaving(false), 1000);
    }
  };

  let action: {
    text?: string;
    button?: "primary" | "secondary";
    function?: () => Promise<void>;
  };
  switch (application?.status) {
    case "draft":
    case "in_review":
    case "review_done":
      action = {
        text: t("Application.actions.declineApplication"),
        button: "secondary",
        function: () => setApplicationStatus(application, "declined", true),
      };
      break;
    case "declined":
      action = {
        text: t("Application.actions.returnAsPartOfAllocation"),
        button: "primary",
        function: () => setApplicationStatus(application, "in_review", true),
      };
      break;
    default:
      action = {};
  }

  if (isLoading) {
    return <Loader />;
  }

  const notificationContent:
    | { heading: string; body: string }
    | undefined = statusNotification
    ? {
        heading: t(
          `Application.saveNotification.${statusNotification}.heading`
        ),
        body: t(`Application.saveNotification.${statusNotification}.body`),
      }
    : undefined;

  const customerName: string | null | undefined =
    application?.applicantType === "individual"
      ? application?.applicantName
      : application?.organisation?.name;

  const isApplicationRoundApproved: boolean | null =
    applicationRound && ["approved", "sent"].includes(applicationRound.status);

  const applicantId: number | null | undefined =
    application?.applicantType === "individual"
      ? application?.applicantId
      : application?.organisation?.id;

  const normalizedApplicationStatus: ApplicationStatus | null =
    application &&
    applicationRound &&
    getNormalizedApplicationStatus(application.status, applicationRound.status);

  const allocatedReservationsVolume: number | undefined =
    recurringReservations?.length &&
    recurringReservations.flatMap(
      (recurringReservation: RecurringReservation) =>
        recurringReservation.reservations
    ).length;

  const allocatedReservationsDuration: number | undefined =
    recurringReservations?.length &&
    recurringReservations
      .flatMap(
        (recurringReservation: RecurringReservation) =>
          recurringReservation.reservations
      )
      .reduce((acc: number, cur: Reservation) => {
        const diff: number = differenceInSeconds(
          new Date(cur.begin),
          new Date(cur.end)
        );
        return acc + Math.abs(diff);
      }, 0);

  return (
    <Wrapper>
      {application && applicationRound && (
        <>
          <ContentContainer>
            <LinkPrev
              route={
                isApplicationRoundApproved
                  ? `/applicationRound/${application.applicationRoundId}/applications`
                  : `/applicationRound/${application.applicationRoundId}`
              }
            />
          </ContentContainer>
          <NarrowContainer>
            <TopLinkContainer>
              <StyledLink
                to={`/application/${application.id}/details`}
                data-testid="application__link--details"
              >
                {t("ApplicationRound.showClientApplication")}
              </StyledLink>
              {isApplicationRoundApproved &&
                applicantId &&
                allocatedReservationsVolume &&
                allocatedReservationsVolume > 0 && (
                  <StyledLink
                    to={`/applicationRound/${applicationRound.id}/${
                      application.organisation?.id
                        ? "organisation"
                        : "applicant"
                    }/${applicantId}`}
                  >
                    {t("Application.showAllocationResultsOfApplicant")}
                  </StyledLink>
                )}
            </TopLinkContainer>
            <Heading data-testid="application__heading--main">
              <CustomerIcon>
                <IconCustomers />
              </CustomerIcon>
              <span>{customerName}</span>
            </Heading>
            <ApplicantType>
              <dt>{t("Application.applicantType")}:</dt>
              <dd data-testid="application__data--applicant-type">
                {application.applicantType &&
                  t(`Application.applicantTypes.${application.applicantType}`)}
              </dd>
            </ApplicantType>
            <ApplicationStatusBlock
              status={application.status}
              view={applicationRound.status}
            />
            {notificationContent ? (
              <StyledNotification
                type="success"
                dismissible
                onClose={() => setStatusNotification(null)}
                closeButtonLabelText={`${t("common.close")}`}
                label={notificationContent.heading}
              >
                <H3>
                  <IconFaceSmile size="m" /> {notificationContent.heading}
                </H3>
                <div>{notificationContent.body}</div>
              </StyledNotification>
            ) : null}
            <DataGrid>
              <GridCol>
                <Subheading>{t("ApplicationRound.recommendedAid")}</Subheading>
                <table>
                  <tbody>
                    <tr>
                      <th>{t("ApplicationRound.appliedReservations")}</th>
                      <td data-testid="application__data--reservations-total">{`${formatNumber(
                        application.aggregatedData.reservationsTotal,
                        t("common.volumeUnit")
                      )}`}</td>
                    </tr>
                    <tr>
                      <th>{t("ApplicationRound.totalReservationTime")}</th>
                      <td data-testid="application__data--min-duration-total">{`${parseDuration(
                        application.aggregatedData.minDurationTotal
                      )}`}</td>
                    </tr>
                  </tbody>
                </table>
              </GridCol>
              <GridCol />
            </DataGrid>
            {isApplicationRoundApproved && (
              <>
                <ResolutionContainer>
                  <DataGrid>
                    <GridCol>
                      <Subheading>{t("Application.resolution")}</Subheading>
                      {["declined"].includes(application.status) ? (
                        <>
                          <p>{t("Application.declinedFromAllocation")}</p>
                          <p>
                            <Strong
                              style={{ fontSize: "var(--fontsize-heading-xs)" }}
                            >
                              {t("Application.noAllocatedReservations")}
                            </Strong>
                          </p>
                        </>
                      ) : (
                        <>
                          <p>{t("Application.graduatedToAllocation")}</p>
                          <table>
                            <tbody>
                              {allocatedReservationsVolume &&
                              allocatedReservationsVolume > 0 ? (
                                <>
                                  <tr>
                                    <th>
                                      {t("Application.allocatedReservations")}
                                    </th>
                                    <td>
                                      {allocatedReservationsVolume}{" "}
                                      {t("common.volumeUnit")}
                                    </td>
                                  </tr>
                                  <tr>
                                    <th>
                                      {t(
                                        "ApplicationRound.totalReservationTime"
                                      )}
                                    </th>
                                    <td>
                                      {parseDuration(
                                        allocatedReservationsDuration
                                      )}
                                    </td>
                                  </tr>
                                </>
                              ) : (
                                <tr>
                                  <td>
                                    <Strong
                                      style={{
                                        fontSize: "var(--fontsize-heading-xs)",
                                      }}
                                    >
                                      {t("Application.noAllocatedReservations")}
                                    </Strong>
                                  </td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </>
                      )}
                    </GridCol>
                    <GridCol>
                      <DownloadResolutionBtn onClick={() => {}}>
                        <Strong>
                          {t("Application.downloadResolution")} TODO
                        </Strong>
                        <div>(.pdf)</div>
                      </DownloadResolutionBtn>
                      {normalizedApplicationStatus === "approved" && (
                        <p>{t("Application.downloadResolutionHelper")}</p>
                      )}
                    </GridCol>
                  </DataGrid>
                </ResolutionContainer>
              </>
            )}
          </NarrowContainer>
          <ContentContainer>
            {isApplicationRoundApproved &&
              !["declined"].includes(application.status) && (
                <WideContainer>
                  {recurringReservations && recurringReservations.length > 0 && (
                    <StyledAccordion
                      heading={t(
                        "Application.summaryOfAllocatedApplicationEvents"
                      )}
                      defaultOpen={false}
                    >
                      <NarrowContainer
                        style={{
                          paddingRight: 0,
                          marginLeft: 'calc(var("--spacing-layout-m") * -1)',
                        }}
                      >
                        {recurringReservations.map((recurringReservation) => {
                          const applicationEvent:
                            | ApplicationEvent
                            | undefined = application.applicationEvents.find(
                            (n: ApplicationEvent) =>
                              n.id ===
                              get(recurringReservation, "applicationEventId")
                          );

                          const reservationUnit:
                            | ReservationUnit
                            | undefined = get(
                            recurringReservation,
                            "reservations.0.reservationUnit.0"
                          );

                          const beginDate: string | null =
                            recurringReservation.firstReservationBegin;

                          const endDate: string | null =
                            recurringReservation.lastReservationEnd;

                          const weekday: number | null = get(
                            recurringReservation,
                            "reservations.0.beginWeekday"
                          );

                          const duration: number = Math.abs(
                            differenceInSeconds(
                              new Date(
                                get(
                                  recurringReservation,
                                  "reservations.0.begin"
                                )
                              ),
                              new Date(
                                get(recurringReservation, "reservations.0.end")
                              )
                            )
                          );

                          return (
                            applicationEvent &&
                            reservationUnit && (
                              <ReservationWrapper key={applicationEvent.id}>
                                <H2>{applicationEvent?.name}</H2>
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
                                          <th>{t("Application.space")}</th>
                                          <td>
                                            {trim(
                                              `${
                                                reservationUnit.building
                                                  ?.name || ""
                                              }, ${
                                                localizedValue(
                                                  reservationUnit.name,
                                                  i18n.language
                                                ) || ""
                                              }`,
                                              ", "
                                            )}
                                          </td>
                                        </tr>
                                        <tr>
                                          <th>
                                            {t("Application.headings.purpose")}
                                          </th>
                                          <td>{applicationEvent.purpose}</td>
                                        </tr>
                                      </tbody>
                                    </table>
                                  </GridCol>
                                  <GridCol />
                                </DataGrid>
                                <table>
                                  <RecommendedSlot
                                    id={applicationEvent.id || null}
                                    start={beginDate}
                                    end={endDate}
                                    weekday={weekday}
                                    biweekly={
                                      applicationEvent.biweekly || false
                                    }
                                    durationStr={parseDuration(duration)}
                                    timeStart={formatDate(
                                      beginDate || "",
                                      "H:mm:ss"
                                    )}
                                    timeEnd={formatDate(
                                      endDate || "",
                                      "H:mm:ss"
                                    )}
                                  />
                                </table>
                                {recurringReservation.deniedReservations
                                  ?.length > 0 && (
                                  <DeclinedReservations>
                                    <H3>
                                      {t("Application.declinedReservations")}
                                    </H3>
                                    <div>
                                      {trim(
                                        recurringReservation.deniedReservations
                                          .map(
                                            (n: Reservation) =>
                                              `${formatDate(n.begin)}, `
                                          )
                                          .join(", "),
                                        ", "
                                      )}
                                    </div>
                                  </DeclinedReservations>
                                )}
                                <ReservationListLinkWrapper>
                                  <ReservationListLink
                                    to={`/application/${applicationId}/recurringReservation/${recurringReservation.id}`}
                                  >
                                    <IconCalendar />{" "}
                                    {t("Application.showDetailedResultList")}{" "}
                                    <IconArrowRight />
                                  </ReservationListLink>
                                </ReservationListLinkWrapper>
                              </ReservationWrapper>
                            )
                          );
                        })}
                      </NarrowContainer>
                    </StyledAccordion>
                  )}
                  <ActionButtonContainer>
                    {normalizedApplicationStatus === "approved" && (
                      <MarkAsResolutionSentBtn
                        onClick={() =>
                          setApplicationStatus(application, "sent")
                        }
                      >
                        {t("Application.markAsResolutionSent")}
                      </MarkAsResolutionSentBtn>
                    )}
                    {normalizedApplicationStatus === "sent" && (
                      <MarkAsResolutionNotSentBtn
                        onClick={() =>
                          setApplicationStatus(application, "in_review")
                        }
                      >
                        {t("Application.markAsResolutionNotSent")}
                      </MarkAsResolutionNotSentBtn>
                    )}
                  </ActionButtonContainer>
                </WideContainer>
              )}
            {["draft", "in_review"].includes(applicationRound.status) &&
              action.function && (
                <ActionButton
                  data-testid="application__button--toggle-state"
                  id="submit"
                  variant={action.button}
                  onClick={() =>
                    action.function && !isSaving && action.function()
                  }
                >
                  {action.text}
                </ActionButton>
              )}
          </ContentContainer>
        </>
      )}
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
    </Wrapper>
  );
}

export default withMainMenu(Application);
