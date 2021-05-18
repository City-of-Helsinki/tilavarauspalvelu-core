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
import sortBy from "lodash/sortBy";
import trim from "lodash/trim";
import {
  getAllocationResults,
  getApplication,
  getApplicationRound,
  saveApplication,
} from "../../common/api";
import Loader from "../Loader";
import {
  AllocationResult,
  Application as ApplicationType,
  ApplicationRound as ApplicationRoundType,
  ApplicationStatus,
} from "../../common/types";
import {
  ContentContainer,
  NarrowContainer,
  WideContainer,
} from "../../styles/layout";
import { BasicLink, breakpoints, Strong } from "../../styles/util";
import { ContentHeading, H2, H3 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import LinkPrev from "../LinkPrev";
import { ReactComponent as IconCustomers } from "../../images/icon_customers.svg";
import {
  formatNumber,
  getNormalizedApplicationStatus,
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

const GridCol = styled.div`
  &:last-child {
    padding-bottom: var(--spacing-xl);
  }

  font-size: var(--fontsize-heading-xs);
  line-height: 1.75;

  table {
    width: 100%;
  }

  th {
    text-align: left;
    padding: 0 0 var(--spacing-xs) 0;
  }

  td {
    padding: 0 0 var(--spacing-xs) 0;
    width: 17%;
    white-space: nowrap;
  }

  p {
    font-size: var(--fontsize-body-s);
    padding-right: 20%;
  }

  @media (min-width: ${breakpoints.l}) {
    padding-right: 20%;

    h3 {
      margin-top: 0;
    }

    p {
      padding: 0;
    }
  }
`;

const DataGrid = styled.div`
  display: grid;
  border-top: 1px solid var(--color-silver);
  padding-top: var(--spacing-xl);
  margin-bottom: var(--spacing-layout-xl);

  th {
    padding-right: var(--spacing-l);
  }

  &:last-of-type {
    margin-bottom: var(--spacing-layout-s);
  }

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
    border-bottom: 0;
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

const RecommendationWrapper = styled.div`
  padding-bottom: var(--spacing-layout-m);
  border-bottom: 1px solid var(--color-silver);
`;

const RecommendationListLinkWrapper = styled.div`
  display: block;
  position: relative;
  padding: var(--spacing-xl) 0;
`;

const RecommendationListLink = styled(BasicLink)`
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
  const [allocationResults, setAllocationResults] = useState<
    AllocationResult[]
  >([]);
  const [
    statusNotification,
    setStatusNotification,
  ] = useState<ApplicationStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { applicationId } = useParams<IRouteParams>();
  const { t } = useTranslation();

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

      if (["approved", "sent"].includes(applicationRoundResult.status)) {
        const applicationEventIds = app.applicationEvents
          .map((n) => n.id)
          .join(",");
        const result = await getAllocationResults({
          applicationRoundId: app.applicationRoundId,
          applicationEvent: applicationEventIds,
        });
        setAllocationResults(
          sortBy(result, ["unitName", "allocatedReservationUnitName"])
        );
      }
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplicationRound");
    } finally {
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

  const setApplicationStatus = async (
    app: ApplicationType,
    status: ApplicationStatus
  ) => {
    if (!app) return;
    const payload = { ...app, status };
    try {
      setIsSaving(true);
      const result = await saveApplication(payload);
      fetchApplication(result.id);
      setStatusNotification(status);
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
        function: () => setApplicationStatus(application, "declined"),
      };
      break;
    case "declined":
      action = {
        text: t("Application.actions.returnAsPartOfAllocation"),
        button: "primary",
        function: () => setApplicationStatus(application, "in_review"),
      };
      break;
    default:
      action = {};
  }

  if (isLoading) {
    return <Loader />;
  }

  const notificationContent = statusNotification
    ? {
        heading: t(
          `Application.saveNotification.${statusNotification}.heading`
        ),
        body: t(`Application.saveNotification.${statusNotification}.body`),
      }
    : undefined;

  const customerName =
    application?.applicantType === "individual"
      ? application?.applicantName
      : application?.organisation?.name;

  const isApplicationRoundApproved =
    applicationRound && ["approved", "sent"].includes(applicationRound.status);

  const applicantId =
    application?.applicantType === "individual"
      ? application?.applicantId
      : application?.organisation?.id;

  const normalizedApplicationStatus =
    application &&
    applicationRound &&
    getNormalizedApplicationStatus(application.status, applicationRound.status);

  const allocatedSum = {
    reservationsTotal: allocationResults.reduce((acc, cur) => {
      return cur?.aggregatedData?.reservationsTotal
        ? acc + cur.aggregatedData.reservationsTotal
        : acc;
    }, 0),
    durationTotal: allocationResults.reduce((acc, cur) => {
      return cur?.aggregatedData?.durationTotal
        ? acc + cur.aggregatedData.durationTotal
        : acc;
    }, 0),
  };

  return (
    <Wrapper>
      {application && applicationRound && (
        <>
          <ContentContainer>
            <LinkPrev
              route={`/applicationRound/${application.applicationRoundId}`}
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
                allocationResults.length > 0 && (
                  <StyledLink
                    to={`/applicationRound/${applicationRound.id}/applicant/${applicantId}`}
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
                              <tr>
                                <th>
                                  {t("Application.allocatedReservations")}
                                </th>
                                <td>
                                  {allocatedSum.reservationsTotal}{" "}
                                  {t("common.volumeUnit")}
                                </td>
                              </tr>
                              <tr>
                                <th>
                                  {t("ApplicationRound.totalReservationTime")}
                                </th>
                                <td>
                                  {parseDuration(allocatedSum.durationTotal) ||
                                    "-"}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </>
                      )}
                    </GridCol>
                    <GridCol>
                      <DownloadResolutionBtn
                        onClick={() => console.log("TODO")}
                      >
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
                  {allocationResults.length > 0 && (
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
                        {allocationResults.map((allocationResult) => {
                          return (
                            <RecommendationWrapper
                              key={allocationResult.applicationEventScheduleId}
                            >
                              <H2>{allocationResult.applicationEvent.name}</H2>
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
                                              allocationResult.unitName || ""
                                            }, ${
                                              allocationResult.allocatedReservationUnitName ||
                                              ""
                                            }`,
                                            ", "
                                          )}
                                        </td>
                                      </tr>
                                      <tr>
                                        <th>
                                          {t("Application.headings.purpose")}
                                        </th>
                                        <td>
                                          {
                                            allocationResult.applicationEvent
                                              .purpose
                                          }
                                        </td>
                                      </tr>
                                    </tbody>
                                  </table>
                                </GridCol>
                                <GridCol />
                              </DataGrid>
                              <table>
                                <RecommendedSlot
                                  id={
                                    allocationResult.applicationEventScheduleId
                                  }
                                  start={
                                    allocationResult.applicationEvent.begin
                                  }
                                  end={allocationResult.applicationEvent.end}
                                  weekday={allocationResult.allocatedDay}
                                  biweekly={
                                    allocationResult.applicationEvent.biweekly
                                  }
                                  timeStart={allocationResult.allocatedBegin}
                                  timeEnd={allocationResult.allocatedEnd}
                                  duration={allocationResult.allocatedDuration}
                                />
                              </table>
                              <RecommendationListLinkWrapper>
                                <RecommendationListLink
                                  to={`/application/${applicationId}/result/${allocationResult.applicationEventScheduleId}`}
                                >
                                  <IconCalendar />{" "}
                                  {t("Application.showDetailedResultList")}{" "}
                                  <IconArrowRight />
                                </RecommendationListLink>
                              </RecommendationListLinkWrapper>
                            </RecommendationWrapper>
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
                        {t("Application.markAsResolutionSent")} TODO
                      </MarkAsResolutionSentBtn>
                    )}
                    {normalizedApplicationStatus === "sent" && (
                      <MarkAsResolutionNotSentBtn
                        onClick={() =>
                          setApplicationStatus(application, "approved")
                        }
                      >
                        {t("Application.markAsResolutionNotSent")} TODO
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
