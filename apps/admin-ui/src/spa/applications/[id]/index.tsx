import React, { useRef, type ReactNode } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  Card,
  IconCheck,
  IconEnvelope,
  Button,
  IconCross,
  IconArrowRedo,
  Tag,
} from "hds-react";
import { isEqual, trim } from "lodash";
import { type ApolloQueryResult, useMutation, useQuery } from "@apollo/client";
import { type TFunction } from "i18next";
import { H2, H4, H5, Strong } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { getValidationErrors } from "common/src/apolloUtils";
import {
  type Query,
  ApplicationStatusChoice,
  type ApplicationSectionNode,
  type ApplicationNode,
  ApplicantTypeChoice,
  type SuitableTimeRangeNode,
  Priority,
  type QueryApplicationArgs,
  type MutationUpdateReservationUnitOptionArgs,
  type ReservationUnitOptionNode,
  type Maybe,
} from "common/types/gql-types";
import { formatDuration } from "common/src/common/util";
import { convertWeekday, type Day } from "common/src/conversion";
import { WEEKDAYS } from "common/src/const";
import { formatNumber, formatDate, parseAgeGroups } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import ScrollIntoView from "@/common/ScrollIntoView";
import BreadcrumbWrapper from "@/component/BreadcrumbWrapper";
import { Accordion } from "@/component/Accordion";
import { Accordion as HDSAccordion } from "@/common/hds-fork/Accordion";
import Loader from "@/component/Loader";
import { ApplicationWorkingMemo } from "@/component/WorkingMemo";
import ShowWhenTargetInvisible from "@/component/ShowWhenTargetInvisible";
import StickyHeader from "@/component/StickyHeader";
import StatusBlock from "@/component/StatusBlock";
import { BirthDate } from "@/component/BirthDate";
import { Container } from "@/styles/layout";
import { ValueBox } from "../ValueBox";
import { TimeSelector } from "../TimeSelector";
import { APPLICATION_ADMIN_QUERY } from "../queries";
import { getApplicantName, getApplicationStatusColor } from "@/helpers";
// TODO move
import { UPDATE_RESERVATION_UNIT_OPTION } from "@/spa/recurring-reservations/application-rounds/[id]/allocation/queries";
import Error404 from "@/common/Error404";

function printSuitableTimes(
  timeRanges: SuitableTimeRangeNode[],
  day: Day,
  priority: Priority
): string {
  const schedules = timeRanges
    .filter((s) => convertWeekday(s.dayOfTheWeek) === day)
    .filter((s) => s.priority === priority);

  return schedules
    .map((s) => `${s.beginTime.substring(0, 2)}-${s.endTime.substring(0, 2)}`)
    .join(", ");
}

const StyledStatusBlock = styled(StatusBlock)`
  margin: 0;
`;

function getApplicationStatusIcon(status: ApplicationStatusChoice): {
  icon: ReactNode | null;
  style: React.CSSProperties;
} {
  switch (status) {
    case ApplicationStatusChoice.Handled:
      return {
        icon: (
          <IconCheck aria-hidden style={{ color: "var(--color-success)" }} />
        ),
        style: { fontSize: "var(--fontsize-heading-xs)" },
      };
    case ApplicationStatusChoice.ResultsSent:
      return {
        icon: <IconEnvelope aria-hidden />,
        style: { fontSize: "var(--fontsize-heading-xs)" },
      };
    default:
      return {
        icon: null,
        style: {},
      };
  }
}

function ApplicationStatusBlock({
  status,
  className,
}: {
  status: ApplicationStatusChoice;
  className?: string;
}): JSX.Element {
  const { t } = useTranslation();

  const { icon, style } = getApplicationStatusIcon(status);
  return (
    <StyledStatusBlock
      statusStr={t(`Application.statuses.${status}`)}
      color={getApplicationStatusColor(status, "l")}
      icon={icon}
      className={className}
      style={style}
    />
  );
}

const CardContentContainer = styled.div`
  display: grid;
  gap: var(--spacing-m);
  grid-template-columns: 1fr;
  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 1fr 1fr;
  }
`;

const EventProps = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-l);
  word-break: break-all;
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

