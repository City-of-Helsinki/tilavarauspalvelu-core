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
import { type ApolloQueryResult } from "@apollo/client";
import { type TFunction } from "i18next";
import { H2, H4, H5, Strong } from "common/src/common/typography";
import { breakpoints } from "common/src/common/style";
import { base64encode, filterNonNullable } from "common/src/helpers";
import {
  getPermissionErrors,
  getValidationErrors,
} from "common/src/apolloUtils";
import {
  ApplicationStatusChoice,
  ApplicantTypeChoice,
  Priority,
  type Maybe,
  useRestoreAllApplicationOptionsMutation,
  useRejectAllApplicationOptionsMutation,
  useRestoreAllSectionOptionsMutation,
  useRejectAllSectionOptionsMutation,
  useApplicationAdminQuery,
  ApplicationAdminQuery,
  useRejectRestMutation,
} from "@gql/gql-types";
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
import { getApplicantName, getApplicationStatusColor } from "@/helpers";
import Error404 from "@/common/Error404";

type ApplicationType = NonNullable<ApplicationAdminQuery["application"]>;
type ApplicationSectionType = NonNullable<
  ApplicationType["applicationSections"]
>[0];
type ReservationUnitOptionType = NonNullable<
  ApplicationSectionType["reservationUnitOptions"]
>[0];
type SuitableTimeRangeType = NonNullable<
  ApplicationSectionType["suitableTimeRanges"]
>[0];

function printSuitableTimes(
  timeRanges: SuitableTimeRangeType[],
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
`;

const PreCard = styled.div`
  font-size: var(--fontsize-body-s);
  margin-bottom: var(--spacing-2-xs);
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
  align-items: start;
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
  as: ApplicationSectionType;
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
  applicationStatus,
  refetch,
}: {
  option: ReservationUnitOptionType;
  applicationStatus: ApplicationStatusChoice;
  refetch: () => Promise<ApolloQueryResult<ApplicationAdminQuery>>;
}) {
  const [mutation, { loading }] = useRejectRestMutation();

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
      if (getPermissionErrors(err).length > 0) {
        notifyError(t("errors.noPermission"));
      } else if (mutationErrors.length > 0) {
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
        // TODO this translation is missing
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

  const canReject =
    applicationStatus === ApplicationStatusChoice.InAllocation ||
    applicationStatus === ApplicationStatusChoice.Handled;
  const isDisabled = !canReject || option.allocatedTimeSlots?.length > 0;
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
      {isRejected
        ? t("Application.section.btnRestore")
        : t("Application.section.btnReject")}
    </Button>
  );
}

