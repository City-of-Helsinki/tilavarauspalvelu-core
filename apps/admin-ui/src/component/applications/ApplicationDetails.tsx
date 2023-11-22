import React, { useRef, type ReactNode } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { Card, Table, IconCheck, IconEnvelope } from "hds-react";
import { isEqual, trim, orderBy } from "lodash";
import { useQuery } from "@apollo/client";
import { TFunction } from "i18next";
import { H2, H4, H5, Strong } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { filterNonNullable } from "common/src/helpers";
import {
  type Query,
  ApplicationStatusChoice,
  type ApplicationEventScheduleNode,
  type ApplicationEventNode,
  type ApplicationNode,
} from "common/types/gql-types";
import {
  formatNumber,
  formatDate,
  parseAgeGroups,
  formatDurationShort,
  secondsToHms,
} from "@/common/util";
import { publicUrl, weekdays } from "@/common/const";
import { useNotification } from "@/context/NotificationContext";
import ScrollIntoView from "@/common/ScrollIntoView";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import Accordion from "@/component/Accordion";
import { Accordion as HDSAccordion } from "@/common/hds-fork/Accordion";
import Loader from "@/component/Loader";
import { ApplicationWorkingMemo } from "@/component/WorkingMemo";
import ShowWhenTargetInvisible from "@/component/ShowWhenTargetInvisible";
import { Container } from "@/styles/layout";
import ValueBox from "./ValueBox";
import { getApplicantName, getApplicationStatusColor } from "./util";
import { TimeSelector } from "./time-selector/TimeSelector";
import StickyHeader from "../StickyHeader";
import { ApplicationUserBirthDate } from "./ApplicationUserBirthDate";
import StatusBlock from "../StatusBlock";
import { APPLICATION_QUERY } from "./queries";

const parseApplicationEventSchedules = (
  applicationEventSchedules: ApplicationEventScheduleNode[],
  index: number,
  priority: 100 | 200 | 300
): string => {
  const schedules = applicationEventSchedules
    .filter((s) => s.day === index)
    .filter((s) => s.priority === priority);

  return schedules
    .map((s) => `${s.begin.substring(0, 2)}-${s.end.substring(0, 2)}`)
    .join(", ");
};

const StyledStatusBlock = styled(StatusBlock)`
  margin: 0;
  margin-top: var(--spacing-l);
`;

function ApplicationStatusBlock({
  status,
  className,
}: {
  status: ApplicationStatusChoice;
  className?: string;
}): JSX.Element {
  const { t } = useTranslation();

  let icon: ReactNode | null;
  let style: React.CSSProperties = {};
  switch (status) {
    case ApplicationStatusChoice.Handled:
      icon = (
        <IconCheck aria-hidden style={{ color: "var(--color-success)" }} />
      );
      style = { fontSize: "var(--fontsize-heading-xs)" };
      break;
    case ApplicationStatusChoice.ResultsSent:
      icon = <IconEnvelope aria-hidden />;
      style = { fontSize: "var(--fontsize-heading-xs)" };
      break;
    default:
  }

  return (
    <div>
      <StyledStatusBlock
        statusStr={t(`Application.statuses.${status}`)}
        color={getApplicationStatusColor(status, "l")}
        icon={icon}
        className={className}
        style={style}
      />
    </div>
  );
}

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
  } as React.CSSProperties,
})`
  margin-top: 48px;
  h4 {
    margin-top: 4rem;
  }
`;

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
  gap: var(--spacing-l);
  display: flex;
  flex-direction: column;
  width: 100%;

  @media (min-width: ${breakpoints.xl}) {
    display: grid;
    grid-template-columns: 1fr 16em;
  }
`;

const SchedulesCardContainer = styled.div`
  gap: var(--spacing-m);
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;

  @media (min-width: ${breakpoints.xl}) {
    display: flex;
    flex-direction: column;
  }
  h5:nth-of-type(1) {
    margin-top: 0;
  }
`;

const EventSchedule = styled.div`
  font-size: var(--fontsize-body-m);
  line-height: 2em;
`;

const StyledH5 = styled(H5)`
  font-size: var(--fontsize-heading-xs);
  font-family: (--font-bold);
  margin-bottom: var(--spacing-2-xs);
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

const formatDuration = (
  duration: number | undefined,
  t: TFunction,
  type?: "min" | "max"
): string => {
  if (!duration) {
    return "";
  }
  const translationKey = `common.${type}Amount`;
  return `${type ? t(translationKey) : ""} ${formatDurationShort(
    secondsToHms(duration)
  )}`;
};

const appEventDuration = (
  min: number | undefined,
  max: number | undefined,
  t: TFunction
): string => {
  let duration = "";
  if (isEqual(min, max)) {
    duration += formatDuration(min, t);
  } else {
    duration += formatDuration(min, t, "min");
    duration += `, ${formatDuration(max, t, "max")}`;
  }
  return trim(duration, ", ");
};

