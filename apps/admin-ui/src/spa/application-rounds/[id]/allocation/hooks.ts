import { ApolloError, gql, type ApolloQueryResult } from "@apollo/client";
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
import { useDisplayError } from "common/src/hooks";
import { toNumber } from "common/src/helpers";

export function useFocusApplicationEvent(): [number | null, (aes?: SectionNodeT) => void] {
  const [params, setParams] = useSearchParams();

  const selectedAeasPk = toNumber(params.get("aes"));

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

  const allocatedPk = params.get("allocated") ? Number(params.get("allocated")) : undefined;

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
    if (day == null || beginHour == null || beginMinute == null || endHour == null || endMinute == null) {
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
  fetchCallback: () => Promise<ApolloQueryResult<ApplicationSectionAllocationsQuery>>
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

export function useAcceptSlotMutation({
  selection,
  timeRange,
  applicationSection,
  reservationUnitOptionPk,
  // TODO await instead of calling a callback (alternatively chain a callback to the handle function but it's already red)
  refresh,
}: AcceptSlotMutationProps): HookReturnValue {
  const { t } = useTranslation();

  const [acceptApplicationEvent, { loading: isLoading }] = useCreateAllocatedTimeSlotMutation();
  const displayError = useDisplayError();

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
    const allocatedEnd = timeSlotKeyToScheduleTime(selection[selection.length - 1], true);
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
      if (errors != null && errors.length > 0) {
        throw new ApolloError({
          graphQLErrors: errors,
        });
      }
      const { name } = applicationSection;
      const msg = t("Allocation.acceptingSuccess", { name });
      successToast({ text: msg });
      refresh();
    } catch (e) {
      displayError(e);
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

  const [resetApplicationEvent, { loading: isLoading }] = useDeleteAllocatedTimeSlotMutation();
  const displayError = useDisplayError();

  const handleRemoveAllocation = async () => {
    try {
      if (allocatedTimeSlot?.pk == null || allocatedTimeSlot.pk === 0) {
        throw new Error("Invalid allocated time slot for section");
      }

      const allocatedPk = allocatedTimeSlot.pk;
      const { data, errors } = await resetApplicationEvent({
        variables: {
          input: {
            pk: String(allocatedPk),
          },
        },
      });
      // TODO these should not happen (they should still go through the same process and get logged and maybe displayed)
      // they are typed the same as other GraphQL errors so we can make a free function / hook for both
      if (errors != null && errors.length > 0) {
        throw new ApolloError({
          graphQLErrors: errors,
        });
      }
      const { deleteAllocatedTimeslot: res } = data || {};
      if (res?.deleted) {
        const { name } = applicationSection;
        const msg = t("Allocation.resetSuccess", { name });
        successToast({ text: msg });
        refresh();
      }
    } catch (e) {
      displayError(e);
    }
  };
  return [handleRemoveAllocation, { isLoading }];
}

export const CREATE_ALLOCATED_TIME_SLOT = gql`
  mutation CreateAllocatedTimeSlot($input: AllocatedTimeSlotCreateMutationInput!) {
    createAllocatedTimeslot(input: $input) {
      beginTime
      dayOfTheWeek
      endTime
      pk
      reservationUnitOption
    }
  }
`;

export const DELETE_ALLOCATED_TIME_SLOT = gql`
  mutation DeleteAllocatedTimeSlot($input: AllocatedTimeSlotDeleteMutationInput!) {
    deleteAllocatedTimeslot(input: $input) {
      deleted
    }
  }
`;
