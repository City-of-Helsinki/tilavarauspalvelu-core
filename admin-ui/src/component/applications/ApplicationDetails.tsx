import React, { useEffect, useState } from "react";
import { orderBy, set, sum } from "lodash";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Card, Table } from "hds-react";
import isEqual from "lodash/isEqual";
import omit from "lodash/omit";
import Accordion from "../Accordion";
import {
  getApplication,
  getApplicationRound,
  getParameters,
} from "../../common/api";
import Loader from "../Loader";
import {
  Application as ApplicationType,
  ApplicationRound,
  Parameter,
} from "../../common/types";
import { IngressContainer } from "../../styles/layout";
import { H2, H4, H5, H5Top } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import {
  formatNumber,
  formatDate,
  parseApplicationEventSchedules,
  parseAgeGroups,
} from "../../common/util";
import ValueBox from "./ValueBox";
import { weekdays } from "../../common/const";
import {
  appEventDuration,
  appEventHours,
  applicantName,
  numTurns,
} from "./util";
import ApplicationStatusBlock from "./ApplicationStatusBlock";
import { useNotification } from "../../context/NotificationContext";

interface IRouteParams {
  applicationId: string;
}

const StyledApplicationStatusBlock = styled(ApplicationStatusBlock)`
  margin: 0;
`;

const Wrapper = styled.div`
  margin: var(--spacing-layout-m) 0;
  width: 100%;
  padding-bottom: var(--spacing-5-xl);
`;

const CardContentContainer = styled.div`
  display: grid;
  gap: var(--spacing-m);
  grid-template-columns: 1fr 1fr;
`;

const EventProps = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-l);
`;

const DefinitionList = styled.div`
  font-size: var(--fontsize-body-s);
  line-height: var(--lineheight-l);
  display: flex;
  gap: var(--spacing-s);
  flex-direction: column;
`;

const Label = styled.span``;

const Value = styled.span`
  font-family: var(--tilavaraus-admin-font-bold);
  font-weight: 700;
`;

const StyledAccordion = styled(Accordion).attrs({
  style: {
    "--header-font-size": "var(--fontsize-heading-m)",
    "--button-size": "var(--fontsize-heading-l)",
    "--border-color": "var(--tilavaraus-ui-gray)",
  } as React.CSSProperties,
})``;

const PreCard = styled.div`
  font-size: var(--fontsize-body-s);
  margin-bottom: var(--spacing-m);
`;

const StyledTable = styled(Table)`
  width: 100%;
  border-spacing: 0;
  thead {
    display: none;
  }
  td:nth-child(1) {
    padding-left: var(--spacing-xs);
  }
`;

const EventSchedules = styled.div`
  font-size: var(--fontsize-body-l);
  line-height: 2em;