function SchedulesContent({
  applicationEvent,
  priority,
}: {
  applicationEvent: ApplicationEventNode;
  priority: 200 | 300;
}): JSX.Element {
  const { t } = useTranslation();
  const schedules = filterNonNullable(
    applicationEvent.applicationEventSchedules
  );
  const title =
    priority === 300
      ? t("ApplicationEvent.primarySchedules")
      : t("ApplicationEvent.secondarySchedules");
  return (
    <div>
      <StyledH5>{title}</StyledH5>
      {weekdays.map((day, index) => {
        const schedulesTxt = parseApplicationEventSchedules(
          schedules,
          index,
          priority
        );
        return (
          <EventSchedule key={day}>
            <Strong>{t(`calendar.${day}`)}</Strong>
            {schedulesTxt ? `: ${schedulesTxt}` : ""}
          </EventSchedule>
        );
      })}
    </div>
  );
}

function ApplicationEventDetails({
  applicationEvent,
  application,
}: {
  applicationEvent: ApplicationEventNode;
  application: ApplicationNode;
}): JSX.Element {
  const { t } = useTranslation();

  const duration = appEventDuration(
    applicationEvent?.minDuration ?? undefined,
    applicationEvent?.maxDuration ?? undefined,
    t
  );
  const hash = applicationEvent?.pk?.toString() ?? "";

  return (
    <ScrollIntoView key={applicationEvent.pk} hash={hash}>
      <StyledAccordion
        heading={`${application.pk}-${applicationEvent.pk} ${applicationEvent.name}`}
        defaultOpen
      >
        <EventProps>
          {applicationEvent.ageGroup && (
            <ValueBox
              label={t("ApplicationEvent.ageGroup")}
              value={parseAgeGroups({
                minimum: applicationEvent.ageGroup.minimum,
                maximum: applicationEvent.ageGroup.maximum ?? undefined,
              })}
            />
          )}
          <ValueBox
            label={t("ApplicationEvent.groupSize")}
            value={`${formatNumber(
              applicationEvent.numPersons,
              t("common.membersSuffix")
            )}`}
          />
          <ValueBox
            label={t("ApplicationEvent.purpose")}
            value={applicationEvent.purpose?.nameFi ?? undefined}
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
            value={
              applicationEvent.begin != null && applicationEvent.end
                ? `${formatDate(applicationEvent.begin)} - ${formatDate(
                    applicationEvent.end
                  )}`
                : "No dates"
            }
          />
        </EventProps>
        <H4>{t("ApplicationEvent.requestedReservationUnits")}</H4>
        <StyledTable
          rows={filterNonNullable(applicationEvent?.eventReservationUnits).map(
            (ru, index) => ({
              index: index + 1,
              pk: ru?.pk,
              unit: ru?.reservationUnit?.unit?.nameFi,
              name: ru?.reservationUnit?.nameFi,
            })
          )}
          cols={[
            { headerName: "a", key: "index" },
            { headerName: "b", key: "unit" },
            { headerName: "c", key: "name" },
          ]}
          indexKey="pk"
        />
        <H4>{t("ApplicationEvent.requestedTimes")}</H4>
        <EventSchedules>
          <TimeSelector applicationEvent={applicationEvent} />
          <Card
            border
            theme={{
              "--background-color": "var(--color-black-5)",
              "--padding-horizontal": "var(--spacing-m)",
              "--padding-vertical": "var(--spacing-m)",
            }}
          >
            <SchedulesCardContainer>
              <SchedulesContent
                applicationEvent={applicationEvent}
                priority={300}
              />
              <SchedulesContent
                applicationEvent={applicationEvent}
                priority={200}
              />
            </SchedulesCardContainer>
          </Card>
        </EventSchedules>
      </StyledAccordion>
    </ScrollIntoView>
  );
}

