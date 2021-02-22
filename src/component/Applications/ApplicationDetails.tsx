import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IconClock, Notification } from "hds-react";
import trim from "lodash/trim";
import Accordion from "../Accordion";
import { getApplication } from "../../common/api";
import Loader from "../../common/Loader";
import { Application as ApplicationType } from "../../common/types";
import {
  ContentContainer,
  NarrowContainer,
  IngressContainer,
} from "../../styles/layout";
import { breakpoints } from "../../styles/util";
import { ContentHeading, H3 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import LinkPrev from "../LinkPrev";
import { ReactComponent as IconCustomers } from "../../images/icon_customers.svg";
import {
  formatDuration,
  formatNumber,
  formatDate,
  processApplication,
  parseApplicationEventSchedules,
} from "../../common/util";
import ValueBox from "../ValueBox";
import { weekdays } from "../../common/const";

interface IRouteParams {
  applicationId: string;
}

const Wrapper = styled.div`
  width: 100%;
  padding-bottom: var(--spacing-5-xl);
`;

const HeadingContainer = styled(NarrowContainer)`
  margin-bottom: var(--spacing-layout-xl);
`;

const ApplicationId = styled.div`
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

const DefinitionList = styled.dl`
  font-size: var(--fontsize-body-s);
  margin-bottom: var(--spacing-s);

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

const AccordionContent = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: var(--spacing-layout-m);

  @media (min-width: ${breakpoints.l}) {
    padding-left: var(--spacing-layout-m);
    grid-template-columns: 1fr 1fr;
  }
`;

const Subheading = styled(H3)`
  margin: var(--spacing-2-xl) var(--spacing-2-xl) var(--spacing-2-xl) 0;
  padding-top: var(--spacing-l);
  border-top: 1px solid var(--tilavaraus-ui-gray);

  @media (min-width: ${breakpoints.l}) {
    margin-left: var(--spacing-2-xl);
  }
`;

function ApplicationDetails(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { applicationId } = useParams<IRouteParams>();
  const { t } = useTranslation();

  const fetchApplication = async (id: number) => {
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
    fetchApplication(Number(applicationId));
  }, [applicationId]);

  if (isLoading) {
    return <Loader />;
  }

  return (
    <Wrapper>
      {application && (
        <>
          <ContentContainer>
            <LinkPrev route={`/application/${application.id}`} />
          </ContentContainer>
          <HeadingContainer>
            <ApplicationId>{t("Application.applicationId")} TODO</ApplicationId>
            <Heading>
              <CustomerIcon>
                <IconCustomers />
              </CustomerIcon>
              <span>{application.organisation?.name}</span>
            </Heading>
            <DefinitionList>
              <dt>{t("Organisation.organisationType")}:</dt>
              <dd>todo</dd>
            </DefinitionList>
            <DefinitionList>
              <dt>{t("Application.applicationReceivedTime")}:</dt>
              <dd>todo</dd>
            </DefinitionList>
          </HeadingContainer>
          <IngressContainer>
            <ContentHeading>
              {t("Application.applicationDetails")}
            </ContentHeading>
            <Accordion heading={t("Application.customerBasicInfo")} defaultOpen>
              <AccordionContent>
                <ValueBox
                  label={t("Application.contactForename")}
                  value={application.contactPerson?.firstName}
                />
                <ValueBox
                  label={t("Application.contactSurname")}
                  value={application.contactPerson?.lastName}
                />
                <ValueBox
                  label={t("common.emailAddress")}
                  value={application.contactPerson?.email}
                />
                <ValueBox
                  label={t("Application.contactEmailOnApplication")}
                  value="??????"
                />
                <ValueBox
                  label={t("Application.recurringReservationsForOrganisation")}
                  value="??????"
                />
                <ValueBox
                  label={t("Application.organisationName")}
                  value={application.organisation?.name}
                />
                <ValueBox
                  label={t("common.streetAddress")}
                  value={application.billingAddress?.streetAddress}
                />
                <ValueBox
                  label={t("common.postalNumber")}
                  value={application.billingAddress?.postCode}
                />
                <ValueBox
                  label={t("common.postalDistrict")}
                  value={application.billingAddress?.city}
                />
                <ValueBox label={t("common.emailAddress")} value="??????????" />
                <ValueBox
                  label={t("Application.organisationCoreActivity")}
                  value={application.organisation?.coreBusiness}
                />
                <ValueBox
                  label={t("common.billingAddress")}
                  value="???????????"
                />
              </AccordionContent>
            </Accordion>
            <Accordion heading={t("Application.members")} defaultOpen>
              <AccordionContent>
                <ValueBox
                  label={t("Organisation.activeParticipants")}
                  value={`${formatNumber(
                    application.organisation?.activeMembers,
                    t("common.volumeUnit")
                  )}`}
                />
              </AccordionContent>
            </Accordion>
            {application.applicationEvents.map((applicationEvent) => {
              let duration = "";
              const minDuration =
                applicationEvent.minDuration &&
                formatDuration(applicationEvent.minDuration);
              const maxDuration =
                applicationEvent.maxDuration &&
                formatDuration(applicationEvent.maxDuration);
              if (minDuration) {
                duration += `${t("common.minAmount")} ${
                  minDuration.hours && minDuration.hours + t("common.hoursUnit")
                }`;
                if (minDuration.minutes) {
                  duration += ` ${
                    minDuration.minutes + t("common.minutesUnit")
                  }`;
                }
              }
              if (maxDuration) {
                duration += `, ${t("common.maxAmount")} ${
                  maxDuration.hours && maxDuration.hours + t("common.hoursUnit")
                }`;
                if (maxDuration.minutes) {
                  duration += ` ${
                    maxDuration.minutes + t("common.minutesUnit")
                  }`;
                }
              }
              duration = trim(duration, ", ");

              return (
                <Accordion
                  key={applicationEvent.id}
                  heading={applicationEvent.name}
                  defaultOpen
                >
                  <AccordionContent>
                    <ValueBox
                      label={t("ApplicationEvent.name")}
                      value={applicationEvent.name}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.groupSize")}
                      value={`${formatNumber(
                        applicationEvent.numPersons,
                        t("common.membersSuffix")
                      )}`}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.ageGroup")}
                      value={t("common.agesSuffix", { range: "?????" })}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.eventDuration")}
                      value={duration}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.purpose")}
                      value="??? purpose data needed ???"
                    />
                    <ValueBox
                      label={t("ApplicationEvent.additionalEventInfo")}
                      value="?????"
                    />
                    <ValueBox
                      label={t("ApplicationEvent.startDate")}
                      value={formatDate(applicationEvent.begin)}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.endDate")}
                      value={formatDate(applicationEvent.end)}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.eventsPerWeek")}
                      value={`${applicationEvent.eventsPerWeek}`}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.biweekly")}
                      value={t(`common.${applicationEvent.biweekly}`)}
                    />
                    <ValueBox label={`${t("common.option")} 1.`} value="???" />
                    <ValueBox label={`${t("common.option")} 2.`} value="???" />
                    <ValueBox label={`${t("common.option")} 3.`} value="???" />
                    <ValueBox label={`${t("common.option")} 4.`} value="???" />
                  </AccordionContent>
                  <Subheading>
                    {t("ApplicationEvent.requestedTimes")}
                  </Subheading>
                  <AccordionContent>
                    {weekdays.map((day, index) => (
                      <ValueBox
                        label={`${t(`calendar.${day}`)}`}
                        value={parseApplicationEventSchedules(
                          applicationEvent.applicationEventSchedules,
                          index
                        )}
                        icon={<IconClock />}
                        key={`requestedTimes.${day}`}
                      />
                    ))}
                  </AccordionContent>
                </Accordion>
              );
            })}
          </IngressContainer>
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

export default withMainMenu(ApplicationDetails);