// TODO this is duplicated in other pages (H1 + status tag)
// TODO should not use margin-top almost ever. The container (reused in all layouts) should have the correct padding.
// spacing between elements should be either gap if possible or margin-bottom if not.
const HeadingContainer = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: var(--spacing-s);
`;

const ApplicationSectionsContainer = styled.div`
  display: grid;

  /* responsive shinanigans the tag takes too much space, so we only use 4 columns on mobile */
  grid-template-columns: 1rem repeat(2, auto) 8rem;
  align-items: stretch;
  justify-content: stretch;
  gap: 0;

  border-collapse: collapse;
  > div > div {
    border: 1px solid var(--color-black-20);
    border-left: none;
    border-right: none;
    display: flex;
    align-items: center;
    padding-left: 1rem;

    /* responsive shinanigans the tag takes too much space */
    :nth-child(4) {
      display: none;
    }
  }

  > div:nth-child(2n) {
    > div {
      border-top: none;
    }
  }

  @media (min-width: ${breakpoints.m}) {
    grid-template-columns: 3rem repeat(2, auto) repeat(2, 8rem);

    /* undo responsive shinanigans, and align the HDS tag */
    > div > div:nth-child(4) {
      display: flex;
      align-items: center;
    }
  }
`;

// the default HDS tag css can't align icons properly so we have to do this
// TODO reusable Tags that allow setting both the background and optional Icon
const DeclinedTag = styled(Tag)`
  background-color: var(--color-metro-medium-light);
  > span > span {
    display: flex;
    align-items: center;
  }
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

function formatApplicationDuration(
  durationSeconds: number | undefined,
  t: TFunction,
  type?: "min" | "max"
): string {
  if (!durationSeconds) {
    return "";
  }
  const durMinutes = durationSeconds / 60;
  const translationKey = `common.${type}Amount`;
  return `${type ? t(translationKey) : ""} ${formatDuration(durMinutes, t)}`;
}

function appEventDuration(
  min: number | undefined,
  max: number | undefined,
  t: TFunction
): string {
  let duration = "";
  if (isEqual(min, max)) {
    duration += formatApplicationDuration(min, t);
  } else {
    duration += formatApplicationDuration(min, t, "min");
    duration += `, ${formatApplicationDuration(max, t, "max")}`;
  }
  return trim(duration, ", ");
}

function SchedulesContent({
  as,
  priority,
}: {
  as: ApplicationSectionNode;
  priority: Priority;
}): JSX.Element {
  const { t } = useTranslation();
  const schedules = filterNonNullable(as.suitableTimeRanges);
  const title =
    priority === Priority.Primary
      ? t("ApplicationEvent.primarySchedules")
      : t("ApplicationEvent.secondarySchedules");
  const calendar = WEEKDAYS.map((day) => {
    const schedulesTxt = printSuitableTimes(schedules, day, priority);
    return { day, schedulesTxt };
  });

  return (
    <div>
      <StyledH5>{title}</StyledH5>
      {calendar.map(({ day, schedulesTxt }) => (
        <EventSchedule key={day}>
          <Strong>{t(`dayLong.${day}`)}</Strong>
          {schedulesTxt ? `: ${schedulesTxt}` : ""}
        </EventSchedule>
      ))}
    </div>
  );
}

function RejectOptionButton({
  option,
  refetch,
}: {
  option: ReservationUnitOptionNode;
  refetch: () => Promise<ApolloQueryResult<Query>>;
}) {
  const [mutation, { loading }] = useMutation<
    Query,
    MutationUpdateReservationUnitOptionArgs
  >(UPDATE_RESERVATION_UNIT_OPTION);

  const { notifyError } = useNotification();
  const { t } = useTranslation();

  const updateOption = async (
    pk: Maybe<number> | undefined,
    rejected: boolean
  ) => {
    if (pk == null) {
      return;
    }
    try {
      await mutation({
        variables: {
          input: {
            pk,
            rejected,
          },
        },
      });
      refetch();
    } catch (err) {
      const mutationErrors = getValidationErrors(err);
      if (mutationErrors.length > 0) {
        // TODO handle other codes also
        const isInvalidState = mutationErrors.find(
          (e) => e.code === "invalid" && e.field === "rejected"
        );
        if (isInvalidState) {
          notifyError(t("errors.cantRejectAlreadyAllocated"));
        } else {
          // TODO this should show them with cleaner formatting (multiple errors)
          // TODO these should be translated
          const message = mutationErrors.map((e) => e.message).join(", ");
          notifyError(t("errors.formValidationError", { message }));
        }
      } else {
        notifyError(t("errors.errorRejectingOption"));
      }
    }
  };

  const handleReject = async () => {
    updateOption(option.pk, true);
  };

  const handleRevert = async () => {
    updateOption(option.pk, false);
  };

  const isRejected = option.rejected;

  // codegen types are allow nulls so have to do this for debugging
  if (option.allocatedTimeSlots == null) {
    // eslint-disable-next-line no-console
    console.warn("no allocatedTimeSlots", option);
  }

  const isDisabled = option.allocatedTimeSlots?.length > 0;
  return (
    <Button
      variant="supplementary"
      iconLeft={isRejected ? <IconArrowRedo /> : <IconCross />}
      theme="black"
      size="small"
      onClick={isRejected ? handleRevert : handleReject}
      isLoading={loading}
      disabled={isDisabled}
      data-testid={`reject-btn-${option.pk}`}
    >
      {isRejected ? t("Application.btnRevert") : t("Application.btnReject")}
    </Button>
  );
}

