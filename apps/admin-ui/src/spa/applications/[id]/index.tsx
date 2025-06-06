import React, { useRef, type ReactNode } from "react";
import styled from "styled-components";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  Button,
  IconCross,
  IconArrowRedo,
  Tag,
  ButtonSize,
  ButtonVariant,
  LoadingSpinner,
} from "hds-react";
import { isEqual, trim } from "lodash-es";
import { gql, type ApolloQueryResult } from "@apollo/client";
import { type TFunction } from "i18next";
import {
  CenterSpinner,
  Flex,
  TitleSection,
  H1,
  H3,
  H4,
  H5,
  Strong,
  fontMedium,
} from "common/styled";
import { breakpoints, WEEKDAYS } from "common/src/const";
import {
  base64encode,
  filterNonNullable,
  formatTimeRange,
  timeToMinutes,
  toNumber,
} from "common/src/helpers";
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
  type ApplicationAdminQuery,
  useRejectRestMutation,
  UserPermissionChoice,
  type SuitableTimeFragment,
  type ReservationUnitOptionFieldsFragment,
  type ApplicationPageSectionFragment,
  type ApplicationPageFieldsFragment,
} from "@gql/gql-types";
import { formatDuration } from "common/src/common/util";
import { convertWeekday, type Day } from "common/src/conversion";
import {
  formatNumber,
  formatDate,
  formatAgeGroups,
  formatDateRange,
} from "@/common/util";
import ScrollIntoView from "@/common/ScrollIntoView";
import { Accordion as AccordionBase } from "@/component/Accordion";
import { ApplicationWorkingMemo } from "@/component/WorkingMemo";
import ShowWhenTargetInvisible from "@/component/ShowWhenTargetInvisible";
import { StickyHeader } from "@/component/StickyHeader";
import { BirthDate } from "@/component/BirthDate";
import { ValueBox } from "../ValueBox";
import { TimeSelector } from "../TimeSelector";
import { getApplicantName } from "@/helpers";
import Error404 from "@/common/Error404";
import { useCheckPermission } from "@/hooks";
import { errorToast } from "common/src/common/toast";
import { ApplicationDatas, Summary } from "@/styled";
import { ApplicationStatusLabel } from "common/src/components/statuses";
import { useDisplayError } from "common/src/hooks";

function printSuitableTimes(
  timeRanges: Pick<
    SuitableTimeFragment,
    "dayOfTheWeek" | "beginTime" | "endTime" | "priority"
  >[],
  day: Day,
  priority: Priority
): string {
  const schedules = timeRanges
    .filter((s) => convertWeekday(s.dayOfTheWeek) === day)
    .filter((s) => s.priority === priority);

  return schedules
    .map((s) =>
      formatTimeRange(timeToMinutes(s.beginTime), timeToMinutes(s.endTime))
    )
    .join(", ");
}

const Value = styled.span`
  ${fontMedium}
`;

const Accordion = styled(AccordionBase)`
  --spacing-unit: 0;
  & h2 {
    --header-padding: var(--spacing-xs);
    margin: 0;
  }
`;

const PreCard = styled.div`
  font-size: var(--fontsize-body-s);
`;