`;

const KV = ({
  k,
  v,
  dataId,
}: {
  k: string;
  v?: string;
  dataId?: string;
}): JSX.Element => (
  <div key={k}>
    <Label id={k}>{k}</Label>:{" "}
    <Value aria-labelledby={k} data-testid={dataId}>
      {v || "-"}
    </Value>
  </div>
);

function ApplicationDetails(): JSX.Element | null {
  const { notifyError } = useNotification();
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [applicationRound, setApplicationRound] =
    useState<ApplicationRound | null>(null);
  const [cities, setCities] = useState<Parameter[]>([]);

  const { applicationId } = useParams<IRouteParams>();
  const { t } = useTranslation();

  const fetchApplication = async (id: number) => {
    try {
      const appResult = await getApplication(id);
      const citiesResult = await getParameters("city");
      const applicationRoundResult = await getApplicationRound({
        id: appResult.applicationRoundId,
      });
      appResult.applicationEvents.forEach((ae) => {
        set(
          ae,
          "eventReservationUnits",
          orderBy(ae.eventReservationUnits, "priority", "asc")
        );
        set(
          ae,
          "applicationEventSchedules",
          orderBy(ae.applicationEventSchedules, "begin", "asc")
        );
      });

      setApplication(appResult);
      setCities(citiesResult);
      setApplicationRound(applicationRoundResult);
    } catch (error) {
      notifyError(t("errors.errorFetchingApplication"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApplication(Number(applicationId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applicationId]);

  if (isLoading) {
    return <Loader />;
  }

  /** laskutusosoite näytetään aina henkilöhakijalle (koska ei muuta osoitetta ja silloin jos organisaation laskutusosoite on eri kuin normiosoite ) */

  const hasBillingAddress = !isEqual(
    omit(application?.billingAddress, "id"),
    omit(application?.organisation?.address, "id")
  );

  const isOrganisation = Boolean(application?.organisation);

  const customerName = applicantName(application);

  const homeCity: Parameter | undefined = cities.find(
    (n) => n.id === application?.homeCityId
  );

  return (
    <Wrapper>
      {application && applicationRound && (
        <>
          <IngressContainer>
            <StyledApplicationStatusBlock
              status={application.status}
              view={applicationRound.status}
            />
            <H2
              style={{ margin: "0.5em 0" }}
              data-testid="application-details__heading--main"
            >
              {customerName}
            </H2>
            <PreCard>
              {t("Application.applicationReceivedTime")}{" "}
              {formatDate(application.createdDate, "d.M.yyyy")}
            </PreCard>
            <Card
              theme={{
                "--background-color": "var(--color-black-10)",
                "--padding-horizontal": "var(--spacing-m)",
                "--padding-vertical": "var(--spacing-m)",
              }}
            >
              <CardContentContainer>
                <DefinitionList>
                  <KV
                    k={t("Application.applicantType")}
                    v={t(
                      `Application.applicantTypes.${application.applicantType}`
                    )}
                    dataId="application-details__data--applicant-type"
                  />
                  <KV k={t("common.homeCity")} v={homeCity?.name} />
                  <KV
                    k={t("Application.coreActivity")}
                    v={application.additionalInformation}
                  />
                </DefinitionList>
                <DefinitionList>
                  <KV
                    k={t("Application.numHours")}
                    v={`${t("common.hoursUnitLong", {
                      count: sum(
                        application.applicationEvents.map((ae) =>
                          appEventHours(
                            ae.begin as string,
                            ae.end as string,
                            ae.biweekly,
                            ae.eventsPerWeek,
                            ae.minDuration as string
                          )
                        )
                      ),
                    })}`}
                  />
                  <KV
                    k={t("Application.numTurns")}
                    v={`${sum(
                      application.applicationEvents.map((ae) =>
                        numTurns(
                          ae.begin as string,
                          ae.end as string,
                          ae.biweekly
                        )
                      )
                    )} ${t("common.volumeUnit")}`}
                  />
                  <KV k={t("Application.basket")} v="" />
                </DefinitionList>
              </CardContentContainer>
            </Card>
          </IngressContainer>
          <IngressContainer>
            {application.applicationEvents.map((applicationEvent) => {
              const duration = appEventDuration(applicationEvent, t);

              return (
                <StyledAccordion
                  key={applicationEvent.id}
                  heading={applicationEvent.name}
                  defaultOpen
                >
                  <EventProps>
                    <ValueBox
                      label={t("ApplicationEvent.ageGroup")}
                      value={parseAgeGroups(applicationEvent.ageGroupDisplay)}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.groupSize")}
                      value={`${formatNumber(
                        applicationEvent.numPersons,
                        t("common.membersSuffix")
                      )}`}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.purpose")}
                      value={applicationEvent.purpose}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.eventDuration")}
                      value={duration}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.eventsPerWeek")}
                      value={`${applicationEvent.eventsPerWeek}`}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.dates")}
                      value={`${formatDate(
                        applicationEvent.begin
                      )} - ${formatDate(applicationEvent.end)}`}
                    />
                  </EventProps>
                  <H4>{t("ApplicationEvent.requestedReservationUnits")}</H4>
                  <StyledTable
                    rows={applicationEvent.eventReservationUnits.map(
                      (reservationUnit, index) => ({
                        index: index + 1,
                        id: reservationUnit.id,
                        unit: reservationUnit.reservationUnitDetails.unit.name
                          .fi,
                        name: reservationUnit.reservationUnitDetails.name.fi,
                      })
                    )}
                    cols={[
                      { headerName: "a", key: "index" },
                      { headerName: "b", key: "unit" },
                      { headerName: "c", key: "name" },
                    ]}
                    indexKey="id"
                  />
                  <H4>{t("ApplicationEvent.requestedTimes")}</H4>
                  <Card border>
                    <H5Top>{t("ApplicationEvent.primarySchedules")}</H5Top>
                    {weekdays.map((day, index) => (
                      <EventSchedules>
                        {t(`calendar.${day}`)},{" "}
                        {parseApplicationEventSchedules(
                          applicationEvent.applicationEventSchedules,
                          index,
                          200
                        )}
                      </EventSchedules>
                    ))}
                    <H5>{t("ApplicationEvent.secondarySchedules")}</H5>
                    {weekdays.map((day, index) => (
                      <EventSchedules>
                        {t(`calendar.${day}`)},{" "}
                        {parseApplicationEventSchedules(
                          applicationEvent.applicationEventSchedules,
                          index,
                          300
                        )}
                      </EventSchedules>
                    ))}
                  </Card>
                </StyledAccordion>
              );
            })}
            <H4>{t("Application.customerBasicInfo")}</H4>
            <EventProps>
              <ValueBox
                label={t("Application.authenticatedUser")}
                value={application.applicantEmail}
              />
              <ValueBox
                label={t("Application.applicantType")}
                value={t(
                  `Application.applicantTypes.${application?.applicantType}`
                )}
              />
              <ValueBox
                label={t("Application.organisationName")}
                value={application.organisation?.name}
              />
              <ValueBox
                label={t("Application.headings.additionalInformation")}
                value={application.additionalInformation}
              />
              <ValueBox label={t("common.homeCity")} value={homeCity?.name} />
              <ValueBox
                label={t("Application.identificationNumber")}
                value={application.organisation?.identifier}
              />
            </EventProps>
            <H4>{t("Application.contactPersonInformation")}</H4>
            <EventProps>
              <ValueBox
                label={t("Application.contactPersonFirstName")}
                value={application.contactPerson?.firstName}
              />
              <ValueBox
                label={t("Application.contactPersonLastName")}
                value={application.contactPerson?.lastName}
              />
              <ValueBox
                label={t("Application.contactPersonEmail")}
                value={application.contactPerson?.email}
              />
              <ValueBox
                label={t("Application.contactPersonPhoneNumber")}
                value={application.contactPerson?.phoneNumber}
              />
            </EventProps>
            {isOrganisation ? (
              <>
                <H4>{t("Application.contactInformation")}</H4>
                <EventProps>
                  <ValueBox
                    label={t("common.streetAddress")}
                    value={application.organisation?.address?.streetAddress}
                  />
                  <ValueBox
                    label={t("common.postalNumber")}
                    value={application.organisation?.address?.postCode}
                  />
                  <ValueBox
                    label={t("common.postalDistrict")}
                    value={application.organisation?.address?.city}
                  />
                </EventProps>
              </>
            ) : null}
            {hasBillingAddress ? (
              <>
                <H4>{t("common.billingAddress")}</H4>
                <EventProps>
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
                </EventProps>
              </>
            ) : null}
          </IngressContainer>
        </>
      )}
    </Wrapper>
  );
}

export default withMainMenu(ApplicationDetails);
