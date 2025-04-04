import { type ApolloQueryResult } from "@apollo/client";
import { useTranslation } from "react-i18next";
import {
  type AllocatedTimeSlotCreateMutationInput,
  useCreateAllocatedTimeSlotMutation,
  useDeleteAllocatedTimeSlotMutation,
  type ApplicationSectionAllocationsQuery,
} from "@gql/gql-types";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  type AllocatedTimeSlotNodeT,
  type SectionNodeT,
  type SuitableTimeRangeNodeT,
  timeSlotKeyToScheduleTime,
} from "./modules/applicationRoundAllocation";
import { errorToast, successToast } from "common/src/common/toast";
import { getValidationErrors, ValidationError } from "common/src/apolloUtils";
import { toNumber } from "common/src/helpers";

export function useFocusApplicationEvent(): [
  number | undefined,
  (aes?: SectionNodeT) => void,
] {
  const [params, setParams] = useSearchParams();

  const selectedAeasPk = params.get("aes")
    ? Number(params.get("aes"))
    : undefined;

  const setFocused = (aes?: SectionNodeT) => {
    // TODO ?? if the applicationEvent is completely allocated => remove the selection
    if (aes?.pk != null) {
      const p = new URLSearchParams(params);
      p.set("aes", aes.pk.toString());
      p.delete("allocated");
      setParams(p, { replace: true });
    } else {
      const p = new URLSearchParams(params);
      p.delete("aes");
      setParams(p, { replace: true });
    }
  };

  return [selectedAeasPk, setFocused];
}

/// Mutaully exclusive with useFocusApplicationEvent
export function useFocusAllocatedSlot(): [
  number | undefined,
  (allocated?: Pick<AllocatedTimeSlotNodeT, "pk">) => void,
] {
  const [params, setParams] = useSearchParams();

  const allocatedPk = params.get("allocated")
    ? Number(params.get("allocated"))
    : undefined;

  // { pk?: number | null | undefined }) => {
  const setAllocated = (allocated?: Pick<AllocatedTimeSlotNodeT, "pk">) => {
    if (allocated?.pk != null) {
      const p = new URLSearchParams(params);
      p.set("allocated", allocated.pk.toString());
      p.delete("aes");
      setParams(p, { replace: true });
    } else {
      const p = new URLSearchParams(params);
      p.delete("allocated");
      setParams(p, { replace: true });
    }
  };

  return [allocatedPk, setAllocated];
}

/// Allow selecting a continuous block on a single day
/// state is saved in the URL as selectionBegin and selectionEnd parameters
/// TODO rework the interface, accepts string[] for compatibility, not because it's desired
export function useSlotSelection(): [string[], (slots: string[]) => void] {
  const [params, setParams] = useSearchParams();

  const setSelectedSlots = (slots: string[]) => {
    if (slots.length < 1) {
      const qp = new URLSearchParams(params);
      qp.delete("selectionBegin");
      qp.delete("selectionEnd");
      setParams(qp, { replace: true });
    } else {
      // TODO change the save format
      // current format is: {day}-{hour}-{minute}
      // what's the format we'd like to use?
      // we also don't allow using different days for begin and end so it should not be possible
      // => maybe selectionDay, selectionBegin, selectionEnd
      // with integers for each, time is in minutes from midnight?
      const selectionBegin = slots[0];
      const selectionEnd = slots[slots.length - 1];
      if (selectionBegin == null || selectionEnd == null) {
        return;
      }
      const qp = new URLSearchParams(params);
      qp.set("selectionBegin", selectionBegin);
      qp.set("selectionEnd", selectionEnd);
      setParams(qp, { replace: true });
    }
  };

  // generate a list of strings for each slot based on the interval
  // we can assume the same day for begin and end (so end day is ignored)
  const generateSelection = (begin: string, end: string): string[] => {
    // current format: {day}-{hour}-{minute}
    // with minute always 00 or 30
    const [day, beginHour, beginMinute] = begin.split("-").map(toNumber);
    const [_, endHour, endMinute] = end.split("-").map(toNumber);
    const slots = [];
    if (
      day == null ||
      beginHour == null ||
      beginMinute == null ||
      endHour == null ||
      endMinute == null
    ) {
      return [];
    }
    // NOTE: parseInt returns NaN for invalid => the loop checks will fail and return []
    for (let hour = beginHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === beginHour && minute < beginMinute) {
          continue;
        }
        if (hour === endHour && minute > endMinute) {
          break;
        }
        // garbage format: hours have no leading zero, minutes have to have it
        const minuteString = minute < 10 ? `0${minute}` : `${minute}`;
        slots.push(`${day}-${hour}-${minuteString}`);
      }
    }
    return slots;
  };

  const getSelection = (): string[] => {
    const selectionBegin = params.get("selectionBegin");
    const selectionEnd = params.get("selectionEnd");
    if (selectionBegin == null || selectionEnd == null) {
      return [];
    }
    return generateSelection(selectionBegin, selectionEnd);
  };

  const selection = getSelection();

  return [selection, setSelectedSlots];
}

// side effects that should happen when a modification is made
export function useRefreshApplications(
  fetchCallback: () => Promise<
    ApolloQueryResult<ApplicationSectionAllocationsQuery>
  >
): [(clearSelection?: boolean) => Promise<void>, boolean] {
  const [, setSelection] = useSlotSelection();
  const [isRefetchLoading, setIsRefetchLoading] = useState(false);
  // TODO this should disable sibling cards allocation while this is loading
  // atm one can try to allocate multiple cards at the same time and all except the first will fail
  const refresh = async (clearSelection = true) => {
    setIsRefetchLoading(true);
    await fetchCallback();
    setIsRefetchLoading(false);
    // Close all the cards (requires removing the selection)
    if (clearSelection) {
      setSelection([]);
    }
  };

  return [refresh, isRefetchLoading];
}

