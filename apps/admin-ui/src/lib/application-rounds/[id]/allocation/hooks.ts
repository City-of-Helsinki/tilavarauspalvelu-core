import { ApolloError, gql } from "@apollo/client";
import type { ApolloQueryResult } from "@apollo/client";
import { useTranslation } from "next-i18next";
import { useCreateAllocatedTimeSlotMutation, useDeleteAllocatedTimeSlotMutation } from "@gql/gql-types";
import type { AllocatedTimeSlotCreateMutation, ApplicationSectionAllocationsQuery } from "@gql/gql-types";
import { useState } from "react";
import { decodeTimeSlot, timeSlotKeyToScheduleTime } from "./modules/applicationRoundAllocation";
import type {
  AllocatedTimeSlotNodeT,
  SectionNodeT,
  SuitableTimeRangeNodeT,
} from "./modules/applicationRoundAllocation";
import { errorToast, successToast } from "common/src/components/toast";
import { useDisplayError } from "common/src/hooks";
import { toNumber } from "common/src/helpers";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { useSearchParams } from "next/navigation";
import { useSelectedSlots } from "./SelectedSlotsContext";
import type { TimeSlotRange } from "./SelectedSlotsContext";
import type { DayT } from "common/src/const";

export function useFocusApplicationEvent(): [number | null, (aes?: SectionNodeT) => void] {
  const params = useSearchParams();
  const setParams = useSetSearchParams();

  const selectedAeasPk = toNumber(params.get("aes"));

  const setFocused = (aes?: SectionNodeT) => {
    // TODO ?? if the applicationEvent is completely allocated => remove the selection
    const p = new URLSearchParams(params);
    if (aes?.pk != null) {
      p.set("aes", aes.pk.toString());
      p.delete("allocated");
    } else {
      p.delete("aes");
    }
    setParams(p);
  };

  return [selectedAeasPk, setFocused];
}

/// Mutaully exclusive with useFocusApplicationEvent
export function useFocusAllocatedSlot(): [
  number | undefined,
  (allocated?: Pick<AllocatedTimeSlotNodeT, "pk">) => void,
] {
  const params = useSearchParams();
  const setParams = useSetSearchParams();

  const allocatedPk = params.get("allocated") ? Number(params.get("allocated")) : undefined;

  // { pk?: number | null | undefined }) => {
  const setAllocated = (allocated?: Pick<AllocatedTimeSlotNodeT, "pk">) => {
    const p = new URLSearchParams(params);
    if (allocated?.pk != null) {
      p.set("allocated", allocated.pk.toString());
      p.delete("aes");
    } else {
      p.delete("allocated");
    }
    setParams(p);
  };

  return [allocatedPk, setAllocated];
}

// generate a list of strings for each slot based on the interval
const generateSelection = (selectionRange: TimeSlotRange): string[] => {
  const { day, ends, begins } = selectionRange;
  const beginHour = Math.floor(begins);
  const beginMinute = Math.round((begins - beginHour) * 60);
  const endHour = Math.floor(ends);
  const endMinute = Math.round((ends - endHour) * 60);

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

const getSelection = (selection: TimeSlotRange | null): string[] => {
  if (selection == null) {
    return [];
  }
  return generateSelection(selection);
};

/// Allow selecting a continuous block on a single day
/// state is saved in the URL as selectionBegin and selectionEnd parameters
/// TODO rework the interface, accepts string[] for compatibility, not because it's desired
export function useSlotSelection(): [string[], (slots: string[]) => void] {
  const { selection, setSelection } = useSelectedSlots();

  const setSelectedSlots = (slots: string[]) => {
    if (slots.length === 0) {
      setSelection(null);
    } else {
      const selectionBegin = slots[0];
      const selectionEnd = slots[slots.length - 1];
      if (selectionBegin == null || selectionEnd == null) {
        return;
      }
      const begins = decodeTimeSlot(selectionBegin);
      const ends = decodeTimeSlot(selectionEnd);
      setSelection({
        begins: begins.hour,
        ends: ends.hour,
        day: begins.day as DayT,
      });
    }
  };

  return [getSelection(selection), setSelectedSlots];
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
    console.error("Invalid reservationUnitOptionPk:", reservationUnitOptionPk);
  }

  const handleAcceptSlot = async () => {
    if (selection.length === 0) {
      // eslint-disable-next-line no-console
      console.error("Invalid selection");
    }
    if (timeRange == null) {
      // eslint-disable-next-line no-console
      console.error("Invalid timeRange for section:", applicationSection);
    }
    if (selection.length === 0 || timeRange == null) {
      errorToast({ text: t("allocation:errors.accepting.generic") });
      return;
    }
    const allocatedBegin = timeSlotKeyToScheduleTime(selection[0]);
    const allocatedEnd = timeSlotKeyToScheduleTime(selection[selection.length - 1], true);
    if (!reservationUnitOptionPk) {
      errorToast({ text: t("allocation:errors.accepting.generic") });
      return;
    }

    // NOTE the pk is an update pk that matches AllocatedTimeSlot (not the applicationSection)
    // TODO check the inputs
    const input: AllocatedTimeSlotCreateMutation = {
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
      const msg = t("allocation:acceptingSuccess", { name });
      successToast({ text: msg });
      refresh();
    } catch (err) {
      displayError(err);
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
            pk: allocatedPk,
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
      if (res?.pk) {
        const { name } = applicationSection;
        const msg = t("allocation:resetSuccess", { name });
        successToast({ text: msg });
        refresh();
      }
    } catch (err) {
      displayError(err);
    }
  };
  return [handleRemoveAllocation, { isLoading }];
}

export const CREATE_ALLOCATED_TIME_SLOT = gql`
  mutation CreateAllocatedTimeSlot($input: AllocatedTimeSlotCreateMutation!) {
    createAllocatedTimeslot(input: $input) {
      beginTime
      dayOfTheWeek
      endTime
      pk
      reservationUnitOption {
        id
      }
    }
  }
`;

export const DELETE_ALLOCATED_TIME_SLOT = gql`
  mutation DeleteAllocatedTimeSlot($input: AllocatedTimeSlotDeleteMutation!) {
    deleteAllocatedTimeslot(input: $input) {
      pk
    }
  }
`;
