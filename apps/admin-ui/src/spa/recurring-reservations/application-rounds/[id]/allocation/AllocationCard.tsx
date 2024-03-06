import React from "react";
import { Button } from "hds-react";
import { useTranslation } from "react-i18next";
import styled from "styled-components";
import { Strong, fontMedium } from "common/src/common/typography";
import { ApolloError, ApolloQueryResult, useMutation } from "@apollo/client";
import {
  type ApplicationSectionNode,
  type Mutation,
  type Query,
  type MutationDeleteAllocatedTimeslotArgs,
  type MutationCreateAllocatedTimeslotArgs,
  type AllocatedTimeSlotCreateMutationInput,
  Priority,
  type SuitableTimeRangeNode,
  type AllocatedTimeSlotNode,
  type ReservationUnitOptionNode,
} from "common/types/gql-types";
import { filterNonNullable } from "common/src/helpers";
import { NotificationInline } from "common/src/components/NotificationInline";
import { SemiBold } from "common";
import { getApplicantName } from "@/component/applications/util";
import { formatDuration } from "@/common/util";
import { useNotification } from "@/context/NotificationContext";
import { Accordion } from "@/component/Accordion";
import {
  formatTime,
  getApplicationEventScheduleTimeString,
  parseApiTime,
  timeSlotKeyToScheduleTime,
  createDurationString,
  decodeTimeSlot,
} from "./modules/applicationRoundAllocation";
import {
  CREATE_ALLOCATED_TIME_SLOT,
  DELETE_ALLOCATED_TIME_SLOT,
} from "./queries";
import { useSlotSelection } from "./hooks";
import { convertWeekday } from "common/src/conversion";

type Props = {
  applicationSection: ApplicationSectionNode;
  reservationUnitOption?: ReservationUnitOptionNode;
  selection: string[];
  isAllocationEnabled: boolean;
  // TODO better solution would be to have a query key (similar to tanstack/react-query) and invalidate the key
  // so we don't have to prop drill the refetch
  refetchApplicationEvents: () => Promise<ApolloQueryResult<Query>>;
  timeSlot: SuitableTimeRangeNode | null;
  allocatedTimeSlot: AllocatedTimeSlotNode | null;
};

const Wrapper = styled.div`
  &:last-of-type {
    border: 0;
    margin-bottom: 0;
  }

  border-bottom: 1px solid var(--color-black-50);
  margin-bottom: var(--spacing-s);
  padding-bottom: var(--spacing-s);
`;

const ApplicationEventName = styled.h2`
  ${fontMedium}
  font-size: var(--fontsize-body-l);
  line-height: var(--lineheight-l);
`;

const Applicant = styled.div`
  line-height: var(--lineheight-xl);
`;

const DetailRow = styled.div`
  text-align: left;

  > span {
    &:nth-of-type(1) {
      white-space: nowrap;
      margin-right: var(--spacing-3-xs);
    }

    &:nth-of-type(2) {
      ${Strong}
    }
  }
`;

// NOTE flex-wrap doesn't match the design, but there is layout shifts without it
// so when removing it, fix the card size changing when there is more than one button.
const Actions = styled.div`
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  margin-top: var(--spacing-s);
  gap: var(--spacing-s);
  & > * {
    width: 100%;
  }
`;

const StyledAccordion = styled(Accordion)`
  --header-font-size: 1rem;

  padding-top: var(--spacing-xs);
  & > * {
    padding: 0;
  }
  & > div:nth-of-type(2) {
    padding-top: var(--spacing-2-xs);
  }

  & h3 {
    ${fontMedium}
    padding: 0;
  }
`;

const DetailContainer = styled.div`
  padding-top: var(--spacing-2-xs);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-2-xs);
`;

