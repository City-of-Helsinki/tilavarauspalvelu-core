import { useMemo } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { useTranslation } from "react-i18next";
import get from "lodash/get";
import type {
  Query,
  QueryReservationUnitByPkArgs,
  QueryUnitsArgs,
  ReservationUnitByPkTypeReservationsArgs,
  ReservationUnitType,
  ErrorType,
  RecurringReservationCreateMutationInput,
  RecurringReservationCreateMutationPayload,
  ReservationStaffCreateMutationInput,
  ReservationStaffCreateMutationPayload,
} from "common/types/gql-types";
import {
  ReservationsReservationTypeChoices,
  ReservationUnitsReservationUnitReservationStartIntervalChoices,
} from "common/types/gql-types";
import type { UseFormReturn } from "react-hook-form";
import type { RecurringReservationForm } from "app/schemas";
import { toApiDate, fromUIDate, toApiDateUnsafe } from "common/src/common/util";
import { addDays } from "date-fns";
import {
  CollisionInterval,
  doesIntervalCollide,
  reservationToInterval,
} from "app/helpers";
import { generateReservations } from "./generateReservations";
import { useNotification } from "../../../context/NotificationContext";
import { RECURRING_RESERVATION_UNIT_QUERY } from "../queries";
import {
  GET_RESERVATIONS_IN_INTERVAL,
  CREATE_RECURRING_RESERVATION,
} from "./queries";
import { NewReservationListItem } from "../../ReservationsList";
import { convertToDate } from "./utils";
import { dateTime } from "../../ReservationUnits/ReservationUnitEditor/DateTimeInput";
import { CREATE_STAFF_RESERVATION } from "../create-reservation/queries";
import { ReservationMade } from "./RecurringReservationDone";
import { flattenMetadata } from "../create-reservation/utils";

