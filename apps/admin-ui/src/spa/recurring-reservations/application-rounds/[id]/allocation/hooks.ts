import {
  ApolloError,
  type ApolloQueryResult,
  useMutation,
} from "@apollo/client";
import { useTranslation } from "react-i18next";
import {
  type ApplicationSectionNode,
  type Query,
  type SuitableTimeRangeNode,
  type Mutation,
  type MutationDeleteAllocatedTimeslotArgs,
  type MutationCreateAllocatedTimeslotArgs,
  type AllocatedTimeSlotCreateMutationInput,
  type AllocatedTimeSlotNode,
} from "@gql/gql-types";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useNotification } from "@/context/NotificationContext";
import { timeSlotKeyToScheduleTime } from "./modules/applicationRoundAllocation";
import {
  CREATE_ALLOCATED_TIME_SLOT,
  DELETE_ALLOCATED_TIME_SLOT,
} from "./queries";

export function useFocusApplicationEvent(): [
  number | undefined,
  (aes?: ApplicationSectionNode) => void,
] {
  const [params, setParams] = useSearchParams();

  const selectedAeasPk = params.get("aes")
    ? Number(params.get("aes"))
    : undefined;

  const setFocused = (aes?: ApplicationSectionNode) => {
    // TODO ?? if the applicationEvent is completely allocated => remove the selection
    if (aes?.pk != null) {
      const p = new URLSearchParams(params);
      p.set("aes", aes.pk.toString());
      p.delete("allocated");
      setParams(p);
    } else {
      const p = new URLSearchParams(params);
      p.delete("aes");
      setParams(p);
    }
  };

  return [selectedAeasPk, setFocused];
}

/// Mutaully exclusive with useFocusApplicationEvent
export function useFocusAllocatedSlot(): [
  number | undefined,
  (allocated?: AllocatedTimeSlotNode) => void,
] {
  const [params, setParams] = useSearchParams();

  const allocatedPk = params.get("allocated")
    ? Number(params.get("allocated"))
    : undefined;

  const setAllocated = (allocated?: AllocatedTimeSlotNode) => {
    if (allocated?.pk != null) {
      const p = new URLSearchParams(params);
      p.set("allocated", allocated.pk.toString());
      p.delete("aes");
      setParams(p);
    } else {
      const p = new URLSearchParams(params);
      p.delete("allocated");
      setParams(p);
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
      setParams(qp);
    } else {
      // TODO change the save format
      // current format is: {day}-{hour}-{minute}
      // what's the format we'd like to use?
      // we also don't allow using different days for begin and end so it should not be possible
      // => maybe selectionDay, selectionBegin, selectionEnd
      // with integers for each, time is in minutes from midnight?
      const selectionBegin = slots[0];
      const selectionEnd = slots[slots.length - 1];
      const qp = new URLSearchParams(params);
      qp.set("selectionBegin", selectionBegin);
      qp.set("selectionEnd", selectionEnd);
      setParams(qp);
    }
  };

  // generate a list of strings for each slot based on the interval
  // we can assume the same day for begin and end (so end day is ignored)
  const generateSelection = (begin: string, end: string): string[] => {
    // current format: {day}-{hour}-{minute}
    // with minute always 00 or 30
    const [day, beginHour, beginMinute] = begin.split("-");
    const [_, endHour, endMinute] = end.split("-");
    const slots = [];
    // NOTE: parseInt returns NaN for invalid => the loop checks will fail and return []
    for (let hour = parseInt(beginHour); hour <= parseInt(endHour); hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        if (hour === parseInt(beginHour) && minute < parseInt(beginMinute)) {
          continue;
        }
        if (hour === parseInt(endHour) && minute > parseInt(endMinute)) {
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
  fetchCallback: () => Promise<ApolloQueryResult<Query>>
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
  applicationSection: ApplicationSectionNode;
  reservationUnitOptionPk: number;
  selection: string[];
  timeRange: SuitableTimeRangeNode | null;
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

export function useAcceptSlotMutation({
  selection,
  timeRange,
  applicationSection,
  reservationUnitOptionPk,
  // TODO await instead of calling a callback (alternatively chain a callback to the handle function but it's already red)
  refresh,
}: AcceptSlotMutationProps): HookReturnValue {
  const { notifySuccess, notifyError } = useNotification();
  const { t } = useTranslation();

  const [acceptApplicationEvent, { loading: isLoading }] = useMutation<
    Mutation,
    MutationCreateAllocatedTimeslotArgs
  >(CREATE_ALLOCATED_TIME_SLOT);

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
      notifyError(t("Allocation.errors.accepting.generic"));
      return;
    }
    const allocatedBegin = timeSlotKeyToScheduleTime(selection[0]);
    const allocatedEnd = timeSlotKeyToScheduleTime(
      selection[selection.length - 1],
      true
    );
    if (!reservationUnitOptionPk) {
      notifyError(t("Allocation.errors.accepting.generic"));
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
        notifyError(t("Allocation.errors.accepting.generic", { name }));
        return;
      }
      const { name } = applicationSection;
      const msg = t("Allocation.acceptingSuccess", { name });
      notifySuccess(msg);
      refresh();
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
              refresh(false);
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
    }
  };

  return [handleAcceptSlot, { isLoading }];
}

export function useRemoveAllocation({
  allocatedTimeSlot,
  applicationSection,
  refresh,
}: {
  allocatedTimeSlot: AllocatedTimeSlotNode | null;
  applicationSection: ApplicationSectionNode;
  refresh: (clearSelection?: boolean) => void;
}): HookReturnValue {
  const { notifySuccess, notifyError } = useNotification();
  const { t } = useTranslation();

  const [resetApplicationEvent, { loading: isLoading }] = useMutation<
    Mutation,
    MutationDeleteAllocatedTimeslotArgs
  >(DELETE_ALLOCATED_TIME_SLOT);

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
              refresh(false);
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
  return [handleRemoveAllocation, { isLoading }];
}