/// Why two different components?
/// because they require different props
/// allocated requires the allocated data structure (with the pk) so it can be change or destroyed
/// requested requires the reservationUnitOptions so it can be allocated
/// The mutations they use are completely different.
/// - yes the error handling is common
/// - yes we should move them to hooks, but still it's two different hooks
///
/// TODO rename these two (so they aren't so similar)
export function AllocatedCard({
  applicationSection,
  refetchApplicationEvents,
  allocatedTimeSlot,
}: Omit<
  Props,
  "timeSlot" | "selection" | "isAllocationEnabled" | "reservationUnitOption"
>): JSX.Element {
  const { notifySuccess, notifyError } = useNotification();
  const { t } = useTranslation();

  // TODO refactor so it is mandatory
  if (allocatedTimeSlot == null) {
    // eslint-disable-next-line no-console
    console.warn("MANDATORY: No allocated time slot");
  }

  const [refresh, isRefreshLoading] = useRefreshApplications(
    refetchApplicationEvents
  );

  const [resetApplicationEvent, { loading: isResetLoading }] = useMutation<
    Mutation,
    MutationDeleteAllocatedTimeslotArgs
  >(DELETE_ALLOCATED_TIME_SLOT);

  const handleRemoveAllocation = async () => {
    if (allocatedTimeSlot?.pk == null) {
      // eslint-disable-next-line no-console
      console.error(
        "Invalid allocated time slot for section: ",
        applicationSection
      );
      return;
    }

    const allocatedPk = allocatedTimeSlot.pk;
    // TODO both of these should be handled before we are in a callback
    // they should never happen
    // if the card is not allocated this callback should not be called (and they should be zero)
    // if this card is allocated, it should have a single allocation (to this particular time slot)
    // one applicationSection can't be allocated multiple times in a single day (so even if we have multiple time slots,
    // they are all on the same day) and also a card matches a single time slot / range
    if (allocatedPk === 0) {
      const { name } = applicationSection;
      notifyError(
        t("Allocation.errors.remove.noAllocations", { name }),
        t("Allocation.errors.remove.title")
      );
      return;
    }
    try {
      const { data, errors } = await resetApplicationEvent({
        variables: {
          input: {
            pk: String(allocatedPk),
          },
        },
      });
      // TODO these should not happen (they should still go through the same process and get logged and maybe displayed)
      // they are typed the same as other GraphQL errors so we can make a free function / hook for both
      if (errors) {
        // eslint-disable-next-line no-console
        console.warn("Removing allocation failed with data errors: ", errors);
        notifyError(
          t("Allocation.errors.remove.generic", {
            name: applicationSection.name,
          }),
          t("Allocation.errors.remove.title")
        );
        return;
      }
      const { deleteAllocatedTimeslot: res } = data || {};
      if (res?.deleted) {
        const { name } = applicationSection;
        const msg = t("Allocation.resetSuccess", { name });
        notifySuccess(msg);
        refresh();
      }
    } catch (e) {
      if (e instanceof ApolloError) {
        const gqlerrors = e.graphQLErrors;
        for (const err of gqlerrors) {
          if ("code" in err.extensions) {
            const { code } = err.extensions;
            if (code === "NOT_FOUND") {
              const { name } = applicationSection;
              notifyError(
                t("Allocation.errors.remove.alreadyDeleted", {
                  name,
                }),
                t("Allocation.errors.remove.title")
              );
              return;
            }
          }
        }
      }
      notifyError(
        t("Allocation.errors.remove.generic", {
          name: applicationSection.name,
        }),
        t("Allocation.errors.remove.title")
      );
    }
  };

  const handleChangeSlot = async () => {
    // eslint-disable-next-line no-console
    console.warn("TODO: implement");
  };

  const allocationBegin =
    allocatedTimeSlot?.beginTime != null
      ? parseApiTime(allocatedTimeSlot.beginTime) ?? 0
      : 0;

  const allocationEnd = allocatedTimeSlot?.endTime
    ? parseApiTime(allocatedTimeSlot.endTime) ?? 0
    : 0;

  const beginSeconds = applicationSection.reservationMinDuration ?? 0;
  const endSeconds = applicationSection.reservationMaxDuration ?? 0;
  const allocatedDurationMins = (allocationEnd - allocationBegin) * 60;
  const durationIsInvalid =
    allocatedDurationMins < beginSeconds / 60 ||
    allocatedDurationMins > endSeconds / 60;
  const isMutationLoading = isResetLoading;
  const isLoading = isMutationLoading || isRefreshLoading;

  // FIXME
  const isAllocatedTimeMismatch = false; // isOutsideOfAllocatedTimes(section);
  const isTimeMismatch = isAllocatedTimeMismatch;
  const applicantName = applicationSection.application
    ? getApplicantName(applicationSection.application)
    : "-";

  return (
    <Wrapper>
      <ApplicationEventName>{applicationSection.name}</ApplicationEventName>
      <Applicant>{applicantName}</Applicant>
      {allocatedTimeSlot != null ? (
        <AllocatedDetails
          section={applicationSection}
          allocatedTimeSlot={allocatedTimeSlot}
        />
      ) : null}
      <StyledAccordion
        heading={t("Allocation.showTimeRequests")}
        headingLevel="h3"
      >
        <TimeRequested applicationSection={applicationSection} />
      </StyledAccordion>
      {/* TODO this could be abstracted into a common component (both cards use it, but use diferent error messages and durations
       * a common error component, since there is also a third different error message (with "error" type) */}
      <DetailContainer>
        {isTimeMismatch ? (
          <NotificationInline type="alert">
            {t("Allocation.errors.allocatedOutsideOfRequestedTimes")}
          </NotificationInline>
        ) : null}
        {durationIsInvalid ? (
          <NotificationInline type="alert">
            {t("Allocation.errors.allocatedDurationIsIncorrect")}
          </NotificationInline>
        ) : null}
      </DetailContainer>
      <Actions>
        <Button
          size="small"
          variant="secondary"
          theme="black"
          onClick={handleRemoveAllocation}
          isLoading={isLoading}
          disabled={isLoading}
        >
          {t("Allocation.removeAllocation")}
        </Button>
        <Button size="small" disabled onClick={handleChangeSlot}>
          {t("Allocation.changeSlot")}
        </Button>
      </Actions>
    </Wrapper>
  );
}

