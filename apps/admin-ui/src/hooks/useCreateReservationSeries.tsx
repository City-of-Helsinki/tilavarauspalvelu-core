import {
  ReservationStateChoice,
  ReservationTypeChoice,
  ReservationTypeStaffChoice,
  type ReservationSeriesCreateMutationInput,
  useCreateReservationSeriesMutation,
  type ReservationSeriesReservationCreateSerializerInput,
} from "@gql/gql-types";
import type { ReservationSeriesForm } from "@/schemas";
import { parseUIDateUnsafe, formatApiDateUnsafe } from "common/src/modules/date-utils";
import { type ReservationFormMeta } from "common/src/schemas";
import { gql } from "@apollo/client";
import { useSession } from "@/hooks";

// Not all choices are valid for reservation series (the ui should not allow these)
function transformReservationTypeStaffChoice(t: ReservationTypeChoice): ReservationTypeStaffChoice {
  switch (t) {
    case ReservationTypeChoice.Staff:
      return ReservationTypeStaffChoice.Staff;
    case ReservationTypeChoice.Behalf:
      return ReservationTypeStaffChoice.Behalf;
    case ReservationTypeChoice.Blocked:
      return ReservationTypeStaffChoice.Blocked;
    default:
      throw new Error("Invalid reservation type");
  }
}

export function useCreateReservationSeries() {
  const [create] = useCreateReservationSeriesMutation();

  const createReservationSeries = (input: ReservationSeriesCreateMutationInput) => create({ variables: { input } });

  const { user } = useSession();

  // NOTE unsafe
  const mutate = async (props: {
    // FIXME this type is incorrect, it should include the reservation meta fields
    data: ReservationSeriesForm & ReservationFormMeta;
    skipDates: Date[];
    reservationUnitPk: number;
    buffers: { before?: number; after?: number };
  }): Promise<number | null> => {
    const { data, reservationUnitPk, buffers } = props;
    const {
      ageGroup,
      type,
      seriesName,
      comments,
      startingDate,
      startTime,
      endingDate,
      endTime,
      repeatOnDays,
      repeatPattern,
      reserveeType,
      reserveeIsUnregisteredAssociation,
      enableBufferTimeAfter,
      enableBufferTimeBefore,
      reserveeIdentifier,
      ...rest
    } = data;

    if (user?.pk == null) {
      throw new Error("Current user pk missing");
    }
    const name = data.type === "BLOCKED" ? "BLOCKED" : (seriesName ?? "");

    const reservationDetails: ReservationSeriesReservationCreateSerializerInput = {
      // TODO don't use spread it breaks type checking for unknown fields
      ...rest,
      type: transformReservationTypeStaffChoice(type),
      reserveeIdentifier: !reserveeIsUnregisteredAssociation ? reserveeIdentifier : undefined,
      reserveeType: reserveeType,
      bufferTimeBefore: buffers.before,
      bufferTimeAfter: buffers.after,
      workingMemo: comments,
      state: ReservationStateChoice.Confirmed,
      // TODO why is this needed in the mutation?
      user: user.pk,
    };

    const skipDates: string[] = props.skipDates.map((d) => formatApiDateUnsafe(d));
    const input: ReservationSeriesCreateMutationInput = {
      reservationDetails,
      skipDates,
      // checkOpeningHours: true,
      ageGroup: !Number.isNaN(ageGroup) ? ageGroup : undefined,
      reservationUnit: reservationUnitPk,
      beginDate: formatApiDateUnsafe(parseUIDateUnsafe(startingDate)),
      beginTime: startTime,
      endDate: formatApiDateUnsafe(parseUIDateUnsafe(endingDate)),
      endTime,
      weekdays: repeatOnDays,
      recurrenceInDays: repeatPattern === "weekly" ? 7 : 14,
      name,
      description: comments,
    };

    const { data: createResponse } = await createReservationSeries(input);

    return createResponse?.createReservationSeries?.pk ?? null;
  };

  return mutate;
}

export const CREATE_RESERVATION_SERIES = gql`
  mutation CreateReservationSeries($input: ReservationSeriesCreateMutationInput!) {
    createReservationSeries(input: $input) {
      pk
    }
  }
`;
