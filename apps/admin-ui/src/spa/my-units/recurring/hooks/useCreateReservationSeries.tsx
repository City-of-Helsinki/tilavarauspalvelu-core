import {
  ReservationStateChoice,
  useCreateReservationSeriesMutation,
  type ReservationSeriesCreateMutation,
} from "@gql/gql-types";
import type { ReservationSeriesForm, ReservationFormMeta } from "@/schemas";
import { fromUIDateUnsafe, toApiDateUnsafe } from "common/src/common/util";
import { gql } from "@apollo/client";
import { useSession } from "@/hooks/auth";
import { transformReserveeType } from "common/src/conversion";

export function useCreateReservationSeries() {
  const [create] = useCreateReservationSeriesMutation();

  const createReservationSeries = (input: ReservationSeriesCreateMutation) => create({ variables: { input } });

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
      numPersons,
      ...rest
    } = data;

    const name = data.type === "BLOCKED" ? "BLOCKED" : (seriesName ?? "");

    if (user?.pk == null) {
      throw new Error("Current user pk missing");
    }

    const reservationDetails: ReservationSeriesCreateMutation["reservationDetails"] = {
      ...rest,
      numPersons: numPersons ?? 1,
      type: type,
      reserveeIdentifier: !reserveeIsUnregisteredAssociation ? reserveeIdentifier : undefined,
      reserveeType: transformReserveeType(reserveeType),
      bufferTimeBefore: buffers.before,
      bufferTimeAfter: buffers.after,
      workingMemo: comments,
      state: ReservationStateChoice.Confirmed,
      // TODO why is this needed in the mutation?
      user: user.pk,
    };

    const skipDates: string[] = props.skipDates.map((d) => toApiDateUnsafe(d));
    const input: ReservationSeriesCreateMutation = {
      reservationDetails,
      skipDates,
      // checkOpeningHours: true,
      ageGroup: !Number.isNaN(ageGroup) ? ageGroup : undefined,
      reservationUnit: reservationUnitPk,
      beginDate: toApiDateUnsafe(fromUIDateUnsafe(startingDate)),
      beginTime: startTime,
      endDate: toApiDateUnsafe(fromUIDateUnsafe(endingDate)),
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
  mutation CreateReservationSeries($input: ReservationSeriesCreateMutation!) {
    createReservationSeries(input: $input) {
      pk
    }
  }
`;
