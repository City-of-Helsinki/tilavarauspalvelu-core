import React, { type ReactNode, useRef } from "react";
import styled from "styled-components";
import { useTranslation, type TFunction } from "next-i18next";
import { Button, ButtonSize, ButtonVariant, IconArrowRedo, IconCross, LoadingSpinner, Tag } from "hds-react";
import { isEqual, trim } from "lodash-es";
import { type ApolloQueryResult, gql } from "@apollo/client";
import { CenterSpinner, Flex, fontMedium, H1, H3, H4, TitleSection } from "ui/src/styled";
import { breakpoints } from "ui/src/modules/const";
import { createNodeId, filterNonNullable, ignoreMaybeArray, toNumber } from "ui/src/modules/helpers";
import {
  type ApplicationAdminQuery,
  type ApplicationPageFieldsFragment,
  type ApplicationPageSectionFragment,
  ApplicationStatusChoice,
  type Maybe,
  type ReservationUnitOptionFieldsFragment,
  ReserveeType,
  useApplicationAdminQuery,
  useRejectAllApplicationOptionsMutation,
  useRejectAllSectionOptionsMutation,
  useRejectRestMutation,
  useRestoreAllApplicationOptionsMutation,
  useRestoreAllSectionOptionsMutation,
  UserPermissionChoice,
} from "@gql/gql-types";
import { formatDateRange, formatDateTime, formatDuration, parseValidDateObject } from "ui/src/modules/date-utils";
import { ApplicationTimePreview } from "ui/src/components/ApplicationTimePreview";
import { formatAgeGroups, formatNumber } from "@/modules/util";
import { ScrollIntoView } from "@/components/ScrollIntoView";
import { Accordion as AccordionBase } from "@/components/Accordion";
import { ApplicationWorkingMemo } from "@/components/WorkingMemo";
import { ShowWhenTargetInvisible } from "@/components/ShowWhenTargetInvisible";
import { StickyHeader } from "@/components/StickyHeader";
import { BirthDate } from "@/components/BirthDate";
import { ValueBox } from "@/components/ValueBox";
import { TimeSelector } from "@/components/TimeSelector";
import { getApplicantName, translateReserveeType } from "@/modules/helpers";
import { Error404 } from "@/components/Error404";
import { useCheckPermission } from "@/hooks";
import { ApplicationDatas, Summary } from "@/styled";
import { ApplicationStatusLabel } from "ui/src/components/statuses";
import { useDisplayError } from "ui/src/hooks";
import { Error403 } from "@/components/Error403";
import { GetServerSidePropsContext } from "next";
import { getCommonServerSideProps } from "@/modules/serverUtils";
import { serverSideTranslations } from "next-i18next/serverSideTranslations";
import { NOT_FOUND_SSR_VALUE } from "@/modules/const";

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

// the default HDS tag css can't align icons properly so we have to do this
// TODO reusable Tags that allow setting both the background and optional Icon
const DeclinedTag = styled(Tag)`
  background-color: var(--color-metro-medium-light);

  > span > span {
    display: flex;
    align-items: center;
  }
`;

const KV = ({ k, v, dataId }: { k: string; v?: string; dataId?: string }): JSX.Element => (
  <div key={k}>
    <span id={k}>{k}</span>:{" "}
    <Value aria-labelledby={k} data-testid={dataId}>
      {v || "-"}
    </Value>
  </div>
);

function formatApplicationDuration(durationSeconds: number | undefined, t: TFunction, type?: "min" | "max"): string {
  if (!durationSeconds) {
    return "";
  }
  const translationKey = `common:${type}Amount`;
  return `${type ? t(translationKey) : ""} ${formatDuration(t, { seconds: durationSeconds })}`;
}