const EventSchedule = styled.div`
  font-size: var(--fontsize-body-m);
  line-height: 2em;
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

    /* when the button is hidden the row should still have the same height */
    min-height: 46px;

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
    <span id={k}>{k}</span>:{" "}
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
  as: ApplicationPageSectionFragment;
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
      <H5 as="h4" $marginTop="none">
        {title}
      </H5>
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
  option: ReservationUnitOptionFieldsFragment;
  applicationStatus: ApplicationStatusChoice;
  refetch: () => Promise<ApolloQueryResult<ApplicationAdminQuery>>;
}) {
  const [mutation, { loading }] = useRejectRestMutation();
  const units = [option.reservationUnit?.unit?.pk ?? 0];

  const { hasPermission } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanManageApplications,
    requireAll: true,
  });
  const { t } = useTranslation();
  const displayError = useDisplayError();

  const updateOption = async (
    pk: Maybe<number> | undefined,
    rejected: boolean
  ): Promise<void> => {
    try {
      if (pk == null) {
        throw new Error("no pk in option");
      }
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
      displayError(err);
    }
  };

  const handleReject = () => {
    return updateOption(option.pk, true);
  };

  const handleRevert = () => {
    return updateOption(option.pk, false);
  };

  const isRejected = option.rejected;

  // codegen types are allow nulls so have to do this for debugging
  if (option.allocatedTimeSlots == null) {
    // eslint-disable-next-line no-console
    console.warn("no allocatedTimeSlots", option);
  }

  const isRejectionAllowed =
    applicationStatus === ApplicationStatusChoice.InAllocation ||
    applicationStatus === ApplicationStatusChoice.Handled;
  const hasAllocations = option.allocatedTimeSlots?.length > 0;
  const isDisabled =
    !isRejectionAllowed || hasAllocations || !hasPermission || option.locked;

  if (!hasPermission) {
    return null;
  }
  return (
    <Button
      size={ButtonSize.Small}
      variant={loading ? ButtonVariant.Clear : ButtonVariant.Supplementary}
      iconStart={
        loading ? (
          <LoadingSpinner small />
        ) : isRejected ? (
          <IconArrowRedo />
        ) : (
          <IconCross />
        )
      }
      onClick={isRejected ? handleRevert : handleReject}
      disabled={isDisabled || loading}
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
  section: ApplicationPageSectionFragment;
  applicationStatus: ApplicationStatusChoice;
  refetch: () => Promise<ApolloQueryResult<ApplicationAdminQuery>>;
}) {
  const { t } = useTranslation();
  const units = filterNonNullable(
    section.reservationUnitOptions.map((x) => x.reservationUnit?.unit?.pk)
  );
  const { hasPermission } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanManageApplications,
    requireAll: true,
  });

  const [rejectMutation, { loading: rejectLoading }] =
    useRejectAllSectionOptionsMutation();

  const [restoreMutation, { loading: restoreLoading }] =
    useRestoreAllSectionOptionsMutation();

  const displayError = useDisplayError();

  const isLoading = rejectLoading || restoreLoading;

  const mutate = async (
    pk: Maybe<number> | undefined,
    restore: boolean
  ): Promise<void> => {
    try {
      if (pk == null) {
        throw new Error("no pk in section");
      }
      if (isLoading) {
        throw new Error("mutation already in progress");
      }
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
      displayError(err);
    }
  };

  const handleRejectAll = () => {
    return mutate(section.pk, false);
  };

  const handleRestoreAll = () => {
    return mutate(section.pk, true);
  };

  // codegen types allow undefined so have to do this for debugging
  if (section.allocations == null) {
    // eslint-disable-next-line no-console
    console.warn("section.allocations is null", section);
  }

  const inAllocation =
    applicationStatus === ApplicationStatusChoice.InAllocation ||
    applicationStatus === ApplicationStatusChoice.Handled;
  const isRejected = section.reservationUnitOptions.every(
    (x) => x.rejected || x.locked
  );
  // edge case: only locked options -> rejection has no effect
  const isAllLocked = section.reservationUnitOptions.every((x) => x.locked);
  const hasAllocations = section.allocations != null && section.allocations > 0;
  const canReject = inAllocation && !hasAllocations;
  const isDisabled = !canReject || !hasPermission || isAllLocked;

  if (!hasPermission) {
    return null;
  }
  return (
    <Button
      size={ButtonSize.Small}
      variant={isLoading ? ButtonVariant.Clear : ButtonVariant.Secondary}
      iconStart={isLoading ? <LoadingSpinner small /> : undefined}
      disabled={isDisabled || isLoading}
      onClick={() => (isRejected ? handleRestoreAll() : handleRejectAll())}
    >
      {isRejected
        ? t("Application.section.btnRestoreAll")
        : t("Application.section.btnRejectAll")}
    </Button>
  );
}

const TimeSection = styled(Flex).attrs({
  $gap: "l",
})`
  & > div:first-child {
    flex-grow: 1;
  }
  & > div:last-child {
    flex-shrink: 0;
    grid-template-columns: repeat(2, 1fr);
    @media (min-width: ${breakpoints.l}) {
      grid-template-columns: 1fr;
    }
  }
  @media (min-width: ${breakpoints.l}) {
    flex-direction: row;
  }
