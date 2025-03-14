import { useTranslation } from "react-i18next";
import { get } from "lodash-es";
import {
  ReservationStateChoice,
  ReservationTypeChoice,
  ReservationTypeStaffChoice,
  type ReservationSeriesCreateMutationInput,
  useCreateReservationSeriesMutation,
  type ReservationSeriesReservationCreateSerializerInput,
} from "@gql/gql-types";
import type { RecurringReservationForm, ReservationFormMeta } from "@/schemas";
import { fromUIDateUnsafe, toApiDateUnsafe } from "common/src/common/util";
import { gql } from "@apollo/client";
import { errorToast } from "common/src/common/toast";
import { useSession } from "@/hooks/auth";
import { transformReserveeType } from "common/src/conversion";

// Not all choices are valid for recurring reservations (the ui should not allow these)
function transformReservationTypeStaffChoice(
  t: ReservationTypeChoice
): ReservationTypeStaffChoice {
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

export const CREATE_RESERVATION_SERIES = gql`
  mutation CreateReservationSeries(
    $input: ReservationSeriesCreateMutationInput!
  ) {
    createReservationSeries(input: $input) {
      pk
    }
  }
`;

export function useCreateRecurringReservation() {
  const [create] = useCreateReservationSeriesMutation();

  const createReservationSeries = (
    input: ReservationSeriesCreateMutationInput
  ) => create({ variables: { input } });

  const { t } = useTranslation();
  const handleError = (error: unknown) => {
    const errorMessage = get(error, "messages[0]");
    errorToast({
      text: t("ReservationDialog.saveFailedWithError", { errorMessage }),
    });
  };

  const { user } = useSession();

  // NOTE unsafe
  const mutate = async (props: {
    // FIXME this type is incorrect, it should include the reservation meta fields
    data: RecurringReservationForm & ReservationFormMeta;
    skipDates: Date[];
    reservationUnitPk: number;
    // metaFields: ReservationMetadataFieldNode[];
    buffers: { before?: number; after?: number };
  }): Promise<number | undefined> => {
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
      ...rest
    } = data;

    const name = data.type === "BLOCKED" ? "BLOCKED" : (data.seriesName ?? "");

    if (user?.pk == null) {
      throw new Error("Current user pk missing");
    }

    const reservationDetails: ReservationSeriesReservationCreateSerializerInput =
      {
        ...rest,
        type: transformReservationTypeStaffChoice(type),
        reserveeType: transformReserveeType(reserveeType),
        bufferTimeBefore: buffers.before,
        bufferTimeAfter: buffers.after,
        workingMemo: comments,
        state: ReservationStateChoice.Confirmed,
        // TODO why is this needed in the mutation?
        user: user.pk,
      };

    const skipDates: string[] = props.skipDates.map((d) => toApiDateUnsafe(d));
    const input: ReservationSeriesCreateMutationInput = {
      reservationDetails,
      skipDates,
      // checkOpeningHours: true,
      ageGroup: !Number.isNaN(Number(ageGroup)) ? Number(ageGroup) : undefined,
      reservationUnit: reservationUnitPk,
      beginDate: toApiDateUnsafe(fromUIDateUnsafe(data.startingDate)),
      beginTime: startTime,
      endDate: toApiDateUnsafe(fromUIDateUnsafe(data.endingDate)),
      endTime,
      weekdays: repeatOnDays,
      recurrenceInDays: repeatPattern === "weekly" ? 7 : 14,
      name,
      description: comments,
    };

    const { data: createResponse } = await createReservationSeries(input);

    if (createResponse?.createReservationSeries == null) {
      handleError(undefined);
      return undefined;
    }
    const { pk } = createResponse.createReservationSeries;

    return pk ?? undefined;
  };

  return [mutate];
}