function appEventDuration(min: number | undefined, max: number | undefined, t: TFunction): string {
  let duration = "";
  if (isEqual(min, max)) {
    duration += formatApplicationDuration(min, t);
  } else {
    duration += formatApplicationDuration(min, t, "min");
    duration += `, ${formatApplicationDuration(max, t, "max")}`;
  }
  return trim(duration, ", ");
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

  const updateOption = async (pk: Maybe<number> | undefined, isRejected: boolean): Promise<void> => {
    try {
      if (pk == null) {
        throw new Error("no pk in option");
      }
      await mutation({
        variables: {
          input: {
            pk,
            isRejected,
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

  const isRejectionAllowed =
    applicationStatus === ApplicationStatusChoice.InAllocation || applicationStatus === ApplicationStatusChoice.Handled;
  const hasAllocations = option.allocatedTimeSlots?.length > 0;
  const isDisabled = !isRejectionAllowed || hasAllocations || !hasPermission || option.isLocked;
  const isRejected = option.isRejected;

  if (!hasPermission) {
    return null;
  }
  return (
    <Button
      size={ButtonSize.Small}
      variant={loading ? ButtonVariant.Clear : ButtonVariant.Supplementary}
      iconStart={loading ? <LoadingSpinner small /> : isRejected ? <IconArrowRedo /> : <IconCross />}
      onClick={isRejected ? handleRevert : handleReject}
      disabled={isDisabled || loading}
      data-testid={`reject-btn-${option.pk}`}
    >
      {isRejected ? t("application:section.btnRestore") : t("application:section.btnReject")}
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
  const units = filterNonNullable(section.reservationUnitOptions.map((x) => x.reservationUnit?.unit?.pk));
  const { hasPermission } = useCheckPermission({
    units,
    permission: UserPermissionChoice.CanManageApplications,
    requireAll: true,
  });

  const [rejectMutation, { loading: rejectLoading }] = useRejectAllSectionOptionsMutation();

  const [restoreMutation, { loading: restoreLoading }] = useRestoreAllSectionOptionsMutation();

  const displayError = useDisplayError();

  const isLoading = rejectLoading || restoreLoading;

  const mutate = async (pk: Maybe<number> | undefined, restore: boolean): Promise<void> => {
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
    applicationStatus === ApplicationStatusChoice.InAllocation || applicationStatus === ApplicationStatusChoice.Handled;
  const isRejected = section.reservationUnitOptions.every((x) => x.isRejected || x.isLocked);
  // edge case: only locked options -> rejection has no effect
  const isAllLocked = section.reservationUnitOptions.every((x) => x.isLocked);
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
      {isRejected ? t("application:section.btnRestoreAll") : t("application:section.btnRejectAll")}
    </Button>
  );
}

const TimeSection = styled.div`
  display: grid;
  gap: var(--spacing-m);

  grid-template-columns: 1fr;
  @media (min-width: ${breakpoints.l}) {
    grid-template-columns: minmax(0, max-content) min-content;
  }

  /* force legend to next row after calendar */

  > :nth-child(2) {
    grid-row: 2;
  }
`;

interface DataType extends ReservationUnitOptionFieldsFragment {
  index: number;
}

type ColumnType = {
  key: string;
  transform: (data: DataType) => ReactNode;
};

const ReservationUnitOptionsTable = styled.table`
  border-collapse: collapse;
  width: 100%;
`;

const ReservationUnitOptionRow = styled.tr`
  border-top: 1px solid var(--color-black-20);
`;

const ReservationUnitOptionElem = styled.td<{ $hideOnMobile?: boolean }>`
  box-sizing: border-box;
  padding: var(--spacing-2-xs);
  display: ${({ $hideOnMobile }) => ($hideOnMobile ? "none" : "table-cell")};
  @media (min-width: ${breakpoints.m}) {
    display: table-cell;
  }
`;

// Required for table overflow
const TableWrapper = styled.div`
  display: grid;
  overflow-x: auto;
`;

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
      transform: ({ isRejected, isLocked }: ReservationUnitOptionFieldsFragment) => {
        if (isRejected || isLocked) {
          return (
            <DeclinedTag iconStart={<IconCross />} placeholder="">
              {t("application:rejected")}
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
        return <RejectOptionButton option={option} applicationStatus={applicationStatus} refetch={refetch} />;
      },
    },
  ];

  const rows: DataType[] = section.reservationUnitOptions.map((ru, index) => ({
    ...ru,
    index: index + 1,
  }));

  return (
    <TableWrapper>
      <ReservationUnitOptionsTable>
        {rows.map((row) => (
          <ReservationUnitOptionRow key={row.pk}>
            {cols.map((col) => (
              <ReservationUnitOptionElem key={`${col.key}-${row.pk}`} $hideOnMobile={col.key === "status"}>
                {col.transform(row)}
              </ReservationUnitOptionElem>
            ))}
          </ReservationUnitOptionRow>
        ))}
      </ReservationUnitOptionsTable>
    </TableWrapper>
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

  const beginDate = parseValidDateObject(section.reservationsBeginDate);
  const endDate = parseValidDateObject(section.reservationsEndDate);
  const dates = formatDateRange(beginDate, endDate);

  return (
    <ScrollIntoView key={section.pk} hash={hash}>
      <Accordion heading={heading} initiallyOpen>
        <Flex>
          <ApplicationDatas>
            {section.ageGroup && (
              <ValueBox
                label={t("applicationSection:ageGroup")}
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
              label={t("applicationSection:groupSize")}
              value={formatNumber(section.numPersons, t("common:membersSuffix"))}
            />
            <ValueBox label={t("applicationSection:purpose")} value={section.purpose?.nameFi ?? undefined} />
            <ValueBox label={t("applicationSection:eventDuration")} value={duration} />
            <ValueBox label={t("applicationSection:eventsPerWeek")} value={`${section.appliedReservationsPerWeek}`} />
            <ValueBox label={t("applicationSection:dates")} value={dates} />
          </ApplicationDatas>
          <Flex $justifyContent="space-between" $direction="row" $alignItems="center">
            <H4 as="h3">{t("applicationSection:requestedReservationUnits")}</H4>
            <RejectAllOptionsButton
              section={section}
              refetch={refetch}
              applicationStatus={application.status ?? ApplicationStatusChoice.Draft}
            />
          </Flex>
          <ReservationUnitOptionsSection section={section} refetch={refetch} applicationStatus={application.status} />
          <H4 as="h3">{t("applicationSection:requestedTimes")}</H4>
          <TimeSection>
            <TimeSelector applicationSection={section} />
            <ApplicationTimePreview schedules={section.suitableTimeRanges} />
          </TimeSection>
        </Flex>
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

  const [rejectionMutation, { loading: isRejectionLoading }] = useRejectAllApplicationOptionsMutation();

  const [restoreMutation, { loading: isRestoreLoading }] = useRestoreAllApplicationOptionsMutation();
  const displayError = useDisplayError();

  const isLoading = isRejectionLoading || isRestoreLoading;

  const updateApplication = async (pk: Maybe<number> | undefined, shouldReject: boolean): Promise<void> => {
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

  if (application.applicationSections == null) {
    // eslint-disable-next-line no-console
    console.warn("application.applicationSections is null", application);
  }

  if (application.pk == null) {
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
    section.reservationUnitOptions.some((option) => option.allocatedTimeSlots?.length > 0)
  );
  const canReject = isInAllocation && !hasBeenAllocated;
  const isRejected = aes.every((section) =>
    section.reservationUnitOptions.every((option) => option.isRejected || option.isLocked)
  );
  // edge case: only locked options -> rejection has no effect
  const isAllLocked = aes.every((section) => section.reservationUnitOptions.every((x) => x.isLocked));
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
      {isRejected ? t("application:btnRestore") : t("application:btnReject")}
    </Button>
  );
}

export default function ApplicationPage({ pk }: PropsNarrowed): JSX.Element | null {
  const ref = useRef<HTMLHeadingElement>(null);
  const { t } = useTranslation();

  const {
    data,
    loading: isLoading,
    refetch,
  } = useApplicationAdminQuery({
    skip: !(pk > 0),
    variables: { id: createNodeId("ApplicationNode", pk) },
  });

  const application = data?.application;
  const applicationRound = application?.applicationRound;

  if (isLoading) {
    return <CenterSpinner />;
  }

  // NOTE id query will return null if the application is not found or the user does not have permission
  // we can't distinguish between these two cases
  const canView = application != null;
  if (!canView) {
    return <Error403 />;
  }

  if (applicationRound == null) {
    return <Error404 />;
  }

  const isOrganisation = !!application.organisationName;

  const hasBillingAddress =
    !!application.billingStreetAddress &&
    application.billingStreetAddress === application.organisationStreetAddress &&
    application.billingPostCode === application.organisationPostCode &&
    application.billingCity === application.organisationCity;

  const applicantType = translateReserveeType(t, application?.applicantType, application?.organisationIdentifier);
  const municipality = application.municipality
    ? t(`common:municipalities.${application.municipality.toUpperCase()}`)
    : "-";
  const customerName = getApplicantName(application);

  // TODO (test these and either change the query to do the sorting or sort on the client)
  // sort reservationUnitOptions by priority
  // sort applicationSections by "begin" date (test case would be to have the second section begin before the first)

  const applicationSections = application.applicationSections ?? [];

  return (
    <>
      <ShowWhenTargetInvisible target={ref}>
        <StickyHeader name={customerName} tagline={`${t("application:id")}: ${application.pk}`} />
      </ShowWhenTargetInvisible>
      <>
        <TitleSection>
          <H1 ref={ref} $noMargin>
            {customerName}
          </H1>
          {application.status != null && <ApplicationStatusLabel status={application.status} user="admin" />}
        </TitleSection>
        <PreCard>
          {t("application:applicationReceivedTime")},{" "}
          {formatDateTime(parseValidDateObject(application?.updatedAt), {
            includeWeekday: false,
            includeTimeSeparator: false,
          })}
        </PreCard>
        <div>
          <RejectApplicationButton application={application} refetch={refetch} />
        </div>

        <Summary>
          <KV k={t("application:applicantType")} v={applicantType} dataId="application-details__data--applicant-type" />
          <KV k={t("common:municipality")} v={municipality} />
          {isOrganisation && <KV k={t("application:coreActivity")} v={application.organisationCoreBusiness || "-"} />}
          <KV k={t("application:numHours")} v="-" />
          <KV k={t("application:numTurns")} v="-" />
        </Summary>

        <Accordion heading={t("reservation:workingMemo")} initiallyOpen={application.workingMemo.length > 0}>
          <ApplicationWorkingMemo applicationPk={pk} refetch={refetch} initialValue={application.workingMemo} />
        </Accordion>
        {applicationSections.map((section) => (
          <ApplicationSectionDetails section={section} application={application} key={section.pk} refetch={refetch} />
        ))}

        <H3 as="h2" $noMargin style={{ marginTop: "var(--spacing-xl)" }}>
          {t("application:customerBasicInfo")}
        </H3>
        <ApplicationDatas>
          <ValueBox label={t("application:authenticatedUser")} value={application.user?.email} />
          <ValueBox label={t("application:applicantType")} value={applicantType} />
          {isOrganisation && (
            <>
              <ValueBox label={t("application:organisationName")} value={application.organisationName} />
              <ValueBox label={t("application:coreActivity")} value={application.organisationCoreBusiness} />
              <ValueBox label={t("common:municipality")} value={municipality} />
              <ValueBox label={t("application:identificationNumber")} value={application.organisationIdentifier} />
            </>
          )}
          <ValueBox label={t("application:headings.additionalInformation")} value={application.additionalInformation} />
          <ValueBox
            label={t("application:headings.userBirthDate")}
            value={<BirthDate applicationPk={application.pk ?? 0} />}
          />
        </ApplicationDatas>
        <H3 as="h2" $noMargin>
          {t("application:contactPersonInformation")}
        </H3>
        <ApplicationDatas>
          <ValueBox label={t("application:contactPersonFirstName")} value={application.contactPersonFirstName} />
          <ValueBox label={t("application:contactPersonLastName")} value={application.contactPersonLastName} />
          <ValueBox label={t("application:contactPersonEmail")} value={application.contactPersonEmail} />
          <ValueBox label={t("application:contactPersonPhoneNumber")} value={application.contactPersonPhoneNumber} />
        </ApplicationDatas>

        {isOrganisation ? (
          <>
            <H3 as="h2" $noMargin>
              {t("application:contactInformation")}
            </H3>
            <ApplicationDatas>
              <ValueBox label={t("common:streetAddress")} value={application.organisationStreetAddress} />
              <ValueBox label={t("common:postalNumber")} value={application.organisationPostCode} />
              <ValueBox label={t("common:postalDistrict")} value={application.organisationCity} />
            </ApplicationDatas>
          </>
        ) : null}

        {hasBillingAddress ? (
          <>
            <H3 as="h2" $noMargin>
              {application.applicantType === ReserveeType.Individual
                ? t("application:contactInformation")
                : t("common:billingAddress")}
            </H3>
            <ApplicationDatas>
              <ValueBox label={t("common:streetAddress")} value={application.billingStreetAddress} />
              <ValueBox label={t("common:postalNumber")} value={application.billingPostCode} />
              <ValueBox label={t("common:postalDistrict")} value={application.billingCity} />
            </ApplicationDatas>
          </>
        ) : null}
      </>
    </>
  );
}

type PageProps = Awaited<ReturnType<typeof getServerSideProps>>["props"];
type PropsNarrowed = Exclude<PageProps, { notFound: boolean }>;

export async function getServerSideProps({ locale, query }: GetServerSidePropsContext) {
  const pk = toNumber(ignoreMaybeArray(query.id));
  if (pk == null || pk <= 0) {
    return NOT_FOUND_SSR_VALUE;
  }

  return {
    props: {
      pk,
      ...(await getCommonServerSideProps()),
      ...(await serverSideTranslations(locale ?? "fi")),
    },
  };
}

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
    updatedAt
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
    isRejected
    isLocked
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
  mutation RejectAllSectionOptions($input: RejectAllSectionOptionsMutationInput!) {
    rejectAllSectionOptions(input: $input) {
      pk
    }
  }
`;

export const RESTORE_ALL_SECTION_OPTIONS = gql`
  mutation RestoreAllSectionOptions($input: RestoreAllSectionOptionsMutationInput!) {
    restoreAllSectionOptions(input: $input) {
      pk
    }
  }
`;

export const REJECT_APPLICATION = gql`
  mutation RejectAllApplicationOptions($input: RejectAllApplicationOptionsMutationInput!) {
    rejectAllApplicationOptions(input: $input) {
      pk
    }
  }
`;

export const RESTORE_APPLICATION = gql`
  mutation RestoreAllApplicationOptions($input: RestoreAllApplicationOptionsMutationInput!) {
    restoreAllApplicationOptions(input: $input) {
      pk
    }
  }
`;
