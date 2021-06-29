import React, { useEffect, useState } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { IconClock, Notification } from "hds-react";
import trim from "lodash/trim";
import isEqual from "lodash/isEqual";
import omit from "lodash/omit";
import Accordion from "../Accordion";
import { getApplication, getParameters } from "../../common/api";
import Loader from "../Loader";
import { Application as ApplicationType, Parameter } from "../../common/types";
import {
  ContentContainer,
  NarrowContainer,
  IngressContainer,
} from "../../styles/layout";
import { breakpoints, Divider } from "../../styles/util";
import { ContentHeading, H3 } from "../../styles/typography";
import withMainMenu from "../withMainMenu";
import LinkPrev from "../LinkPrev";
import { ReactComponent as IconCustomers } from "../../images/icon_customers.svg";
import {
  formatDuration,
  formatNumber,
  formatDate,
  parseApplicationEventSchedules,
  parseAgeGroups,
  localizedValue,
} from "../../common/util";
import ValueBox from "../ValueBox";
import { weekdays } from "../../common/const";
import i18n from "../../i18n";

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

const StyledAccordion = styled(Accordion).attrs({
  style: {
    "--header-font-size": "var(--fontsize-heading-m)",
    "--button-size": "var(--fontsize-heading-l)",
    "--border-color": "var(--tilavaraus-ui-gray)",
  } as React.CSSProperties,
})``;

const AccordionContent = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  grid-gap: var(--spacing-layout-m);
  margin-bottom: var(--spacing-xl);

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

const StyledDivider = styled(Divider)`
  margin: var(--spacing-xs) 0;
  background-color: var(--color-black);
`;

function ApplicationDetails(): JSX.Element | null {
  const [isLoading, setIsLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationType | null>(null);
  const [cities, setCities] = useState<Parameter[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const { applicationId } = useParams<IRouteParams>();
  const { t } = useTranslation();

  const fetchApplication = async (id: number) => {
    try {
      const appResult = await getApplication(id);
      const citiesResult = await getParameters("city");

      setApplication(appResult);
      setCities(citiesResult);
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

  const isOrganisation = application?.applicantType !== "individual";

  const billingAddress: string = isEqual(
    omit(application?.billingAddress, "id"),
    omit(application?.organisation?.address, "id")
  )
    ? t("common.same")
    : trim(
        `${application?.billingAddress?.streetAddress || ""}, ${
          application?.billingAddress?.postCode || ""
        } ${application?.billingAddress?.city || ""}`,
        ", "
      );

  const customerName =
    application?.applicantType === "individual"
      ? application?.applicantName
      : application?.organisation?.name;

  const homeCity: Parameter | undefined = cities.find(
    (n) => n.id === application?.homeCityId
  );

  return (
    <Wrapper>
      {application && (
        <>
          <ContentContainer>
            <LinkPrev route={`/application/${application.id}`} />
          </ContentContainer>
          <HeadingContainer>
            <Heading data-testid="application-details__heading--main">
              <CustomerIcon>
                <IconCustomers aria-hidden />
              </CustomerIcon>
              <span>{customerName}</span>
            </Heading>
            <DefinitionList>
              <dt>{t("Application.applicantType")}:</dt>
              <dd data-testid="application-details__data--applicant-type">
                {application.applicantType &&
                  t(`Application.applicantTypes.${application.applicantType}`)}
              </dd>
            </DefinitionList>
            <DefinitionList>
              <dt>{t("Application.applicationReceivedTime")}:</dt>
              <dd>{formatDate(application.createdDate, "d.M.yyyy H:mm")}</dd>
            </DefinitionList>
          </HeadingContainer>
          <IngressContainer>
            <ContentHeading>
              {t("Application.applicationDetails")}
            </ContentHeading>
            <StyledAccordion
              heading={t("Application.customerBasicInfo")}
              defaultOpen
            >
              <AccordionContent>
                <ValueBox
                  label={t("Application.authenticatedUser")}
                  value={application.applicantEmail}
                />
                <StyledDivider />
                <ValueBox
                  label={t("Application.contactForename")}
                  value={application.contactPerson?.firstName}
                />
                <ValueBox
                  label={t("Application.contactSurname")}
                  value={application.contactPerson?.lastName}
                />
                <ValueBox
                  label={t("Application.contactPersonEmailAddress")}
                  value={application.contactPerson?.email || "-"}
                />
                <ValueBox
                  label={t("Application.contactPersonPhone")}
                  value={application.contactPerson?.phoneNumber || "-"}
                />
                <StyledDivider />
                <ValueBox
                  label={t("Application.applicantType")}
                  value={t(
                    `Application.applicantTypes.${application?.applicantType}`
                  )}
                />
                {isOrganisation && (
                  <>
                    <ValueBox
                      label={t("Application.organisationName")}
                      value={application.organisation?.name}
                    />
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
                    <ValueBox
                      label={t("common.homeCity")}
                      value={homeCity?.name || "-"}
                    />
                    <ValueBox
                      label={t("Application.identificationNumber")}
                      value={application.organisation?.identifier || "-"}
                    />
                    <ValueBox
                      label={t("Application.headings.coreActivity")}
                      value={application.organisation?.coreBusiness || "-"}
                    />
                    {billingAddress && (
                      <>
                        <StyledDivider />
                        <ValueBox
                          label={t("common.billingAddress")}
                          value={billingAddress}
                        />
                      </>
                    )}
                  </>
                )}
              </AccordionContent>
            </StyledAccordion>
            {application.applicationEvents.map((applicationEvent) => {
              const parseDuration = (
                duration: string | null,
                type?: "min" | "max"
              ): string => {
                if (!duration) return "";
                const durationObj = formatDuration(duration);
                const translationKey = `common.${type}Amount`;
                let result = "";
                result += `${type ? t(translationKey) : ""} ${
                  durationObj.hours && durationObj.hours + t("common.hoursUnit")
                }`;
                if (durationObj.minutes) {
                  result += ` ${durationObj.minutes + t("common.minutesUnit")}`;
                }
                return result;
              };
              let duration = "";
              if (
                isEqual(
                  applicationEvent.minDuration,
                  applicationEvent.maxDuration
                )
              ) {
                duration += parseDuration(applicationEvent.minDuration);
              } else {
                duration += parseDuration(applicationEvent?.minDuration, "min");
                duration += `, ${parseDuration(
                  applicationEvent?.maxDuration,
                  "max"
                )}`;
              }
              duration = trim(duration, ", ");

              return (
                <StyledAccordion
                  key={applicationEvent.id}
                  heading={applicationEvent.name}
                  defaultOpen={false}
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
                      value={parseAgeGroups(applicationEvent.ageGroupDisplay)}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.eventDuration")}
                      value={duration}
                    />
                    <ValueBox
                      label={t("ApplicationEvent.purpose")}
                      value={applicationEvent.purpose}
                      style={{ gridColumn: "1/-1" }}
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
                    {applicationEvent.eventReservationUnits.map(
                      (reservationUnit, index) => (
                        <ValueBox
                          key={reservationUnit.id}
                          label={`${t("common.option")} ${index + 1}.`}
                          value={`${
                            reservationUnit.reservationUnitDetails.building.name
                          }, ${localizedValue(
                            reservationUnit.reservationUnitDetails.name,
                            i18n.language
                          )}`}
                        />
                      )
                    )}
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
                        icon={<IconClock aria-hidden />}
                        key={`requestedTimes.${day}`}
                      />
                    ))}
                  </AccordionContent>
                </StyledAccordion>
              );
            })}
          </IngressContainer>
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

export default withMainMenu(ApplicationDetails);