interface DataType extends ReservationUnitOptionNode {
  index: number;
}
type ColumnType = {
  key: string;
  transform: (data: DataType) => ReactNode;
};

function ApplicationSectionDetails({
  section,
  application,
  refetch,
}: {
  section: ApplicationSectionNode;
  application: ApplicationNode;
  refetch: () => Promise<ApolloQueryResult<Query>>;
}): JSX.Element {
  const { t } = useTranslation();

  const minDuration = section?.reservationMinDuration ?? undefined;
  const maxDuration = section?.reservationMaxDuration ?? undefined;
  const duration = appEventDuration(minDuration, maxDuration, t);
  const hash = section?.pk?.toString() ?? "";
  const heading = `${application.pk}-${section.pk} ${section.name}`;

  // TODO use a function for this
  const dates =
    section.reservationsBeginDate != null && section.reservationsEndDate
      ? `${formatDate(section.reservationsBeginDate)} - ${formatDate(
          section.reservationsEndDate
        )}`
      : "No dates";

  const cols: Array<ColumnType> = [
    {
      key: "index",
      transform: (d: DataType) => d.index.toString(),
    },
    {
      key: "unit",
      transform: (reservationUnitOption: ReservationUnitOptionNode) =>
        reservationUnitOption?.reservationUnit?.unit?.nameFi ?? "-",
    },
    {
      key: "name",
      transform: (reservationUnitOption: ReservationUnitOptionNode) =>
        reservationUnitOption?.reservationUnit?.nameFi ?? "-",
    },
    {
      key: "status",
      transform: (reservationUnitOption: ReservationUnitOptionNode) => {
        if (reservationUnitOption.rejected) {
          return (
            <DeclinedTag>
              <IconCross />
              {t("Application.rejected")}
            </DeclinedTag>
          );
        }
      },
    },
    {
      key: "reject",
      transform: (reservationUnitOption: ReservationUnitOptionNode) => {
        // TODO button should only be visible if user has "can_handle_applications" permission
        // the application is visible to the user if they have "can_view_application" permission
        // but they aren't allowed to reject it
        // requires mergin a PR with changes to application permission checks
        return (
          <RejectOptionButton
            option={reservationUnitOption}
            refetch={refetch}
          />
        );
      },
    },
  ];

  const rows: DataType[] = filterNonNullable(
    section?.reservationUnitOptions
  ).map((ru, index) => ({
    ...ru,
    index: index + 1,
  }));

  return (
    <ScrollIntoView key={section.pk} hash={hash}>
      <StyledAccordion heading={heading} initiallyOpen>
        <EventProps>
          {section.ageGroup && (
            <ValueBox
              label={t("ApplicationEvent.ageGroup")}
              value={parseAgeGroups({
                minimum: section.ageGroup.minimum,
                maximum: section.ageGroup.maximum ?? undefined,
              })}
            />
          )}
          <ValueBox
            label={t("ApplicationEvent.groupSize")}
            value={`${formatNumber(
              section.numPersons,
              t("common.membersSuffix")
            )}`}
          />
          <ValueBox
            label={t("ApplicationEvent.purpose")}
            value={section.purpose?.nameFi ?? undefined}
          />
          <ValueBox
            label={t("ApplicationEvent.eventDuration")}
            value={duration}
          />
          <ValueBox
            label={t("ApplicationEvent.eventsPerWeek")}
            value={`${section.appliedReservationsPerWeek}`}
          />
          <ValueBox label={t("ApplicationEvent.dates")} value={dates} />
        </EventProps>
        <H4>{t("ApplicationEvent.requestedReservationUnits")}</H4>
        <ApplicationSectionsContainer>
          {rows.map((row) => (
            <div style={{ display: "contents" }} key={row.pk}>
              {cols.map((col) => (
                <div key={`${col.key}-${row.pk}`}>{col.transform(row)}</div>
              ))}
            </div>
          ))}
        </ApplicationSectionsContainer>
        <H4>{t("ApplicationEvent.requestedTimes")}</H4>
        <EventSchedules>
          <TimeSelector applicationSection={section} />
          <Card
            border
            theme={{
              "--background-color": "var(--color-black-5)",
              "--padding-horizontal": "var(--spacing-m)",
              "--padding-vertical": "var(--spacing-m)",
            }}
          >
            <SchedulesCardContainer>
              <SchedulesContent as={section} priority={Priority.Primary} />
              <SchedulesContent as={section} priority={Priority.Secondary} />
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

  const typename = "ApplicationNode";
  const id = base64encode(`${typename}:${applicationPk}`);
  const {
    data,
    loading: isLoading,
    refetch,
  } = useQuery<Query, QueryApplicationArgs>(APPLICATION_ADMIN_QUERY, {
    skip: applicationPk === 0,
    variables: { id },
    onError: () => {
      notifyError(t("errors.errorFetchingApplication"));
    },
  });

  const application = data?.application ?? undefined;
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
  // TODO where is this defined in the application form?
  const homeCity = application?.homeCity?.nameFi ?? "-";

  // TODO (test these and either change the query to do the sorting or sort on the client)
  // sort reservationUnitOptions by priority
  // sort applicationSections by "begin" date (test case would be to have the second section begin before the first)

  const applicationSections = filterNonNullable(
    application?.applicationSections
  );

  if (application == null || applicationRound == null) {
    return <Error404 />;
  }

  const route = [
    {
      slug: "",
      alias: t("breadcrumb.recurring-reservations"),
    },
    {
      slug: `/recurring-reservations/application-rounds`,
      alias: t("breadcrumb.application-rounds"),
    },
    {
      // TODO url builder
      slug: `/recurring-reservations/application-rounds/${applicationRound.pk}`,
      alias: applicationRound.nameFi ?? "-",
    },
    {
      slug: "",
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
      <Container>
        <HeadingContainer>
          <H2 ref={ref} style={{ margin: "0" }}>
            {customerName}
          </H2>
          {application.status != null && (
            <ApplicationStatusBlock status={application.status} />
          )}
        </HeadingContainer>
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
              {isOrganisation && (
                <KV
                  k={t("Application.coreActivity")}
                  v={application.organisation?.coreBusiness || "-"}
                />
              )}
            </DefinitionList>
            <DefinitionList>
              <KV k={t("Application.numHours")} v="-" />
              <KV k={t("Application.numTurns")} v="-" />
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
        {applicationSections.map((section) => (
          <ApplicationSectionDetails
            section={section}
            application={application}
            key={section.pk}
            refetch={refetch}
          />
        ))}
        <H4>{t("Application.customerBasicInfo")}</H4>
        <EventProps>
          <ValueBox
            label={t("Application.authenticatedUser")}
            value={application.user?.email}
          />
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
                label={t("Application.coreActivity")}
                value={application.organisation?.coreBusiness}
              />
              <ValueBox label={t("common.homeCity")} value={homeCity} />
              <ValueBox
                label={t("Application.identificationNumber")}
                value={application.organisation?.identifier}
              />
            </>
          )}
          <ValueBox
            label={t("Application.headings.additionalInformation")}
            value={application.additionalInformation}
          />
          <ValueBox
            label={t("Application.headings.userBirthDate")}
            value={<BirthDate userPk={application.user?.pk ?? 0} />}
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
            <H4>
              {application.applicantType === ApplicantTypeChoice.Individual
                ? t("Application.contactInformation")
                : t("common.billingAddress")}
            </H4>
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