type AcceptSlotMutationProps = {
  applicationSection: SectionNodeT;
  reservationUnitOptionPk: number;
  selection: string[];
  timeRange: SuitableTimeRangeNodeT | null;
  refresh: (clearSelection?: boolean) => void;
};

// TODO make into more generic
// MutationF
// MutationParams
type HookReturnValue = [
  // TODO add the results to the promise
  () => Promise<void>, //FetchResult<TData>>,
  {
    isLoading: boolean;
  },
];

// Return the translation key for a mutation error
// these are new errors using the backend code system, so don't work most of the mutations.
function getTranslatedMutationError(err: ValidationError): string | null {
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
  if (err.message?.includes(MAX_ALLOCATIONS)) {
    return "Allocation.errors.accepting.maxAllocations";
  }
  if (err.message?.includes(ALREADY_ALLOCATED_FOR_THAT_DAY)) {
    return "Allocation.errors.accepting.alreadyAllocated";
  }
  return null;
}

export function useAcceptSlotMutation({
  selection,
  timeRange,
  applicationSection,
  reservationUnitOptionPk,
  // TODO await instead of calling a callback (alternatively chain a callback to the handle function but it's already red)
  refresh,
}: AcceptSlotMutationProps): HookReturnValue {
  const { t } = useTranslation();

  const [acceptApplicationEvent, { loading: isLoading }] =
    useCreateAllocatedTimeSlotMutation();

  if (!reservationUnitOptionPk) {
    // eslint-disable-next-line no-console
    console.error("Invalid reservationUnitOptionPk: ", reservationUnitOptionPk);
  }

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
      errorToast({ text: t("Allocation.errors.accepting.generic") });
      return;
    }
    const allocatedBegin = timeSlotKeyToScheduleTime(selection[0]);
    const allocatedEnd = timeSlotKeyToScheduleTime(
      selection[selection.length - 1],
      true
    );
    if (!reservationUnitOptionPk) {
      errorToast({ text: t("Allocation.errors.accepting.generic") });
      return;
    }

    // NOTE the pk is an update pk that matches AllocatedTimeSlot (not the applicationSection)
    // TODO check the inputs
    const input: AllocatedTimeSlotCreateMutationInput = {
      reservationUnitOption: reservationUnitOptionPk,
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
        errorToast({
          text: t("Allocation.errors.accepting.generic", { name }),
        });
        return;
      }
      const { name } = applicationSection;
      const msg = t("Allocation.acceptingSuccess", { name });
      successToast({ text: msg });
      refresh();
    } catch (e) {
      const mutErrors = getValidationErrors(e);
      const err = mutErrors[0];
      if (err != null) {
        const errMsg = getTranslatedMutationError(err);

        const { name } = applicationSection;
        if (errMsg != null) {
          const title = "Allocation.errors.accepting.title";
          errorToast({ text: t(errMsg, { name }), label: t(title) });
          refresh(false);
          return;
        }
      } else {
        // eslint-disable-next-line no-console
        console.warn("Not a graphql error: ", e);
      }
      errorToast({
        text: t("Allocation.errors.accepting.generic"),
        label: t("Allocation.errors.accepting.title"),
      });
    }
  };

  return [handleAcceptSlot, { isLoading }];
}

export function useRemoveAllocation({
  allocatedTimeSlot,
  applicationSection,
  refresh,
}: {
  allocatedTimeSlot: AllocatedTimeSlotNodeT | null;
  applicationSection: SectionNodeT;
  refresh: (clearSelection?: boolean) => void;
}): HookReturnValue {
  const { t } = useTranslation();

  const [resetApplicationEvent, { loading: isLoading }] =
    useDeleteAllocatedTimeSlotMutation();

  const handleRemoveAllocation = async () => {
    // TODO both of these error cases should be handled before we are in this event handler
    if (allocatedTimeSlot?.pk == null) {
      // eslint-disable-next-line no-console
      console.error(
        "Invalid allocated time slot for section: ",
        applicationSection
      );
      return;
    }
    const allocatedPk = allocatedTimeSlot.pk;
    if (allocatedPk === 0) {
      const { name } = applicationSection;
      errorToast({
        text: t("Allocation.errors.remove.noAllocations", { name }),
        label: t("Allocation.errors.remove.title"),
      });
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
        errorToast({
          text: t("Allocation.errors.remove.generic", {
            name: applicationSection.name,
          }),
          label: t("Allocation.errors.remove.title"),
        });
        return;
      }
      const { deleteAllocatedTimeslot: res } = data || {};
      if (res?.deleted) {
        const { name } = applicationSection;
        const msg = t("Allocation.resetSuccess", { name });
        successToast({ text: msg });
        refresh();
      }
    } catch (e) {
      const mutErrors = getValidationErrors(e);
      if (mutErrors.length > 0) {
        const hasNotFound = mutErrors.some((err) => err.code === "NOT_FOUND");
        if (hasNotFound) {
          const { name } = applicationSection;
          errorToast({
            text: t("Allocation.errors.remove.alreadyDeleted", { name }),
            label: t("Allocation.errors.remove.title"),
          });
          refresh(false);
          return;
        }
      }
      errorToast({
        text: t("Allocation.errors.remove.generic", {
          name: applicationSection.name,
        }),
        label: t("Allocation.errors.remove.title"),
      });
    }
  };
  return [handleRemoveAllocation, { isLoading }];
}
