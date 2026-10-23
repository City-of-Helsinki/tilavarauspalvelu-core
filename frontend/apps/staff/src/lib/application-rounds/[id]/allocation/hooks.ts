import { useState } from "react";
import { ApolloError, gql } from "@apollo/client";
import { useTranslation } from "next-i18next/pages";
import { useSearchParams } from "next/navigation";
import type { ApolloQueryResult } from "@apollo/client";
import type { WeekdayInterval } from "@ui/components/WeeklyPatternCalendar/types";
import { logError } from "@ui/modules/errors";
import { errorToast, successToast } from "ui/src/components/toast";
import { useDisplayError } from "ui/src/hooks";
import { convertWeekday, numberToDayT, transformWeekday } from "ui/src/modules/conversion";
import { toNumber } from "ui/src/modules/helpers";
import { useCreateAllocatedTimeSlotMutation, useDeleteAllocatedTimeSlotMutation } from "@gql/gql-types";
import type { AllocatedTimeSlotCreateMutationInput, ApplicationSectionAllocationsQuery } from "@gql/gql-types";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import { decodeTimeSlot, timeSlotKeyToScheduleTime } from "./modules/applicationRoundAllocation";
import type {
  AllocatedTimeSlotNodeT,
  SectionNodeT,
  SuitableTimeRangeNodeT,
} from "./modules/applicationRoundAllocation";
import { useSelectedSlots } from "./SelectedSlotsContext";

export function useFocusApplicationEvent(): [number | null, (aes?: SectionNodeT) => void] {
  const params = useSearchParams();
  const setParams = useSetSearchParams();

  const selectedAeasPk = toNumber(params.get("aes"));

  const setFocused: (aes?: SectionNodeT) => Promise<void> = async (aes) => {
    const p = new URLSearchParams(params);
    if (aes?.pk != null) {
      p.set("aes", aes.pk.toString());
      p.delete("allocated");
    } else {
      p.delete("aes");
    }
    await setParams(p);
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

  const setAllocated: (allocated?: Pick<AllocatedTimeSlotNodeT, "pk">) => Promise<void> = async (allocated) => {
    const p = new URLSearchParams(params);
    if (allocated?.pk != null) {
      p.set("allocated", allocated.pk.toString());
      p.delete("aes");
    } else {
      p.delete("allocated");
    }
    await setParams(p);
  };

  return [allocatedPk, setAllocated];
}

/** The old grid draws one cell per half hour, so one string key stands for 30 minutes. */
const SLOT_MINUTES = 30;

// TEMPORARY BRIDGE. The context holds the Selection as a WeekdayInterval, while the old grid, the column and the
// cards still speak in "day-hour-min" string keys, one key per half hour slot. These two functions translate
// between the two shapes so each consumer can move on its own. Step 12 of the allocation calendar migration
// deletes them, together with the keys and the helpers they use.

/** One key per half hour slot that starts inside the interval. */
function selectionToSlotKeys(selection: WeekdayInterval): string[] {
  const day = convertWeekday(selection.weekday);
  const keys: string[] = [];
  for (let minutes = selection.beginMinutes; minutes < selection.endMinutes; minutes += SLOT_MINUTES) {
    const hour = Math.floor(minutes / 60);
    const minute = minutes % 60;
    // hours have no leading zero, minutes have to have it
    keys.push(`${day}-${hour}-${minute < 10 ? `0${minute}` : minute}`);
  }
  return keys;
}

/** The first and the last key decide the span. The last key is a slot start, and the interval's end is exclusive. */
function slotKeysToSelection(slots: string[]): WeekdayInterval | null {
  const first = slots[0];
  const last = slots[slots.length - 1];
  if (first == null || last == null) {
    return null;
  }
  const begins = decodeTimeSlot(first);
  const ends = decodeTimeSlot(last);
  const day = numberToDayT(begins.day);
  if (day == null) {
    return null;
  }
  return {
    weekday: transformWeekday(day),
    beginMinutes: Math.round(begins.hour * 60),
    endMinutes: Math.round(ends.hour * 60) + SLOT_MINUTES,
  };
}

/// Allow selecting a continuous block on a single day
export function useSlotSelection(): [string[], (slots: string[]) => void] {
  const { selection, setSelection } = useSelectedSlots();

  const setSelectedSlots = (slots: string[]) => {
    if (slots.length === 0) {
      setSelection(null);
      return;
    }
    const next = slotKeysToSelection(slots);
    // a key that does not parse leaves the Selection as it is, the same way it did before
    if (next == null) {
      return;
    }
    setSelection(next);
  };

  const selectedSlots = selection != null ? selectionToSlotKeys(selection) : [];

  return [selectedSlots, setSelectedSlots];
}

// side effects that should happen when a modification is made
export function useRefreshApplications(
  fetchCallback: () => Promise<ApolloQueryResult<ApplicationSectionAllocationsQuery>>
): [(clearSelection?: boolean) => Promise<void>, boolean] {
  const [, setSelection] = useSlotSelection();
  const [isRefetchLoading, setIsRefetchLoading] = useState(false);

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

type HookReturnValue = [
  () => Promise<void>,
  {
    isLoading: boolean;
  },
];

export function useAcceptSlotMutation({
  selection,
  timeRange,
  applicationSection,
  reservationUnitOptionPk,
  refresh,
}: AcceptSlotMutationProps): HookReturnValue {
  const { t } = useTranslation();

  const [acceptApplicationEvent, { loading: isLoading }] = useCreateAllocatedTimeSlotMutation();
  const displayError = useDisplayError();

  const handleAcceptSlot = async () => {
    if (selection.length === 0) {
      logError("Invalid selection", "warning");
    }
    if (timeRange == null) {
      logError(`Invalid timeRange for section ${JSON.stringify(applicationSection)}`, "warning");
    }
    if (reservationUnitOptionPk < 1) {
      logError(`Invalid reservation unit pk ${reservationUnitOptionPk}`, "warning");
    }
    if (selection.length === 0 || timeRange == null || reservationUnitOptionPk < 1) {
      errorToast({ text: t("allocation:errors.accepting.generic") });
      return;
    }
    const allocatedBegin = timeSlotKeyToScheduleTime(selection[0]);
    const allocatedEnd = timeSlotKeyToScheduleTime(selection[selection.length - 1], true);

    // NOTE the pk is an update pk that matches AllocatedTimeSlot (not the applicationSection)
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
            pk: String(allocatedPk),
          },
        },
      });
      if (errors != null && errors.length > 0) {
        throw new ApolloError({
          graphQLErrors: errors,
        });
      }
      const { deleteAllocatedTimeslot: res } = data || {};
      if (res?.deleted) {
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