function ApplicationDetails({
  applicationPk,
}: {
  applicationPk: number;
}): JSX.Element | null {
  const ref = useRef<HTMLHeadingElement>(null);
  const { t } = useTranslation();
  const { notifyError } = useNotification();

  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery<Query>(APPLICATION_QUERY, {
    skip: applicationPk === 0,
    variables: { pk: [applicationPk] },
    onError: () => {
      notifyError(t("errors.errorFetchingApplication"));
    },
  });
  const application = data?.applications?.edges[0]?.node ?? undefined;
  const applicationRound = application?.applicationRound ?? undefined;

  if (isLoading) {
    return <Loader />;
  }

  const isOrganisation = application?.organisation != null;

  // TODO replace this with an explicit check and warn on undefined fields
  const hasBillingAddress =
    application?.billingAddress != null &&
    !isEqual(application?.billingAddress, application?.organisation?.address);

  const customerName = application != null ? getApplicantName(application) : "";
  const homeCity = application?.homeCity?.nameFi ?? "-";
  const applicationEvents = filterNonNullable(
    application?.applicationEvents
  ).map((ae) => ({
    ...ae,
    eventReservationUnits: orderBy(ae.eventReservationUnits, "priority", "asc"),
    applicationEventSchedules: orderBy(
      ae.applicationEventSchedules,
      "begin",
      "asc"
    ),
  }));

  if (application == null || applicationRound == null) {
    return null;
  }

  const route = [
    {
      slug: "",
      alias: t("breadcrumb.recurring-reservations"),
    },
    {
      slug: `${publicUrl}/recurring-reservations/application-rounds`,
      alias: t("breadcrumb.application-rounds"),
    },
    {
      slug: `${publicUrl}/recurring-reservations/application-rounds/${applicationRound.pk}`,
      alias: applicationRound.nameFi ?? "-",
    },
    {
      slug: `application`,
      alias: customerName,
    },
  ];

  return (
    <>
      <BreadcrumbWrapper route={route} />
      <ShowWhenTargetInvisible target={ref}>
        <StickyHeader
          name={customerName}
          tagline={`${t("Application.id")}: ${application.pk}`}
        />
      </ShowWhenTargetInvisible>
      <Container style={{ marginBottom: "6rem" }}>
        {application.status != null && (
          <ApplicationStatusBlock status={application.status} />
        )}
        <H2 ref={ref} data-testid="application-details__heading--main">
          {customerName}
        </H2>
        <PreCard>
          {t("Application.applicationReceivedTime")}{" "}
          {formatDate(application.lastModifiedDate, "d.M.yyyy HH:mm")}
        </PreCard>
        <Card
          theme={{
            "--background-color": "var(--color-black-5)",
            "--padding-horizontal": "var(--spacing-m)",
            "--padding-vertical": "var(--spacing-m)",
          }}
        >
          <CardContentContainer>
            <DefinitionList>
              <KV
                k={t("Application.applicantType")}
                v={t(`Application.applicantTypes.${application.applicantType}`)}
                dataId="application-details__data--applicant-type"
              />
              <KV k={t("common.homeCity")} v={homeCity} />
              <KV
                k={t("Application.coreActivity")}
                v={application.organisation?.coreBusiness || "-"}
              />
            </DefinitionList>
            <DefinitionList>
              <KV
                k={t("Application.numHours")}
                v={`${t("common.hoursUnitLong", {
                  count: 0,
                })}`}
              />
              <KV
                k={t("Application.numTurns")}
                v={`0 ${t("common.volumeUnit")}`}
              />
            </DefinitionList>
          </CardContentContainer>
        </Card>
        <HDSAccordion
          heading={t("RequestedReservation.workingMemo")}
          initiallyOpen={application.workingMemo.length > 0}
        >
          <ApplicationWorkingMemo
            applicationPk={applicationPk}
            refetch={refetch}
            initialValue={application.workingMemo}
          />
        </HDSAccordion>
        {applicationEvents.map((applicationEvent) => (
          <ApplicationEventDetails
            applicationEvent={applicationEvent}
            application={application}
          />
        ))}
        <H4>{t("Application.customerBasicInfo")}</H4>
        <EventProps>
          <ValueBox
            label={t("Application.authenticatedUser")}
            value={application.applicant?.email}
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
            label={t("Application.coreActivity")}
            value={application.organisation?.coreBusiness}
          />
          <ValueBox label={t("common.homeCity")} value={homeCity} />
          <ValueBox
            label={t("Application.identificationNumber")}
            value={application.organisation?.identifier}
          />
          <ValueBox
            label={t("Application.headings.additionalInformation")}
            value={application.additionalInformation}
          />
          <ValueBox
            label={t("Application.headings.userBirthDate")}
            value={
              <ApplicationUserBirthDate
                applicationPk={application.pk ?? 0}
                showLabel={t("RequestedReservation.showBirthDate")}
                hideLabel={t("RequestedReservation.hideBirthDate")}
              />
            }
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
      </Container>
    </>
  );
}

interface IRouteParams {
  [key: string]: string;
  applicationId: string;
}

function ApplicationDetailsRouted(): JSX.Element {
  const { t } = useTranslation();
  const { applicationId } = useParams<IRouteParams>();

  const applicationPk = Number(applicationId);
  if (!applicationId || Number.isNaN(applicationPk)) {
    return <div>{t("errors.router.invalidApplicationNumber")}</div>;
  }

  return <ApplicationDetails applicationPk={applicationPk} />;
}

export default ApplicationDetailsRouted;
