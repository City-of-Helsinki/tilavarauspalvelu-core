import { useTranslation } from "react-i18next";
import get from "lodash/get";
import {
  type ReservationSeriesReservationSerializerInput,
  ReservationStateChoice,
  ReservationTypeChoice,
  ReservationTypeStaffChoice,
  type ReservationMetadataFieldNode,
  type ReservationSeriesCreateMutationInput,
  useCreateReservationSeriesMutation,
} from "@gql/gql-types";
import type { RecurringReservationForm } from "@/schemas";
import { fromUIDateUnsafe, toApiDateUnsafe } from "common/src/common/util";
import { flattenMetadata } from "@/common/util";
import { gql } from "@apollo/client";
import { errorToast } from "common/src/common/toast";
import { useSession } from "@/hooks/auth";

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
    data: RecurringReservationForm;
    skipDates: Date[];
    reservationUnitPk: number;
    metaFields: ReservationMetadataFieldNode[];
    buffers: { before?: number; after?: number };
  }): Promise<number | undefined> => {
    const { data, reservationUnitPk, metaFields, buffers } = props;
    const flattenedMetadataSetValues = flattenMetadata(data, metaFields, false);
    // unlike reservation creation age group are passed to the main mutation and others to details
    const ageGroup = flattenedMetadataSetValues.ageGroup;
    delete flattenedMetadataSetValues.ageGroup;

    const name = data.type === "BLOCKED" ? "BLOCKED" : (data.seriesName ?? "");

    if (user?.pk == null) {
      throw new Error("Current user pk missing");
    }

    const reservationDetails: ReservationSeriesReservationSerializerInput = {
      ...flattenedMetadataSetValues,
      type: transformReservationTypeStaffChoice(data.type),
      bufferTimeBefore: buffers.before,
      bufferTimeAfter: buffers.after,
      workingMemo: data.comments,
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
      beginTime: data.startTime,
      endDate: toApiDateUnsafe(fromUIDateUnsafe(data.endingDate)),
      endTime: data.endTime,
      weekdays: data.repeatOnDays,
      recurrenceInDays: data.repeatPattern.value === "weekly" ? 7 : 14,
      name,
      description: data.comments,
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
