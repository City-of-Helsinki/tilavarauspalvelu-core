import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import get from "lodash/get";
import type {
  Maybe,
  RecurringReservationCreateMutationInput,
  ReservationMetadataFieldNode,
  ReservationsInIntervalFragment,
  ReservationStaffCreateMutationInput,
} from "@gql/gql-types";
import {
  ReservationStartInterval,
  ReservationTypeChoice,
  useCreateRecurringReservationMutation,
  useCreateStaffReservationMutation,
  useRecurringReservationUnitQuery,
  useReservationTimesInReservationUnitQuery,
} from "@gql/gql-types";
import type { UseFormReturn } from "react-hook-form";
import type { RecurringReservationForm } from "app/schemas";
import {
  fromUIDateUnsafe,
  toApiDate,
  toApiDateUnsafe,
} from "common/src/common/util";
import { addDays } from "date-fns";
import {
  CollisionInterval,
  dateTime,
  doesIntervalCollide,
  reservationToInterval,
} from "@/helpers";
import { generateReservations } from "./generateReservations";
import { useNotification } from "@/context/NotificationContext";
import { NewReservationListItem } from "../../ReservationsList";
import { convertToDate } from "./utils";
import { ReservationMade } from "./RecurringReservationDone";
import { flattenMetadata } from "../create-reservation/utils";
import { base64encode, filterNonNullable } from "common/src/helpers";
import { RELATED_RESERVATION_STATES } from "common/src/const";

type ReservationUnitBufferType = {
  bufferTimeBefore?: number;
  bufferTimeAfter?: number;
};
export const useMultipleReservation = ({
  form,
  reservationUnit,
  interval = ReservationStartInterval.Interval_15Mins,
}: {
  form: UseFormReturn<RecurringReservationForm>;
  reservationUnit?: Maybe<ReservationUnitBufferType>;
  interval?: ReservationStartInterval;
}) => {
  const { watch } = form;

  // NOTE useMemo is useless here, watcher already filters out unnecessary runs
  const result = generateReservations(
    {
      startingDate: watch("startingDate"),
      endingDate: watch("endingDate"),
      startTime: watch("startTime"),
      endTime: watch("endTime"),
      repeatPattern: watch("repeatPattern"),
      repeatOnDays: watch("repeatOnDays"),
    },
    interval
  );

  const isBlocked = watch("type") === "BLOCKED";

  return {
    ...result,
    reservations: result.reservations.map((item) => ({
      ...item,
      buffers: {
        before:
          watch("bufferTimeBefore") && !isBlocked
            ? reservationUnit?.bufferTimeBefore ?? 0
            : 0,
        after:
          watch("bufferTimeAfter") && !isBlocked
            ? reservationUnit?.bufferTimeAfter ?? 0
            : 0,
      },
    })),
  };
};

export function useRecurringReservationsUnits(unitId: number) {
  const { notifyError } = useNotification();

  const id = base64encode(`UnitNode:${unitId}`);
  const { loading, data } = useRecurringReservationUnitQuery({
    variables: { id },
    onError: (err) => {
      notifyError(err.message);
    },
  });

  const { unit } = data ?? {};
  const reservationUnits = filterNonNullable(unit?.reservationunitSet);

  return { loading, reservationUnits };
}

const useReservationsInInterval = ({
  begin,
  end,
  reservationUnitPk,
  reservationType,
}: {
  begin: Date;
  end: Date;
  reservationUnitPk?: number;
  reservationType: ReservationTypeChoice;
}) => {
  const { notifyError } = useNotification();

  const apiStart = toApiDate(begin);
  // NOTE backend error, it returns all till 00:00 not 23:59
  const apiEnd = toApiDate(addDays(end, 1));

  const typename = "ReservationUnitNode";
  const id = base64encode(`${typename}:${reservationUnitPk}`);
  // NOTE unlike array fetches this fetches a single element with an included array
  // so it doesn't have the 100 limitation of array fetch nor does it have pagination
  const { loading, data, refetch } = useReservationTimesInReservationUnitQuery({
    skip:
      !reservationUnitPk ||
      Number.isNaN(reservationUnitPk) ||
      !apiStart ||
      !apiEnd,
    variables: {
      id,
      pk: reservationUnitPk ?? 0,
      state: RELATED_RESERVATION_STATES,
      beginDate: apiStart ?? "",
      endDate: apiEnd ?? "",
    },
    fetchPolicy: "no-cache",
    onError: (err) => {
      notifyError(err.message);
    },
  });
  function doesReservationAffectReservationUnit(
    reservation: ReservationsInIntervalFragment,
    resUnitPk: number
  ) {
    return reservation.affectedReservationUnits?.some((pk) => pk === resUnitPk);
  }

  const reservationSet = filterNonNullable(
    data?.reservationUnit?.reservationSet
  );
  const affectingReservations = filterNonNullable(data?.affectingReservations);
  const reservations = filterNonNullable(
    reservationSet?.concat(
      affectingReservations?.filter((y) =>
        doesReservationAffectReservationUnit(y, reservationUnitPk ?? 0)
      ) ?? []
    )
  )
    .map((x) => reservationToInterval(x, reservationType))
    .filter((x): x is CollisionInterval => x != null);

  return { reservations, loading, refetch };
};

const listItemToInterval = (
  item: NewReservationListItem,
  type: ReservationTypeChoice
): CollisionInterval | undefined => {
  const start = convertToDate(item.date, item.startTime);
  const end = convertToDate(item.date, item.endTime);
  if (start && end) {
    return {
      start,
      end,
      buffers: {
        before:
          type !== ReservationTypeChoice.Blocked
            ? item.buffers?.before ?? 0
            : 0,
        after:
          type !== ReservationTypeChoice.Blocked ? item.buffers?.after ?? 0 : 0,
      },
      type,
    };
  }
  return undefined;
};

// TODO this is only used for RecurringReservationForm, why? (the above query + hook also)
export const useFilteredReservationList = ({
  items,
  reservationUnitPk,
  begin,
  end,
  reservationType,
}: {
  items: NewReservationListItem[];
  reservationUnitPk?: number;
  begin: Date;
  end: Date;
  reservationType: ReservationTypeChoice;
}) => {
  const { reservations, refetch } = useReservationsInInterval({
    reservationUnitPk,
    begin,
    end,
    reservationType,
  });

  const data = useMemo(() => {
    if (reservations.length === 0) {
      return items;
    }
    const isReservationInsideRange = (
      reservationToMake: NewReservationListItem,
      interval: CollisionInterval
    ) => {
      const type = interval.type ?? ReservationTypeChoice.Blocked;
      const interval2 = listItemToInterval(reservationToMake, type);
      if (interval2 && interval) {
        return doesIntervalCollide(interval2, interval);
      }
      return false;
    };

    return items.map((x) =>
      reservations.find((y) => isReservationInsideRange(x, y))
        ? { ...x, isOverlapping: true }
        : x
    );
  }, [items, reservations]);

  return { reservations: data, refetch };
};

// TODO this is common with the ReservationForm combine them
const myDateTime = (date: Date, time: string) => {
  const maybeDateString = toApiDate(date, "dd.MM.yyyy");
  return maybeDateString ? dateTime(maybeDateString, time) : undefined;
};

export const useCreateRecurringReservation = () => {
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

    const name = data.type === "BLOCKED" ? "BLOCKED" : data.seriesName ?? "";

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
};