// Return the translation key for a mutation error
// these are new errors using the backend code system, so don't work most of the mutations.
type ERROR_EXTENSION = { message: string; code: string; field: string };
function getTranslatedMutationError(err: ERROR_EXTENSION) {
  // TODO remove the message variation
  // "Given time slot has already been allocated for another application section with a related reservation unit or resource."
  const ALREADY_ALLOCATED_WITH_SPACE_HIERARCHY_CODE =
    "ALLOCATION_OVERLAPPING_ALLOCATIONS";
  // TODO migrate to error codes
  const ALREADY_ALLOCATED_FOR_THAT_DAY =
    "Cannot make multiple allocations on the same day of the week for one application section.";
  const STATUS_CANCELLED =
    "Cannot allocate to application in status: 'CANCELLED'";
  const STATUS_HANDLED =
    "Cannot allocate to application section in status: 'HANDLED'";
  const MAX_ALLOCATIONS =
    "Cannot make more allocations for this application section."; // Maximum allowed is 1."
  if (err.code === ALREADY_ALLOCATED_WITH_SPACE_HIERARCHY_CODE) {
    return "Allocation.errors.accepting.alreadyAllocatedWithSpaceHierrarchy";
  }
  if (err.message === STATUS_CANCELLED) {
    return "Allocation.errors.accepting.statusCancelled";
  }
  if (err.message === STATUS_HANDLED) {
    return "Allocation.errors.accepting.statusHandled";
  }
  if (err.message.includes(MAX_ALLOCATIONS)) {
    return "Allocation.errors.accepting.maxAllocations";
  }
  if (err.message.includes(ALREADY_ALLOCATED_FOR_THAT_DAY)) {
    return "Allocation.errors.accepting.alreadyAllocated";
  }
}