`;

interface DataType extends ReservationUnitOptionFieldsFragment {
  index: number;
}
type ColumnType = {
  key: string;
  transform: (data: DataType) => ReactNode;
};

function ReservationUnitOptionsSection({
  section,
  refetch,
  applicationStatus,
}: {
  section: Pick<ApplicationPageSectionFragment, "reservationUnitOptions">;
  refetch: () => Promise<ApolloQueryResult<ApplicationAdminQuery>>;
  applicationStatus: Maybe<ApplicationStatusChoice>;
}) {
  const { t } = useTranslation();

  const cols: Array<ColumnType> = [
    {
      key: "index",
      transform: (d: DataType) => d.index.toString(),
    },
    {
      key: "unit",
      transform: (reservationUnitOption: ReservationUnitOptionFieldsFragment) =>
        reservationUnitOption?.reservationUnit?.unit?.nameFi ?? "-",
    },
    {
      key: "name",
      transform: (reservationUnitOption: ReservationUnitOptionFieldsFragment) =>
        reservationUnitOption?.reservationUnit?.nameFi ?? "-",
    },
    {
      key: "status",
      transform: ({
        rejected,
        locked,
      }: ReservationUnitOptionFieldsFragment) => {
        if (rejected || locked) {
          return (
            <DeclinedTag iconStart={<IconCross />}>
              {t("Application.rejected")}
            </DeclinedTag>
          );
        }
      },
    },
    {
      key: "reject",
      transform: (option: ReservationUnitOptionFieldsFragment) => {
        if (applicationStatus == null) {
          return null;
        }
        return (
          <RejectOptionButton
            option={option}
            applicationStatus={applicationStatus}
            refetch={refetch}
          />
        );
      },
    },
  ];

  const rows: DataType[] = section.reservationUnitOptions.map((ru, index) => ({
    ...ru,
    index: index + 1,
  }));

  return (
    <ApplicationSectionsContainer>
      {rows.map((row) => (
        <div style={{ display: "contents" }} key={row.pk}>
          {cols.map((col) => (
            <div key={`${col.key}-${row.pk}`}>{col.transform(row)}</div>
          ))}
        </div>
      ))}
    </ApplicationSectionsContainer>
  );
}

function ApplicationSectionDetails({
  section,
  application,
  refetch,
}: {
  section: ApplicationPageSectionFragment;
  application: ApplicationPageFieldsFragment;
  refetch: () => Promise<ApolloQueryResult<ApplicationAdminQuery>>;
}): JSX.Element {
  const { t } = useTranslation();

  const minDuration = section.reservationMinDuration;
  const maxDuration = section.reservationMaxDuration;
  const duration = appEventDuration(minDuration, maxDuration, t);
  const hash = section.pk?.toString() ?? "";
  const heading = `${application.pk ?? "-"}-${section.pk ?? "-"} ${section.name}`;

  const beginDate = new Date(section.reservationsBeginDate);
  const endDate = new Date(section.reservationsEndDate);
  const dates = formatDateRange(t, beginDate, endDate);

  return (
    <ScrollIntoView key={section.pk} hash={hash}>
      <Accordion heading={heading} initiallyOpen>
        <ApplicationDatas>
          {section.ageGroup && (
            <ValueBox
              label={t("ApplicationEvent.ageGroup")}
              value={formatAgeGroups(
                {
                  minimum: section.ageGroup.minimum,
                  maximum: section.ageGroup.maximum ?? undefined,
                },
                t
              )}
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
        </ApplicationDatas>
        <Flex
          $justifyContent="space-between"
          $direction="row"
          $alignItems="center"
        >
          <H4 as="h3">{t("ApplicationEvent.requestedReservationUnits")}</H4>
          <RejectAllOptionsButton
            section={section}
            refetch={refetch}
            applicationStatus={
              application?.status ?? ApplicationStatusChoice.Draft
            }
          />
        </Flex>
        <ReservationUnitOptionsSection
          section={section}
          refetch={refetch}
          applicationStatus={application?.status}
        />
        <H4 as="h3">{t("ApplicationEvent.requestedTimes")}</H4>
        <TimeSection>
          <TimeSelector applicationSection={section} />
          <Summary>
            <SchedulesContent as={section} priority={Priority.Primary} />
            <SchedulesContent as={section} priority={Priority.Secondary} />
          </Summary>
        </TimeSection>
      </Accordion>
    </ScrollIntoView>
  );
}

function RejectApplicationButton({
  application,
  refetch,
}: {
  application: ApplicationPageFieldsFragment;
  refetch: () => Promise<ApolloQueryResult<ApplicationAdminQuery>>;
}): JSX.Element | null {
  const { t } = useTranslation();
  const units = filterNonNullable(
    application.applicationSections?.flatMap((section) =>
      section.reservationUnitOptions?.map((x) => x.reservationUnit?.unit?.pk)
    )
  );
  const { hasPermission } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanManageApplications,
    requireAll: true,
  });

  const [rejectionMutation, { loading: isRejectionLoading }] =
    useRejectAllApplicationOptionsMutation();

  const [restoreMutation, { loading: isRestoreLoading }] =
    useRestoreAllApplicationOptionsMutation();
  const displayError = useDisplayError();

  const isLoading = isRejectionLoading || isRestoreLoading;

  const updateApplication = async (
    pk: Maybe<number> | undefined,
    shouldReject: boolean
  ): Promise<void> => {
    try {
      if (pk == null) {
        throw new Error("no pk in application");
      }
      if (isLoading) {
        throw new Error("mutation already in progress");
      }

      const mutation = shouldReject ? rejectionMutation : restoreMutation;
      await mutation({
        variables: {
          input: {
            pk,
          },
        },
      });
      refetch();
    } catch (err) {
      displayError(err);
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

  const handleRejectAll = () => {
    return updateApplication(application.pk, true);
  };

  const handleRestoreAll = () => {
    return updateApplication(application.pk, false);
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
  const aes = application.applicationSections ?? [];
  const hasBeenAllocated = aes.some((section) =>
    section.reservationUnitOptions.some(
      (option) => option.allocatedTimeSlots?.length > 0
    )
  );
  const canReject = isInAllocation && !hasBeenAllocated;
  const isRejected = aes.every((section) =>
    section.reservationUnitOptions.every(
      (option) => option.rejected || option.locked
    )
  );
  // edge case: only locked options -> rejection has no effect
  const isAllLocked = aes.every((section) =>
    section.reservationUnitOptions.every((x) => x.locked)
  );
  const isDisabled = !canReject || !hasPermission || isAllLocked;

  if (!hasPermission) {
    return null;
  }

  return (
    <Button
      variant={ButtonVariant.Secondary}
      size={ButtonSize.Small}
      onClick={() => (isRejected ? handleRestoreAll() : handleRejectAll())}
      disabled={isDisabled}
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
      errorToast({ text: t("errors.errorFetchingApplication") });
    },
  });

  const application = data?.application;
  const applicationRound = application?.applicationRound;

  if (isLoading) {
    return <CenterSpinner />;
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

  if (applicationRound == null) {
    return <Error404 />;
  }

  const isOrganisation = application?.organisation != null;

  // TODO replace this with an explicit check and warn on undefined fields
  const hasBillingAddress =
    application?.billingAddress != null &&
    !isEqual(application?.billingAddress, application.organisation?.address);

  const customerName = getApplicantName(application);
  // TODO where is this defined in the application form?
  const homeCity = application.homeCity?.nameFi ?? "-";

  // TODO (test these and either change the query to do the sorting or sort on the client)
  // sort reservationUnitOptions by priority
  // sort applicationSections by "begin" date (test case would be to have the second section begin before the first)

  const applicationSections = application.applicationSections ?? [];

  return (
    <>
      <ShowWhenTargetInvisible target={ref}>
        <StickyHeader
          name={customerName}
          tagline={`${t("Application.id")}: ${application.pk}`}
        />
      </ShowWhenTargetInvisible>
      <>
        <TitleSection>
          <H1 ref={ref} $noMargin>
            {customerName}
          </H1>
          {application.status != null && (
            <ApplicationStatusLabel status={application.status} user="admin" />
          )}
        </TitleSection>
        <PreCard>
          {t("Application.applicationReceivedTime")}{" "}
          {formatDate(application.lastModifiedDate, "d.M.yyyy HH:mm")}
        </PreCard>
        <div>
          <RejectApplicationButton
            application={application}
            refetch={refetch}
          />
        </div>
        <Summary>
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
          <KV k={t("Application.numHours")} v="-" />
          <KV k={t("Application.numTurns")} v="-" />
        </Summary>
        <Accordion
          heading={t("RequestedReservation.workingMemo")}
          initiallyOpen={application.workingMemo.length > 0}
        >
          <ApplicationWorkingMemo
            applicationPk={applicationPk}
            refetch={refetch}
            initialValue={application.workingMemo}
          />
        </Accordion>
        {applicationSections.map((section) => (
          <ApplicationSectionDetails
            section={section}
            application={application}
            key={section.pk}
            refetch={refetch}
          />
        ))}
        <H3 as="h2" $noMargin>
          {t("Application.customerBasicInfo")}
        </H3>
        <ApplicationDatas>
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
        </ApplicationDatas>
        <H3 as="h2" $noMargin>
          {t("Application.contactPersonInformation")}
        </H3>
        <ApplicationDatas>
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
        </ApplicationDatas>
        {isOrganisation ? (
          <>
            <H3 as="h2" $noMargin>
              {t("Application.contactInformation")}
            </H3>
            <ApplicationDatas>
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
            </ApplicationDatas>
          </>
        ) : null}
        {hasBillingAddress ? (
          <>
            <H3 as="h2" $noMargin>
              {application.applicantType === ApplicantTypeChoice.Individual
                ? t("Application.contactInformation")
                : t("common.billingAddress")}
            </H3>
            <ApplicationDatas>
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
            </ApplicationDatas>
          </>
        ) : null}
      </>
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

  const applicationPk = toNumber(applicationId);
  if (!applicationPk) {
    return <div>{t("errors.router.invalidApplicationNumber")}</div>;
  }

  return <ApplicationDetails applicationPk={applicationPk} />;
}

export default ApplicationDetailsRouted;

export const APPLICATION_PAGE_SECTION_FRAGMENT = gql`
  fragment ApplicationPageSection on ApplicationSectionNode {
    ...ApplicationSectionCommon
    suitableTimeRanges {
      ...SuitableTime
    }
    purpose {
      id
      pk
      nameFi
    }
    allocations
    reservationUnitOptions {
      id
      ...ReservationUnitOptionFields
    }
  }
