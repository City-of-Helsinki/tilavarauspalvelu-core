import { useState } from "react";
import { ApolloError, gql } from "@apollo/client";
import { useTranslation } from "next-i18next/pages";
import { useSearchParams } from "next/navigation";
import type { ApolloQueryResult } from "@apollo/client";
import type { WeekdayInterval } from "@ui/components/WeeklyPatternCalendar/types";
import { logError } from "@ui/modules/errors";
import { errorToast, successToast } from "ui/src/components/toast";
import { useDisplayError } from "ui/src/hooks";
import { formatApiTimeUnsafe } from "ui/src/modules/date-utils";
import { toNumber } from "ui/src/modules/helpers";
import { useCreateAllocatedTimeSlotMutation, useDeleteAllocatedTimeSlotMutation } from "@gql/gql-types";
import type { AllocatedTimeSlotCreateMutationInput, ApplicationSectionAllocationsQuery } from "@gql/gql-types";
import { useSetSearchParams } from "@/hooks/useSetSearchParams";
import type { AllocatedTimeSlotNodeT, SectionNodeT } from "./modules/applicationRoundAllocation";
import { useSelectedSlots } from "./SelectedSlotsContext";

/**
 * Forget the Highlight, which lives in the `aes` and `allocated` search params.
 *
 * A Highlight means "this section on this reservation unit", the same way the Selection does. So the write that
 * changes the unit clears it in the same navigation.
 */
export function clearHighlightParams(params: URLSearchParams): void {
  params.delete("aes");
  params.delete("allocated");
}

export function useFocusApplicationEvent(): [number | null, (aes?: SectionNodeT) => void] {
  const params = useSearchParams();
  const setParams = useSetSearchParams();

  const selectedAeasPk = toNumber(params.get("aes"));

  const setFocused: (aes?: SectionNodeT) => Promise<void> = async (aes) => {
    const p = new URLSearchParams(params);
    clearHighlightParams(p);
    if (aes?.pk != null) {
      p.set("aes", aes.pk.toString());
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
    clearHighlightParams(p);
    if (allocated?.pk != null) {
      p.set("allocated", allocated.pk.toString());
    }
    await setParams(p);
  };

  return [allocatedPk, setAllocated];
}

/**
 * The Selection, which is one span on one weekday, and the write that replaces it. Null means nothing is selected.
 *
 * This is the context in a pair, so a caller can name both halves in one line.
 */
export function useSlotSelection(): [WeekdayInterval | null, (next: WeekdayInterval | null) => void] {
  const { selection, setSelection } = useSelectedSlots();

  return [selection, setSelection];
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
      setSelection(null);
    }
  };

  return [refresh, isRefetchLoading];
}

type AcceptSlotMutationProps = {
  applicationSection: SectionNodeT;
  reservationUnitOptionPk: number;
  /** The Selection to allocate. It carries the weekday and both times. */
  selection: WeekdayInterval | null;
  refresh: (clearSelection?: boolean) => void;
};

type HookReturnValue = [
  () => Promise<void>,
  {
    isLoading: boolean;
  },
];

/** The API writes a time as `HH:MM:SS`, and the end of the day as `00:00:00`. */
function toApiTime(minutes: number): string {
  const hours = Math.floor(minutes / 60) % 24;
  return `${formatApiTimeUnsafe(hours, minutes % 60)}:00`;
}

export function useAcceptSlotMutation({
  selection,
  applicationSection,
  reservationUnitOptionPk,
  refresh,
}: AcceptSlotMutationProps): HookReturnValue {
  const { t } = useTranslation();

  const [acceptApplicationEvent, { loading: isLoading }] = useCreateAllocatedTimeSlotMutation();
  const displayError = useDisplayError();

  const handleAcceptSlot = async () => {
    if (selection == null) {
      logError(`Invalid selection for section ${JSON.stringify(applicationSection)}`, "warning");
    }
    if (reservationUnitOptionPk < 1) {
      logError(`Invalid reservation unit pk ${reservationUnitOptionPk}`, "warning");
    }
    if (selection == null || reservationUnitOptionPk < 1) {
      errorToast({ text: t("allocation:errors.accepting.generic") });
      return;
    }

    // NOTE the pk is an update pk that matches AllocatedTimeSlot (not the applicationSection)
    const input: AllocatedTimeSlotCreateMutationInput = {
      reservationUnitOption: reservationUnitOptionPk,
      // The Selection says which weekday it is on, so no Suitable Time Range is searched for it.
      dayOfTheWeek: selection.weekday,
      beginTime: toApiTime(selection.beginMinutes),
      endTime: toApiTime(selection.endMinutes),
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