function isOutsideOfRequestedTimes(
  time: SuitableTimeRangeNode | null,
  begin: number,
  end: number
) {
  if (time?.beginTime == null || time.endTime == null) {
    return true;
  }
  const beginTime = parseApiTime(time.beginTime);
  const endTime = parseApiTime(time.endTime);
  if (beginTime == null || endTime == null) {
    return true;
  }
  if (begin < beginTime || end > endTime) {
    return true;
  }
}

type AcceptSlotMutationProps = Pick<
  Props,
  "selection" | "applicationSection" | "reservationUnitOption"
> & {
  timeRange: SuitableTimeRangeNode | null;
  refresh: () => void;
};

// TODO make into more generic
// MutationF
// MutationParams
type RetVal = [
  // TODO add the results to the promise
  () => Promise<void>, //FetchResult<TData>>,
  {
    isLoading: boolean;
  },
];

function useAcceptSlotMutation({
  selection,
  timeRange,
  applicationSection,
  reservationUnitOption,
  // TODO await instead of calling a callback (alternatively chain a callback to the handle function but it's already red)
  refresh,
}: AcceptSlotMutationProps): RetVal {
  const { notifySuccess, notifyError } = useNotification();
  const { t } = useTranslation();

  const [acceptApplicationEvent, { loading: isLoading }] = useMutation<
    Mutation,
    MutationCreateAllocatedTimeslotArgs
  >(CREATE_ALLOCATED_TIME_SLOT);

  const handleAcceptSlot = async () => {
    if (selection.length === 0) {
      // eslint-disable-next-line no-console
      console.error("Invalid selection");
    }
    if (timeRange == null) {
      // eslint-disable-next-line no-console
      console.error("Invalid timeRange for section: ", applicationSection);
    }
    if (selection.length === 0 || timeRange == null) {
      notifyError(t("Allocation.errors.accepting.generic"));
      return;
    }
    // TODO is this correct time format?
    // why isn't it going through and API format function?
    const allocatedBegin = timeSlotKeyToScheduleTime(selection[0]);
    const allocatedEnd = timeSlotKeyToScheduleTime(
      selection[selection.length - 1],
      true
    );
    if (reservationUnitOption?.pk == null) {
      notifyError(t("Allocation.errors.accepting.generic"));
      return;
    }

    // NOTE the pk is an update pk that matches AllocatedTimeSlot (not the applicationSection)
    // The reservationUnitOption is ReservationUnitOptionNode.pk not ReservationUnit.pk
    // This creates an allocated time slot for the given reservationUnitOption and time range
    // that changes the status of the applicationSection and maybe the whole application
    // TODO check the inputs
    const input: AllocatedTimeSlotCreateMutationInput = {
      reservationUnitOption: reservationUnitOption?.pk,
      dayOfTheWeek: timeRange.dayOfTheWeek,
      beginTime: allocatedBegin,
      endTime: allocatedEnd,
      // Disable backend checks
      force: true,
    };

    try {
      const { errors } = await acceptApplicationEvent({
        variables: {
          input,
        },
      });
      // NOTE there should be no errors here (the new api throws them as exceptions)
      if (errors) {
        const { name } = applicationSection;
        notifyError(t("Allocation.errors.accepting.generic", { name }));
        return;
      }
    } catch (e) {
      if (e instanceof ApolloError) {
        const gqlerrors = e.graphQLErrors;
        const mutError = gqlerrors.find(
          (err) =>
            "code" in err.extensions &&
            err.extensions.code === "MUTATION_VALIDATION_ERROR"
        );
        if (mutError) {
          const err = mutError;
          if (
            "errors" in err.extensions &&
            Array.isArray(err.extensions.errors)
          ) {
            // TODO type check the error
            // TODO check the number of errors (should be 1)
            const errMsg = getTranslatedMutationError(err.extensions.errors[0]);

            const { name } = applicationSection;
            if (errMsg != null) {
              const title = "Allocation.errors.accepting.title";
              notifyError(t(errMsg, { name }), t(title));
              return;
            }
          }
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn("Not a graphql error: ", e);
      }
      notifyError(
        t("Allocation.errors.accepting.generic"),
        t("Allocation.errors.accepting.title")
      );
      return;
    }
    const { name } = applicationSection;
    const msg = t("Allocation.acceptingSuccess", { name });
    notifySuccess(msg);
    refresh();
  };

  return [handleAcceptSlot, { isLoading }];
}

// side effects that should happen when a modification is made
function useRefreshApplications(
  fetchCallback: () => Promise<ApolloQueryResult<Query>>
): [() => Promise<void>, boolean] {
  const [, setSelection] = useSlotSelection();
  const [isRefetchLoading, setIsRefetchLoading] = React.useState(false);
  // TODO this should disable sibling cards allocation while this is loading
  // atm one can try to allocate multiple cards at the same time and all except the first will fail
  const refresh = async () => {
    // NOTE this is slow so use a loading state to show the user that something is happening
    // TODO this takes 3s to complete (on my local machine, so more in the cloud),
    // should update the cache in the mutation instead (or do a single id query instead of refetching all)
    setIsRefetchLoading(true);
    await fetchCallback();
    setIsRefetchLoading(false);
    // Close all the cards (requires removing the selection)
    setSelection([]);
  };

  return [refresh, isRefetchLoading];
}

/// Right hand side single card
/// Contains the single applicationScheduleEvent and its actions (accept / decline etc.)
/// TODO either time slot or allocated time slot should be mandatory
export function AllocationCard({
  applicationSection,
  reservationUnitOption,
  selection,
  isAllocationEnabled,
  refetchApplicationEvents,
  timeSlot,
}: Omit<Props, "allocatedTimeSlot">): JSX.Element {
  const { t } = useTranslation();

  // TODO should cause a type error if both are null
  if (timeSlot == null) {
    // eslint-disable-next-line no-console
    console.warn("MANDATORY: No time slot or allocated time slot");
  }

  // TODO reservationUnit should not be null (requires refactoring the parent component a bit)
  if (reservationUnitOption?.pk == null) {
    // eslint-disable-next-line no-console
    console.warn("Invalid reservation unit option: missing pk");
  }

  const [refresh, isRefreshLoading] = useRefreshApplications(
    refetchApplicationEvents
  );

  const [handleAcceptSlot, { isLoading: isAcceptLoading }] =
    useAcceptSlotMutation({
      selection,
      timeRange: timeSlot,
      applicationSection,
      reservationUnitOption,
      refresh,
    });
  const applicantName = applicationSection.application
    ? getApplicantName(applicationSection.application)
    : "-";

  // TODO this is hackish
  // the allocated have custom fields in the GQL query and suitableTimeRanges is not quried for them
  // problem if we refactor the query or use the pk to do a frontend search
  // const isAllocated = applicationSection.suitableTimeRanges == null;
  // section?.allocatedReservationUnit != null;
  // TODO need to check if it's allocated here or elsewhere, don't allow changes if it's elsewhere (just show it or not?)
  const isReservable = isAllocationEnabled;
  const isDisabled = !reservationUnitOption?.pk || !isReservable;

  // Time interval checks
  const selectionDurationMins = selection.length * 30;
  // TODO rename the begin and end it's duration not time
  const beginSeconds = applicationSection.reservationMinDuration ?? 0;
  const endSeconds = applicationSection.reservationMaxDuration ?? 0;
  const selectionDurationString = formatDuration(selectionDurationMins, t);
  // TODO this should be cleaner, only pass things we need here
  const firstSelected = selection[0];
  const lastSelected = selection[selection.length - 1];
  const selectionBegin = decodeTimeSlot(firstSelected);
  const selectionEnd = decodeTimeSlot(lastSelected);
  const isTimeMismatch = isOutsideOfRequestedTimes(
    timeSlot,
    selectionBegin.hour,
    selectionEnd.hour + 0.5
  );

  // Duration checks
  const isTooShort = selectionDurationMins < beginSeconds / 60;
  const isTooLong = selectionDurationMins > endSeconds / 60;
  const durationIsInvalid = isTooShort || isTooLong;
  const isMutationLoading = isAcceptLoading;
  const isLoading = isMutationLoading || isRefreshLoading;

  return (
    <Wrapper>
      <ApplicationEventName>{applicationSection.name}</ApplicationEventName>
      <Applicant>{applicantName}</Applicant>
      <DetailContainer>
        <TimeRequested applicationSection={applicationSection} />
      </DetailContainer>
      <DetailContainer>
        {/* logic: if in edit mode / not allocated -> check against selection
         * if allocated -> check against allocated time
         * always show error
         * TODO error should be shown for some cases where the selection is not valid
         */}
        {/*error ? (
          <NotificationInline type="error">{error}</NotificationInline>
        ) : null*/}
        {isTimeMismatch ? (
          <NotificationInline type="alert">
            {t("Allocation.errors.selectionOutsideOfRequestedTimes")}
          </NotificationInline>
        ) : null}
        {durationIsInvalid ? (
          <NotificationInline type="alert">
            {t("Allocation.errors.requestedDurationIsIncorrect")}
          </NotificationInline>
        ) : null}
      </DetailContainer>
      <Actions>
        <Button
          variant="primary"
          size="small"
          disabled={isDisabled || isLoading}
          isLoading={isLoading}
          onClick={handleAcceptSlot}
        >
          {t("Allocation.acceptSlot", { duration: selectionDurationString })}
        </Button>
      </Actions>
    </Wrapper>
  );
}

function getDurationFromApiTimeInHours(begin: string, end: string) {
  const bh = parseApiTime(begin);
  const eh = parseApiTime(end);
  if (bh == null || eh == null) {
    return undefined;
  }
  return eh - bh;
}

function AllocatedDetails({
  section,
  allocatedTimeSlot,
}: {
  section: ApplicationSectionNode;
  allocatedTimeSlot: AllocatedTimeSlotNode;
}) {
  const { t } = useTranslation();
  const { beginTime, endTime, dayOfTheWeek } = allocatedTimeSlot;
  const allocationDuration = getDurationFromApiTimeInHours(beginTime, endTime);
  const day = convertWeekday(dayOfTheWeek);
  const allocatedTimeString = `${t(`dayShort.${day}`)} ${formatTime(beginTime)} - ${formatTime(endTime)}`;

  if (allocationDuration == null) {
    // eslint-disable-next-line no-console
    console.warn("Allocation duration is undefined", { section });
  }

  if (allocatedTimeString == null || allocationDuration == null) {
    // eslint-disable-next-line no-console
    console.warn("Allocated time string or duration is undefined", {
      section,
    });
  }

  const durString = t("common.hoursUnit", { count: allocationDuration });

  return (
    <DetailRow>
      <span>{t("Allocation.allocatedTime")}</span>
      <SemiBold>
        {allocatedTimeString} ({durString})
      </SemiBold>
    </DetailRow>
  );
}

function TimeRequested({
  applicationSection,
}: {
  applicationSection: ApplicationSectionNode;
}) {
  const { t } = useTranslation();
  const { appliedReservationsPerWeek } = applicationSection;
  const durationString = createDurationString(applicationSection, t);

  const aes = filterNonNullable(applicationSection?.suitableTimeRanges);
  const primaryTimes = getApplicationEventScheduleTimeString(
    aes,
    Priority.Primary
  );
  const secondaryTimes = getApplicationEventScheduleTimeString(
    aes,
    Priority.Secondary
  );

  return (
    <div>
      <DetailRow>
        <span>{t("Allocation.applicationsWeek")}:</span>
        <SemiBold>
          {durationString}, {appliedReservationsPerWeek}x
        </SemiBold>
      </DetailRow>
      <DetailRow>
        <span>{t("Allocation.primaryTimes")}:</span>
        <SemiBold>{primaryTimes || "-"}</SemiBold>
      </DetailRow>
      <DetailRow>
        <span>{t("Allocation.secondaryTimes")}:</span>
        <SemiBold>{secondaryTimes || "-"}</SemiBold>
      </DetailRow>
    </div>
  );
}
