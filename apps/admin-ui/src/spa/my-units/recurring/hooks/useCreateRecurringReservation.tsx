import { useTranslation } from "react-i18next";
import get from "lodash/get";
import {} from "@gql/gql-types";
import {
  type RecurringReservationCreateMutationInput,
  type ReservationMetadataFieldNode,
  type ReservationStaffCreateMutationInput,
  useCreateRecurringReservationMutation,
  useCreateStaffReservationMutation,
} from "@gql/gql-types";
import type { RecurringReservationForm } from "@/schemas";
import {
  fromUIDateUnsafe,
  toApiDate,
  toApiDateUnsafe,
} from "common/src/common/util";
import { dateTime } from "@/helpers";
import { useNotification } from "@/context/NotificationContext";
import { type NewReservationListItem } from "@/component/ReservationsList";
import { ReservationMade } from "../RecurringReservationDone";
import { flattenMetadata } from "app/common/util";
import { gql } from "@apollo/client";

// TODO this is common with the ReservationForm combine them
function myDateTime(date: Date, time: string) {
  const maybeDateString = toApiDate(date, "dd.MM.yyyy");
  return maybeDateString ? dateTime(maybeDateString, time) : undefined;
}

export const CREATE_RECURRING_RESERVATION = gql`
  mutation CreateRecurringReservation(
    $input: RecurringReservationCreateMutationInput!
  ) {
    createRecurringReservation(input: $input) {
      pk
    }
  }
`;

export function useCreateRecurringReservation() {
  const [create] = useCreateRecurringReservationMutation();

  const createRecurringReservation = (
    input: RecurringReservationCreateMutationInput
  ) => create({ variables: { input } });

  const [createReservationMutation] = useCreateStaffReservationMutation();

  const createStaffReservation = (input: ReservationStaffCreateMutationInput) =>
    createReservationMutation({ variables: { input } });

  const { t } = useTranslation();
  const { notifyError } = useNotification();
  const handleError = (error: unknown) => {
    const errorMessage = get(error, "messages[0]");
    notifyError(t("ReservationDialog.saveFailed", { errorMessage }));
  };

  const makeSingleReservation = async (
    reservation: NewReservationListItem,
    input: Omit<ReservationStaffCreateMutationInput, "begin" | "end">
  ) => {
    const x = reservation;
    const common = {
      startTime: x.startTime,
      endTime: x.endTime,
      date: x.date,
    };

    try {
      const begin = myDateTime(x.date, x.startTime);
      const end = myDateTime(x.date, x.endTime);

      if (!begin || !end) {
        throw new Error("Invalid date selected");
      }
      const staffInput = {
        ...input,
        begin,
        end,
      };

      const retryOnce = async (
        variables: ReservationStaffCreateMutationInput
      ) => {
        try {
          const res2 = await createStaffReservation(variables);
          return res2;
        } catch (err) {
          if (err != null && typeof err === "object" && "networkError" in err) {
            const res3 = await createStaffReservation(variables);
            return Promise.resolve(res3);
          }
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          return Promise.reject(err);
        }
      };

      const { data: staffData } = await retryOnce(staffInput);

      if (staffData == null) {
        return {
          ...common,
          reservationPk: undefined,
          error: "Null error",
        };
      }

      const { createStaffReservation: response } = staffData;

      return {
        ...common,
        reservationPk: response?.pk ?? undefined,
        error: undefined,
      };
    } catch (e) {
      // This happens at least when the start time is in the past
      // or if there is a another reservation on that time slot
      return {
        ...common,
        reservationPk: undefined,
        error: String(e),
      };
    }
  };

  // NOTE unsafe
  const mutate = async (
    data: RecurringReservationForm,
    reservationsToMake: NewReservationListItem[],
    // TODO why is this named unitPk?
    unitPk: number,
    metaFields: ReservationMetadataFieldNode[],
    buffers: { before?: number; after?: number }
  ): Promise<[number | undefined, ReservationMade[]]> => {
    const flattenedMetadataSetValues = flattenMetadata(data, metaFields);

    const name = data.type === "BLOCKED" ? "BLOCKED" : (data.seriesName ?? "");

    const input: RecurringReservationCreateMutationInput = {
      reservationUnit: unitPk,
      beginDate: toApiDateUnsafe(fromUIDateUnsafe(data.startingDate)),
      beginTime: data.startTime,
      endDate: toApiDateUnsafe(fromUIDateUnsafe(data.endingDate)),
      endTime: data.endTime,
      weekdays: data.repeatOnDays,
      recurrenceInDays: data.repeatPattern.value === "weekly" ? 7 : 14,
      name,
      description: data.comments,
    };

    const { data: createResponse } = await createRecurringReservation(input);

    if (createResponse?.createRecurringReservation == null) {
      handleError(undefined);
      return [undefined, []];
    }
    const staffInput = {
      reservationUnitPks: [unitPk],
      recurringReservationPk: createResponse.createRecurringReservation.pk,
      type: data.type,
      bufferTimeBefore: buffers.before ? String(buffers.before) : undefined,
      bufferTimeAfter: buffers.after ? String(buffers.after) : undefined,
      workingMemo: data.comments,
      ...flattenedMetadataSetValues,
    };

    const rets = reservationsToMake.map(async (x) =>
      makeSingleReservation(x, staffInput)
    );

    const result: ReservationMade[] = await Promise.all(rets).then((y) => y);
    return [createResponse.createRecurringReservation.pk ?? undefined, result];
  };

  return [mutate];
}