export const useMultipleReservation = ({
  form,
  reservationUnit,
  interval = ReservationUnitsReservationUnitReservationStartIntervalChoices.Interval_15Mins,
}: {
  form: UseFormReturn<RecurringReservationForm>;
  reservationUnit?: ReservationUnitType;
  interval?: ReservationUnitsReservationUnitReservationStartIntervalChoices;
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

// NOTE pks are integers even though the query uses strings
export const useRecurringReservationsUnits = (unitId: number) => {
  const { notifyError } = useNotification();

  const { loading, data } = useQuery<Query, QueryUnitsArgs>(
    RECURRING_RESERVATION_UNIT_QUERY,
    {
      variables: {
        pk: [String(unitId)],
        offset: 0,
      },
      onError: (err) => {
        notifyError(err.message);
      },
    }
  );

  const unit = data?.units?.edges[0];
  const reservationUnits = unit?.node?.reservationUnits?.filter(
    (item): item is ReservationUnitType => !!item
  );

  return { loading, reservationUnits };
};

const useReservationsInInterval = ({
  begin,
  end,
  reservationUnitPk,
  reservationType,
}: {
  begin: Date;
  end: Date;
  reservationUnitPk?: number;
  reservationType: ReservationsReservationTypeChoices;
}) => {
  const { notifyError } = useNotification();

  const apiStart = toApiDate(begin);
  // NOTE backend error, it returns all till 00:00 not 23:59
  const apiEnd = toApiDate(addDays(end, 1));

  // NOTE unlike array fetches this fetches a single element with an included array
  // so it doesn't have the 100 limitation of array fetch nor does it have pagination
  const { loading, data, refetch } = useQuery<
    Query,
    QueryReservationUnitByPkArgs & ReservationUnitByPkTypeReservationsArgs
  >(GET_RESERVATIONS_IN_INTERVAL, {
    skip:
      !reservationUnitPk ||
      Number.isNaN(reservationUnitPk) ||
      !apiStart ||
      !apiEnd,
    variables: {
      pk: reservationUnitPk,
      from: apiStart,
      to: apiEnd,
    },
    fetchPolicy: "no-cache",
    onError: (err) => {
      notifyError(err.message);
    },
  });

  const reservations = (data?.reservationUnitByPk?.reservations ?? [])
    .map((x) => (x ? reservationToInterval(x, reservationType) : undefined))
    .filter((x): x is CollisionInterval => x != null);

  return { reservations, loading, refetch };
};

const listItemToInterval = (
  item: NewReservationListItem,
  type: ReservationsReservationTypeChoices
): CollisionInterval | undefined => {
  const start = convertToDate(item.date, item.startTime);
  const end = convertToDate(item.date, item.endTime);
  if (start && end) {
    return {
      start,
      end,
      buffers: {
        before:
          type !== ReservationsReservationTypeChoices.Blocked
            ? item.buffers?.before ?? 0
            : 0,
        after:
          type !== ReservationsReservationTypeChoices.Blocked
            ? item.buffers?.after ?? 0
            : 0,
      },
      type,
    };
  }
  return undefined;
};

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
  reservationType: ReservationsReservationTypeChoices;
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
      const type = interval.type ?? ReservationsReservationTypeChoices.Blocked;
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
  const [create] = useMutation<
    { createRecurringReservation: RecurringReservationCreateMutationPayload },
    { input: RecurringReservationCreateMutationInput }
  >(CREATE_RECURRING_RESERVATION);

  const createRecurringReservation = (
    input: RecurringReservationCreateMutationInput
  ) => create({ variables: { input } });

  const [createReservationMutation] = useMutation<
    { createStaffReservation: ReservationStaffCreateMutationPayload },
    { input: ReservationStaffCreateMutationInput }
  >(CREATE_STAFF_RESERVATION);

  const createStaffReservation = (input: ReservationStaffCreateMutationInput) =>
    createReservationMutation({ variables: { input } });

  const { t } = useTranslation();
  const { notifyError } = useNotification();
  const handleError = (error: ErrorType | undefined) => {
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

      // TODO When does the graphql send errors as data? oposed to exceptions
      if (response.errors != null) {
        const errors =
          response.errors
            .filter((y): y is ErrorType => y != null)
            ?.find(() => true)?.messages ?? [];
        return {
          ...common,
          reservationPk: undefined,
          error: errors.length > 0 ? errors[0] : "unkownError",
        };
      }
      return {
        ...common,
        reservationPk: response.pk ?? undefined,
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
    unitPk: number,
    metaFields: string[],
    buffers: { before?: number; after?: number }
  ): Promise<[number | undefined, ReservationMade[]]> => {
    const metadataSetFields = metaFields;

    const flattenedMetadataSetValues = flattenMetadata(data, metadataSetFields);

    const name = data.type === "BLOCKED" ? "BLOCKED" : data.seriesName ?? "";

    const input: RecurringReservationCreateMutationInput = {
      reservationUnitPk: unitPk,
      beginDate: toApiDateUnsafe(fromUIDate(data.startingDate)),
      beginTime: data.startTime,
      endDate: toApiDateUnsafe(fromUIDate(data.endingDate)),
      endTime: data.endTime,
      weekdays: data.repeatOnDays,
      recurrenceInDays: data.repeatPattern.value === "weekly" ? 7 : 14,
      name,
      description: data.comments,

      // TODO missing fields
      // abilityGroupPk?: InputMaybe<Scalars["Int"]>;
      // ageGroupPk?: InputMaybe<Scalars["Int"]>;
      // clientMutationId?: InputMaybe<Scalars["String"]>;
      // user?: InputMaybe<Scalars["String"]>;
    };

    const { data: createResponse } = await createRecurringReservation(input);

    if (
      createResponse?.createRecurringReservation == null ||
      createResponse?.createRecurringReservation.errors != null
    ) {
      const firstError = (
        createResponse?.createRecurringReservation?.errors || []
      ).find(() => true);

      handleError(firstError ?? undefined);
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