`;

// NOTE only include fields here that need to be passed to other components
export const APPLICATION_PAGE_FRAGMENT = gql`
  fragment ApplicationPageFields on ApplicationNode {
    id
    pk
    status
    lastModifiedDate
    ...ApplicantFields
    ...ApplicantNameFields
    applicationRound {
      id
      pk
      nameFi
    }
    applicationSections {
      ...ApplicationPageSection
    }
  }
`;

// TODO this is not a good fragment, match a component / function not just create them for tab count
export const RESERVATION_UNIT_OPTION_FRAGMENT = gql`
  fragment ReservationUnitOptionFields on ReservationUnitOptionNode {
    id
    pk
    rejected
    locked
    allocatedTimeSlots {
      pk
      id
    }
    reservationUnit {
      id
      pk
      nameFi
      unit {
        id
        pk
        nameFi
      }
      applicationRoundTimeSlots {
        ...ApplicationRoundTimeSlots
      }
    }
  }
`;

export const APPLICATION_ADMIN_QUERY = gql`
  query ApplicationAdmin($id: ID!) {
    application(id: $id) {
      ...ApplicationPageFields
      workingMemo
      user {
        id
        email
      }
    }
  }
`;

export const REJECT_ALL_SECTION_OPTIONS = gql`
  mutation RejectAllSectionOptions(
    $input: RejectAllSectionOptionsMutationInput!
  ) {
    rejectAllSectionOptions(input: $input) {
      pk
    }
  }
`;

export const RESTORE_ALL_SECTION_OPTIONS = gql`
  mutation RestoreAllSectionOptions(
    $input: RestoreAllSectionOptionsMutationInput!
  ) {
    restoreAllSectionOptions(input: $input) {
      pk
    }
  }
`;

export const REJECT_APPLICATION = gql`
  mutation RejectAllApplicationOptions(
    $input: RejectAllApplicationOptionsMutationInput!
  ) {
    rejectAllApplicationOptions(input: $input) {
      pk
    }
  }
`;

export const RESTORE_APPLICATION = gql`
  mutation RestoreAllApplicationOptions(
    $input: RestoreAllApplicationOptionsMutationInput!
  ) {
    restoreAllApplicationOptions(input: $input) {
      pk
    }
  }
`;