function RejectAllOptionsButton({
  section,
  applicationStatus,
  refetch,
}: {
  section: ApplicationSectionType;
  applicationStatus: ApplicationStatusChoice;
  refetch: () => Promise<ApolloQueryResult<ApplicationAdminQuery>>;
}) {
  const { t } = useTranslation();

  const [rejectMutation, { loading: rejectLoading }] =
    useRejectAllSectionOptionsMutation();

  const [restoreMutation, { loading: restoreLoading }] =
    useRestoreAllSectionOptionsMutation();

  const { notifyError } = useNotification();

  const isLoading = rejectLoading || restoreLoading;

  const mutate = async (pk: Maybe<number> | undefined, restore: boolean) => {
    if (pk == null) {
      // TODO this is an error
      return;
    }
    if (isLoading) {
      return;
    }
    try {
      const mutation = restore ? restoreMutation : rejectMutation;
      await mutation({
        variables: {
          input: {
            pk,
          },
        },
      });
      refetch();
    } catch (err) {
      const mutationErrors = getValidationErrors(err);
      if (getPermissionErrors(err).length > 0) {
        notifyError(t("errors.noPermission"));
      } else if (mutationErrors.length > 0) {
        // TODO handle other codes also
        const isInvalidState = mutationErrors.find(
          (e) => e.code === "CANNOT_REJECT_SECTION_OPTIONS"
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
        // TODO this translation is missing
        notifyError(t("errors.errorRejectingOption"));
      }
    }
  };

  const handleRejectAll = async () => {
    mutate(section.pk, false);
  };

  const handleRestoreAll = async () => {
    mutate(section.pk, true);
  };

  // codegen types allow undefined so have to do this for debugging
  if (section.allocations == null) {
    // eslint-disable-next-line no-console
    console.warn("section.allocations is null", section);
  }

  const inAllocation =
    applicationStatus === ApplicationStatusChoice.InAllocation ||
    applicationStatus === ApplicationStatusChoice.Handled;
  const isRejected = section.reservationUnitOptions.every((x) => x.rejected);
  const hasAllocations = section.allocations != null && section.allocations > 0;
  const canReject = inAllocation && !hasAllocations;
  return (
    <Button
      disabled={!canReject}
      size="small"
      variant="secondary"
      onClick={() => (isRejected ? handleRestoreAll() : handleRejectAll())}
      isLoading={isLoading}
    >
      {isRejected
        ? t("Application.section.btnRestoreAll")
        : t("Application.section.btnRejectAll")}
    </Button>
  );
}

interface DataType extends ReservationUnitOptionType {
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
  section: ApplicationSectionType;
  application: ApplicationType;
  refetch: () => Promise<ApolloQueryResult<ApplicationAdminQuery>>;
}): JSX.Element {
  const { t } = useTranslation();

  const minDuration = section?.reservationMinDuration ?? undefined;
  const maxDuration = section?.reservationMaxDuration ?? undefined;
  const duration = appEventDuration(minDuration, maxDuration, t);
  const hash = section?.pk?.toString() ?? "";
  const heading = `${application?.pk}-${section.pk} ${section.name}`;

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
      transform: (reservationUnitOption: ReservationUnitOptionType) =>
        reservationUnitOption?.reservationUnit?.unit?.nameFi ?? "-",
    },
    {
      key: "name",
      transform: (reservationUnitOption: ReservationUnitOptionType) =>
        reservationUnitOption?.reservationUnit?.nameFi ?? "-",
    },
    {
      key: "status",
      transform: (reservationUnitOption: ReservationUnitOptionType) => {
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
      transform: (reservationUnitOption: ReservationUnitOptionType) => {
        // TODO button should only be visible if user has "can_handle_applications" permission
        // the application is visible to the user if they have "can_view_application" permission
        // but they aren't allowed to reject it
        // requires mergin a PR with changes to application permission checks
        return (
          <RejectOptionButton
            option={reservationUnitOption}
            applicationStatus={
              application?.status ?? ApplicationStatusChoice.Draft
            }
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
            value={formatNumber(section.numPersons, t("common.membersSuffix"))}
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
        <HeadingContainer style={{ alignItems: "center" }}>
          <H4 as="h3">{t("ApplicationEvent.requestedReservationUnits")}</H4>
          <RejectAllOptionsButton
            section={section}
            refetch={refetch}
            applicationStatus={
              application?.status ?? ApplicationStatusChoice.Draft
            }
          />
        </HeadingContainer>
        <ApplicationSectionsContainer>
          {rows.map((row) => (
            <div style={{ display: "contents" }} key={row.pk}>
              {cols.map((col) => (
                <div key={`${col.key}-${row.pk}`}>{col.transform(row)}</div>
              ))}
            </div>
          ))}
        </ApplicationSectionsContainer>
        <H4 as="h3">{t("ApplicationEvent.requestedTimes")}</H4>
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

function RejectApplicationButton({
  application,
  refetch,
}: {
  application: ApplicationType;
  refetch: () => Promise<ApolloQueryResult<ApplicationAdminQuery>>;
}): JSX.Element | null {
  const { t } = useTranslation();
  const { notifyError } = useNotification();

  const [rejectionMutation, { loading: isRejectionLoading }] =
    useRejectAllApplicationOptionsMutation();

  const [restoreMutation, { loading: isRestoreLoading }] =
    useRestoreAllApplicationOptionsMutation();

  const isLoading = isRejectionLoading || isRestoreLoading;

  const updateApplication = async (
    pk: Maybe<number> | undefined,
    shouldReject: boolean
  ) => {
    if (pk == null) {
      return;
    }
    if (isLoading) {
      return;
    }

    const mutation = shouldReject ? rejectionMutation : restoreMutation;
    try {
      await mutation({
        variables: {
          input: {
            pk,
          },
        },
      });
      refetch();
    } catch (err) {
      const mutationErrors = getValidationErrors(err);
      if (getPermissionErrors(err).length > 0) {
        notifyError(t("errors.noPermission"));
      } else if (mutationErrors.length > 0) {
        // TODO handle other codes also
        const isInvalidState = mutationErrors.find(
          (e) => e.code === "CANNOT_REJECT_APPLICATION_OPTIONS"
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
        notifyError(t("errors.errorRejectingApplication"));
      }
    }
  };

  if (application?.applicationSections == null) {
    // eslint-disable-next-line no-console
    console.warn("application.applicationSections is null", application);
  }

  if (application?.pk == null) {
    // eslint-disable-next-line no-console
    console.warn("application.pk is null", application);
    return null;
  }

  const handleRejectAll = async () => {
    updateApplication(application.pk, true);
  };

  const handleRestoreAll = async () => {
    updateApplication(application.pk, false);
  };

  // codegen types allow undefined so have to do this for debugging
  if (application.applicationSections == null) {
    // eslint-disable-next-line no-console
    console.warn("application.applicationSections is null", application);
  }
  if (application.status == null) {
    // eslint-disable-next-line no-console
    console.warn("application.status is null", application);
  }

  const isInAllocation =
    application.status === ApplicationStatusChoice.InAllocation ||
    application.status === ApplicationStatusChoice.Handled;
  const hasBeenAllocated =
    application.applicationSections?.some((section) =>
      section.reservationUnitOptions.some(
        (option) => option.allocatedTimeSlots?.length > 0
      )
    ) ?? false;
  const canReject = isInAllocation && !hasBeenAllocated;
  const isRejected =
    application.applicationSections?.every((section) =>
      section.reservationUnitOptions.every((option) => option.rejected)
    ) ?? false;

  return (
    <Button
      size="small"
      variant="secondary"
      theme="black"
      onClick={() => (isRejected ? handleRestoreAll() : handleRejectAll())}
      disabled={!canReject}
    >
      {isRejected ? t("Application.btnRestore") : t("Application.btnReject")}
    </Button>
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
    error,
  } = useApplicationAdminQuery({
    skip: !(applicationPk > 0),
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

  if (error) {
    return <div>{t("errors.errorFetchingApplication")}</div>;
  }

  // NOTE id query will return null if the application is not found or the user does not have permission
  // we can't distinguish between these two cases
  const canView = application != null;
  if (!canView) {
    return <div>{t("errors.noPermission")}</div>;
  }

  const isOrganisation = application?.organisation != null;

  // TODO replace this with an explicit check and warn on undefined fields
  const hasBillingAddress =
    application?.billingAddress != null &&
    !isEqual(application?.billingAddress, application?.organisation?.address);

  const customerName = getApplicantName(application);
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
          <H2 as="h1" ref={ref} style={{ margin: "0" }}>
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
        <div style={{ marginBottom: "var(--spacing-s)" }}>
          <RejectApplicationButton
            application={application}
            refetch={refetch}
          />
        </div>
        <Card
          theme={{
            "--background-color": "var(--color-black-5)",
            "--padding-horizontal": "var(--spacing-m)",
            "--padding-vertical": "var(--spacing-m)",
          }}
          style={{ marginBottom: "var(--spacing-m)" }}
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
                  v={application.organisation?.coreBusinessFi || "-"}
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
                value={application.organisation?.nameFi}
              />
              <ValueBox
                label={t("Application.coreActivity")}
                value={application.organisation?.coreBusinessFi}
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
            value={<BirthDate applicationPk={application.pk ?? 0} />}
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
                value={application.organisation?.address?.streetAddressFi}
              />
              <ValueBox
                label={t("common.postalNumber")}
                value={application.organisation?.address?.postCode}
              />
              <ValueBox
                label={t("common.postalDistrict")}
                value={application.organisation?.address?.cityFi}
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
                value={application.billingAddress?.streetAddressFi}
              />
              <ValueBox
                label={t("common.postalNumber")}
                value={application.billingAddress?.postCode}
              />
              <ValueBox
                label={t("common.postalDistrict")}
                value={application.billingAddress?.cityFi}
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
