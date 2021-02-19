import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Button, Notification, IconFaceSmile } from "hds-react";
import { getApplication, saveApplication } from "../../common/api";
import Loader from "../../common/Loader";
import {
  Application as ApplicationType,
  ApplicationStatus,
} from "../../common/types";
import { ContentContainer, NarrowContainer } from "../../styles/layout";
import { BasicLink, breakpoints } from "../../styles/util";
import { ContentHeading, H2, H3 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import LinkPrev from "../LinkPrev";
import { ReactComponent as IconCustomers } from "../../images/icon_customers.svg";
import { formatNumber, processApplication } from "../../common/util";
import StatusBlock from "../StatusBlock";

interface IRouteParams {
  applicationId: string;
}

const Wrapper = styled.div`
  width: 100%;
  padding-bottom: var(--spacing-5-xl);
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

const OrganisationType = styled.dl`
  font-size: var(--fontsize-body-s);
  margin-bottom: var(--spacing-3-xl);

  dt {
    font-family: var(--tilavaraus-admin-font-bold);
    font-weight: bold;
    display: inline-block;
  }

  dd {
    display: inline-block;
    margin: 0 0 0 1em;
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
    border-bottom: 1px solid var(--color-black-90);
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
  &:last-of-type {
    ${GridCol} {
      border-bottom: 0;
    }

    border-bottom: 0;
  }

  display: grid;
  border-bottom: 1px solid var(--color-black-90);
  margin-bottom: var(--spacing-2-xl);

  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: 1fr 1fr;
    border-bottom: 0;
  }
`;

const ActionButton = styled(Button)`
  position: absolute;
  right: var(--spacing-2-xl);
`;

function Application(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [
    statusNotification,
    setStatusNotification,
  ] = useState<ApplicationStatus | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { applicationId } = useParams<IRouteParams>();
  const { t } = useTranslation();

  const fetchApplications = async (id: number) => {
    try {
      const result = await getApplication(id);
      setApplication(processApplication(result));
    } catch (error) {
      setErrorMsg("errors.errorFetchingApplication");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications(Number(applicationId));
  }, [applicationId]);

  const setApplicationStatus = async (status: ApplicationStatus) => {
    if (!application) return;
    const payload = { ...application, status };
    try {
      setIsSaving(true);
      const result = await saveApplication(payload);
      fetchApplications(result.id);
      setStatusNotification(status);
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
    case "in_review":
    case "review_done":
      action = {
        text: t("Application.actions.declineApplication"),
        button: "secondary",
        function: () => setApplicationStatus("declined"),
      };
      break;
    case "declined":
      action = {
        text: t("Application.actions.returnAsPartOfAllocation"),
        button: "primary",
        function: () => setApplicationStatus("in_review"),
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

  return (
    <Wrapper>
      {application && (
        <>
          <ContentContainer>
            <LinkPrev
              route={`/applicationRounds/${application.applicationRoundId}`}
            />
          </ContentContainer>
          <NarrowContainer>
            <StyledLink to="/">
              {t("ApplicationRound.showClientApplication")}
            </StyledLink>
            <Heading>
              <CustomerIcon>
                <IconCustomers />
              </CustomerIcon>
              <span>{application.organisation?.name}</span>
            </Heading>
            <OrganisationType>
              <dt>{t("Organisation.organisationType")}:</dt>
              <dd>todo</dd>
            </OrganisationType>
            <StatusBlock status={application.status} view={1} />
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
            <Subheading>{t("ApplicationRound.infoGivenByCustomer")}</Subheading>
            <DataGrid>
              <GridCol>
                <table>
                  <tbody>
                    <tr>
                      <th>{t("Organisation.activeParticipants")}</th>
                      <td>
                        {`${formatNumber(
                          application.organisation?.activeMembers,
                          t("common.volumeUnit")
                        )}`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </GridCol>
            </DataGrid>
            <Subheading>{t("ApplicationRound.recommendedAid")}</Subheading>
            <DataGrid>
              <GridCol>
                <table>
                  <tbody>
                    <tr>
                      <th>{t("ApplicationRound.appliedReservations")}</th>
                      <td>{`${formatNumber(
                        application.processedData.reservationsTotal,
                        t("common.volumeUnit")
                      )}`}</td>
                    </tr>
                    <tr>
                      <th>{t("ApplicationRound.totalReservationTime")}</th>
                      <td>{`${formatNumber(
                        application.processedData.minDurationTotal,
                        t("common.hoursUnit")
                      )}`}</td>
                    </tr>
                  </tbody>
                </table>
              </GridCol>
            </DataGrid>
          </NarrowContainer>
          <ContentContainer>
            {action.function && (
              <ActionButton
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
          label={t("errors.errorFetchingData")}
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
